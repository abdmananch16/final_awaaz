import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CloudSun, Drop, Wind, Clock, Calendar, ChatCircleText, CheckCircle, Heart, GasPump, Truck, Fire } from '@phosphor-icons/react';

interface Stats { total: number; donors: number; pending: number; resolved: number; }
interface Weather { temp: number; humidity: number; wind: number; desc: string; }
interface Prayer { Fajr: string; Sunrise: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string; }
interface FuelPrice { name: string; price: string; }

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [fuelUpdated, setFuelUpdated] = useState('');
  const [fuelSource, setFuelSource] = useState('');
  const [city, setCity] = useState('Rawalpindi');

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
    api.getWeather().then(setWeather).catch(() => {});
    api.getPrayerTimes().then(setPrayer).catch(() => {});
    api.getFuelPrices().then(d => {
      setFuelPrices(d.prices || []);
      setFuelUpdated(d.updated || '');
      setFuelSource(d.source || '');
    }).catch(() => {});
    api.getConfig().then(c => setCity(c.city)).catch(() => {});
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeNow = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const statItems = [
    { icon: ChatCircleText, color: '#4fc3f7', emoji: '📝', label: 'Total Complaints', value: stats?.total ?? 0, bg: 'rgba(79,195,247,0.12)' },
    { icon: Clock, color: '#ffd166', emoji: '⏳', label: 'Pending', value: stats?.pending ?? 0, bg: 'rgba(255,209,102,0.12)' },
    { icon: CheckCircle, color: '#2ed573', emoji: '✅', label: 'Resolved', value: stats?.resolved ?? 0, bg: 'rgba(46,213,115,0.12)' },
    { icon: Heart, color: '#fd79a8', emoji: '❤️', label: 'Blood Donors', value: stats?.donors ?? 0, bg: 'rgba(253,121,168,0.12)' },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Colorful Hero Banner */}
      <div className="hero-banner">
        <div className="relative z-10">
          <div className="hero-title">🇵🇰 خوش آمدید — AWAAZ360 Pro</div>
          <div className="mt-3 text-lg flex items-center gap-2" style={{ color: 'var(--color-fg2)' }}>
            <span>Pakistan ka Civic Platform — Shikayat, Malumat, Madad</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,229,176,0.08)', border: '1px solid rgba(0,229,176,0.15)', color: 'var(--color-teal)' }}>
              <Calendar size={14} /> {timeStr}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.15)', color: 'var(--color-sky)' }}>
              <Clock size={14} /> {timeNow}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,209,102,0.08)', border: '1px solid rgba(255,209,102,0.15)', color: 'var(--color-gold)' }}>
              📍 Rawalpindi
            </span>
          </div>
        </div>
      </div>

      {/* Colorful Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 0.1}s`, borderColor: `${item.color}30` }}>
            <div className="flex justify-center mb-2">                  <div className="p-3 rounded-2xl" style={{ background: item.bg, border: `2px solid ${item.color}30` }}>
                <item.icon size={28} weight="duotone" color={item.color} />
              </div>
            </div>
            <div className="stat-value" style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}aa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{item.value}</div>
            <div className="text-sm mt-1 font-medium" style={{ color: item.color, opacity: 0.8 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Weather & Prayer */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weather */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-sky)' }}>
          <span className="text-xl">🌤️</span> Mausam — {city}
        </h3>
          {weather ? (
            <div className="card-3d">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl" style={{ background: 'rgba(79,195,247,0.12)', border: '1px solid rgba(79,195,247,0.25)' }}>
                  <CloudSun size={32} weight="duotone" style={{ color: 'var(--color-sky)' }} />
                </div>
                <div>
                  <div className="weather-big" style={{ fontSize: '2.5rem' }}>{weather.temp}°C</div>
                  <div className="text-sm capitalize" style={{ color: 'var(--color-fg2)' }}>{weather.desc}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ background: 'rgba(0,229,176,0.06)', border: '1px solid rgba(0,229,176,0.12)' }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-fg2)' }}>                      <Drop size={14} weight="fill" style={{ color: 'var(--color-teal)' }} />
                    <span>Humidity</span>
                  </div>
                  <div className="text-lg font-bold mt-1" style={{ color: 'var(--color-teal)' }}>{weather.humidity}%</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.12)' }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-fg2)' }}>                      <Wind size={14} weight="fill" style={{ color: 'var(--color-sky)' }} />
                    <span>Wind</span>
                  </div>
                  <div className="text-lg font-bold mt-1" style={{ color: 'var(--color-sky)' }}>{weather.wind} km/h</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card text-sm" style={{ color: 'var(--color-fg2)' }}>
              Weather fetch ho raha hai ya internet available nahi.
            </div>
          )}
        </div>

        {/* Prayer */}
        <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-teal)' }}>
          <span className="text-xl">🕌</span> Namaz — {city}
        </h3>
          {prayer ? (
            <div className="card-3d" style={{ padding: '14px' }}>
              {Object.entries(prayer).map(([name, time]) => (
                <div key={name} className="prayer-card">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">
                      {name === 'Fajr' ? '🌅' : name === 'Sunrise' ? '🌄' : name === 'Dhuhr' ? '☀️' : name === 'Asr' ? '🌤️' : name === 'Maghrib' ? '🌇' : '🌙'}
                    </span>
                    <span className="prayer-name">{name}</span>
                  </span>
                  <span className="prayer-time">{time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card text-sm" style={{ color: 'var(--color-fg2)' }}>
              Prayer times fetch ho rahe hain ya internet available nahi.
            </div>
          )}
        </div>
      </div>

      {/* Fuel Prices */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-gold)' }}>
          <span className="text-xl">⛽</span> Fuel Prices
        </h3>
        {fuelPrices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fuelPrices.map((item, i) => (
              <div key={i} className="fuel-card animate-in tilt-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{
                  background: item.name.includes('Petrol') ? 'linear-gradient(90deg, #00e5b0, #4fc3f7)' : item.name.includes('Diesel') ? 'linear-gradient(90deg, #ffd166, #ff7b54)' : 'linear-gradient(90deg, #ff7b54, #ff4757)'
                }} />
                <div className="flex justify-center mb-3 mt-2">
                  <div className="p-3 rounded-2xl" style={{
                    background: item.name.includes('Petrol') ? 'rgba(0,229,176,0.12)' : item.name.includes('Diesel') ? 'rgba(255,209,102,0.12)' : 'rgba(255,123,84,0.12)',
                    border: `1px solid ${item.name.includes('Petrol') ? 'rgba(0,229,176,0.25)' : item.name.includes('Diesel') ? 'rgba(255,209,102,0.25)' : 'rgba(255,123,84,0.25)'}`
                  }}>
                    {item.name.includes('Petrol') ? <GasPump size={28} weight="duotone" style={{ color: 'var(--color-teal)' }} /> : item.name.includes('Diesel') ? <Truck size={28} weight="duotone" style={{ color: 'var(--color-gold)' }} /> : <Fire size={28} weight="duotone" style={{ color: 'var(--color-orange)' }} />}
                  </div>
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-fg2)' }}>{item.name}</div>
                <div className="fuel-price" style={{
                  background: `linear-gradient(135deg, ${item.name.includes('Petrol') ? '#00e5b0' : item.name.includes('Diesel') ? '#ffd166' : '#ff7b54'}, ${item.name.includes('Petrol') ? '#4fc3f7' : item.name.includes('Diesel') ? '#ff7b54' : '#ff4757'})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Rs.{item.price}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-fg2)' }}>
                  {item.name.includes('LPG') ? 'per kg' : 'per litre'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card text-sm" style={{ color: 'var(--color-red)' }}>
            Live fuel prices abhi fetch nahi ho sakin.
          </div>
        )}
        <div className="mt-2 text-xs" style={{ color: 'var(--color-fg2)' }}>
          {fuelUpdated} — Source: {fuelSource}
        </div>
      </div>
    </div>
  );
}
