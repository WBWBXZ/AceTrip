'use client';

import { useEffect, useRef } from 'react';
import type { Tournament } from '@/types';
import { useAppStore } from '@/lib/store';
import { TournamentMap } from '@/components/map/TournamentMap';
import { DrawViewer } from '@/components/tournaments/DrawViewer';
import { WeatherWidget } from '@/components/tournaments/WeatherWidget';
import { ExchangeRateWidget } from '@/components/tournaments/ExchangeRateWidget';
import { Heart, MapPin } from 'lucide-react';

interface Props {
  tournament: Tournament;
}

export function TournamentDetailClient({ tournament }: Props) {
  const { isBucketListed, addToBucketList, removeFromBucketList } = useAppStore();
  const inBucket = isBucketListed(tournament.id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container-tight pb-12">
      {/* Bucket List Button */}
      <div className="mb-8">
        <button
          onClick={() => inBucket ? removeFromBucketList(tournament.id) : addToBucketList(tournament.id)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            inBucket
              ? 'bg-rose-500 text-white'
              : 'bg-white border border-black/10 text-[var(--text-primary)] hover:border-rose-400 hover:text-rose-500'
          }`}
        >
          <Heart size={16} fill={inBucket ? 'currentColor' : 'none'} />
          {inBucket ? '已加入心愿单' : '加入心愿单'}
        </button>
      </div>

      {/* Map */}
      <div className="mb-8">
        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
          <MapPin size={20} /> 赛事位置
        </h2>
        <TournamentMap
          tournaments={[tournament]}
          selectedId={tournament.id}
          height={350}
        />
      </div>

      {/* Draw / 签表 */}
      {tournament.liveTennisId && (
        <DrawViewer liveTennisId={tournament.liveTennisId} />
      )}

      {/* Travel Guide */}
      <div className="mb-8">
        <h2 className="font-noto-serif text-2xl font-bold text-[var(--tennis-green-dark)] mb-6">旅行指南</h2>
        
        {/* Row 1: Weather + Exchange Rate side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-2 p-4 rounded-xl bg-white/40 border border-black/[0.04]">
            <WeatherWidget
              coordinates={[tournament.coordinates.lat, tournament.coordinates.lng]}
              city={tournament.cityCn || tournament.city}
            />
          </div>
          <div className="flex flex-col gap-4">
            <ExchangeRateWidget country={tournament.country} />
            <GuideCard
              emoji="🕐"
              title="当地时差"
              desc={tournament.timezoneCn || tournament.timezone}
            />
          </div>
        </div>

        {/* Row 2: Travel info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GuideCard
            emoji="✈️"
            title="如何到达"
            desc={`飞往${tournament.cityCn || tournament.city}，场馆 ${tournament.venue}`}
          />
          <GuideCard
            emoji="🎫"
            title="购票信息"
            desc={`请访问 ${tournament.nameCn || tournament.name} 官网了解购票详情`}
          />
          <GuideCard
            emoji="🏨"
            title="住宿推荐"
            desc={`建议在 ${tournament.venue} 附近预订酒店`}
          />
        </div>
      </div>
    </div>
  );
}

function GuideCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white/40 border border-black/[0.04]">
      <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
