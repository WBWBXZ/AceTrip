import Link from 'next/link';
import type { TournamentWithStatus } from '@/types';
import { formatDateRange, LEVEL_LABELS } from '@/lib/data';
import { Calendar, MapPin } from 'lucide-react';

interface Props {
  tournaments: TournamentWithStatus[];
}

const LEVEL_BADGE: Record<string, string> = {
  GS: 'badge-gs',
  WTA1000: 'badge-wta1000',
  WTA500: 'badge-wta500',
  WTA250: 'badge-wta250',
  Finals: 'badge-finals',
};

export function UpcomingTournaments({ tournaments }: Props) {
  if (tournaments.length === 0) {
    return (
      <div className="card-flat p-8 text-center">
        <p className="text-[var(--text-muted)]">暂无即将开赛的赛事</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tournaments.map((t) => (
        <Link key={t.id} href={`/tournaments/${t.id}`} className="card p-5 group cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <span className={`badge ${LEVEL_BADGE[t.level] || ''}`}>
              {LEVEL_LABELS[t.level]}
            </span>
            {t.daysUntil !== null && (
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {t.daysUntil === 0 ? '今天开赛' : `${t.daysUntil} 天后`}
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold tracking-tight group-hover:text-[var(--tennis-green)] transition-colors">
            {t.nameCn || t.name}
          </h3>
          {t.nameCn && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.name}</p>
          )}

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {t.cityCn || t.city}，{t.countryCn || t.countryName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDateRange(t.dateStart, t.dateEnd)}
            </span>
          </div>

          {/* Surface indicator */}
          <div className="flex items-center gap-2 mt-3">
            <div className={`w-2 h-2 rounded-full surface-${t.surface.toLowerCase()}`} />
            <span className="text-xs text-[var(--text-muted)]">
              {t.surface === 'Hard' ? '硬地' : t.surface === 'Clay' ? '红土' : '草地'}{t.indoor ? '（室内）' : '（室外）'}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
