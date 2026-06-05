import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ArrowsClockwise, Moon, SunHorizon, Sun, CloudSun, MoonStars, Star } from '@phosphor-icons/react';

interface PrayerData { Fajr: string; Sunrise: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string; }

const PRAYER_ICONS: Record<string, React.ReactNode> = {
  Fajr: <Moon size={18} weight="duotone" style={{ color: 'var(--color-sky)' }} />,
  Sunrise: <SunHorizon size={18} weight="duotone" style={{ color: 'var(--color-orange)' }} />,
  Dhuhr: <Sun size={18} weight="duotone" style={{ color: 'var(--color-gold)' }} />,
  Asr: <CloudSun size={18} weight="duotone" style={{ color: 'var(--color-teal)' }} />,
  Maghrib: <SunHorizon size={18} weight="duotone" style={{ color: 'var(--color-orange)' }} />,
  Isha: <MoonStars size={18} weight="duotone" style={{ color: 'var(--color-purple)' }} />,
};

export default function Prayer() {
  const [prayer, setPrayer] = useState<PrayerData | null>(null);
  const [city, setCity] = useState('Rawalpindi');
  const [loading, setLoading] = useState(false);

  const loadPrayer = async () => {
    setLoading(true);
    try {
      const data = await api.getPrayerTimes();
      setPrayer(data);
    } catch { setPrayer(null); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadPrayer();
    api.getConfig().then(c => setCity(c.city)).catch(() => {});
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const current = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const foundNext = { current: false };

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(0,229,176,0.15), rgba(79,195,247,0.15))',
          border: '1px solid rgba(0,229,176,0.25)',
          boxShadow: '0 0 20px rgba(0,229,176,0.15)',
        }}>
          <Star size={24} weight="duotone" style={{ color: 'var(--color-gold)' }} />
        </span>
        <div>
          <div className="title" style={{
            background: 'linear-gradient(135deg, #00e5b0, #4fc3f7, #a29bfe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>🕌 Namaz Awqaat — {city}</div>
          <div className="subtitle">Aaj ke namaz ke auqaat — Al-Adhan API se</div>
        </div>
      </div>

      <button onClick={loadPrayer} disabled={loading} className="btn flex items-center gap-2 mb-4">
        <ArrowsClockwise size={16} weight="bold" className={loading ? 'animate-spin' : ''} /> Refresh Namaz
      </button>

      <div className="text-xs mb-4" style={{ color: 'var(--color-fg2)' }}>{timeStr} | {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>

      {!prayer ? (
        <div className="card-3d text-center py-12" style={{ color: 'var(--color-fg2)' }}>
          <Star size={48} className="mx-auto mb-3" weight="duotone" style={{ opacity: 0.3, color: 'var(--color-gold)' }} />
          <div>Fetch ho raha hai ya internet available nahi.</div>
        </div>
      ) : (
        <div className="card-3d" style={{ padding: '14px' }}>
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 mb-2 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
            <div className="p-2 rounded-xl" style={{ background: 'rgba(0,229,176,0.1)' }}>
              <Star size={16} weight="fill" style={{ color: 'var(--color-gold)' }} />
            </div>
            <div>
              <div className="text-sm font-semibold">Aaj ke Auqaat</div>
              <div className="text-xs" style={{ color: 'var(--color-fg2)' }}>{timeStr}</div>
            </div>
          </div>
          {Object.entries(prayer).map(([name, time]) => {
            const isNext = !foundNext.current && time > current;
            if (isNext) foundNext.current = true;
            return (
              <div key={name} className={`prayer-card ${isNext ? 'next-prayer' : ''}`}>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-2">{PRAYER_ICONS[name] || <Star size={16} weight="duotone" />}</span>
                  <span style={{ fontWeight: isNext ? 600 : 400 }}>{name}</span>
                  {isNext && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                      background: 'rgba(0,229,176,0.2)',
                      color: 'var(--color-teal)',
                    }}>
                      NEXT
                    </span>
                  )}
                </span>
                <span className="prayer-time">{time}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-2 text-xs" style={{ color: 'var(--color-fg2)' }}>
        Source: Al-Adhan API | Method: UISK Karachi
      </div>
    </div>
  );
}
