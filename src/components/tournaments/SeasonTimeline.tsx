'use client';

import Link from 'next/link';
import type { TournamentWithStatus } from '@/types';
import { formatDateRange, LEVEL_LABELS } from '@/lib/data';

interface Props {
  tournaments: TournamentWithStatus[];
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const SURFACE_DOT: Record<string, string> = {
  Hard: 'bg-blue-400',
  Clay: 'bg-orange-400',
  Grass: 'bg-green-400',
};

const STATUS_STYLE: Record<string, string> = {
  completed: 'opacity-50',
  ongoing: 'ring-2 ring-[var(--tennis-green)] ring-offset-2',
  upcoming: '',
};

export function SeasonTimeline({ tournaments }: Props) {
  // Group by month
  const byMonth = new Map<number, TournamentWithStatus[]>();
  tournaments.forEach(t => {
    const month = new Date(t.dateStart).getMonth();
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(t);
  });

  return (
    <div className="space-y-5">
      {Array.from(byMonth.entries())
        .sort(([a], [b]) => a - b)
        .map(([month, monthTournaments]) => (
          <div key={month} className="flex gap-4 md:gap-6">
            {/* Month label */}
            <div className="w-10 md:w-14 flex-shrink-0 pt-3">
              <span className="text-sm font-bold text-[var(--text-muted)] tracking-wider">
                {MONTHS[month]}
              </span>
            </div>

            {/* Tournament cards — fixed grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {monthTournaments.map(t => (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}`}
                  className={`card-flat px-3.5 py-3 hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between min-h-[88px] ${STATUS_STYLE[t.status]}`}
                >
                  {/* Top: name + dot */}
                  <div>
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${SURFACE_DOT[t.surface]}`} />
                      <span className="text-sm font-semibold leading-tight group-hover:text-[var(--tennis-green)] transition-colors line-clamp-2">
                        {t.name}
                      </span>
                    </div>
                    {t.nameCn && (
                      <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 ml-4 line-clamp-1">{t.nameCn}</p>
                    )}
                  </div>

                  {/* Bottom: meta + winner */}
                  <div className="mt-1.5 ml-4">
                    {t.status === 'completed' && (t as any).winner && (
                      <div className="text-[11px] text-amber-600 font-medium mb-0.5">
                        🏆 {(t as any).winner.nameCn || (t as any).winner.name}
                      </div>
                    )}
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {t.cityCn || t.city} · {LEVEL_LABELS[t.level]} · {formatDateRange(t.dateStart, t.dateEnd)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

      {/* Legend */}
      <div className="flex items-center gap-5 pt-2 ml-14 md:ml-20">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-xs text-[var(--text-muted)]">硬地</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-xs text-[var(--text-muted)]">红土</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-xs text-[var(--text-muted)]">草地</span>
        </div>
      </div>
    </div>
  );
}
