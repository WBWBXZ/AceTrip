'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface DrawData {
  html: string;
  isCombined: boolean;
  parts: string[];
  drawNotPublished: boolean;
  error?: string;
}

const PART_LABELS: Record<string, string> = {
  WS: '女单',
  MS: '单打',
  WD: '女双',
  MD: '双打',
  QS: '资格赛',
  PS: '女子资格赛',
  WS_ENTRY: '女单参赛名单',
  MS_ENTRY: '参赛名单',
  TROPHY: '历届冠军',
};

interface Props {
  liveTennisId: number | string;
  year?: number;
}

export function DrawViewer({ liveTennisId, year = 2026 }: Props) {
  const [data, setData] = useState<DrawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePart, setActivePart] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDraw = async () => {
      try {
        const res = await fetch(`/api/draw?ltId=${liveTennisId}&year=${year}`);
        const d = await res.json();
        if (d.html && d.html.length > 100 && !d.error) {
          setData(d);
          // For unpublished draws, show TROPHY; otherwise default to WS for combined, first part for others
          const defaultPart = d.drawNotPublished ? 'TROPHY' : (d.isCombined ? 'WS' : (d.parts[0] || 'MS'));
          setActivePart(defaultPart);
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDraw();
  }, [liveTennisId, year]);

  // Show/hide parts when activePart changes
  useEffect(() => {
    if (!containerRef.current || !activePart) return;
    containerRef.current.querySelectorAll('.cDrawPart').forEach(el => {
      const part = el as HTMLElement;
      const partId = part.getAttribute('data-id');
      part.style.display = partId === activePart ? '' : 'none';
    });
    // Lazy load images in visible part
    containerRef.current.querySelectorAll('.cDrawPart[style=""] img[data-original], .cDrawPart:not([style*="none"]) img[data-original]').forEach(img => {
      const imgEl = img as HTMLImageElement;
      const src = imgEl.getAttribute('data-original');
      if (src && !imgEl.src.includes(src)) imgEl.src = src;
    });
  }, [activePart, data]);

  const handlePartClick = useCallback((part: string) => {
    setActivePart(part);
  }, []);

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="font-noto-serif text-2xl font-bold text-gray-900 mb-6">签表</h2>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--tennis-green)] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">加载签表中...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-8">
        <h2 className="font-noto-serif text-2xl font-bold text-gray-900 mb-4">签表</h2>
        <p className="text-sm text-gray-400 italic">签表尚未公布</p>
      </div>
    );
  }

  // Filter parts to show (for combined events, only WTA parts)
  const visibleParts = data.isCombined
    ? data.parts.filter(p => ['WS', 'WD', 'PS', 'WS_ENTRY', 'TROPHY'].includes(p))
    : data.parts;

  return (
    <div className="py-8">
      <h2 className="font-noto-serif text-2xl font-bold text-gray-900 mb-4">签表</h2>
      
      {/* Not published notice */}
      {data.drawNotPublished && (
        <p className="text-sm text-gray-400 italic mb-4">签表尚未公布</p>
      )}
      
      {/* Part selector tabs - only show when draw is published and has multiple parts */}
      {!data.drawNotPublished && visibleParts.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {visibleParts.map(part => (
            <button
              key={part}
              onClick={() => handlePartClick(part)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                activePart === part
                  ? 'bg-[var(--tennis-green)] text-white'
                  : 'bg-black/5 text-gray-600 hover:bg-black/10'
              }`}
            >
              {PART_LABELS[part] || part}
            </button>
          ))}
        </div>
      )}

      {/* Draw content */}
      <div
        ref={containerRef}
        className="draw-viewer overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: data.html }}
      />

      <style jsx global>{`
        .draw-viewer {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }
        .draw-viewer #iDrawInfo {
          display: none;
        }
        .draw-viewer #iDrawPartSelector {
          display: none;
        }
        .draw-viewer .cDrawPartTitle {
          font-weight: 700;
          font-size: 14px;
          color: var(--tennis-green-dark);
          padding: 12px 0 8px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          margin-bottom: 8px;
        }
        .draw-viewer .cDrawBlockRow {
          border-collapse: collapse;
          width: 100%;
          margin: 2px 0;
        }
        .draw-viewer .cDrawBlock {
          border-collapse: collapse;
          width: 100%;
        }
        .draw-viewer .cDrawGrid {
          padding: 4px 8px;
          border: 1px solid rgba(0,0,0,0.04);
          font-size: 12px;
          vertical-align: middle;
        }
        .draw-viewer .cDrawGridOdd {
          background: rgba(0,0,0,0.015);
        }
        .draw-viewer .cDrawSeq {
          width: 24px;
          text-align: center;
          color: #999;
          font-size: 10px;
          padding: 2px;
        }
        .draw-viewer .cDrawGridScore {
          padding: 4px 6px;
          text-align: center;
          font-size: 11px;
          color: #666;
          vertical-align: middle;
          border: 1px solid rgba(0,0,0,0.04);
        }
        .draw-viewer .cDrawEntryWin,
        .draw-viewer .cDrawEntryWin pname {
          font-weight: 600;
          color: var(--tennis-green-dark);
        }
        .draw-viewer .cDrawEntryLose,
        .draw-viewer .cDrawEntryLose pname {
          color: #999;
        }
        .draw-viewer .cDrawEntrySeed {
          color: #C9A84C;
          font-weight: 700;
          font-size: 10px;
        }
        .draw-viewer .cDrawEntryCountry {
          margin-right: 4px;
        }
        .draw-viewer img.playerFlag {
          width: 16px;
          height: 12px;
          vertical-align: middle;
          margin-right: 3px;
          border-radius: 1px;
        }
        .draw-viewer .cDrawTrophyDiv {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .draw-viewer .cDrawTrophyYear {
          font-weight: 700;
          color: var(--tennis-green);
          min-width: 40px;
        }
        .draw-viewer .cDrawTrophyImg {
          width: 60px;
          height: auto;
          border-radius: 4px;
        }
        .draw-viewer .cDrawTrophyName {
          font-weight: 500;
        }
        .draw-viewer .cDrawTrophyPic {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .draw-viewer .cDrawEntryPortraitImg {
          display: none;
        }
        .draw-viewer a {
          color: inherit;
          text-decoration: none;
          pointer-events: none;
        }
        .draw-viewer .cDrawGridSideBorder {
          border-left: 2px solid rgba(0,0,0,0.08);
        }
        .draw-viewer .cDrawPartS {
          min-width: 800px;
        }
        .draw-viewer .BgOdd {
          background: rgba(0,0,0,0.01);
        }
        .draw-viewer pname {
          font-size: 12px;
          display: inline-flex;
          align-items: baseline;
          gap: 4px;
        }
        .draw-viewer .entrySign {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 16px;
          padding: 0 3px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          flex-shrink: 0;
          margin-right: 4px;
          background: #C9A84C;
          color: white;
        }
        .draw-viewer .entrySign:empty {
          display: none;
        }
        .draw-viewer .draw-cn {
          font-weight: 600;
          font-size: 12px;
          color: var(--text-primary);
        }
        .draw-viewer .draw-en {
          font-size: 10px;
          color: #999;
          margin-left: 2px;
        }
        .draw-viewer .cDrawEntryWin .draw-cn {
          color: var(--tennis-green-dark);
        }
        .draw-viewer .cDrawEntryLose .draw-cn {
          color: #bbb;
        }
        .draw-viewer .cDrawEntryLose .draw-en {
          color: #ccc;
        }
      `}</style>
    </div>
  );
}
