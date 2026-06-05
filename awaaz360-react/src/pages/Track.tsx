import { useState } from 'react';
import { api, resolveUrl } from '../api/client';
import toast from 'react-hot-toast';
import { MagnifyingGlass, FileText, ClipboardText, Gear, CheckCircle, MapPin, ArrowSquareOut, Image } from '@phosphor-icons/react';


interface EvidenceFile { name: string; original: string; size: number; mimetype: string; url: string; }
interface ComplaintDetail { id: string; name: string; phone: string; category: string; desc: string; location: string; date: string; status: string; evidence?: EvidenceFile[]; geo_lat?: string; geo_lng?: string; }

export default function Track() {
  const [cid, setCid] = useState('');
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [verifyCount, setVerifyCount] = useState(0);
  const [userVerified, setUserVerified] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleTrack = async () => {
    if (!cid.trim()) { toast.error('ID enter karein'); return; }
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.getComplaint(cid.trim().toUpperCase());
      setComplaint(data);
      if (!data) toast.error(`'${cid}' nahi mila`);
      // Load verification status (silently fail - don't overwrite complaint)
      try {
        const v = await api.getVerificationStatus(cid.trim().toUpperCase());
        setVerifyCount(v.count);
        setUserVerified(v.verified);
      } catch {}
    } catch {
      setComplaint(null);
      toast.error('Not found');
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (s: string) => {
    const map: Record<string, string> = { 'Pending': 'status-pending', 'In Progress': 'status-progress', 'Resolved': 'status-resolved', 'Rejected': 'status-rejected' };
    return map[s] || 'status-pending';
  };

  const steps = ['Pending', 'In Progress', 'Resolved'];
  const stepIcons = [<ClipboardText size={20} weight="duotone" />, <Gear size={20} weight="duotone" />, <CheckCircle size={20} weight="fill" />];
  const active = complaint ? steps.indexOf(complaint.status) : -1;

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(162,155,254,0.15), rgba(79,195,247,0.15))',
          border: '1px solid rgba(162,155,254,0.25)',
          boxShadow: '0 0 20px rgba(162,155,254,0.15)',
        }}>
          <MagnifyingGlass size={24} weight="duotone" style={{ color: 'var(--color-purple)' }} />
        </span>
        <div>
          <div className="title" style={{
            background: 'linear-gradient(135deg, #a29bfe, #4fc3f7, #00e5b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>🔍 Track Complaint</div>
          <div className="subtitle">Apni shikayat ka status real-time dekhein</div>
        </div>
      </div>

      <div className="card-3d">
        <div className="flex items-center gap-3 pb-3 mb-3 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
          <MagnifyingGlass size={18} weight="duotone" style={{ color: 'var(--color-teal)' }} />
          <div className="font-semibold text-sm">Enter Complaint ID</div>
        </div>
        <div className="flex gap-3">
          <input
            type="text" value={cid} onChange={e => setCid(e.target.value)}
            placeholder="Apna Complaint ID darj karein — AWZ-XXXXXXXX"
            className="flex-1"
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
          />
          <button onClick={handleTrack} disabled={loading} className="btn whitespace-nowrap flex items-center gap-2 px-6">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching</> : <><MagnifyingGlass size={16} weight="bold" /> Track</>}
          </button>
        </div>
      </div>

      {searched && !complaint && !loading && (
        <div className="glass-card text-center" style={{ color: 'var(--color-red)' }}>
          Complaint nahi mila. Sahi ID check karein.
        </div>
      )}

      {complaint && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold flex items-center gap-2"><FileText size={20} weight="duotone" style={{ color: 'var(--color-teal)' }} /> Complaint: {complaint.id}</h3>
            <span className={`status-pill ${statusClass(complaint.status)}`}>{complaint.status}</span>
          </div>

          <div className="card-3d">
            <div className="flex items-center gap-3 pb-3 mb-3 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
              <FileText size={18} weight="duotone" style={{ color: 'var(--color-teal)' }} />
              <div className="font-semibold text-sm">Complaint Details</div>
            </div>
            <div className="space-y-1">
              <div className="info-row"><span className="info-label">👤 Naam</span><span className="info-value">{complaint.name}</span></div>
              <div className="info-row"><span className="info-label">📱 Phone</span><span className="info-value">{complaint.phone}</span></div>
              <div className="info-row"><span className="info-label">📂 Category</span>
                <span className="info-value">
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(0,229,176,0.08)', color: 'var(--color-teal)' }}>{complaint.category}</span>
                </span>
              </div>
              <div className="info-row"><span className="info-label">📍 Location</span><span className="info-value">{complaint.location}</span></div>
              <div className="info-row"><span className="info-label">📅 Date</span><span className="info-value">{complaint.date}</span></div>
              <div className="info-row" style={{ flexDirection: 'column', gap: 4, paddingBottom: 12 }}>
                <span className="info-label">📝 Detail</span>
                <span className="info-value text-sm mt-1" style={{ lineHeight: 1.6 }}>{complaint.desc}</span>
              </div>
            </div>
            
            {/* Geo-Tagged Location */}
            {complaint.geo_lat && complaint.geo_lng && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-glass-border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,176,0.1)' }}>
                    <MapPin size={16} weight="duotone" style={{ color: 'var(--color-teal)' }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-teal)' }}>📍 Geo-Tagged Location</span>
                </div>
                <div className="text-xs mb-3" style={{ color: 'var(--color-fg2)' }}>
                  {parseFloat(complaint.geo_lat).toFixed(6)}, {parseFloat(complaint.geo_lng).toFixed(6)}
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${complaint.geo_lat}&mlon=${complaint.geo_lng}&zoom=15`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-all hover:scale-105"
                  style={{ background: 'rgba(0, 229, 176, 0.1)', color: 'var(--color-teal)', border: '1px solid rgba(0, 229, 176, 0.2)' }}
                >
                  <MapPin size={14} weight="fill" /> OpenStreetMap par dekhein <ArrowSquareOut size={12} weight="bold" />
                </a>
              </div>
            )}
          </div>

          {/* Evidence Section */}
          {complaint.evidence && complaint.evidence.length > 0 && (
            <div className="card-3d">
              <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
                <h4 className="font-semibold flex items-center gap-2">
                  <Image size={18} weight="duotone" style={{ color: 'var(--color-teal)' }} />
                  Evidence ({complaint.evidence.length} file{complaint.evidence.length > 1 ? 's' : ''})
                </h4>
                <span className="text-xs px-2 py-1.5 rounded-lg" style={{ background: 'rgba(0,229,176,0.08)', color: 'var(--color-teal)' }}>
                  {complaint.evidence.length} file{complaint.evidence.length > 1 ? 's' : ''} attached
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {complaint.evidence.slice(0, 5).map((ef, i) => (
                  <div key={i} className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border transition-all hover:scale-105" style={{ borderColor: 'var(--color-glass-border)' }}>
                    {ef.mimetype.startsWith('image/') ? (
                      <img src={resolveUrl(ef.url)} alt={ef.original} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-card2)' }}>
                        <FileText size={28} weight="duotone" style={{ color: 'var(--color-orange)' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Community Issue Verification ═══ */}
          {complaint.status !== 'Resolved' && complaint.status !== 'Rejected' && (
            <div className="card-3d text-center" style={{ 
              background: userVerified ? 'rgba(0, 229, 176, 0.06)' : undefined,
              border: userVerified ? '1px solid rgba(0, 229, 176, 0.25)' : undefined,
            }}>
              <h4 className="font-semibold text-base mb-1 flex items-center justify-center gap-2">
                👥 Community Issue Verification
              </h4>
              <p className="text-sm mb-4" style={{ color: 'var(--color-fg2)' }}>
                Kya ye masla aapko bhi pesh hai?
              </p>

              <div className="flex items-center justify-center gap-6 mb-4">
                {/* Animated count */}
                <div className="text-center">
                  <div
                    className="text-3xl font-extrabold"
                    style={{ color: 'var(--color-teal)' }}
                  >
                    {verifyCount}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-fg2)' }}>
                    Affected Citizens
                  </div>
                </div>

                {/* People icons */}
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm border-2"
                      style={{
                        background: i <= Math.min(verifyCount, 3) ? 'var(--color-teal)' : 'var(--color-card2)',
                        borderColor: i <= Math.min(verifyCount, 3) ? 'var(--color-teal)' : 'var(--color-glass-border)',
                        color: i <= Math.min(verifyCount, 3) ? '#0a0f1a' : 'var(--color-fg2)',
                        zIndex: 4 - i,
                      }}
                    >
                      👤
                    </div>
                  ))}
                  {verifyCount > 3 && (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 -ml-2"
                      style={{
                        background: 'var(--color-teal)',
                        borderColor: 'var(--color-teal)',
                        color: '#0a0f1a',
                        zIndex: 0,
                      }}
                    >
                      +{verifyCount - 3}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={async () => {
                  if (verifyLoading) return;
                  setVerifyLoading(true);
                  try {
                    if (userVerified) {
                      const r = await api.unverifyComplaint(complaint.id);
                      setVerifyCount(r.count);
                      setUserVerified(false);
                    } else {
                      const r = await api.verifyComplaint(complaint.id);
                      setVerifyCount(r.count);
                      setUserVerified(true);
                    }
                  } catch (e: any) {
                    toast.error('Verification failed');
                  } finally {
                    setVerifyLoading(false);
                  }
                }}
                disabled={verifyLoading}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  userVerified ? 'btn-secondary' : 'btn'
                }`}
                style={userVerified ? {
                  background: 'rgba(0, 229, 176, 0.15)',
                  border: '1px solid rgba(0, 229, 176, 0.3)',
                  color: 'var(--color-teal)',
                } : {}}
              >
                {verifyLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                ) : userVerified ? (
                  <>✅ Confirmed — Aap bhi affected hain</>
                ) : (
                  <>👍 Yes, I am also affected</>
                )}
              </button>

              {/* Progress bar */}
              <div className="mt-4 w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-card2)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(verifyCount * 10, 100)}%`,
                    background: 'linear-gradient(90deg, #00e5b0, #4fc3f7)',
                  }}
                />
              </div>
              <div className="text-xs mt-1 flex justify-between" style={{ color: 'var(--color-fg2)' }}>
                <span>0</span>
                <span>{verifyCount >= 10 ? '10+' : '10'}</span>
              </div>
            </div>
          )}

          {/* Stepper */}
          <div className="card-3d">
            <div className="stepper">
              {steps.map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className={`step-dot ${i < active ? 'done' : i === active ? 'active' : 'waiting'}`}>
                    {stepIcons[i]}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`step-line ${i < active ? 'done' : 'waiting'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-16 text-sm" style={{ color: 'var(--color-fg2)' }}>
              {steps.map(s => <span key={s}>{s}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
