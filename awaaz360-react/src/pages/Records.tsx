import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import toast from 'react-hot-toast';
import { MagnifyingGlass, Download, ClipboardText, Image, Eye, Gear, CheckCircle } from '@phosphor-icons/react';
import EvidenceViewer from '../components/EvidenceViewer';

const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

interface Complaint { id: string; name: string; category: string; location: string; date: string; status: string; }

export default function Records() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [records, setRecords] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [cid, setCid] = useState('');
  const [newStatus, setNewStatus] = useState('Pending');
  const [action, setAction] = useState<'Update' | 'Delete'>('Update');
  const [evidenceComplaintId, setEvidenceComplaintId] = useState<string | null>(null);
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>({});

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getComplaints(query, status);
      setRecords(data);
      
      // Check evidence counts for each record
      const counts: Record<string, number> = {};
      await Promise.all(data.map(async (r: Complaint) => {
        try {
          const ev = await api.getEvidence(r.id);
          if (ev.evidence && ev.evidence.length > 0) {
            counts[r.id] = ev.evidence.length;
          }
        } catch {}
      }));
      setEvidenceCounts(counts);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, [query, status]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handleApply = async () => {
    if (!cid.trim()) { toast.error('Record ID enter karein.'); return; }
    try {
      if (action === 'Update') {
        await api.updateComplaintStatus(cid.trim().toUpperCase(), newStatus);
        toast.success('Status update ho gaya.');
      } else {
        await api.deleteComplaint(cid.trim().toUpperCase());
        toast.success('Record delete ho gaya.');
      }
      loadRecords();
      setCid('');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await api.exportComplaintsPDF(query, status);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complaints_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF export failed'); }
  };

  const statusClass = (s: string) => {
    const map: Record<string, string> = { 'Pending': 'status-pending', 'In Progress': 'status-progress', 'Resolved': 'status-resolved', 'Rejected': 'status-rejected' };
    return map[s] || 'status-pending';
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(79,195,247,0.15), rgba(162,155,254,0.15))',
          border: '1px solid rgba(79,195,247,0.25)',
          boxShadow: '0 0 20px rgba(79,195,247,0.15)',
        }}>
          <ClipboardText size={24} weight="duotone" style={{ color: 'var(--color-sky)' }} />
        </span>
        <div>
          <div className="title" style={{
            background: 'linear-gradient(135deg, #4fc3f7, #a29bfe, #00e5b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>📊 Complaint Records</div>
          <div className="subtitle">Tamaam shikayat ka record dekhein aur manage karein</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <MagnifyingGlass size={16} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-fg2)' }} />
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search naam ya ID" className="pl-9"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="w-40">
          <option value="All">All</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> Export PDF
        </button>
      </div>

      <div className="text-xs mb-2" style={{ color: 'var(--color-fg2)' }}>{records.length} records</div>

      {/* Records Table */}
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--color-glass-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-card-solid))' }}>
              <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>ID</th>
              <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Name</th>
              <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Category</th>
              <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Location</th>
              <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Date</th>
              <th className="text-left p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Status</th>
              <th className="text-center p-3.5 font-semibold" style={{ color: 'var(--color-teal)' }}>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center p-8" style={{ color: 'var(--color-fg2)' }}>
                <div className="spinner mx-auto mb-2" />
                Loading...
              </td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-8" style={{ color: 'var(--color-fg2)' }}>
                <ClipboardText size={32} className="mx-auto mb-2" style={{ opacity: 0.3 }} />
                No records found
              </td></tr>
            ) : records.map((row) => {
              const evCount = evidenceCounts[row.id] || 0;
              return (
                <tr key={row.id} className="border-t transition-all hover:bg-white/[0.02]" style={{ borderColor: 'var(--color-glass-border)' }}>
                  <td className="p-3.5 font-mono text-xs">{row.id}</td>
                  <td className="p-3.5 font-medium">{row.name}</td>
                  <td className="p-3.5">
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(0,229,176,0.08)', color: 'var(--color-teal)' }}>{row.category}</span>
                  </td>
                  <td className="p-3.5" style={{ color: 'var(--color-fg2)' }}>{row.location}</td>
                  <td className="p-3.5" style={{ color: 'var(--color-fg2)' }}>{row.date}</td>
                  <td className="p-3.5">
                    <span className={`status-pill ${statusClass(row.status)}`}>{row.status}</span>
                  </td>
                  <td className="p-3.5 text-center">
                    {evCount > 0 ? (
                      <button
                        onClick={() => setEvidenceComplaintId(row.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                        style={{ background: 'rgba(0, 229, 176, 0.12)', color: 'var(--color-teal)', border: '1px solid rgba(0,229,176,0.2)' }}
                        title={`${evCount} evidence file(s) available`}
                      >
                        <Image size={12} weight="fill" />
                        <span>{evCount}</span>
                        <Eye size={11} weight="bold" className="opacity-60" />
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-fg2)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="card-3d mt-4">
        <div className="flex items-center gap-3 pb-3 mb-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
          <Gear size={18} weight="duotone" style={{ color: 'var(--color-teal)' }} />
          <div className="font-semibold text-sm">Manage Complaint</div>
        </div>
        <div className="grid md:grid-cols-[2fr_1fr_1fr] gap-4 items-end">
          <div>
            <label>Selected Complaint ID</label>
            <input type="text" value={cid} onChange={e => setCid(e.target.value)} placeholder="AWZ-XXXXXXXX" />
          </div>
          <div>
            <label>Update Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Action</label>
            <div className="flex gap-2">
              <button onClick={() => setAction('Update')} className={`flex-1 py-2 rounded-xl text-sm font-medium ${action === 'Update' ? 'btn' : 'btn-secondary'}`}>Update</button>
              <button key="delete" onClick={() => setAction('Delete')} className={`flex-1 py-2 rounded-xl text-sm font-medium ${action === 'Delete' ? 'btn-danger' : 'btn-secondary'}`}>Delete</button>
            </div>
          </div>
        </div>
        <button onClick={handleApply} className="btn mt-4 w-full md:w-auto">
          <CheckCircle size={16} /> Apply
        </button>
      </div>

      {/* Evidence Viewer Modal */}
      {evidenceComplaintId && (
        <EvidenceViewer
          complaintId={evidenceComplaintId}
          onClose={() => setEvidenceComplaintId(null)}
        />
      )}
    </div>
  );
}
