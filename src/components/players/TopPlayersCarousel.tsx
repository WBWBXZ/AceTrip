'use client';

import Link from 'next/link';
import type { Player } from '@/types';
import { getCountryFlag, getRankTrend } from '@/lib/data';
import pointsBreakdownData from '../../../data/player_points_breakdown.json';

const pointsMap = pointsBreakdownData as Record<string, { total: number; entries: any[] }>;
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';

interface Props {
  players: Player[];
}

export function TopPlayersCarousel({ players }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide"
         style={{ scrollbarWidth: 'none' }}>
      {players.map((player, i) => (
        <Link
          key={player.id}
          href={`/players/${player.id}`}
          className="card flex-shrink-0 w-[200px] md:w-[220px] p-4 snap-start group cursor-pointer"
        >
          {/* Rank badge */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[var(--text-muted)] tracking-wider">
              #{player.rank}
            </span>
            <RankTrend current={player.rank} previous={player.previousRank} />
          </div>

          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[var(--warm-beige)] mx-auto mb-3 flex items-center justify-center overflow-hidden">
            {player.headshot ? (
              <img
                src={player.headshot}
                alt={player.displayName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-2xl font-bold text-[var(--text-muted)]">
                {player.firstName[0]}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="text-center">
            <h3 className="font-semibold text-sm tracking-tight group-hover:text-[var(--tennis-green)] transition-colors">
              {player.displayName}
            </h3>
            {player.nameCn && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{player.nameCn}</p>
            )}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="text-base">{getCountryFlag(player.country)}</span>
              <span className="text-xs text-[var(--text-secondary)]">{player.country}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              {(pointsMap[player.id]?.total ?? player.points).toLocaleString()} pts
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function RankTrend({ current, previous }: { current: number; previous: number | null }) {
  const { direction, diff } = getRankTrend(current, previous);
  if (direction === 'up') {
    return (
      <span className="flex items-center gap-0.5 trend-up text-xs font-medium">
        <ChevronUp size={12} /> {diff}
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="flex items-center gap-0.5 trend-down text-xs font-medium">
        <ChevronDown size={12} /> {diff}
      </span>
    );
  }
  return <Minus size={12} className="trend-same" />;
}
