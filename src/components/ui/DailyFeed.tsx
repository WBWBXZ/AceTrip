'use client';

import { useEffect, useState } from 'react';

interface NewsItem {
  title: string;
  source: string;
  date: string;
}

export default function DailyFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(data => {
        setNews(data.news || []);
        setUpdatedAt(data.updatedAt || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container-tight" style={{ paddingTop: '24px', paddingBottom: '16px' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-3 w-20 bg-black/5 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 items-start py-3">
            <div className="w-7 h-7 rounded-full bg-black/5 animate-pulse flex-shrink-0" />
            <div className="h-4 bg-black/5 rounded animate-pulse flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!news.length) return null;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return d; }
  };

  return (
    <div className="container-tight" style={{ paddingTop: '24px', paddingBottom: '16px' }}>
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-4">
        <h3
          className="text-xs font-semibold text-[var(--tennis-green-dark)] tracking-[0.2em] uppercase"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Daily Feed
        </h3>
        <div className="flex-1 h-px bg-[var(--tennis-green)]/15" />
        {updatedAt && (
          <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
            {formatDate(updatedAt)}
          </span>
        )}
      </div>

      {/* 新闻列表 */}
      <div className="divide-y divide-black/[0.04]">
        {news.map((item, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                background: 'var(--tennis-green)',
                color: 'white',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[var(--text-primary)] leading-snug font-medium">
                {item.title}
              </p>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
                {item.source} · {formatDate(item.date)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
