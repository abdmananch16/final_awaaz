import { useState, useEffect, useCallback } from 'react';
import { X, CaretLeft, CaretRight, Download, File, MagnifyingGlassPlus, MagnifyingGlassMinus } from '@phosphor-icons/react';
import { api, resolveUrl } from '../api/client';

interface EvidenceFile {
  name: string;
  original: string;
  size: number;
  mimetype: string;
  url: string;
}

interface EvidenceViewerProps {
  complaintId: string;
  onClose: () => void;
}

export default function EvidenceViewer({ complaintId, onClose }: EvidenceViewerProps) {
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const result = await api.getEvidence(complaintId);
        setEvidence(result.evidence || []);
        if (!result.evidence || result.evidence.length === 0) {
          setError('Koi evidence nahi mila');
        }
      } catch (e: any) {
        setError(e.message || 'Evidence load nahi ho saka');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [complaintId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : evidence.length - 1));
    setZoomed(false);
  }, [evidence.length]);

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev < evidence.length - 1 ? prev + 1 : 0));
    setZoomed(false);
  }, [evidence.length]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="glass-card p-8 rounded-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            <span style={{ color: 'var(--color-fg)' }}>Evidence load ho raha hai...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || evidence.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="glass-card p-8 rounded-2xl text-center" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
          <File size={48} className="mx-auto mb-3" weight="duotone" style={{ color: 'var(--color-fg2)' }} />
          <p className="text-lg font-medium mb-1" style={{ color: 'var(--color-fg)' }}>No Evidence</p>
          <p className="text-sm mb-4" style={{ color: 'var(--color-fg2)' }}>
            {error || 'Is complaint ke liye koi evidence attach nahi kiya gaya'}
          </p>
          <button onClick={onClose} className="btn">Close</button>
        </div>
      </div>
    );
  }

  const current = evidence[currentIndex];
  const isImageView = current?.mimetype?.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full h-full flex flex-col" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', margin: 'auto' }}>
        
        {/* Top bar */}
        <div className="flex items-center justify-between p-3 rounded-t-2xl" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.1)', color: '#aaa' }}>
              {complaintId}
            </span>
            <span className="text-sm" style={{ color: '#ccc' }}>
              {currentIndex + 1} / {evidence.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isImageView && (
              <button
                onClick={() => setZoomed(!zoomed)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                title={zoomed ? 'Zoom out' : 'Zoom in'}
              >
                {zoomed ? <MagnifyingGlassMinus size={18} weight="bold" color="#ccc" /> : <MagnifyingGlassPlus size={18} weight="bold" color="#ccc" />}
              </button>
            )}
            <a
              href={resolveUrl(current.url)}
              download={current.original}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              title="Download"
            >
              <Download size={18} color="#ccc" />
            </a>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X size={20} color="#ccc" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
          
          {/* Previous button */}
          {evidence.length > 1 && (
            <button
              onClick={goPrev}
              className="absolute left-2 z-10 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <CaretLeft size={28} weight="bold" color="rgba(255,255,255,0.7)" />
            </button>
          )}

          {/* Image / PDF */}
          {isImageView ? (
            <img
              src={resolveUrl(current.url)}
              alt={current.original}
              className="transition-transform duration-300"
              style={{
                maxWidth: zoomed ? '150%' : '90%',
                maxHeight: zoomed ? '150%' : '85%',
                objectFit: 'contain',
                cursor: zoomed ? 'zoom-out' : 'zoom-in',
              }}
              onClick={() => setZoomed(!zoomed)}
            />
          ) : (
            <div className="text-center p-8">
              <File size={64} className="mx-auto mb-4" weight="duotone" color="rgba(255,255,255,0.5)" />
              <p className="text-lg font-medium mb-2" style={{ color: '#ddd' }}>{current.original}</p>
              <p className="text-sm mb-4" style={{ color: '#999' }}>
                PDF Document — {(current.size / 1024).toFixed(1)} KB
              </p>
              <a
                href={resolveUrl(current.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn inline-flex items-center gap-2"
                style={{ background: 'var(--color-teal)', color: '#fff' }}
              >
                <Download size={16} /> Open PDF
              </a>
            </div>
          )}

          {/* Next button */}
          {evidence.length > 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 z-10 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <CaretRight size={28} weight="bold" color="rgba(255,255,255,0.7)" />
            </button>
          )}
        </div>

        {/* Thumbnails strip */}
        {evidence.length > 1 && (
          <div className="flex items-center gap-2 p-3 overflow-x-auto" style={{ background: 'rgba(0,0,0,0.6)' }}>
            {evidence.map((ef, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIndex(i); setZoomed(false); }}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentIndex ? 'border-teal-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                {ef.mimetype.startsWith('image/') ? (
                  <img src={resolveUrl(ef.url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <File size={16} color="#aaa" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
