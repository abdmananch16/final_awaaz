import { Phone, ChatCircle, VideoCamera, Ambulance, Shield, Fire, Buildings, Lightbulb, Drop, ArrowsSplit, ShieldWarning } from '@phosphor-icons/react';

const SERVICES = [
  { icon: Ambulance, color: '#ff4757', name: 'Rescue', number: '1122', desc: 'Medical & Rescue' },
  { icon: Shield, color: '#4fc3f7', name: 'Police', number: '15', desc: 'Crime & Security' },
  { icon: Fire, color: '#ff7b54', name: 'Fire Brigade', number: '16', desc: 'Fire Emergency' },
  { icon: Buildings, color: '#2ed573', name: 'Edhi', number: '115', desc: 'Ambulance' },
  { icon: Lightbulb, color: '#ffd166', name: 'LESCO/WAPDA', number: '118', desc: 'Electricity' },
  { icon: Drop, color: '#4fc3f7', name: 'WASA', number: '0800-9272', desc: 'Water Supply' },
  { icon: ArrowsSplit, color: '#a29bfe', name: 'Motorway Police', number: '130', desc: 'Motorway' },
  { icon: Phone, color: '#fd79a8', name: 'Aman Helpline', number: '1717', desc: 'Citizen Services' },
];

function cleanNumber(num: string): string {
  return num.replace(/[^0-9+]/g, '');
}

function whatsappNumber(num: string): string {
  const clean = cleanNumber(num);
  if (clean.startsWith('+')) return clean.substring(1);
  if (clean.startsWith('0')) return '92' + clean.substring(1);
  return clean;
}

export default function Emergency() {
  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(255,71,87,0.15), rgba(255,209,102,0.15))',
          border: '1px solid rgba(255,71,87,0.25)',
          boxShadow: '0 0 20px rgba(255,71,87,0.15)',
        }}>
          <ShieldWarning size={24} weight="duotone" style={{ color: 'var(--color-red)' }} />
        </span>
        <div>
          <div className="title" style={{
            background: 'linear-gradient(135deg, #ff4757, #ff7b54, #ffd166)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>🚨 Emergency Helplines</div>
          <div className="subtitle">Fori madad ke liye — number par click karein aur directly dial karein</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {SERVICES.map((service, i) => (
          <div
            key={service.name}
            onClick={() => window.location.href = `tel:${cleanNumber(service.number)}`}
            className="emergency-card animate-in cursor-pointer"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {/* Emergency icon with glow */}
            <div className="flex justify-center mb-3">
              <div className="p-3.5 rounded-2xl" style={{
                background: `${service.color}15`,
                border: `2px solid ${service.color}30`,
                boxShadow: `0 0 20px ${service.color}20, inset 0 0 15px ${service.color}10`,
              }}>
                <service.icon size={36} weight="duotone" style={{ color: service.color }} />
              </div>
            </div>
            <div className="font-semibold text-sm">{service.name}</div>
            <div className="emergency-number">{service.number}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--color-fg2)' }}>{service.desc}</div>
            
            <div className="mt-3 flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${cleanNumber(service.number)}`; }}
                className="btn text-xs py-2 px-3 flex-1 flex items-center justify-center gap-2"
                style={{ background: service.color, color: '#fff' }}
              >
                <Phone size={13} weight="fill" />
                <span>Call Now</span>
              </button>
              <a
                href={`https://wa.me/${whatsappNumber(service.number)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                title="WhatsApp"
              >
                <ChatCircle size={13} weight="fill" />
              </a>
              <a
                href={`skype:${cleanNumber(service.number)}?call`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                title="Skype"
              >
                <VideoCamera size={13} weight="fill" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
