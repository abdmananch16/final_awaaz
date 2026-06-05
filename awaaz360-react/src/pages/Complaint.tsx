import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, Upload, X, Image, File, CaretDown, CaretUp, MapPin, MapPinSimple } from '@phosphor-icons/react';

const CATEGORIES = ['Electricity', 'Water', 'Roads', 'Sanitation', 'Gas', 'Drainage', 'Other'];

interface EvidenceFile {
  file: File;
  preview?: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  name?: string;
  original?: string;
  size?: number;
  mimetype?: string;
}

export default function Complaint() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Electricity');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [submitting, setSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [geoLocation, setGeoLocation] = useState<{lat:number;lng:number;accuracy?:number} | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoCaptureKey, setGeoCaptureKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-capture geolocation on mount & after form reset
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Browser geolocation support nahi karta');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoLoading(false);
        setGeoError('');
      },
      (err) => {
        setGeoLoading(false);
        switch(err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Location permission deny kar di gayi. Manual location daal sakte hain.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Location available nahi hai');
            break;
          case err.TIMEOUT:
            setGeoError('Location fetch ka time khatam ho gaya');
            break;
          default:
            setGeoError('Location fetch nahi ho saki');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [geoCaptureKey]);

  const isImage = (file: File) => file.type.startsWith('image/');

  const generatePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!isImage(file)) { resolve(undefined); return; }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  };

  const addFiles = useCallback(async (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => {
      const isImg = f.type.startsWith('image/');
      const isPdf = f.type === 'application/pdf';
      if (!isImg && !isPdf) {
        toast.error(`${f.name} — sirf images aur PDF allowed hain`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} — 10MB se barhi hai`);
        return false;
      }
      return true;
    });

    if (evidenceFiles.length + validFiles.length > 5) {
      toast.error('Sirf 5 files upload kar sakte hain');
      return;
    }

    const withPreviews = await Promise.all(
      validFiles.map(async (file) => ({
        file,
        preview: await generatePreview(file),
        uploading: false,
        uploaded: false,
      }))
    );

    setEvidenceFiles(prev => [...prev, ...withPreviews]);
  }, [evidenceFiles.length]);

  const removeFile = (index: number) => {
    setEvidenceFiles(prev => {
      const f = prev[index];
      if (f.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, [addFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Naam zaroor bharein!'); return; }
    if (!description.trim()) { toast.error('Masla bayan karein!'); return; }
    
    setSubmitting(true);

    // Upload evidence files first
    let uploadedEvidence: Array<{name:string;original:string;size:number;mimetype:string;url:string}> = [];
    const pendingFiles = evidenceFiles.filter(f => !f.uploaded && !f.uploading);

    if (pendingFiles.length > 0) {
      setUploadingFiles(true);
      try {
        const result = await api.uploadEvidence(pendingFiles.map(f => f.file));
        uploadedEvidence = result.files;
        setEvidenceFiles(prev => prev.map(f => {
          const match = result.files.find(r => r.original === f.file.name);
          if (match) return { ...f, uploaded: true, uploading: false, ...match };
          return f;
        }));
      } catch (e: any) {
        toast.error('Files upload mein masla: ' + (e.message || 'Unknown error'));
        setUploadingFiles(false);
        setSubmitting(false);
        return;
      }
      setUploadingFiles(false);
    } else {
      // Files already uploaded previously in this session
      uploadedEvidence = evidenceFiles
        .filter(f => f.uploaded && f.url)
        .map(f => ({ name: f.name!, original: f.original!, size: f.size!, mimetype: f.mimetype!, url: f.url! }));
    }

    try {
      const result = await api.createComplaint({ 
        name: name.trim(), 
        phone: phone.trim(), 
        category, 
        description: description.trim(), 
        location: location.trim(),
        evidence: uploadedEvidence.length > 0 ? uploadedEvidence : undefined,
        geoLocation: geoLocation ? { lat: geoLocation.lat, lng: geoLocation.lng } : undefined,
      });
      
      let msg = uploadedEvidence.length > 0
        ? `✅ Darj ho gayi! ID: ${result.id} — ${uploadedEvidence.length} file(s) attached`
        : `✅ Darj ho gayi! ID: ${result.id}`;
      if (result.geoTagged) msg += ' 📍 (Geo-Tagged)';
      toast.success(msg);
      
      // Reset form & re-capture location for next submission
      setName(''); setPhone(''); setDescription(''); setLocation('');
      setCategory('Electricity'); setPriority('Normal');
      setEvidenceFiles([]);
      setGeoLocation(null);
      setGeoCaptureKey(k => k + 1);
    } catch (e: any) {
      toast.error(e.message || 'Koi masla aaya');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(0,229,176,0.15), rgba(255,209,102,0.15))',
          border: '1px solid rgba(0,229,176,0.25)',
          boxShadow: '0 0 20px rgba(0,229,176,0.15)',
        }}>
          <FileText size={24} weight="duotone" style={{ color: 'var(--color-teal)' }} />
        </span>
        <div>
          <div className="title" style={{
            background: 'linear-gradient(135deg, #00e5b0, #4fc3f7, #a29bfe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>📋 New Complaint Register</div>
          <div className="subtitle">Apni shikayat darj karein — tasveerein aur documents bhi attach karein</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-3d space-y-5">
        {/* Form Header */}
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
          <FileText size={20} weight="duotone" style={{ color: 'var(--color-teal)' }} />
          <div>
            <div className="font-semibold">Shikayat Darj Karein</div>
            <div className="text-xs" style={{ color: 'var(--color-fg2)' }}>Apni shikayat ke details bharein</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label>👤 Aapka Naam *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ahmed Ali" />
          </div>
          <div>
            <label>📱 Phone Number</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="03XX-XXXXXXX" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label>📂 Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>📍 Area / Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Satellite Town, Rwp" />
          </div>
        </div>

        <div>
          <label>📝 Masla Detail mein *</label>
          <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Masla mukammal taur par bayan karein... (e.g. gali ka toota hua raasta, street light ka kaam na karna)" />
        </div>

        {/* Evidence Upload Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="mb-0 flex items-center gap-2">
              <Image size={16} weight="duotone" style={{ color: 'var(--color-teal)' }} />
              Evidence Attach karein (Images/PDFs)
            </label>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: evidenceFiles.length > 0 ? 'rgba(0,229,176,0.1)' : 'transparent', color: 'var(--color-fg2)' }}>{evidenceFiles.length}/5 files</span>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all duration-300 ${
              dragging 
                ? 'border-teal-400 scale-[1.02]' 
                : 'border-gray-500/30 hover:border-gray-400/50'
            }`}
            style={{ background: dragging ? 'rgba(0, 137, 123, 0.1)' : 'transparent' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload size={40} className="mx-auto mb-3" weight="duotone" style={{ color: 'var(--color-teal)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>
              {dragging ? 'Yahan chhod dein!' : 'Yahan click karein ya drag & drop karein'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-fg2)' }}>
              Images (JPEG, PNG, GIF, WebP) ya PDF — 10MB tak, 5 files maximum
            </p>
          </div>

          {/* File Previews */}
          {evidenceFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {evidenceFiles.map((ef, i) => (
                <div
                  key={i}
                  className="relative group rounded-2xl overflow-hidden border transition-all hover:scale-105"
                  style={{ 
                    background: 'var(--color-card)', 
                    borderColor: ef.uploaded ? 'rgba(0, 200, 83, 0.4)' : 'var(--color-glass-border)',
                    boxShadow: ef.uploaded ? '0 0 20px rgba(0,200,83,0.15)' : 'none',
                  }}
                >
                  {/* Preview */}
                  {ef.preview ? (
                    <div className="h-20 overflow-hidden">
                      <img src={ef.preview} alt={ef.file.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center" style={{ background: 'var(--color-card2)' }}>
                      <File size={28} weight="fill" style={{ color: 'var(--color-orange)' }} />
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-[10px] truncate font-medium" style={{ color: 'var(--color-fg)' }}>
                      {ef.file.name.length > 18 ? ef.file.name.substring(0, 16) + '…' : ef.file.name}
                    </p>
                    <p className="text-[9px]" style={{ color: 'var(--color-fg2)' }}>
                      {formatSize(ef.file.size)}
                      {ef.uploaded && <span className="ml-1" style={{ color: 'var(--color-green)' }}>✓ Uploaded</span>}
                    </p>
                  </div>

                  {/* Status overlay */}
                  {ef.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Geo-Tagged Evidence Badge */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ 
          background: geoLocation ? 'linear-gradient(135deg, rgba(0,229,176,0.08), rgba(79,195,247,0.05))' : 'var(--color-glass)', 
          border: `1px solid ${geoLocation ? 'rgba(0,229,176,0.25)' : 'var(--color-glass-border)'}`,
          boxShadow: geoLocation ? '0 0 20px rgba(0,229,176,0.08)' : 'none',
        }}>
          {geoLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
              <span className="text-sm" style={{ color: 'var(--color-fg2)' }}>Location capture ho rahi hai...</span>
            </>
          ) : geoLocation ? (
            <>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,176,0.12)' }}>
                <MapPin size={18} weight="duotone" style={{ color: 'var(--color-teal)' }} />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium" style={{ color: 'var(--color-teal)' }}>📍 Geo-Tagged</span>
                <span className="text-xs ml-2" style={{ color: 'var(--color-fg2)' }}>
                  {geoLocation.lat.toFixed(6)}, {geoLocation.lng.toFixed(6)}
                  {geoLocation.accuracy && ` (±${Math.round(geoLocation.accuracy)}m)`}
                </span>
              </div>
            </>
          ) : (
            <>
              <MapPinSimple size={20} weight="duotone" style={{ color: 'var(--color-fg2)' }} />
              <div className="flex-1">
                <span className="text-sm" style={{ color: 'var(--color-fg2)' }}>
                  {geoError || 'Location available nahi — manual location daal sakte hain'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Advanced Options */}
        <div className="p-4 rounded-xl" style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium w-full"
            style={{ color: 'var(--color-fg2)' }}
          >
            {showAdvanced ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
            Advanced Options
          </button>
          
          {showAdvanced && (
            <div className="mt-3 animate-in">
              <label>Priority</label>
              <div className="flex gap-3 flex-wrap mt-1">
                {['Low', 'Normal', 'High', 'Urgent'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      priority === p ? 'btn' : 'btn-secondary'
                    }`}
                  >
                    {p === 'Urgent' ? '🚨 Urgent' : p === 'High' ? '🔴 High' : p === 'Normal' ? '🟡 Normal' : '🟢 Low'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || uploadingFiles}
          className="btn w-full md:w-auto flex items-center gap-2 px-8 py-3"
        >
          {submitting || uploadingFiles ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
          ) : (
            <><CheckCircle size={18} weight="fill" /> Submit Complaint{evidenceFiles.length > 0 && ` (${evidenceFiles.length} files)`}</>
          )}
        </button>
      </form>
    </div>
  );
}
