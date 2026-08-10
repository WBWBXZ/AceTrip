'use client';

import type { DrawData, Match, Player } from '@/lib/parseDraw';

const CARD_WIDTH = 240;
const CARD_HEIGHT = 92;
const COLUMN_GAP = 52;
const ROW_UNIT = 116;

interface Props {
  data: DrawData;
}

function matchTop(roundIndex: number, matchIndex: number): number {
  const span = 2 ** roundIndex;
  return (matchIndex * span + span / 2) * ROW_UNIT - CARD_HEIGHT / 2;
}

function playerFlag(flag?: string) {
  if (!flag) return null;
  if (/^https?:\/\//i.test(flag)) {
    return (
      <span
        aria-hidden="true"
        className="h-3 w-4 shrink-0 rounded-[1px] bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(flag)})` }}
      />
    );
  }
  return (
    <span className="min-w-6 shrink-0 rounded bg-gray-100 px-1 text-center text-[9px] font-semibold text-gray-500">
      {flag}
    </span>
  );
}

function PlayerRow({ player, isWinner, isLoser }: {
  player: Player;
  isWinner: boolean;
  isLoser: boolean;
}) {
  const pending = player.name === 'TBD';
  return (
    <div className={`flex h-[31px] items-center gap-2 px-3 ${
      isWinner
        ? 'bg-emerald-50 font-bold text-emerald-900'
        : isLoser ? 'text-gray-400' : pending ? 'text-gray-400' : 'text-gray-700'
    }`}>
      <span className="w-5 shrink-0 text-center text-[10px] font-bold text-amber-600">
        {player.seed || ''}
      </span>
      {playerFlag(player.flag)}
      <span className="min-w-0 flex-1 truncate text-xs">
        {player.nameCn && <span className="mr-1.5">{player.nameCn}</span>}
        <span className={player.nameCn ? 'text-[10px] font-normal opacity-65' : ''}>
          {player.bye ? '轮空' : player.name}
        </span>
      </span>
      {isWinner && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const completed = match.winner !== undefined;
  return (
    <div className="h-[92px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_2px_10px_rgba(15,61,46,0.06)]">
      <PlayerRow player={match.player1} isWinner={match.winner === 1} isLoser={completed && match.winner !== 1} />
      <div className="h-px bg-gray-100" />
      <PlayerRow player={match.player2} isWinner={match.winner === 2} isLoser={completed && match.winner !== 2} />
      <div className="flex h-[29px] items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/70 px-3 text-[10px] font-medium text-gray-400">
        <span className="truncate">
          {match.score || match.time || (match.player1.bye || match.player2.bye ? '轮空晋级' : 'TBD')}
        </span>
        {match.odds && (
          <span className="shrink-0 font-normal text-gray-400">
            赔率 {match.odds[0]} / {match.odds[1]}
          </span>
        )}
      </div>
    </div>
  );
}

export function BracketView({ data }: Props) {
  const width = data.rounds.length * CARD_WIDTH + Math.max(0, data.rounds.length - 1) * COLUMN_GAP;
  const height = Math.max(ROW_UNIT, (data.rounds[0]?.matches.length || 1) * ROW_UNIT);

  return (
    <div className="overflow-x-auto rounded-2xl border border-emerald-900/10 bg-[#f7faf8] px-5 pb-5">
      <div className="relative" style={{ width, minWidth: width }}>
        <div className="sticky top-0 z-20 flex h-14 bg-[#f7faf8]/95 backdrop-blur-sm">
          {data.rounds.map((round, index) => (
            <div
              key={round.name}
              className="flex shrink-0 items-center text-xs font-bold tracking-[0.16em] text-emerald-900"
              style={{ width: CARD_WIDTH, marginRight: index === data.rounds.length - 1 ? 0 : COLUMN_GAP }}
            >
              <span className="rounded-full bg-emerald-900 px-3 py-1 text-white">{round.name}</span>
              <span className="ml-2 font-normal tracking-normal text-gray-400">{round.matches.length} 场</span>
            </div>
          ))}
        </div>

        <div className="relative" style={{ height }}>
          <svg
            className="pointer-events-none absolute inset-0 z-0 overflow-visible"
            width={width}
            height={height}
            aria-hidden="true"
          >
            {data.rounds.slice(0, -1).flatMap((round, roundIndex) => {
              const startX = roundIndex * (CARD_WIDTH + COLUMN_GAP) + CARD_WIDTH;
              const endX = startX + COLUMN_GAP;
              const jointX = startX + COLUMN_GAP / 2;
              return data.rounds[roundIndex + 1].matches.flatMap((_, nextIndex) => {
                const firstY = matchTop(roundIndex, nextIndex * 2) + CARD_HEIGHT / 2;
                const secondY = matchTop(roundIndex, nextIndex * 2 + 1) + CARD_HEIGHT / 2;
                const targetY = matchTop(roundIndex + 1, nextIndex) + CARD_HEIGHT / 2;
                const color = '#a7c7b7';
                return [
                  <path key={`${roundIndex}-${nextIndex}-a`} d={`M ${startX} ${firstY} H ${jointX} V ${targetY} H ${endX}`} fill="none" stroke={color} strokeWidth="1.5" />,
                  <path key={`${roundIndex}-${nextIndex}-b`} d={`M ${startX} ${secondY} H ${jointX} V ${targetY}`} fill="none" stroke={color} strokeWidth="1.5" />,
                ];
              });
            })}
          </svg>

          {data.rounds.map((round, roundIndex) => (
            <div
              key={round.name}
              className="absolute top-0"
              style={{ left: roundIndex * (CARD_WIDTH + COLUMN_GAP), width: CARD_WIDTH, height }}
            >
              {round.matches.map((match, matchIndex) => (
                <div
                  key={match.id}
                  className="absolute left-0 z-10 w-full"
                  style={{ top: matchTop(roundIndex, matchIndex) }}
                >
                  <MatchCard match={match} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
