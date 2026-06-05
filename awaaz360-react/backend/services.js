const fs = require('fs');
const path = require('path');
const { PRICE_CACHE, CITY, COUNTRY, LATITUDE, LONGITUDE, TIMEZONE, TAVILY_API_KEY } = require('./config');

// Fetch wrapper with timeout — uses global fetch (Node 18+), no dynamic import needed
async function fetchWithTimeout(url, timeoutMs = 12000, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getPrayerTimes() {
  const now = new Date();
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(CITY)}&country=${encodeURIComponent(COUNTRY)}&method=1&date=${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
  return fetchWithTimeout(url, 15000)
    .then(r => r.json())
    .then(data => {
      const timings = data.data.timings;
      return { Fajr: timings.Fajr, Sunrise: timings.Sunrise, Dhuhr: timings.Dhuhr, Asr: timings.Asr, Maghrib: timings.Maghrib, Isha: timings.Isha };
    })
    .catch(() => null);
}

function getWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=${encodeURIComponent(TIMEZONE)}`;
  return fetchWithTimeout(url, 15000)
    .then(r => r.json())
    .then(data => {
      const c = data.current;
      const descs = { 0: 'Saaf aasman', 1: 'Mostly saaf', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 51: 'Halki baarish', 53: 'Baarish', 61: 'Halki baarish', 63: 'Baarish', 71: 'Halki barf', 73: 'Barf', 80: 'Shower', 95: 'Toofan' };
      return { temp: c.temperature_2m, humidity: c.relative_humidity_2m, wind: c.wind_speed_10m, desc: descs[c.weather_code] || '-' };
    })
    .catch(() => null);
}

function loadFuelCache() {
  try {
    if (fs.existsSync(PRICE_CACHE)) {
      const data = JSON.parse(fs.readFileSync(PRICE_CACHE, 'utf-8'));
      return { prices: data.prices || [], updated: data.updated || 'No live update yet', source: data.source || 'cache' };
    }
  } catch (e) {}
  return { prices: [], updated: 'No live update yet', source: 'none' };
}

function saveFuelCache(prices, updated, source) {
  try {
    const dir = path.dirname(PRICE_CACHE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PRICE_CACHE, JSON.stringify({ prices, updated, source }, null, 2), 'utf-8');
  } catch (e) {}
}

async function fetchTavily() {
  if (!TAVILY_API_KEY) return null;
  try {
    const response = await fetchWithTimeout('https://api.tavily.com/search', 15000, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TAVILY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'latest Pakistan petrol high speed diesel LPG prices today OGRA',
        search_depth: 'basic',
        max_results: 5,
        include_answer: 'basic',
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const text = [payload.answer || '', ...(payload.results || []).map(r => r.content || '')].join('\n');
    const pet = priceAfterKeywords(text, ['super petrol', 'petrol', 'motor spirit']);
    const hsd = priceAfterKeywords(text, ['high speed diesel', 'diesel', 'hsd']);
    const lpg = priceAfterKeywords(text, ['lpg']);
    if (pet || hsd || lpg) return { prices: priceRows(pet, hsd, lpg), updated: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), source: 'Tavily live search' };
  } catch (e) {}
  return null;
}

async function fetchPakwheels() {
  try {
    const response = await fetchWithTimeout('https://www.pakwheels.com/petroleum-prices-in-pakistan', 10000, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) return null;
    const text = await response.text();
    const cleanText = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const petMatch = cleanText.match(/Current and Latest Petrol Price in Pakistan is Rs\.?\s*([0-9]{2,4}(?:\.[0-9]{1,2})?)/i);
    const hsdMatch = cleanText.match(/High Speed Diesel is Rs\.?\s*([0-9]{2,4}(?:\.[0-9]{1,2})?)/i);
    const pet = petMatch ? petMatch[1] : null;
    const hsd = hsdMatch ? hsdMatch[1] : null;
    if (pet || hsd) return { prices: priceRows(pet && parseFloat(pet) > 50 ? pet : null, hsd && parseFloat(hsd) > 50 ? hsd : null, null), updated: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), source: 'PakWheels' };
  } catch (e) {}
  return null;
}

async function fetchPSO() {
  try {
    const response = await fetchWithTimeout('https://psopk.com/en/fuels/fuel-prices', 10000, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    let pet = null, hsd = null, lpg = null;
    doc.querySelectorAll('table').forEach(table => {
      table.querySelectorAll('tr').forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length < 2) return;
        const name = cells[0].textContent.trim().toLowerCase();
        const val = extractPrice(cells[1].textContent.trim());
        if (val === null || val < 50 || val > 1500) return;
        if (pet === null && (name.includes('motor spirit') || name.includes('petrol'))) pet = val.toFixed(2);
        else if (hsd === null && (name.includes('high speed diesel') || name.includes('hsd') || name.includes('diesel'))) hsd = val.toFixed(2);
        else if (lpg === null && name.includes('lpg')) lpg = val.toFixed(2);
      });
    });
    if (pet || hsd) return { prices: priceRows(pet, hsd, lpg), updated: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), source: 'PSO' };
  } catch (e) {}
  return null;
}

async function fetchFuelPrices() {
  for (const fetcher of [fetchTavily, fetchPakwheels, fetchPSO]) {
    const result = await fetcher();
    if (result && result.prices.length > 0) return result;
  }
  return null;
}

async function getFuelPrices() {
  const fresh = await fetchFuelPrices();
  if (fresh) {
    saveFuelCache(fresh.prices, fresh.updated, fresh.source);
    return { ...fresh, status: 'live' };
  }
  const cached = loadFuelCache();
  if (cached.prices.length > 0) return { ...cached, status: 'cached' };
  return { prices: [], updated: 'Live fuel prices unavailable', source: 'error', status: 'error' };
}

async function fetchRSSFeed(url, sourceName) {
  try {
    const response = await fetchWithTimeout(url, 10000, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return [];
    const xml = await response.text();
    
    // Simple regex-based RSS parser (works without jsdom XML mode issues)
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const extract = (str, tag) => {
      const m = new RegExp(`<${tag}[^>]*>([^<]*(?:<![CDATA[^>]*>)?[^<]*)<\/${tag}>`, 'i').exec(str);
      if (!m) return '';
      return m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
    };

    const results = [];
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && results.length < 12) {
      const item = match[1];
      const title = extract(item, 'title');
      const link = extract(item, 'link');
      const pubDate = extract(item, 'pubDate');
      const desc = extract(item, 'description').substring(0, 300);

      if (!title || !link) continue;

      // Skip old news
      if (pubDate) {
        const published = new Date(pubDate).getTime();
        if (!isNaN(published) && published < oneWeekAgo) continue;
      }

      results.push({
        title: title.substring(0, 200),
        link: link,
        date: pubDate ? new Date(pubDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        source: sourceName,
        summary: desc,
      });
    }
    return results;
  } catch (e) {
    return [];
  }
}

async function fetchTavilyNews() {
  if (!TAVILY_API_KEY) return [];
  try {
    const response = await fetchWithTimeout('https://api.tavily.com/search', 15000, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TAVILY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `latest Pakistan news today ${CITY} electricity water gas roads government`,
        topic: 'news',
        search_depth: 'basic',
        max_results: 8,
        days: 3,
        include_answer: false,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return (data.results || []).filter(r => r.title && r.url).map(r => ({
        title: r.title.trim(),
        link: r.url.trim(),
        date: r.published_date ? r.published_date.substring(0, 25) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        source: 'Tavily News',
        summary: (r.content || '').trim().substring(0, 300),
      }));
    }
  } catch (e) {}
  return [];
}

// Fallback civic news when live feeds fail
function getFallbackNews() {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return [
    { title: 'Tips to reduce electricity bill this summer - NEPRA announces new slab rates', link: 'https://nepra.org.pk', date: today, source: 'Civic Alert', summary: 'NEPRA has announced updated electricity slab rates for domestic consumers. Check your bill category to save money.' },
    { title: `${CITY}: Water supply schedule for this week - WASA announces timings`, link: 'https://wasa.punjab.gov.pk', date: today, source: 'Civic Alert', summary: `WASA ${CITY} has released the weekly water supply schedule. Check your area timings and plan accordingly.` },
    { title: 'Pakistan petrol prices updated - Check latest fuel rates', link: 'https://www.ogra.org.pk', date: today, source: 'Civic Alert', summary: 'OGRA has updated petroleum product prices. Petrol and diesel rates revised for the fortnight.' },
    { title: 'Emergency helplines you should save right now - 1122, 15, 16', link: '#', date: today, source: 'Safety Guide', summary: 'Keep these emergency numbers handy: Rescue 1122, Police 15, Fire 16, Edhi 115. Share with family.' },
    { title: `${CITY} weather alert - Temperature and humidity forecast`, link: '#', date: today, source: 'Weather Alert', summary: `Current weather in ${CITY}: Check the Mausam section for live temperature, humidity, and wind updates.` },
    { title: 'Blood donation camp this weekend - Donate and save lives', link: '#', date: today, source: 'Community Alert', summary: 'A blood donation camp is being organized. Register in the Blood Bank section to participate or find donors.' },
    { title: 'New online complaint system launched - File shikayat from home', link: '#', date: today, source: 'Government Update', summary: 'Citizens can now file complaints online through AWAAZ360. Track your complaint status in real-time.' },
    { title: 'Road repair work in progress - Major roads to be completed soon', link: '#', date: today, source: 'Infrastructure Update', summary: 'NHA has started road repair work in several sectors. Motorway Police helpline 130 for assistance.' },
  ];
}

async function getNews() {
  // Try Tavily first
  let news = await fetchTavilyNews();
  if (news.length >= 3) return news;

  // Fallback to RSS feeds
  const rssFeeds = [
    { url: 'https://www.dawn.com/feeds/home', name: 'Dawn' },
    { url: 'https://arynews.tv/feed/', name: 'ARY News' },
    { url: 'https://www.thenews.com.pk/rss/1/1', name: 'The News' },
  ];

  const seen = new Set();
  for (const feed of rssFeeds) {
    const items = await fetchRSSFeed(feed.url, feed.name);
    for (const item of items) {
      if (!seen.has(item.link)) {
        seen.add(item.link);
        news.push(item);
      }
      if (news.length >= 12) break;
    }
    if (news.length >= 12) break;
  }

  // If still no news, use fallback content
  if (news.length === 0) {
    news = getFallbackNews();
  }

  return news.slice(0, 12);
}

function extractPrice(value) {
  const cleaned = value.replace(/Rs\.?/gi, '').replace(/\/ltr/, '').replace(/\/kg/, '').replace(/,/g, '').trim();
  const num = parseFloat(cleaned.split(/\s+/)[0]);
  return isNaN(num) ? null : num;
}

function priceAfterKeywords(text, keywords) {
  for (const kw of keywords) {
    const regex = new RegExp(`${kw}[^0-9]{0,80}(?:rs\\.?|pkr)?\\s*([0-9]{2,4}(?:\\.[0-9]{1,2})?)`, 'i');
    const match = text.match(regex);
    if (match) {
      const val = parseFloat(match[1]);
      if (val > 50 && val < 1500) return val.toFixed(2);
    }
  }
  return null;
}

function priceRows(pet, hsd, lpg) {
  const rows = [];
  if (pet) rows.push({ name: 'Super Petrol', price: pet });
  if (hsd) rows.push({ name: 'High Speed Diesel', price: hsd });
  if (lpg) rows.push({ name: 'LPG (kg)', price: lpg });
  return rows;
}

module.exports = { getPrayerTimes, getWeather, getFuelPrices, getNews, loadFuelCache, saveFuelCache };
