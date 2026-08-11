'use client';

import { CalendarDays, ChevronDown, Clock3, MapPin, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type MatchStatus = 'upcoming' | 'live' | 'completed';

interface SchedulePlayer {
  names: string[];
  rank: number | null;
  country: string | null;
  scores: string[];
}

interface ScheduleMatch {
  id: string;
  court: string;
  playerA: SchedulePlayer;
  playerB: SchedulePlayer;
  status: MatchStatus;
  startTime: number | null;
  round: string;
  event: string;
}

interface ScheduleTournament {
  id: string;
  name: string;
  nameEn: string;
  level: string;
  matches: ScheduleMatch[];
}

interface ScheduleResponse {
  date: string;
  tournaments: ScheduleTournament[];
  error?: string;
}

type DayOffset = -1 | 0 | 1;

const TABS: Array<{ offset: DayOffset; label: string }> = [
  { offset: -1, label: '昨日赛果' },
  { offset: 0, label: '今日赛程' },
  { offset: 1, label: '明日预告' },
];

const STATUS_META: Record<MatchStatus, { label: string; className: string }> = {
  live: { label: '进行中', className: 'bg-emerald-100 text-emerald-700' },
  completed: { label: '已完赛', className: 'bg-slate-100 text-slate-600' },
  upcoming: { label: '未开赛', className: 'bg-amber-50 text-amber-700' },
};

function localDate(offset: DayOffset): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return '时间待定';
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp * 1000));
}

function playerName(player: SchedulePlayer): string {
  return player.names.length > 0 ? player.names.join(' / ') : '球员待定';
}

function scoreLabel(match: ScheduleMatch): string {
  const count = Math.max(match.playerA.scores.length, match.playerB.scores.length);
  if (count === 0) return match.status === 'completed' ? '已结束' : formatTime(match.startTime);

  return Array.from({ length: count }, (_, index) => {
    const a = match.playerA.scores[index] ?? '–';
    const b = match.playerB.scores[index] ?? '–';
    return `${a}-${b}`;
  }).join('  ');
}

function levelClass(level: string): string {
  if (level.includes('1000')) return 'badge-wta1000';
  if (level.includes('500')) return 'badge-wta500';
  if (level.includes('250')) return 'badge-wta250';
  if (level.includes('125') || /^W\d+/.test(level)) return 'badge-wta125';
  if (level.includes('大满贯')) return 'badge-gs';
  if (level.includes('Finals')) return 'badge-finals';
  return 'badge-wta250';
}

function PlayerRow({ player, winner }: { player: SchedulePlayer; winner: boolean }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${winner ? 'bg-[var(--tennis-green)]' : 'bg-black/10'}`} />
        <span className={`truncate text-sm ${winner ? 'font-semibold text-[var(--tennis-green-dark)]' : 'font-medium text-[var(--text-primary)]'}`}>
          {playerName(player)}
        </span>
      </div>
      <span className="flex-shrink-0 text-[11px] text-[var(--text-muted)]">
        {player.rank ? `No. ${player.rank}` : '暂无排名'}
      </span>
    </div>
  );
}

function MatchCard({ match }: { match: ScheduleMatch }) {
  const status = STATUS_META[match.status];
  const setCount = Math.max(match.playerA.scores.length, match.playerB.scores.length);
  let aSetsWon = 0;
  let bSetsWon = 0;
  for (let index = 0; index < setCount; index += 1) {
    const aScore = Number(match.playerA.scores[index]);
    const bScore = Number(match.playerB.scores[index]);
    if (aScore > bScore) aSetsWon += 1;
    if (bScore > aScore) bSetsWon += 1;
  }

  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--tennis-green)]">{match.round}</span>
          <span>·</span>
          <span>{match.event}</span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>
          {match.status === 'live' && <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
          {status.label}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="space-y-3">
          <PlayerRow player={match.playerA} winner={match.status === 'completed' && aSetsWon > bSetsWon} />
          <PlayerRow player={match.playerB} winner={match.status === 'completed' && bSetsWon > aSetsWon} />
        </div>
        <div className="flex items-center justify-between border-t border-black/[0.05] pt-3 sm:block sm:min-w-[100px] sm:border-l sm:border-t-0 sm:py-1 sm:pl-5 sm:text-right">
          <span className="text-[10px] text-[var(--text-muted)] sm:hidden">
            {match.status === 'upcoming' ? '开赛时间' : '比分'}
          </span>
          <div className={`font-semibold tabular-nums ${match.status === 'live' ? 'text-emerald-700' : 'text-[var(--tennis-green-dark)]'}`}>
            {scoreLabel(match)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 border-t border-black/[0.05] pt-3 text-[10px] text-[var(--text-muted)]">
        <MapPin size={12} />
        <span className="truncate">{match.court}</span>
        {match.status !== 'completed' && (
          <>
            <span className="mx-1">·</span>
            <Clock3 size={12} />
            <span>{formatTime(match.startTime)}</span>
          </>
        )}
      </div>
    </article>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-6" aria-label="正在加载赛程">
      {[0, 1].map(group => (
        <div key={group} className="animate-pulse rounded-3xl border border-black/[0.05] bg-white/65 p-4 sm:p-6">
          <div className="mb-4 flex gap-3">
            <div className="h-6 w-36 rounded bg-black/[0.07]" />
            <div className="h-6 w-16 rounded-full bg-black/[0.06]" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1].map(card => <div key={card} className="h-44 rounded-2xl bg-black/[0.045]" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScheduleClient() {
  const [activeOffset, setActiveOffset] = useState<DayOffset>(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [collapsedTournaments, setCollapsedTournaments] = useState<Set<string>>(() => new Set());
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const date = useMemo(() => localDate(activeOffset), [activeOffset]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/schedule?date=${date}`, { signal: controller.signal })
      .then(async response => {
        const result = await response.json() as ScheduleResponse;
        if (!response.ok) throw new Error(result.error || '获取赛程失败');
        return result;
      })
      .then(setData)
      .catch(fetchError => {
        if (fetchError instanceof Error && fetchError.name !== 'AbortError') {
          setError(fetchError.message);
          setData(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [date, reloadToken]);

  useEffect(() => {
    if (activeOffset !== 0) return;
    const interval = window.setInterval(() => {
      setReloadToken(value => value + 1);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [activeOffset]);

  function selectDay(offset: DayOffset) {
    if (offset === activeOffset) return;
    setLoading(true);
    setError('');
    setActiveOffset(offset);
  }

  function retry() {
    setLoading(true);
    setError('');
    setReloadToken(value => value + 1);
  }

  function toggleTournament(id: string) {
    setCollapsedTournaments(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="container-tight py-8 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl bg-[var(--tennis-green-dark)] px-5 py-7 text-white shadow-xl shadow-[var(--tennis-green-dark)]/10 sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="absolute -right-2 top-12 h-28 w-28 rounded-full border border-white/10" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-white/60">
            <CalendarDays size={15} />
            WTA DAILY SCHEDULE
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>赛程赛果</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">查看昨日赛果、今日赛程与明日预告，轻松追踪每一场 WTA 比赛。</p>
        </div>
      </section>

      <nav className="sticky top-2 z-20 mt-5 rounded-2xl border border-black/[0.06] bg-[var(--warm-cream)]/90 p-1.5 shadow-sm backdrop-blur-xl" aria-label="日期筛选">
        <div className="grid grid-cols-3 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.offset}
              type="button"
              onClick={() => selectDay(tab.offset)}
              className={`rounded-xl px-2 py-3 text-xs font-semibold transition-all sm:text-sm ${activeOffset === tab.offset ? 'bg-[var(--tennis-green)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-white/70'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mb-5 mt-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--tennis-green)]">{TABS.find(tab => tab.offset === activeOffset)?.label}</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--tennis-green-dark)] sm:text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>{formatDisplayDate(date)}</h2>
        </div>
        {data && !loading && <span className="text-xs text-[var(--text-muted)]">{data.tournaments.reduce((sum, tournament) => sum + tournament.matches.length, 0)} 场比赛</span>}
      </div>

      {loading ? <ScheduleSkeleton /> : error ? (
        <div className="rounded-3xl border border-red-100 bg-white px-5 py-14 text-center">
          <p className="font-medium text-[var(--tennis-green-dark)]">暂时无法加载赛程</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{error}</p>
          <button type="button" onClick={retry} className="mt-5 rounded-full bg-[var(--tennis-green)] px-5 py-2.5 text-xs font-semibold text-white">重新加载</button>
        </div>
      ) : !data?.tournaments.length ? (
        <div className="rounded-3xl border border-dashed border-[var(--tennis-green)]/20 bg-white/60 px-5 py-16 text-center">
          <Trophy className="mx-auto text-[var(--tennis-green)]/35" size={36} strokeWidth={1.5} />
          <p className="mt-4 font-medium text-[var(--tennis-green-dark)]">这一天暂无 WTA 比赛</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">稍后再来看看，新的赛程可能正在路上。</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.tournaments.map(tournament => {
            const isExpanded = !collapsedTournaments.has(tournament.id);
            return (
              <section key={tournament.id} className="rounded-3xl border border-black/[0.05] bg-white/55 p-3 shadow-sm sm:p-5">
                <button
                  type="button"
                  onClick={() => toggleTournament(tournament.id)}
                  className={`flex w-full items-start justify-between gap-3 px-1 text-left sm:px-1.5 ${isExpanded ? 'pb-4' : ''}`}
                  aria-expanded={isExpanded}
                >
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[var(--tennis-green-dark)] sm:text-lg">{tournament.name}</h3>
                    {tournament.nameEn && tournament.nameEn !== tournament.name && <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{tournament.nameEn}</p>}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className={`badge text-[10px] ${levelClass(tournament.level)}`}>{tournament.level}</span>
                    <ChevronDown
                      size={18}
                      className={`text-[var(--tennis-green)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </div>
                </button>
                {isExpanded && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {tournament.matches.map(match => <MatchCard key={match.id} match={match} />)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
