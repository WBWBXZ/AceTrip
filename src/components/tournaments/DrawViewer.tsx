'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BracketView } from './BracketView';
import { parseDraw, type DrawData as ParsedDrawData } from '@/lib/parseDraw';

interface DrawResponse {
  html: string;
  isCombined: boolean;
  parts: string[];
  drawNotPublished: boolean;
  error?: string;
}

const PART_LABELS: Record<string, string> = {
  WS: '女单',
  MS: '男单',
  WD: '女双',
  MD: '男双',
  QS: '资格赛',
  PS: '女子资格赛',
  WS_ENTRY: '女单参赛名单',
  MS_ENTRY: '男单参赛名单',
  TROPHY: '历届冠军',
};

interface Props {
  liveTennisId: number | string;
  year?: number;
}

export function DrawViewer({ liveTennisId, year = 2026 }: Props) {
  const [data, setData] = useState<DrawResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePart, setActivePart] = useState('');
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDraw() {
      setLoading(true);
      try {
        const response = await fetch(`/api/draw?ltId=${liveTennisId}&year=${year}`, {
          signal: controller.signal,
        });
        const nextData: DrawResponse = await response.json();
        if (nextData.html && nextData.html.length > 100 && !nextData.error) {
          setData(nextData);
          const defaultPart = nextData.drawNotPublished
            ? 'TROPHY'
            : nextData.isCombined ? 'WS' : (nextData.parts[0] || 'MS');
          setActivePart(defaultPart);
        } else {
          setData(null);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setData(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchDraw();
    return () => controller.abort();
  }, [liveTennisId, year]);

  const parsedDraw = useMemo<ParsedDrawData | null>(() => {
    if (!data?.html || !activePart) return null;
    try {
      return parseDraw(data.html, activePart);
    } catch {
      return null;
    }
  }, [activePart, data]);

  const miniDraw = useMemo<ParsedDrawData | null>(() => {
    if (!parsedDraw || parsedDraw.rounds.length < 2) return null;
    const roundCount = Math.min(3, parsedDraw.rounds.length);
    return { rounds: parsedDraw.rounds.slice(-roundCount) };
  }, [parsedDraw]);

  useEffect(() => {
    if (!fallbackRef.current || parsedDraw || !activePart) return;
    fallbackRef.current.querySelectorAll<HTMLElement>('.cDrawPart').forEach(part => {
      part.style.display = part.getAttribute('data-id') === activePart ? '' : 'none';
    });
    fallbackRef.current.querySelectorAll<HTMLImageElement>(
      '.cDrawPart:not([style*="none"]) img[data-original]',
    ).forEach(image => {
      const source = image.getAttribute('data-original');
      if (source) image.src = source;
    });
  }, [activePart, data, parsedDraw]);

  const handlePartClick = useCallback((part: string) => setActivePart(part), []);

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="mb-6 font-noto-serif text-2xl font-bold text-gray-900">签表</h2>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--tennis-green)] border-t-transparent" />
          <span className="ml-3 text-sm text-gray-500">加载签表中...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-8">
        <h2 className="mb-4 font-noto-serif text-2xl font-bold text-gray-900">签表</h2>
        <p className="text-sm italic text-gray-400">签表尚未公布</p>
      </div>
    );
  }

  const visibleParts = data.isCombined
    ? data.parts.filter(part => ['WS', 'MS', 'WD', 'MD', 'QS', 'PS', 'TROPHY'].includes(part))
    : data.parts;

  return (
    <div className="py-8">
      <h2 className="mb-4 font-noto-serif text-2xl font-bold text-gray-900">签表</h2>

      {data.drawNotPublished && <p className="mb-4 text-sm italic text-gray-400">签表尚未公布</p>}

      {!data.drawNotPublished && visibleParts.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {visibleParts.map(part => (
            <button
              key={part}
              type="button"
              onClick={() => handlePartClick(part)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-all ${
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

      {parsedDraw ? (
        <div className="space-y-8">
          {miniDraw && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h3 className="font-noto-serif text-lg font-bold text-gray-900">最新进展</h3>
                  <p className="mt-1 text-xs text-gray-400">聚焦赛事最后三轮</p>
                </div>
              </div>
              <BracketView data={miniDraw} />
            </section>
          )}
          <section>
            <h3 className="mb-3 font-noto-serif text-lg font-bold text-gray-900">完整签表</h3>
            <BracketView data={parsedDraw} />
          </section>
        </div>
      ) : (
        <div
          ref={fallbackRef}
          className="draw-viewer-fallback overflow-x-auto rounded-xl border border-black/5 bg-white p-3"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      )}

      <style jsx global>{`
        .draw-viewer-fallback {
          font-family: Inter, sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }
        .draw-viewer-fallback #iDrawInfo,
        .draw-viewer-fallback #iDrawPartSelector,
        .draw-viewer-fallback .cDrawEntryPortraitImg {
          display: none;
        }
        .draw-viewer-fallback table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .draw-viewer-fallback td {
          min-width: 0;
          padding: 4px 6px;
          overflow-wrap: anywhere;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        .draw-viewer-fallback .cDrawEntryWin,
        .draw-viewer-fallback .cDrawEntryWin pname {
          color: var(--tennis-green-dark);
          font-weight: 700;
        }
        .draw-viewer-fallback .cDrawEntryLose,
        .draw-viewer-fallback .cDrawEntryLose pname {
          color: #aaa;
        }
        .draw-viewer-fallback img.playerFlag {
          display: inline-block;
          width: 16px;
          height: 12px;
          margin-right: 4px;
        }
        .draw-viewer-fallback a {
          color: inherit;
          text-decoration: none;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
