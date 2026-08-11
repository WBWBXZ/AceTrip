'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Player } from '@/types';
import { getCountryFlag, getRankTrend, getCountryCn } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { useFollowConfirm, FollowDialogs } from '@/components/ui/FollowDialogs';
import { useRequireAuth } from '@/lib/use-require-auth';
import { Search, ChevronUp, ChevronDown, Minus, Heart } from 'lucide-react';

interface Props {
  players: Player[];
}

export function PlayerList({ players }: Props) {
  const [search, setSearch] = useState('');
  const { followPlayer, unfollowPlayer, isFollowing } = useAppStore();
  const { requireAuth } = useRequireAuth();
  const follow = useFollowConfirm();

  const filtered = players.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    const countryCn = getCountryCn(p.country);
    return (
      p.displayName.toLowerCase().includes(s) ||
      p.nameCn.includes(search) ||
      p.country.toLowerCase().includes(s) ||
      countryCn.includes(search) ||
      (p.birthPlaceCn || '').includes(search)
    );
  });

  return (
    <div>
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="搜索球员姓名、中文名或国籍..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full min-h-11 pl-9 pr-4 py-2.5 rounded-xl bg-white border border-black/8 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tennis-green)]/20 focus:border-[var(--tennis-green)]/40 transition"
          />
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-[var(--text-muted)] mb-4">
        共 {filtered.length} 位球员
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(player => (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className="card group flex cursor-pointer items-center gap-2.5 p-3 sm:gap-3 md:gap-4 md:p-4"
          >
            {/* Rank */}
            <div className="w-8 flex-shrink-0 text-center md:w-10">
              <span className="text-lg font-bold text-[var(--text-muted)]">
                {player.rank}
              </span>
            </div>

            {/* Avatar */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--warm-beige)] md:h-11 md:w-11">
              {player.headshot ? (
                <img src={player.headshot} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-lg font-bold text-[var(--text-muted)]">{player.firstName[0]}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold truncate group-hover:text-[var(--tennis-green)] transition-colors">
                  {player.nameCn || player.displayName}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm">{getCountryFlag(player.country)}</span>
                <span className="text-xs text-[var(--text-muted)] truncate">{player.displayName}</span>
                <span className="ml-auto whitespace-nowrap text-[11px] text-[var(--text-muted)] sm:text-xs">{player.points.toLocaleString()} 分</span>
              </div>
            </div>

            {/* Trend */}
            <div className="flex-shrink-0">
              <RankTrend current={player.rank} previous={player.previousRank} />
            </div>

            {/* Follow */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                requireAuth(() => follow.requestFollow(player.id, player.nameCn || player.displayName));
              }}
              className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-full hover:bg-rose-50 transition-colors"
              title={isFollowing(player.id) ? '取消关注' : '关注'}
            >
              <Heart
                size={14}
                className={isFollowing(player.id) ? 'text-rose-500 fill-rose-500' : 'text-gray-300 hover:text-rose-400'}
              />
            </button>
          </Link>
        ))}
      </div>

      <FollowDialogs
        state={follow.state}
        confirmFollow={follow.confirmFollow}
        confirmUnfollow={follow.confirmUnfollow}
        dismiss={follow.dismiss}
      />
    </div>
  );
}

function RankTrend({ current, previous }: { current: number; previous: number | null }) {
  const { direction, diff } = getRankTrend(current, previous);
  if (direction === 'up') {
    return <span className="flex items-center gap-0.5 trend-up text-xs font-medium"><ChevronUp size={14} />{diff}</span>;
  }
  if (direction === 'down') {
    return <span className="flex items-center gap-0.5 trend-down text-xs font-medium"><ChevronDown size={14} />{diff}</span>;
  }
  return <Minus size={14} className="trend-same" />;
}
