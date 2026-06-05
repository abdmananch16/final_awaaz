import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ArrowsClockwise, Drop, Wind, Thermometer, CloudSun, Sun, Cloud, CloudRain, CloudSnow } from '@phosphor-icons/react';

interface WeatherData { temp: number; humidity: number; wind: number; desc: string; }

function getWeatherIcon(desc: string) {
  const d = desc.toLowerCase();
  if (d.includes('rain') || d.includes('drizzle')) return CloudRain;
  if (d.includes('snow') || d.includes('sleet')) return CloudSnow;
  if (d.includes('cloud') || d.includes('overcast')) return Cloud;
  if (d.includes('clear') || d.includes('sunny')) return Sun;
  return CloudSun;
}

function getWeatherColor(desc: string) {
  const d = desc.toLowerCase();
  if (d.includes('rain') || d.includes('drizzle')) return '#4fc3f7';
  if (d.includes('snow') || d.includes('sleet')) return '#e8f0fe';
  if (d.includes('cloud') || d.includes('overcast')) return '#7a8fa6';
  if (d.includes('clear') || d.includes('sunny')) return '#ffd166';
  return '#00e5b0';
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [city, setCity] = useState('Rawalpindi');
  const [lat, setLat] = useState('33.6007');
  const [lon, setLon] = useState('73.0679');
  const [loading, setLoading] = useState(false);

  const loadWeather = async () => {
    setLoading(true);
    try {
      const data = await api.getWeather();
      setWeather(data);
    } catch { setWeather(null); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadWeather();
    api.getConfig().then(c => { setCity(c.city); setLat(c.latitude); setLon(c.longitude); }).catch(() => {});
  }, []);

  const WeatherIcon = weather ? getWeatherIcon(weather.desc) : CloudSun;
  const weatherColor = weather ? getWeatherColor(weather.desc) : 'var(--color-sky)';

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: `linear-gradient(135deg, ${weatherColor}15, rgba(79,195,247,0.15))`,
          border: `1px solid ${weatherColor}30`,
          boxShadow: `0 0 20px ${weatherColor}20`,
        }}>
          <CloudSun size={24} weight="duotone" style={{ color: weatherColor }} />
        </span>
        <div>
          <div className="title" style={{
            background: `linear-gradient(135deg, ${weatherColor}, #4fc3f7)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Mausam — {city}
          </div>
          <div className="subtitle">Real-time weather from Open-Meteo API</div>
        </div>
      </div>

      <button onClick={loadWeather} disabled={loading} className="btn flex items-center gap-2 mb-4 relative overflow-hidden group">
        <ArrowsClockwise size={16} weight="bold" className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
        {loading ? 'Refreshing...' : 'Refresh Weather'}
      </button>

      {!weather ? (
        <div className="glass-card text-center py-12">
          <CloudSun size={48} className="mx-auto mb-3" weight="duotone" style={{ color: 'var(--color-fg2)', opacity: 0.4 }} />
          <div style={{ color: 'var(--color-fg2)' }}>
            Weather fetch ho raha hai. Internet check karein ya Refresh dabain.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Weather Card */}
          <div className="relative overflow-hidden rounded-2xl p-9 text-center" style={{
            background: `linear-gradient(135deg, ${weatherColor}10, rgba(79,195,247,0.08))`,
            border: `2px solid ${weatherColor}25`,
            boxShadow: `0 0 40px ${weatherColor}15, 0 8px 32px var(--color-shadow)`,
            backdropFilter: 'blur(20px)',
          }}>
            {/* Decorative orbs */}
            <div className="absolute pointer-events-none" style={{
              top: '-40%', right: '-20%',
              width: '350px', height: '350px',
              background: `radial-gradient(circle, ${weatherColor}10 0%, transparent 70%)`,
              borderRadius: '50%',
              animation: 'billOrbPulse 6s ease-in-out infinite',
            }} />
            <div className="absolute pointer-events-none" style={{
              bottom: '-40%', left: '-20%',
              width: '300px', height: '300px',
              background: 'radial-gradient(circle, rgba(79,195,247,0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'billOrbPulse 8s ease-in-out infinite reverse',
            }} />

            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full" style={{
                  background: `${weatherColor}15`,
                  border: `2px solid ${weatherColor}30`,
                }}>
                  <WeatherIcon size={64} weight="duotone" style={{ color: weatherColor }} />
                </div>
              </div>
              <div style={{
                fontSize: '4.5rem',
                fontWeight: 900,
                fontFamily: "'Outfit', sans-serif",
                background: `linear-gradient(135deg, ${weatherColor}, #4fc3f7)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
                letterSpacing: '-0.05em',
                textShadow: `0 4px 20px ${weatherColor}30`,
              }}>
                {weather.temp}°C
              </div>
              <div className="text-lg mt-2 font-medium capitalize" style={{ color: 'var(--color-fg2)' }}>
                {weather.desc}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Thermometer, label: 'Temperature', value: `${weather.temp}°C`, color: 'var(--color-teal)' },
              { icon: Drop, label: 'Humidity', value: `${weather.humidity}%`, color: 'var(--color-sky)' },
              { icon: Wind, label: 'Wind Speed', value: `${weather.wind} km/h`, color: 'var(--color-purple)' },
            ].map((metric, i) => (
              <div key={i} className="glass-card text-center animate-in tilt-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-xl" style={{ background: `${metric.color}15`, border: `1px solid ${metric.color}30` }}>
                    <metric.icon size={22} weight="duotone" style={{ color: metric.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold" style={{
                  color: metric.color,
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {metric.value}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-fg2)' }}>{metric.label}</div>
              </div>
            ))}
          </div>

      <div className="text-xs px-3 py-2 rounded-xl flex items-center gap-2" style={{ 
        background: `linear-gradient(135deg, ${weatherColor}10, rgba(79,195,247,0.06))`,
        border: `1px solid ${weatherColor}15`,
        color: 'var(--color-fg2)',
      }}>
        <CloudSun size={14} weight="fill" style={{ color: weatherColor }} />
        <span>Source: <strong style={{ color: weatherColor }}>Open-Meteo</strong></span>
        <span className="opacity-50">|</span>
        <span>{city} {lat}N {lon}E</span>
      </div>
        </div>
      )}
    </div>
  );
}
