'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TournamentWithStatus, TournamentLevel } from '@/types';
import { formatDateRange, LEVEL_LABELS } from '@/lib/data';
import { useAppStore } from '@/lib/store';
import { useRequireAuth } from '@/lib/use-require-auth';
import { MapPin, Calendar, Heart } from 'lucide-react';

interface Props {
  tournaments: TournamentWithStatus[];
  defaultStatus?: 'all' | 'upcoming' | 'ongoing' | 'completed';
}

const LEVEL_BADGE: Record<string, string> = {
  GS: 'badge-gs',
  WTA1000: 'badge-wta1000',
  WTA500: 'badge-wta500',
  WTA250: 'badge-wta250',
  Finals: 'badge-finals',
};

const SURFACE_CN: Record<string, string> = {
  Hard: '硬地',
  Clay: '红土',
  Grass: '草地',
};

type FilterLevel = 'all' | TournamentLevel;
type FilterStatus = 'all' | 'upcoming' | 'ongoing' | 'completed';

const STATUS_CN: Record<string, string> = {
  all: '全部',
  upcoming: '即将开赛',
  ongoing: '进行中',
  completed: '已结束',
};

export function TournamentGrid({ tournaments, defaultStatus = 'all' }: Props) {
  const [levelFilter, setLevelFilter] = useState<FilterLevel>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>(defaultStatus);
  const [wishConfirm, setWishConfirm] = useState<{ id: string; name: string; action: 'add' | 'remove' } | null>(null);
  const { isBucketListed, addToBucketList, removeFromBucketList } = useAppStore();
  const { requireAuth } = useRequireAuth();

  const filtered = tournaments.filter(t => {
    const matchesLevel = levelFilter === 'all' || t.level === levelFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesLevel && matchesStatus;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Level Filter */}
        <div className="flex gap-1.5">
          {(['all', 'GS', 'WTA1000', 'WTA500', 'Finals'] as FilterLevel[]).map(level => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                levelFilter === level
                  ? 'bg-[var(--tennis-green)] text-white'
                  : 'bg-white border border-black/8 text-[var(--text-secondary)] hover:bg-black/4'
              }`}
            >
              {level === 'all' ? '全部级别' : LEVEL_LABELS[level]}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex gap-1.5">
          {(['all', 'upcoming', 'ongoing', 'completed'] as FilterStatus[]).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === status
                  ? 'bg-[var(--tennis-green)] text-white'
                  : 'bg-white border border-black/8 text-[var(--text-secondary)] hover:bg-black/4'
              }`}
            >
              {STATUS_CN[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filtered.map(t => (
          <Link
            key={t.id}
            href={`/tournaments/${t.id}`}
            className="card-flat p-4 group cursor-pointer hover:shadow-lg transition-all flex flex-col justify-between min-h-[88px] relative"
          >
            {/* Heart button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                requireAuth(() => {
                  if (isBucketListed(t.id)) {
                    setWishConfirm({ id: t.id, name: t.nameCn || t.name, action: 'remove' });
                  } else {
                    setWishConfirm({ id: t.id, name: t.nameCn || t.name, action: 'add' });
                  }
                });
              }}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-rose-50 transition-colors z-10"
              title={isBucketListed(t.id) ? '移出心愿单' : '加入心愿单'}
            >
              <Heart
                size={14}
                className={isBucketListed(t.id) ? 'text-rose-500 fill-rose-500' : 'text-gray-300 hover:text-rose-400'}
              />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge text-[10px] ${LEVEL_BADGE[t.level]}`}>
                  {LEVEL_LABELS[t.level]}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {SURFACE_CN[t.surface] || t.surface}
                </span>
                {t.status === 'ongoing' && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    进行中
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold leading-snug group-hover:text-[var(--tennis-green)] transition-colors line-clamp-2">
                {t.nameCn || t.name}
              </h3>
              {t.nameCn && (
                <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">{t.name}</p>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <MapPin size={10} /> {t.cityCn || t.city}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={10} /> {formatDateRange(t.dateStart, t.dateEnd)}
              </span>
            </div>

            {/* Winner */}
            {t.status === 'completed' && t.winner && (
              <div className="mt-1.5 text-[11px] text-amber-600 font-medium">
                🏆 {t.winner.nameCn || t.winner.name}
              </div>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card-flat p-8 text-center text-sm text-[var(--text-muted)]">
          没有符合条件的赛事
        </div>
      )}

      {/* 心愿单确认弹窗 */}
      {wishConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-xs w-full shadow-xl text-center">
            {wishConfirm.action === 'add' ? (
              <>
                <div className="text-3xl mb-2">❤️</div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>加入心愿单</p>
                <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>确定要将「{wishConfirm.name}」加入心愿单吗？</p>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">💔</div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>移出心愿单</p>
                <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>确定要将「{wishConfirm.name}」从心愿单中移除吗？</p>
              </>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setWishConfirm(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (wishConfirm.action === 'add') {
                    addToBucketList(wishConfirm.id);
                  } else {
                    removeFromBucketList(wishConfirm.id);
                  }
                  setWishConfirm(null);
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ background: wishConfirm.action === 'add' ? 'var(--tennis-green)' : '#ef4444' }}
              >
                {wishConfirm.action === 'add' ? '确认加入' : '确认移除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
