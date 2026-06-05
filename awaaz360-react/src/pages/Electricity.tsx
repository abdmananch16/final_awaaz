import { useState, useMemo } from 'react';
import { Lightning, Fan, Lightbulb, Wind, Monitor, Television, Fire, Thermometer, Gear, Clock, TrendUp, WarningCircle } from '@phosphor-icons/react';

const APPLIANCES = [
  { name: 'Fans', watt: 80, icon: Fan, color: '#4fc3f7' },
  { name: 'LED Bulbs', watt: 12, icon: Lightbulb, color: '#ffd166' },
  { name: 'AC (1 ton)', watt: 1200, icon: Wind, color: '#00e5b0' },
  { name: 'Computer', watt: 200, icon: Monitor, color: '#a29bfe' },
  { name: 'TV', watt: 100, icon: Television, color: '#fd79a8' },
  { name: 'Iron', watt: 1000, icon: Fire, color: '#ff7b54' },
  { name: 'Fridge', watt: 150, icon: Thermometer, color: '#4fc3f7' },
];

function energyBill(units: number): number {
  if (units <= 100) return units * 7.74;
  if (units <= 200) return 100 * 7.74 + (units - 100) * 10.06;
  if (units <= 300) return 100 * 7.74 + 100 * 10.06 + (units - 200) * 14.05;
  return 100 * 7.74 + 100 * 10.06 + 100 * 14.05 + (units - 300) * 19.45;
}

export default function Electricity() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hours, setHours] = useState<Record<string, number>>({});
  const [wattages, setWattages] = useState<Record<string, number>>({});
  const [showCustomWatt, setShowCustomWatt] = useState(false);
  const [showCustomHours, setShowCustomHours] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'breakdown' | 'tips'>('calculator');

  const getWatt = (name: string, defaultWatt: number) => wattages[name] ?? defaultWatt;
  const getHours = (name: string) => hours[name] ?? 10;

  // Live calculation
  const calculation = useMemo(() => {
    const details = APPLIANCES.map(app => {
      const qty = counts[app.name] || 0;
      const watt = getWatt(app.name, app.watt);
      const hrs = getHours(app.name);
      const dailyWattHours = qty * watt * hrs;
      const monthlyKwh = dailyWattHours * 30 / 1000;
      return { ...app, qty, watt, hrs, dailyWattHours, monthlyKwh };
    });

    const totalUnits = details.reduce((sum, d) => sum + d.monthlyKwh, 0);
    const bill = energyBill(totalUnits);
    const fixed = 500;
    const gst = bill * 0.17;
    const total = bill + fixed + gst;
    const hasData = details.some(d => d.qty > 0);

    return { details, totalUnits, bill, gst, fixed, total, hasData };
  }, [counts, hours, wattages]);

  const totalAppliances = Object.values(counts).reduce((a, b) => a + b, 0);
  const hasInputs = totalAppliances > 0;

  // Energy saving tips
  const tips = useMemo(() => {
    const t: { icon: typeof Wind; text: string; color: string }[] = [];
    const ac = calculation.details.find(d => d.name === 'AC (1 ton)');
    const fridge = calculation.details.find(d => d.name === 'Fridge');
    const bulbs = calculation.details.find(d => d.name === 'LED Bulbs');
    
    if (ac && ac.qty > 0 && ac.hrs > 6) {
      t.push({ icon: Wind, text: 'AC ko 24°C par set karein aur timer use karein — 30% tak bachat', color: '#00e5b0' });
    }
    if (fridge && fridge.qty > 0) {
      t.push({ icon: Thermometer, text: 'Fridge ko dheep se door rakhein — bijli ki bachat hogi', color: '#4fc3f7' });
    }
    if (bulbs && bulbs.qty > 0) {
      t.push({ icon: Lightbulb, text: 'LED bulbs use kar rahe hain — acha hai! 👍', color: '#ffd166' });
    }
    if (calculation.total > 5000) {
      t.push({ icon: WarningCircle, text: 'Aapka bill 5000 se zyada hai — solar panel par ghaur karein', color: '#ff7b54' });
    }
    if (calculation.total > 0 && calculation.total < 2000) {
      t.push({ icon: TrendUp, text: 'Aapka bill kafi kam hai — energy efficient hain! 🌟', color: '#2ed573' });
    }
    if (t.length === 0) {
      t.push({ icon: Lightbulb, text: 'Appliance quantities enter karein — tips yahan aayengi', color: 'var(--color-fg2)' });
    }
    return t;
  }, [calculation]);

  // Find biggest consumer
  const biggestConsumer = useMemo(() => {
    if (!calculation.hasData) return null;
    return calculation.details.reduce((max, d) => d.monthlyKwh > max.monthlyKwh ? d : max, calculation.details[0]);
  }, [calculation]);

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(0,229,176,0.15), rgba(79,195,247,0.15))',
          border: '1px solid rgba(0,229,176,0.25)',
          boxShadow: '0 0 20px rgba(0,229,176,0.15)'
        }}>
          <Lightning size={24} weight="duotone" style={{ color: 'var(--color-teal)' }} />
        </span>
        <div>
          <div className="title" style={{
            background: 'linear-gradient(135deg, #00e5b0, #4fc3f7, #a29bfe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Electricity Bill Estimator
          </div>
          <div className="subtitle">NEPRA slabs ke mutabiq apna bijli ka bill calculate karein</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        {(['calculator', 'breakdown', 'tips'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === tab ? 'btn' : 'btn-secondary'
            }`}
          >
            {tab === 'calculator' && '🧮 Calculator'}
            {tab === 'breakdown' && '📊 Breakdown'}
            {tab === 'tips' && '💡 Tips'}
          </button>
        ))}
      </div>

      {/* Calculator Tab */}
      {activeTab === 'calculator' && (
        <>
          {/* Toggles */}
          <div className="flex flex-wrap items-center justify-end gap-2 mb-3">
            <button
              onClick={() => setShowCustomWatt(!showCustomWatt)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                showCustomWatt ? 'btn' : 'btn-secondary'
              }`}
            >
              <Gear size={14} weight="bold" />
              {showCustomWatt ? 'Custom Watt ON' : 'Custom Watt'}
            </button>
            <button
              onClick={() => setShowCustomHours(!showCustomHours)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                showCustomHours ? 'btn' : 'btn-secondary'
              }`}
            >
              <Clock size={14} weight="bold" />
              {showCustomHours ? 'Custom Hours ON' : 'Custom Hours'}
            </button>
          </div>

          <div className="glass-card relative overflow-hidden">
            <div className="absolute pointer-events-none" style={{
              top: '-30%', right: '-20%',
              width: '300px', height: '300px',
              background: 'radial-gradient(circle, rgba(0,229,176,0.06) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
            <div className="absolute pointer-events-none" style={{
              bottom: '-30%', left: '-20%',
              width: '250px', height: '250px',
              background: 'radial-gradient(circle, rgba(79,195,247,0.06) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />

            <div className="relative z-10">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {APPLIANCES.map((app, index) => {
                  const Icon = app.icon;
                  const value = counts[app.name] ?? 0;
                  const watt = getWatt(app.name, app.watt);
                  const hrs = getHours(app.name);
                  const isCustomWatt = wattages[app.name] !== undefined;
                  const isCustomHours = hours[app.name] !== undefined;
                  const dailyEnergy = value * watt * hrs;
                  return (
                    <div
                      key={app.name}
                      className="animate-in"
                      style={{ animationDelay: `${index * 0.08}s` }}
                    >
                      {/* Appliance header */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg" style={{
                          background: `${app.color}15`,
                          border: `1px solid ${app.color}30`,
                          boxShadow: value > 0 ? `0 0 12px ${app.color}20` : undefined,
                        }}>
                          <Icon size={18} weight="duotone" style={{ color: app.color }} />
                        </div>
                        <div className="flex-1">
                          <label className="mb-0 text-sm font-medium">{app.name}</label>
                          {!showCustomWatt && !showCustomHours && (
                            <div className="text-[10px]" style={{ color: 'var(--color-fg2)' }}>
                              {app.watt}W · {10}h/day
                            </div>
                          )}
                        </div>
                        {/* Daily energy badge */}
                        {value > 0 && (
                          <div className="text-[10px] font-bold px-2 py-1 rounded-md" style={{
                            background: `${app.color}20`,
                            color: app.color,
                          }}>
                            {(dailyEnergy / 1000).toFixed(1)} kWh
                          </div>
                        )}
                      </div>

                      {/* Quantity input */}
                      <div className="relative mb-1.5">
                        <input
                          type="number" min={0} step={1}
                          value={value || ''}
                          onChange={e => setCounts({ ...counts, [app.name]: Math.max(0, parseInt(e.target.value) || 0) })}
                          placeholder="Quantity"
                          className="pl-3 pr-14"
                          style={{
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderColor: value > 0 ? `${app.color}50` : undefined,
                            boxShadow: value > 0 ? `0 0 0 2px ${app.color}20` : undefined,
                          }}
                        />
                        {value > 0 && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: app.color }}>
                            {value * watt}W
                          </div>
                        )}
                      </div>

                      {/* Custom wattage input */}
                      {showCustomWatt && (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number" min={1} step={1}
                            value={wattages[app.name] ?? app.watt}
                            onChange={e => setWattages({ ...wattages, [app.name]: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="!py-1 !text-xs !pl-2 !pr-2 text-center"
                            placeholder="W"
                            style={{
                              borderColor: isCustomWatt ? `${app.color}50` : undefined,
                              boxShadow: isCustomWatt ? `0 0 0 2px ${app.color}15` : undefined,
                            }}
                          />
                          <span className="text-[10px]" style={{ color: 'var(--color-fg2)' }}>Watts</span>
                          {isCustomWatt && (
                            <button
                              onClick={() => { const w = { ...wattages }; delete w[app.name]; setWattages(w); }}
                              className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/10"
                              style={{ color: 'var(--color-fg2)' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}

                      {/* Custom hours input */}
                      {showCustomHours && (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number" min={1} max={24} step={1}
                            value={hours[app.name] ?? 10}
                            onChange={e => setHours({ ...hours, [app.name]: Math.min(24, Math.max(1, parseInt(e.target.value) || 1)) })}
                            className="!py-1 !text-xs !pl-2 !pr-2 text-center"
                            placeholder="H"
                            style={{
                              borderColor: isCustomHours ? `${app.color}50` : undefined,
                              boxShadow: isCustomHours ? `0 0 0 2px ${app.color}15` : undefined,
                            }}
                          />
                          <span className="text-[10px]" style={{ color: 'var(--color-fg2)' }}>hrs/day</span>
                          {isCustomHours && (
                            <button
                              onClick={() => { const h = { ...hours }; delete h[app.name]; setHours(h); }}
                              className="text-[10px] px-1.5 py-0.5 rounded hover:bg-white/10"
                              style={{ color: 'var(--color-fg2)' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 p-3.5 rounded-xl text-xs flex items-center gap-3" style={{
                background: 'linear-gradient(135deg, rgba(0,229,176,0.06), rgba(79,195,247,0.06))',
                border: '1px solid rgba(0,229,176,0.12)',
                color: 'var(--color-fg2)',
              }}>
                <Thermometer size={16} weight="duotone" style={{ color: 'var(--color-teal)' }} />
                <span>
                  <strong>NEPRA Slabs:</strong> 0-100: Rs.7.74 &nbsp;|&nbsp; 101-200: Rs.10.06 &nbsp;|&nbsp; 201-300: Rs.14.05 &nbsp;|&nbsp; 300+: Rs.19.45
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{
                  background: 'rgba(0,229,176,0.08)',
                  border: '1px solid rgba(0,229,176,0.15)',
                  color: 'var(--color-fg2)',
                }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-teal)' }} />
                  Live — Auto Calculating
                </div>

                {hasInputs && (
                  <>
                    <a
                      href="#result"
                      className="btn flex items-center gap-2"
                    >
                      <TrendUp size={16} weight="bold" />
                      <span>View Result</span>
                    </a>
                    <button
                      onClick={() => { setCounts({}); }}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      Clear All
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Result - Live auto-calculated */}
      {calculation.hasData && (
        <div className="scale-in mt-5" id="result">
          <div className="relative overflow-hidden rounded-2xl p-8 text-center" style={{
            background: 'linear-gradient(135deg, rgba(0,229,176,0.08), rgba(79,195,247,0.08), rgba(162,155,254,0.08))',
            border: '2px solid rgba(0,229,176,0.2)',
            boxShadow: '0 0 40px rgba(0,229,176,0.1), 0 8px 32px var(--color-shadow)',
            backdropFilter: 'blur(20px)',
          }}>
            <div className="absolute pointer-events-none" style={{
              top: '-50%', right: '-30%',
              width: '400px', height: '400px',
              background: 'radial-gradient(circle, rgba(0,229,176,0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'billOrbPulse 6s ease-in-out infinite',
            }} />
            <div className="absolute pointer-events-none" style={{
              bottom: '-50%', left: '-30%',
              width: '350px', height: '350px',
              background: 'radial-gradient(circle, rgba(79,195,247,0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'billOrbPulse 8s ease-in-out infinite reverse',
            }} />

            <div className="relative z-10">
              <div className="text-base font-medium mb-1" style={{ color: 'var(--color-fg2)' }}>
                Estimated Monthly Bill
              </div>
              <div className="text-sm mb-4 flex items-center justify-center gap-4" style={{ color: 'var(--color-fg2)' }}>
                <span className="flex items-center gap-1"><Lightning size={14} weight="fill" style={{ color: 'var(--color-teal)' }} /> {calculation.totalUnits.toFixed(0)} kWh</span>
                <span className="flex items-center gap-1"><Clock size={14} weight="bold" /> {totalAppliances} appliances</span>
              </div>

              <div style={{
                fontSize: '4rem',
                fontWeight: 900,
                fontFamily: "'Outfit', sans-serif",
                background: 'linear-gradient(135deg, #00e5b0, #4fc3f7, #a29bfe)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                textShadow: '0 4px 20px rgba(0,229,176,0.3)',
                marginBottom: '16px',
              }}>
                Rs. {calculation.total.toFixed(0)}
              </div>

              <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-sm" style={{ color: 'var(--color-fg2)' }}>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{
                  background: 'rgba(0,229,176,0.08)', border: '1px solid rgba(0,229,176,0.15)',
                }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-teal)' }} />
                  Energy: <strong style={{ color: 'var(--color-teal)' }}>Rs.{calculation.bill.toFixed(0)}</strong>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{
                  background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.15)',
                }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-sky)' }} />
                  GST (17%): <strong style={{ color: 'var(--color-sky)' }}>Rs.{calculation.gst.toFixed(0)}</strong>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{
                  background: 'rgba(162,155,254,0.08)', border: '1px solid rgba(162,155,254,0.15)',
                }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-purple)' }} />
                  Fixed: <strong style={{ color: 'var(--color-purple)' }}>Rs.{calculation.fixed.toFixed(0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <div className="scale-in mt-4 space-y-4">
          {!calculation.hasData ? (
            <div className="glass-card text-center py-8" style={{ color: 'var(--color-fg2)' }}>
              <Lightning size={32} className="mx-auto mb-2" style={{ opacity: 0.4 }} />
              <div className="text-sm">Calculator tab mein appliances ki quantity daalein</div>
            </div>
          ) : (
            <>
              <h3 className="font-semibold flex items-center gap-2">
                <TrendUp size={18} weight="duotone" style={{ color: 'var(--color-teal)' }} />
                Appliance-wise Consumption
              </h3>
              
              {calculation.details.filter(d => d.qty > 0).sort((a, b) => b.monthlyKwh - a.monthlyKwh).map((d, i) => {
                const pct = calculation.totalUnits > 0 ? (d.monthlyKwh / calculation.totalUnits) * 100 : 0;
                const isBiggest = biggestConsumer?.name === d.name;
                return (
                  <div key={d.name} className="animate-in" style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <d.icon size={16} weight="duotone" style={{ color: d.color }} />
                        <span className="text-sm font-medium">{d.qty}× {d.name}</span>
                        {isBiggest && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{
                            background: `${d.color}20`,
                            color: d.color,
                          }}>
                            Highest
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-right">
                        <span style={{ color: d.color }}>{d.monthlyKwh.toFixed(1)} kWh</span>
                        <span className="text-[10px] ml-1" style={{ color: 'var(--color-fg2)' }}>({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-card2)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${d.color}, ${d.color}88)`,
                          boxShadow: isBiggest ? `0 0 12px ${d.color}50` : undefined,
                        }}
                      />
                    </div>
                    <div className="text-[10px] mt-0.5 flex justify-between" style={{ color: 'var(--color-fg2)' }}>
                      <span>{d.qty} × {d.watt}W × {d.hrs}h/day</span>
                      <span>Rs. {((d.monthlyKwh / calculation.totalUnits) * calculation.total).toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <div className="scale-in mt-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Lightbulb size={18} weight="duotone" style={{ color: 'var(--color-gold)' }} />
            Energy Saving Tips
          </h3>
          {tips.map((tip, i) => (
            <div key={i} className="glass-card flex items-start gap-3 animate-in" style={{ 
              animationDelay: `${i * 0.1}s`,
              padding: '16px',
              borderLeft: `3px solid ${tip.color}`,
            }}>
              <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${tip.color}15` }}>
                <tip.icon size={18} weight="duotone" style={{ color: tip.color }} />
              </div>
              <div className="text-sm" style={{ color: 'var(--color-fg)' }}>{tip.text}</div>
            </div>
          ))}
          {!calculation.hasData && (
            <div className="glass-card text-center py-8" style={{ color: 'var(--color-fg2)' }}>
              <Lightbulb size={32} className="mx-auto mb-2" style={{ opacity: 0.4 }} />
              <div className="text-sm">Calculator tab mein appliances ki quantity daalein</div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!calculation.hasData && activeTab === 'calculator' && (
        <div className="mt-8 text-center py-12 animate-in delay-4">
          <div className="text-5xl mb-4 opacity-30">⚡</div>
          <div className="text-lg font-medium" style={{ color: 'var(--color-fg2)' }}>
            Appliances ki quantity enter karein
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--color-fg2)', opacity: 0.7 }}>
            Bill auto-calculate hoga — "Custom Wattage" aur "Custom Hours" bhi set kar sakte hain
          </div>
        </div>
      )}
    </div>
  );
}
