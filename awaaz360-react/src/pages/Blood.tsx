import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import toast from 'react-hot-toast';
import { Heart } from '@phosphor-icons/react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

interface Donor { id: number; name: string; phone: string; b_group: string; area: string; date: string; }

export default function Blood() {
  const [tab, setTab] = useState<'register' | 'search'>('register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [area, setArea] = useState('');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filterGroup, setFilterGroup] = useState('All');
  const [filterArea, setFilterArea] = useState('');
  const [donorId, setDonorId] = useState('');

  const loadDonors = useCallback(async () => {
    try {
      const data = await api.getDonors(filterGroup, filterArea);
      setDonors(data);
    } catch { toast.error('Failed to load donors'); }
  }, [filterGroup, filterArea]);

  useEffect(() => { if (tab === 'search') loadDonors(); }, [tab, loadDonors]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Naam zaroor!'); return; }
    try {
      await api.createDonor({ name: name.trim(), phone: phone.trim(), bloodGroup, area: area.trim() });
      toast.success(`${name} register ho gaya! Shukriya`);
      setName(''); setPhone(''); setArea(''); setBloodGroup('A+');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!donorId) { toast.error('Donor ID enter karein'); return; }
    try {
      await api.deleteDonor(parseInt(donorId));
      toast.success('Donor delete ho gaya.');
      loadDonors();
      setDonorId('');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(253,121,168,0.15), rgba(255,71,87,0.15))',
          border: '1px solid rgba(253,121,168,0.25)',
          boxShadow: '0 0 20px rgba(253,121,168,0.15)',
        }}>
          <Heart size={24} weight="duotone" style={{ color: 'var(--color-pink)' }} />
        </span>
        <div>
          <div className="title" style={{
            background: 'linear-gradient(135deg, #fd79a8, #ff4757, #ff6b9d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>🩸 Blood Donor Directory</div>
          <div className="subtitle">Donor register karein ya zaroorat ke waqt dhoondhein</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('register')} className={tab === 'register' ? 'btn' : 'btn-secondary'}>Register</button>
        <button onClick={() => setTab('search')} className={tab === 'search' ? 'btn' : 'btn-secondary'}>Search</button>
      </div>

      {tab === 'register' ? (
        <form onSubmit={handleRegister} className="card-3d space-y-5">
          {/* Form Header */}
          <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
            <Heart size={20} weight="duotone" style={{ color: 'var(--color-pink)' }} />
            <div>
              <div className="font-semibold">Naya Donor Register</div>
              <div className="text-xs" style={{ color: 'var(--color-fg2)' }}>Apni maloomat darj karein</div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label><span style={{ color: 'var(--color-pink)' }}>❤️</span> Donor Naam *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ahmed Ali" />
            </div>
            <div>
              <label>📱 Phone *</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="03XX-XXXXXXX" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label>🩸 Blood Group *</label>
              <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label>📍 Area</label>
              <input type="text" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Rawalpindi" />
            </div>
          </div>
          <button type="submit" className="btn w-full md:w-auto flex items-center gap-2">
            <Heart size={16} /> Register Donor
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="w-40">
              <option value="All">All Groups</option>
              {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input type="text" value={filterArea} onChange={e => setFilterArea(e.target.value)} placeholder="Area" className="flex-1 min-w-[150px]" />
          </div>

          <div className="text-xs" style={{ color: 'var(--color-fg2)' }}>{donors.length} donors</div>

          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--color-glass-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-card-solid))' }}>
                  <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>ID</th>
                  <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Name</th>
                  <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Phone</th>
                  <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Blood Group</th>
                  <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Area</th>
                  <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Date</th>
                </tr>
              </thead>
              <tbody>
            {donors.length === 0 ? (
              <tr key="empty"><td colSpan={6} className="text-center p-8" style={{ color: 'var(--color-fg2)' }}>
                    <Heart size={32} className="mx-auto mb-2" style={{ opacity: 0.3, color: 'var(--color-pink)' }} />
                    No donors found
                  </td></tr>
                ) : donors.map((row) => (
                  <tr key={row.id} className="border-t transition-all hover:bg-white/[0.02]" style={{ borderColor: 'var(--color-glass-border)' }}>
                    <td className="p-3.5 font-mono text-xs">{row.id}</td>
                    <td className="p-3.5 font-medium">{row.name}</td>
                    <td className="p-3.5">{row.phone}</td>
                    <td className="p-3.5">
                      <span className="status-pill status-resolved heartbeat inline-block">{row.b_group}</span>
                    </td>
                    <td className="p-3.5">{row.area}</td>
                    <td className="p-3.5" style={{ color: 'var(--color-fg2)' }}>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label>Donor ID to delete</label>
              <input type="text" value={donorId} onChange={e => setDonorId(e.target.value)} placeholder="Enter ID" />
            </div>
            <button onClick={handleDelete} className="btn-danger h-fit">Delete Donor</button>
          </div>
        </div>
      )}
    </div>
  );
}
