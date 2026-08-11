'use client';

import { useEffect, useState } from 'react';
import { Search, Swords, X } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface SelectedPlayer {
  id: string;
  name: string;
  nameCn: string;
  nameEn: string;
  country?: string;
  rank?: number;
  headshot?: string;
}

interface H2HPlayer extends SelectedPlayer {
  wins: number;
  winRate: number;
}

interface H2HMatch {
  year: string;
  tournament: string;
  level: string;
  surface: string;
  round: string;
  winner: string;
  winnerId: string;
  score: string;
}

interface H2HResult {
  players: [H2HPlayer, H2HPlayer];
  total: number;
  matches: H2HMatch[];
}

interface Props {
  initialPlayers: [SelectedPlayer | null, SelectedPlayer | null];
  availablePlayers: SelectedPlayer[];
}

export function H2HClient({ initialPlayers, availablePlayers }: Props) {
  const [players, setPlayers] = useState(initialPlayers);
  const [result, setResult] = useState<H2HResult | null>(null);
  const [loading, setLoading] = useState(
    Boolean(initialPlayers[0] && initialPlayers[1] && initialPlayers[0].id !== initialPlayers[1].id),
  );
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const p1id = players[0]?.id ?? '';
  const p2id = players[1]?.id ?? '';

  useEffect(() => {
    if (!p1id || !p2id || p1id === p2id) return;

    const controller = new AbortController();

    fetch(`/api/h2h?p1id=${encodeURIComponent(p1id)}&p2id=${encodeURIComponent(p2id)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async response => {
        const data = await response.json() as H2HResult & { error?: string };
        if (!response.ok) throw new Error(data.error || '查询失败');
        return data;
      })
      .then(data => {
        const localFirst = availablePlayers.find(player => player.id === p1id);
        const localSecond = availablePlayers.find(player => player.id === p2id);
        const localizedPlayers: [H2HPlayer, H2HPlayer] = [
          { ...data.players[0], ...(localFirst ?? {}), name: localFirst?.nameCn || localFirst?.nameEn || data.players[0].name },
          { ...data.players[1], ...(localSecond ?? {}), name: localSecond?.nameCn || localSecond?.nameEn || data.players[1].name },
        ];
        setResult({
          ...data,
          players: localizedPlayers,
          matches: data.matches.map(match => ({
            ...match,
            winner: match.winnerId === p1id
              ? localizedPlayers[0].name
              : match.winnerId === p2id
                ? localizedPlayers[1].name
                : match.winner,
          })),
        });
      })
      .catch(fetchError => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setResult(null);
        setError(fetchError instanceof Error ? fetchError.message : '查询失败，请稍后再试');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [availablePlayers, p1id, p2id]);

  function selectPlayer(index: 0 | 1, player: SelectedPlayer | null) {
    const nextPlayers: [SelectedPlayer | null, SelectedPlayer | null] = index === 0
      ? [player, players[1]]
      : [players[0], player];
    const duplicate = Boolean(nextPlayers[0] && nextPlayers[1] && nextPlayers[0].id === nextPlayers[1].id);
    setPlayers(nextPlayers);
    setResult(null);
    setError(duplicate ? '请选择两位不同的球员' : '');
    setLoading(Boolean(nextPlayers[0] && nextPlayers[1] && !duplicate));
    const params = new URLSearchParams(searchParams.toString());
    const key = index === 0 ? 'p1' : 'p2';
    if (player) params.set(key, player.id);
    else params.delete(key);
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  }

  return (
    <div>
      <section className="rounded-3xl border border-[var(--tennis-green-dark)]/[0.08] bg-white p-4 shadow-sm sm:p-6 md:p-8">
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          <PlayerSearch
            label="球员 1"
            value={players[0]}
            availablePlayers={availablePlayers}
            excludedId={players[1]?.id}
            onSelect={player => selectPlayer(0, player)}
          />
          <div className="flex h-11 items-center justify-center text-[var(--tennis-green)] md:mt-7 md:w-11">
            <Swords size={24} strokeWidth={1.7} />
          </div>
          <PlayerSearch
            label="球员 2"
            value={players[1]}
            availablePlayers={availablePlayers}
            excludedId={players[0]?.id}
            onSelect={player => selectPlayer(1, player)}
          />
        </div>
        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          选择两位球员后将自动查询历史交手记录
        </p>
      </section>

      {loading && <LoadingState />}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-center text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && result && (
        <div className="mt-8 space-y-8">
          <Summary result={result} />
          <MatchTable result={result} />
        </div>
      )}

      {!loading && !result && !error && (
        <div className="mt-8 rounded-3xl border border-dashed border-[var(--tennis-green)]/20 bg-[var(--tennis-green)]/[0.025] px-6 py-14 text-center">
          <Swords className="mx-auto text-[var(--tennis-green)]/35" size={34} strokeWidth={1.4} />
          <p className="mt-3 text-sm text-[var(--text-muted)]">从上方搜索并选择两位球员，开始对比</p>
        </div>
      )}
    </div>
  );
}

function PlayerSearch({ label, value, availablePlayers, excludedId, onSelect }: {
  label: string;
  value: SelectedPlayer | null;
  availablePlayers: SelectedPlayer[];
  excludedId?: string;
  onSelect: (player: SelectedPlayer | null) => void;
}) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const keyword = query.trim().toLocaleLowerCase();
  const suggestions = availablePlayers
    .filter(player => player.id !== excludedId)
    .filter(player => !keyword
      || player.nameCn.toLocaleLowerCase().includes(keyword)
      || player.nameEn.toLocaleLowerCase().includes(keyword))
    .slice(0, 50);

  function clear() {
    setQuery('');
    setOpen(true);
    onSelect(null);
  }

  return (
    <div className="relative">
      <label className="mb-2 block text-xs font-semibold text-[var(--tennis-green-dark)]">{label}</label>
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
            if (value) onSelect(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="输入中文名或英文名..."
          autoComplete="off"
          className="min-h-11 w-full rounded-xl border border-black/[0.08] bg-white py-2.5 pl-10 pr-10 text-base transition focus:border-[var(--tennis-green)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--tennis-green)]/15 sm:text-sm"
        />
        {(query || value) && (
          <button type="button" onClick={clear} aria-label={`清空${label}`} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-black/[0.04] hover:text-gray-600">
            <X size={15} />
          </button>
        )}
      </div>

      {open && !value && (
        <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-xl">
          {suggestions.length ? suggestions.map(player => (
            <button
              type="button"
              key={player.id}
              onMouseDown={event => event.preventDefault()}
              onClick={() => {
                setQuery(player.nameCn || player.nameEn);
                setOpen(false);
                onSelect(player);
              }}
              className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-[var(--tennis-green)]/[0.07]"
            >
              <span className="w-7 flex-shrink-0 text-center text-xs font-bold text-[var(--text-muted)]">{player.rank ? `#${player.rank}` : '—'}</span>
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--warm-beige)]">
                {player.headshot ? (
                  <Image src={player.headshot} alt="" width={36} height={36} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[var(--tennis-green)]">{(player.nameCn || player.nameEn).slice(0, 1)}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{player.nameCn || player.nameEn}</span>
                <span className="block truncate text-[11px] text-[var(--text-muted)]">{player.nameEn}</span>
              </span>
              {player.country && <span className="flex-shrink-0 text-[10px] text-[var(--text-muted)]">{player.country}</span>}
            </button>
          )) : (
            <p className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">未找到匹配球员</p>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-8 rounded-3xl border border-black/[0.05] bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--tennis-green)]/15 border-t-[var(--tennis-green)]" />
      <p className="mt-4 text-sm text-[var(--text-muted)]">正在加载交手记录...</p>
    </div>
  );
}

function Summary({ result }: { result: H2HResult }) {
  const [first, second] = result.players;
  const firstWidth = result.total ? (first.wins / result.total) * 100 : 50;

  return (
    <section className="rounded-3xl bg-[var(--tennis-green-dark)] p-5 text-white shadow-lg shadow-[var(--tennis-green-dark)]/10 sm:p-7">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 sm:gap-6">
        <PlayerRecord player={first} align="left" />
        <div className="pb-1 text-center">
          <div className="text-2xl font-bold sm:text-3xl">{result.total}</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/45">总场数</div>
        </div>
        <PlayerRecord player={second} align="right" />
      </div>
      <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className="bg-emerald-400 transition-all" style={{ width: `${firstWidth}%` }} />
        <div className="flex-1 bg-sky-400" />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-white/45">
        <span>{first.winRate}%</span>
        <span>{second.winRate}%</span>
      </div>
    </section>
  );
}

function PlayerRecord({ player, align }: { player: H2HPlayer; align: 'left' | 'right' }) {
  return (
    <div className={align === 'right' ? 'text-right' : 'text-left'}>
      <p className="truncate text-sm font-semibold sm:text-lg">{player.name}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">{player.wins}<span className="ml-1 text-xs font-normal text-white/50 sm:text-sm">胜</span></p>
      <p className="mt-1 text-xs text-white/55">胜率 {player.winRate}%</p>
    </div>
  );
}

function MatchTable({ result }: { result: H2HResult }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--tennis-green-dark)] md:text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>历史对战</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">共 {result.matches.length} 场记录</p>
        </div>
      </div>

      {result.matches.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.05] bg-white px-6 py-12 text-center text-sm text-[var(--text-muted)]">暂无符合条件的交手记录</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white shadow-sm">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-[var(--tennis-green)]/[0.055] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">年份</th>
                <th className="px-4 py-3 font-medium">赛事</th>
                <th className="px-4 py-3 font-medium">级别</th>
                <th className="px-4 py-3 font-medium">场地</th>
                <th className="px-4 py-3 font-medium">轮次</th>
                <th className="px-4 py-3 font-medium">胜者</th>
                <th className="px-4 py-3 text-right font-medium">比分</th>
              </tr>
            </thead>
            <tbody>
              {result.matches.map((match, index) => {
                const firstPlayerWon = match.winnerId === result.players[0].id;
                return (
                  <tr key={`${match.year}-${match.tournament}-${index}`} className={`border-t border-black/[0.05] ${firstPlayerWon ? 'bg-emerald-50/45' : 'bg-sky-50/45'}`}>
                    <td className={`border-l-2 px-4 py-3 font-semibold ${firstPlayerWon ? 'border-emerald-400' : 'border-sky-400'}`}>{match.year}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{match.tournament}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[var(--tennis-green)]">{match.level}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{match.surface}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{match.round}</td>
                    <td className={`px-4 py-3 font-semibold ${firstPlayerWon ? 'text-emerald-700' : 'text-sky-700'}`}>{match.winner}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-semibold text-[var(--tennis-green-dark)]">{match.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
