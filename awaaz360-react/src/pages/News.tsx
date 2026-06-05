import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ArrowsClockwise, ArrowSquareOut, Newspaper } from '@phosphor-icons/react';

interface NewsItem { title: string; link: string; date: string; source: string; summary: string; }

export default function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await api.getNews();
      setItems(data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadNews(); }, []);

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="p-2 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(255,209,102,0.15), rgba(79,195,247,0.15))',
          border: '1px solid rgba(255,209,102,0.25)',
          boxShadow: '0 0 20px rgba(255,209,102,0.15)',
        }}>
          <Newspaper size={24} weight="duotone" style={{ color: 'var(--color-gold)' }} />
        </span>
        <div>
          <div className="title" style={{
            background: 'linear-gradient(135deg, #ffd166, #4fc3f7, #00e5b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>📰 Civic Alerts & News</div>
          <div className="subtitle">Latest news from live sources — Tavily & RSS feeds</div>
        </div>
      </div>

      <button onClick={loadNews} disabled={loading} className="btn flex items-center gap-2 mb-4">
        <ArrowsClockwise size={16} weight="bold" className={loading ? 'animate-spin' : ''} /> Refresh Latest News
      </button>

      {items.length === 0 && !loading ? (
        <div className="card-3d text-center py-12" style={{ color: 'var(--color-fg2)' }}>
          <Newspaper size={48} className="mx-auto mb-3" weight="duotone" style={{ opacity: 0.3 }} />
          <div>Live news abhi fetch nahi ho saki. Tavily key ya internet source check karein.</div>
        </div>
      ) : (
        <>
          <div className="text-xs mb-4 px-1 py-2 rounded-xl flex items-center gap-2" style={{ 
            color: 'var(--color-fg2)',
            background: 'rgba(79,195,247,0.06)',
            border: '1px solid rgba(79,195,247,0.1)'
          }}>
            <Newspaper size={14} weight="fill" style={{ color: 'var(--color-sky)' }} />
            Tavily live search use hoti hai; agar Tavily unavailable ho to live RSS fallback use hota hai.
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="card-3d text-center py-12" style={{ color: 'var(--color-fg2)' }}>
                <div className="spinner mx-auto mb-3" />
                Loading news...
              </div>
            ) : (
              items.map((item, i) => (
                <div key={i} className={`news-card animate-in`} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ 
                      background: 'rgba(0,229,176,0.1)', 
                      color: 'var(--color-teal)' 
                    }}>
                      {item.source}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-fg2)' }}>{item.date}</span>
                  </div>
                  <div className="font-semibold text-base mb-1.5 leading-relaxed">{item.title}</div>
                  {item.summary && (
                    <div className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--color-fg2)' }}>{item.summary}</div>
                  )}
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl transition-all hover:scale-105"
                      style={{
                        background: 'rgba(79,195,247,0.1)',
                        color: 'var(--color-sky)',
                        border: '1px solid rgba(79,195,247,0.2)',
                      }}
                    >
                      <ArrowSquareOut size={12} weight="bold" /> Read More
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
