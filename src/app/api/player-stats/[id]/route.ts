import { NextResponse } from 'next/server';
import playersData from '../../../../../data/players_final.json';
import { fetchLiveTennisPlayerSeason } from '@/lib/liveTennis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const REQUEST_TIMEOUT_MS = 15000;
const PLAYER_ID_ALIASES: Record<string, string> = {
  'gauff-c': 'gauff',
};
const ROUND_ORDER: Record<string, number> = {
  R128: 1,
  R64: 2,
  R32: 3,
  R16: 4,
  Q: 5,
  S: 6,
  F: 7,
};

const NAME_TO_ID: Record<string, string> = {
  BRISBANE: 'brisbane', ADELAIDE: 'adelaide', 'AUSTRALIAN OPEN': 'australian-open',
  'ABU DHABI': 'abu-dhabi', DOHA: 'qatar-open', DUBAI: 'dubai-championships',
  MÉRIDA: 'merida', MERIDA: 'merida', 'INDIAN WELLS': 'indian-wells',
  MIAMI: 'miami-open', CHARLESTON: 'charleston', LINZ: 'linz',
  STUTTGART: 'stuttgart', MADRID: 'madrid-open', ROME: 'rome',
  STRASBOURG: 'strasbourg', 'ROLAND GARROS': 'roland-garros',
  'FRENCH OPEN': 'roland-garros', "QUEEN'S CLUB": 'queens',
  EASTBOURNE: 'queens', BERLIN: 'berlin', 'BAD HOMBURG': 'bad-homburg',
  WIMBLEDON: 'wimbledon', WASHINGTON: 'washington-dc',
  TORONTO: 'national-bank-open', 'CANADA OPEN': 'national-bank-open',
  'NATIONAL BANK OPEN': 'national-bank-open', MONTREAL: 'national-bank-open',
  CINCINNATI: 'cincinnati-open', MONTERREY: 'monterrey', 'US OPEN': 'us-open',
  GUADALAJARA: 'guadalajara', SINGAPORE: 'singapore-open',
  'CHINA OPEN': 'china-open', BEIJING: 'china-open', WUHAN: 'wuhan-open',
  NINGBO: 'ningbo-open', TOKYO: 'toray-pan-pacific', 'WTA FINALS': 'wta-finals',
  'UNITED CUP': 'united-cup', AUCKLAND: 'adelaide',
};

interface WtaMatch {
  s_d_flag?: string;
  reason_code?: string;
  StartDate?: string;
  TournamentName?: string;
  TournamentLevel?: string;
  round_name?: string;
  winner?: number;
  points_1?: number;
}

interface WtaMatchesResponse {
  matches?: WtaMatch[];
  content?: WtaMatch[];
}

interface TournamentSummary {
  name: string;
  startDate: string;
  bestRound: string;
  bestRoundOrder: number;
  isChampion: boolean;
  wins: number;
  losses: number;
  level: string;
  points: number;
}

async function fetchWtaMatches(wtaId: string | number, year: number): Promise<WtaMatch[]> {
  const response = await fetch(
    `https://api.wtatennis.com/tennis/players/${wtaId}/matches?year=${year}&page=0&pageSize=200`,
    {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) throw new Error(`WTA API returned HTTP ${response.status}`);
  const data = await response.json() as WtaMatchesResponse;
  return (data.matches || data.content || []).filter(
    match => match.s_d_flag === 'S' && match.reason_code !== 'B',
  );
}

function mapTournamentId(name: string): string | null {
  const nameUpper = name.toUpperCase();
  if (NAME_TO_ID[nameUpper]) return NAME_TO_ID[nameUpper];

  for (const [knownName, mappedId] of Object.entries(NAME_TO_ID)) {
    if (nameUpper.includes(knownName) || knownName.includes(nameUpper)) return mappedId;
  }
  return null;
}

function buildStatsResponse(tournaments: TournamentSummary[], year: number, source: 'live-tennis' | 'wta') {
  const sortedTournaments = [...tournaments].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
  const tournamentIds: string[] = [];
  const results = sortedTournaments.map(tournament => {
    const tournamentId = mapTournamentId(tournament.name);
    if (tournamentId) tournamentIds.push(tournamentId);

    return {
      name: tournament.name,
      startDate: tournament.startDate,
      bestRound: tournament.bestRound,
      isChampion: tournament.isChampion,
      tournamentId,
      points: tournament.points,
      level: tournament.level,
    };
  });
  const thisYearTournaments = sortedTournaments.filter(
    tournament => tournament.startDate && new Date(tournament.startDate).getFullYear() === year,
  );

  return {
    source,
    tournamentIds: [...new Set(tournamentIds)],
    totalTournaments: sortedTournaments.length,
    totalWins: sortedTournaments.reduce((sum, tournament) => sum + tournament.wins, 0),
    totalLosses: sortedTournaments.reduce((sum, tournament) => sum + tournament.losses, 0),
    titles: sortedTournaments.filter(tournament => tournament.isChampion).length,
    thisYearTournaments: thisYearTournaments.length,
    thisYearWins: thisYearTournaments.reduce((sum, tournament) => sum + tournament.wins, 0),
    thisYearLosses: thisYearTournaments.reduce((sum, tournament) => sum + tournament.losses, 0),
    thisYearTitles: thisYearTournaments.filter(tournament => tournament.isChampion).length,
    results,
  };
}

function summarizeWtaMatches(matches: WtaMatch[]): TournamentSummary[] {
  const tournamentMap: Record<string, TournamentSummary> = {};

  for (const match of matches) {
    const name = (match.TournamentName || '').trim();
    if (!name) continue;
    if (!tournamentMap[name]) {
      tournamentMap[name] = {
        name,
        startDate: match.StartDate || '',
        bestRound: '',
        bestRoundOrder: 0,
        isChampion: false,
        wins: 0,
        losses: 0,
        level: match.TournamentLevel || '',
        points: 0,
      };
    }

    const tournament = tournamentMap[name];
    const round = match.round_name || '';
    const roundOrder = ROUND_ORDER[round] || 0;
    if (roundOrder > tournament.bestRoundOrder) {
      tournament.bestRound = round;
      tournament.bestRoundOrder = roundOrder;
    }
    if (match.winner === 1) {
      tournament.wins++;
      if (round === 'F') tournament.isChampion = true;
    } else {
      tournament.losses++;
    }
    if (match.points_1 && match.points_1 > tournament.points) {
      tournament.points = match.points_1;
    }
  }

  return Object.values(tournamentMap);
}

async function fetchWtaFallback(wtaId: string | number, year: number): Promise<TournamentSummary[]> {
  const [allMatchesThisYear, allMatchesLastYear] = await Promise.all([
    fetchWtaMatches(wtaId, year),
    fetchWtaMatches(wtaId, year - 1),
  ]);
  const fiftyTwoWeeksAgo = new Date(Date.now() - 52 * 7 * 24 * 60 * 60 * 1000);
  const matches = [...allMatchesThisYear, ...allMatchesLastYear].filter(match => {
    const startDate = new Date(match.StartDate || '');
    return startDate >= fiftyTwoWeeksAgo;
  });
  return summarizeWtaMatches(matches);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const canonicalId = PLAYER_ID_ALIASES[id] ?? id;
  const player = playersData.players.find(item => item.id === canonicalId);

  if (!player?.wtaId) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  const year = new Date().getFullYear();
  try {
    const liveTournaments = await fetchLiveTennisPlayerSeason(player.wtaId, year);
    const tournaments = liveTournaments.map(tournament => ({
      ...tournament,
      bestRoundOrder: ROUND_ORDER[tournament.bestRound] || 0,
    }));
    return NextResponse.json(buildStatsResponse(tournaments, year, 'live-tennis'));
  } catch (liveTennisError) {
    console.warn(`live-tennis player stats fetch failed (${id}), falling back to WTA:`, liveTennisError);
  }

  try {
    const tournaments = await fetchWtaFallback(player.wtaId, year);
    return NextResponse.json(buildStatsResponse(tournaments, year, 'wta'));
  } catch (error) {
    console.error(`Player stats fetch error (${id}):`, error);
    return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 502 });
  }
}
