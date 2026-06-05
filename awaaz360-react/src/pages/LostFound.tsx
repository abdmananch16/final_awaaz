import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import toast from 'react-hot-toast';
import { MagnifyingGlass, Plus, CheckCircle, Trash } from '@phosphor-icons/react';

const ITEM_TYPES = ['CNIC', 'Document', 'Other'];
const POST_TYPES = ['lost', 'found'];

interface LostFoundItem {
  id: string;
  type: string;
  item_type: string;
  title: string;
  description: string;
  name: string;
  phone: string;
  location: string;
  date: string;
  status: string;
}

export default function LostFound() {
  const [tab, setTab] = useState<'post' | 'browse'>('browse');
  const [postType, setPostType] = useState<'lost' | 'found'>('lost');
  const [itemType, setItemType] = useState('CNIC');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getLostFoundItems(filterType, searchQuery);
      setItems(data);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [filterType, searchQuery]);

  useEffect(() => { if (tab === 'browse') loadItems(); }, [tab, loadItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title zaroori hai'); return; }
    if (!name.trim()) { toast.error('Apna naam likhein'); return; }
    try {
      const result = await api.createLostFoundItem({
        type: postType,
        itemType,
        title: title.trim(),
        description: description.trim(),
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
      });
      toast.success(`${postType === 'lost' ? 'Gumshuda' : 'Payi gayi'} cheez register ho gayi! ID: ${result.id}`);
      setTitle(''); setDescription(''); setName(''); setPhone(''); setLocation(''); setItemType('CNIC');
      setTab('browse');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.resolveLostFoundItem(id);
      toast.success('Marked as resolved!');
      loadItems();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Is record ko delete karna chahte hain?')) return;
    try {
      await api.deleteLostFoundItem(id);
      toast.success('Deleted');
      loadItems();
    } catch { toast.error('Failed to delete'); }
  };

  const typeIcon = (type: string) => {
    if (type === 'lost') return '🔴';
    return '🟢';
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(255,209,102,0.15), rgba(255,138,128,0.15))',
          border: '1px solid rgba(255,209,102,0.25)',
          boxShadow: '0 0 20px rgba(255,209,102,0.15)',
        }}>            <MagnifyingGlass size={24} weight="duotone" style={{ color: 'var(--color-gold)' }} />
        </span>
        <div>
          <div className="title" style={{
            background: 'linear-gradient(135deg, #ffd166, #ff8a80, #ff7b54)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>📦 Lost & Found</div>
          <div className="subtitle">Gumshuda cheezein dhoondhein ya kisi ki khoi hui cheez wapas karein</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('browse')} className={tab === 'browse' ? 'btn' : 'btn-secondary'}>
          Browse
        </button>
        <button onClick={() => setTab('post')} className={tab === 'post' ? 'btn' : 'btn-secondary'}>
          Post
        </button>
      </div>

      {tab === 'post' ? (
        <form onSubmit={handleSubmit} className="card-3d space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
            <Plus size={18} weight="bold" style={{ color: 'var(--color-teal)' }} />
            <div>
              <div className="font-semibold text-sm">Naya Post</div>
              <div className="text-xs" style={{ color: 'var(--color-fg2)' }}>Gumshuda ya payi gayi cheez register karein</div>
            </div>
          </div>
          <div className="flex gap-3 mb-2">
            {POST_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setPostType(t as 'lost' | 'found')}
                className={postType === t ? 'btn' : 'btn-secondary'}
                style={postType === t ? {} : { flex: 1 }}
              >
                {t === 'lost' ? '🔴 Gumshuda (Lost)' : '🟢 Payi Gayi (Found)'}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label>Item Type *</label>
              <select value={itemType} onChange={e => setItemType(e.target.value)}>
                {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lost CNIC near F-10 Market" />
            </div>
          </div>

          <div>
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Koi extra details (optional)" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label>Your Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ahmed Ali" />
            </div>
            <div>
              <label>Phone</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="03XX-XXXXXXX" />
            </div>
            <div>
              <label>Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Lahore" />
            </div>
          </div>

          <button type="submit" className="btn flex items-center gap-2">
            <CheckCircle size={16} weight="fill" />
            {postType === 'lost' ? 'Post Gumshuda' : 'Post Payi Gayi'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-40">
              <option value="All">Sab (All)</option>
              <option value="lost">🔴 Lost</option>
              <option value="found">🟢 Found</option>
            </select>
            <div className="flex-1 min-w-[200px] relative">
              <MagnifyingGlass size={16} weight="bold" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-fg2)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, description or name..."
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="text-xs" style={{ color: 'var(--color-fg2)' }}>
            {loading ? 'Loading...' : `${items.length} records`}
          </div>

          {loading ? (
            <div className="text-center py-12" style={{ color: 'var(--color-fg2)' }}>
              <div className="spinner mx-auto mb-3"></div>
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="card-3d text-center py-12" style={{ color: 'var(--color-fg2)' }}>
              <MagnifyingGlass size={40} weight="duotone" className="mx-auto mb-3" style={{ opacity: 0.4 }} />
              <div>Koi record nahi mila</div>
              <button onClick={() => setTab('post')} className="btn mt-4 flex items-center gap-2 mx-auto">
                <Plus size={16} weight="bold" /> Post karein
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="card-3d animate-in"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeIcon(item.type)}</span>
                      <span className="text-sm font-semibold" style={{ color: item.type === 'lost' ? 'var(--color-red)' : 'var(--color-green)' }}>
                        {item.type === 'lost' ? 'LOST' : 'FOUND'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-glass)', color: 'var(--color-fg2)' }}>
                        {item.item_type}
                      </span>
                    </div>
                    <span className={`status-pill ${item.status === 'Active' ? 'status-pending' : 'status-resolved'}`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm mb-3" style={{ color: 'var(--color-fg2)' }}>{item.description}</p>
                  )}

                  <div className="text-xs space-y-1 mb-3" style={{ color: 'var(--color-fg2)' }}>
                    <div>👤 {item.name} {item.phone !== 'N/A' ? `| ${item.phone}` : ''}</div>
                    <div>📍 {item.location} | 📅 {item.date}</div>
                    <div className="font-mono text-[10px]" style={{ color: 'var(--color-teal)' }}>ID: {item.id}</div>
                  </div>

                  {item.status === 'Active' && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleResolve(item.id)} className="btn-secondary text-xs" style={{ padding: '6px 14px' }}>
                        <CheckCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
                        Resolve
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="btn-danger text-xs" style={{ padding: '6px 14px' }}>
                        <Trash size={14} weight="bold" style={{ display: 'inline', marginRight: 4 }} />
                        Delete
                      </button>
                    </div>
                  )}
                  {item.status === 'Resolved' && (
                    <div className="text-xs font-semibold" style={{ color: 'var(--color-green)' }}>
                      ✅ Ye masla hal ho chuka hai
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
