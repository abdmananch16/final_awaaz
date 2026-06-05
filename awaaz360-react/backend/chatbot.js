const { CITY, OPENAI_API_KEY } = require('./config');

async function getAIResponse(query, fuelPrices, fuelUpdated, weatherData, prayerData, fuelSource) {
  if (!OPENAI_API_KEY) return null;
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const fuelInfo = fuelPrices.map(p => `${p.name}: Rs.${p.price}`).join('\n');
    const weatherInfo = weatherData ? `Temperature: ${weatherData.temp}C, ${weatherData.desc}, Humidity: ${weatherData.humidity}%, Wind: ${weatherData.wind} km/h` : 'Not available';
    const prayerInfo = prayerData ? Object.entries(prayerData).map(([k, v]) => `${k}: ${v}`).join(', ') : 'Not available';

    const systemPrompt = `You are AWAAZ360 AI Assistant, a helpful civic services chatbot for Pakistan.
You help citizens with electricity, water, gas, roads, emergency services, fuel prices, prayer times, weather, blood donation, health, education, and NADRA services.

Current Live Data:
- Fuel Prices: ${fuelInfo}
- Fuel Updated: ${fuelUpdated}
- Fuel Source: ${fuelSource}
- Weather (${CITY}): ${weatherInfo}
- Prayer Times (${CITY}): ${prayerInfo}

Respond in a mix of Urdu and English (Romanized Urdu). Be helpful, concise, and friendly.
Provide contact numbers, websites, and practical information. Keep responses under 150 words.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: query }],
      max_tokens: 200,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
  } catch (e) {
    return null;
  }
}

function getFallbackResponse(query) {
  const lowered = query.toLowerCase();
  const kb = knowledgeBase();
  for (const [keys, answer] of Object.entries(kb)) {
    const keyList = keys.split(',').map(k => k.trim());
    if (keyList.some(key => (key.length >= 2 && lowered.includes(key)) || lowered === key)) {
      return answer;
    }
  }
  return 'Mujhe samajh nahi aaya. Koshish karein: bijli, paani, gas, sadak, fuel, namaz, mausam, emergency, blood, health, education, NADRA, FIR.';
}

function knowledgeBase() {
  return {
    'bijli,lesco,wapda,electricity,light,iesco,mepco,fesco,gepco,load,shedding':
      'Bijli Services:\n- LESCO: 118 | www.lesco.gov.pk\n- IESCO: 051-9252244 | www.iesco.com.pk\n- MEPCO: 0800-60000 | www.mepco.com.pk\n- Online Bill: https://bill.pitc.com.pk',
    'paani,water,pani,wasa,kwsb':
      'Paani Services:\n- WASA Rawalpindi: 0800-9272\n- WASA Lahore: 042-99211119\n- KWSB Karachi: 0800-KWSB (5972)\n- Online Complaint: www.wasa.punjab.gov.pk',
    'gas,sui,sngpl,ssgc,leak':
      'Gas Services:\n- SNGPL: 0800-00786\n- SSGC: 0800-43111\n- Gas Emergency: 1199\n- Online: www.sngpl.com.pk | www.ssgc.com.pk',
    'road,sadak,pothole,nha,motorway,highway':
      'Sadak Services:\n- NHA Helpline: 0800-03000\n- Punjab RHD: 042-99210080\n- Motorway Police: 130\n- Online: www.nha.gov.pk',
    'rescue,ambulance,emergency,accident,1122':
      'Emergency Services:\n- Rescue 1122\n- Edhi Ambulance: 115\n- Police: 15\n- Fire: 16\n- Available 24/7',
    'police,crime,fir,chori,theft,online':
      'Police Services:\n- Emergency: 15\n- Online FIR: punjab.gov.pk/opfir\n- Motorway Police: 130\n- Citizen Portal: 1717\n- Legal Aid: 0800-11111',
    'fire,aag,brigade':
      'Fire Emergency:\n- Fire Brigade: 16\n- Rescue 1122\n- Available 24/7 in all major cities',
    'namaz,prayer,azan,waqt,salah':
      `Namaz Timings:\n- Check Namaz section for today's times\n- Location: ${CITY}\n- Source: Al-Adhan API\n- Method: UISK Karachi`,
    'mausam,weather,barish,temperature,mosam':
      `Weather Information:\n- Check Mausam section for live weather\n- Location: ${CITY}\n- Real-time temperature, humidity, wind\n- Source: Open-Meteo API`,
    'blood,khoon,donor,donation':
      'Blood Donation:\n- Register in Blood Bank section\n- Search donors by blood group\n- Edhi Blood Bank: 021-111-33-44-4\n- Fatimid Foundation: 0800-33-100',
    'health,hospital,sehat,card,doctor':
      'Health Services:\n- Sehat Card: 0800-09009\n- PIMS Hospital: 051-9261170\n- Holy Family: 051-9290301\n- DHQ Hospital: 051-9290271\n- Emergency: 1122',
    'education,board,hec,scholarship,result':
      'Education Services:\n- BISE Rawalpindi: 051-9290274\n- HEC: 051-9044000\n- FBISE: 051-9269515\n- Scholarships: www.hec.gov.pk',
    'nadra,cnic,passport,id,card':
      'NADRA Services:\n- Helpline: 051-111-786-100\n- Online: www.nadra.gov.pk\n- CNIC, Passport, Family Registration\n- Track Application Online',
    'hello,hi,salam,assalam,kia,hal':
      'Walaikum Salam! Kya madad chahiye? Main aapki civic services mein madad kar sakta hoon.',
    'shukriya,thanks,thank':
      'Khushi hui madad karke! Allah Hafiz. Dobara zaroor aana.',
  };
}

async function answerQuery(query, fuelPrices, fuelUpdated, weatherData, prayerData, fuelSource) {
  const aiResponse = await getAIResponse(query, fuelPrices, fuelUpdated, weatherData, prayerData, fuelSource);
  return aiResponse || getFallbackResponse(query);
}

module.exports = { answerQuery };
