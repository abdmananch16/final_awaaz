import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ArrowsClockwise, GasPump, Truck, Fire, Drop, TrendUp } from '@phosphor-icons/react';
import toast from 'react-hot-toast';

interface FuelPrice { name: string; price: string; }

const FUEL_ICONS: Record<string, typeof GasPump> = {
  'Super Petrol': GasPump,
  'Hi-Octane': Fire,
  'High Speed Diesel': Truck,
  'Kerosene': Drop,
  'LPG (kg)': Fire,
};

const FUEL_COLORS: Record<string, string> = {
  'Super Petrol': '#00e5b0',
  'Hi-Octane': '#ff7b54',
  'High Speed Diesel': '#ffd166',
  'Kerosene': '#4fc3f7',
  'LPG (kg)': '#ff7b54',
};

export default function Fuel() {
  const [prices, setPrices] = useState<FuelPrice[]>([]);
  const [updated, setUpdated] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPrices = async () => {
    setLoading(true);
    try {
      const data = await api.getFuelPrices();
      setPrices(data.prices || []);
      setUpdated(data.updated || '');
      setSource(data.source || '');
      setStatus(data.status || '');
    } catch { toast.error('Failed to fetch prices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPrices(); }, []);

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(0,229,176,0.15), rgba(255,209,102,0.15))',
          border: '1px solid rgba(0,229,176,0.25)',
          boxShadow: '0 0 20px rgba(0,229,176,0.15)',
        }}>
          <GasPump size={24} weight="duotone" style={{ color: 'var(--color-teal)' }} />
        </span>
        <div>
          <div className="title" style={{
            background: 'linear-gradient(135deg, #00e5b0, #ffd166, #ff7b54)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Fuel Prices Pakistan
          </div>
          <div className="subtitle">Live fuel prices from multiple verified sources</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button onClick={loadPrices} disabled={loading} className="btn flex items-center gap-2 relative overflow-hidden group">
          <ArrowsClockwise size={16} weight="bold" className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
          <span>{loading ? 'Refreshing...' : 'Refresh Prices'}</span>
        </button>
        <div className="text-xs flex items-center gap-2" style={{ color: 'var(--color-fg2)' }}>
          <span className={`inline-block w-2 h-2 rounded-full ${loading ? 'animate-pulse' : ''}`} style={{ 
            background: loading ? 'var(--color-teal)' : 'var(--color-green)' 
          }} />
          {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Ready'}
        </div>
      </div>

      <div className="text-xs mb-6 px-3 py-2 rounded-xl flex flex-wrap items-center gap-3" style={{ 
        background: 'linear-gradient(135deg, rgba(0,229,176,0.06), rgba(255,209,102,0.06))',
        border: '1px solid rgba(0,229,176,0.12)',
        color: 'var(--color-fg2)',
      }}>
        <TrendUp size={14} weight="fill" style={{ color: 'var(--color-teal)' }} />
        <span>Last updated: <strong style={{ color: 'var(--color-teal)' }}>{updated}</strong></span>
        <span>—</span>
        <span>Source: <strong style={{ color: 'var(--color-gold)' }}>{source}</strong></span>
      </div>

      {prices.length === 0 ? (
        <div className="card-3d text-center py-12">
          <Fire size={48} className="mx-auto mb-3" weight="duotone" style={{ color: 'var(--color-orange)', opacity: 0.3 }} />
          <div style={{ color: 'var(--color-fg2)' }}>
            Live fuel prices unavailable. Tavily/PSO/ProPakistani sources se abhi data nahi mila.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {prices.map((item, i) => {
            const Icon = FUEL_ICONS[item.name] || GasPump;
            const color = FUEL_COLORS[item.name] || 'var(--color-teal)';
            const unit = item.name.includes('LPG') ? 'per kg' : 'per litre';
            return (
              <div
                key={i}
                className="fuel-card animate-in tilt-card"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{
                  background: `linear-gradient(90deg, ${color}, ${color}88)`,
                }} />
                
                <div className="flex justify-center mb-4 mt-2">
                  <div className="p-3 rounded-2xl" style={{
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                  }}>
                    <Icon size={40} weight="duotone" style={{ color }} />
                  </div>
                </div>
                
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-fg2)' }}>{item.name}</div>
                
                <div style={{
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  fontFamily: "'Outfit', sans-serif",
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '8px 0 4px',
                }}>
                  Rs. {item.price}
                </div>
                
                <div className="text-xs" style={{ color: 'var(--color-fg2)' }}>{unit}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 card-3d text-sm flex items-center gap-3" style={{ color: 'var(--color-fg2)' }}>
        <GasPump size={18} weight="duotone" style={{ color: 'var(--color-teal)' }} />
        <span>Prices live sources se fetch hoti hain. Agar source temporarily fail ho to app last successful live cache show karegi.</span>
      </div>
    </div>
  );
}
