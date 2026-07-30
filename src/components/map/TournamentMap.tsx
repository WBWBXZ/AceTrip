'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAP_STYLE } from '@/lib/config';
import type { Tournament } from '@/types';
import { LEVEL_LABELS } from '@/lib/data';

interface Props {
  tournaments: Tournament[];
  selectedId?: string;
  height?: number | string;
  interactive?: boolean;
}

const LEVEL_COLOR: Record<string, string> = {
  GS: '#F59E0B',
  WTA1000: '#7C3AED',
  WTA500: '#06B6D4',
  WTA250: '#14B8A6',
  Finals: '#F43F5E',
};

export function TournamentMap({
  tournaments,
  selectedId,
  height = 400,
  interactive = true,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: selectedId
        ? (() => {
            const t = tournaments.find(t => t.id === selectedId);
            return t ? [t.coordinates.lng, t.coordinates.lat] as [number, number] : [20, 30] as [number, number];
          })()
        : [20, 30],
      zoom: selectedId ? 10 : 1.5,
      minZoom: 1,
      maxZoom: 16,
      interactive,
      attributionControl: false,
    });

    m.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    m.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    m.on('load', () => {
      setLoaded(true);

      // 隐藏 Taiwan 文字 + CN worldview
      try {
        const style = m.getStyle();
        if (style?.layers) {
          for (const layer of style.layers) {
            const sl = (layer as any).sourceLayer || '';
            if (layer.type === 'symbol') {
              try {
                const existing = m.getFilter(layer.id);
                const taiwanFilter: any = [
                  '!',
                  ['any',
                    ['==', ['coalesce', ['get', 'name_en'], ''], 'Taiwan'],
                    ['==', ['coalesce', ['get', 'name'], ''], 'Taiwan'],
                    ['==', ['coalesce', ['get', 'name_zh-Hans'], ''], '台湾'],
                  ]
                ];
                m.setFilter(layer.id, existing ? ['all', existing, taiwanFilter] : taiwanFilter);
              } catch {}
            }
            if (sl.includes('admin') || sl.includes('boundary')) {
              try {
                const existing = m.getFilter(layer.id);
                const wv: any = ['any', ['!', ['has', 'worldview']], ['==', ['get', 'worldview'], 'all'], ['in', 'CN', ['get', 'worldview']]];
                m.setFilter(layer.id, existing ? ['all', existing, wv] : wv);
              } catch {}
            }
          }
        }
      } catch {}

      // Markers — 点击直接跳转到赛事详情页，不弹 tooltip
      tournaments.forEach(t => {
        const isSelected = t.id === selectedId;
        const color = LEVEL_COLOR[t.level] || '#6B7280';

        const el = document.createElement('div');
        el.style.cssText = `
          width: ${isSelected ? 20 : 14}px;
          height: ${isSelected ? 20 : 14}px;
          background: ${color};
          border: 2.5px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        `;
        el.title = t.nameCn || t.name;
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = `/tournaments/${t.id}`;
        });

        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([t.coordinates.lng, t.coordinates.lat])
          .addTo(m);
      });
    });

    mapRef.current = m;
    return () => { m.remove(); mapRef.current = null; };
  }, [tournaments, selectedId, interactive]);

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height }}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 rounded-2xl">
          <div className="text-sm text-gray-400">地图加载中...</div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
        {Object.entries(LEVEL_COLOR).map(([level, color]) => (
          <span key={level} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            {LEVEL_LABELS[level]}
          </span>
        ))}
      </div>
    </div>
  );
}
