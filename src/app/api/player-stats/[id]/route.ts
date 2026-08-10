import { NextResponse } from 'next/server';
import playersData from '../../../../../data/players_final.json';

export const revalidate = 3600;

const REQUEST_TIMEOUT_MS = 15000;
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
  "QUEEN'S CLUB": 'queens', EASTBOURNE: 'queens', BERLIN: 'berlin',
  'BAD HOMBURG': 'bad-homburg', WIMBLEDON: 'wimbledon',
  WASHINGTON: 'washington-dc', TORONTO: 'national-bank-open',
  'CANADA OPEN': 'national-bank-open', 'NATIONAL BANK OPEN': 'national-bank-open',
  MONTREAL: 'national-bank-open',
  CINCINNATI: 'cincinnati-open', MONTERREY: 'monterrey',
  'US OPEN': 'us-open', GUADALAJARA: 'guadalajara',
  SINGAPORE: 'singapore-open', 'CHINA OPEN': 'china-open',
  BEIJING: 'china-open', WUHAN: 'wuhan-open',
  NINGBO: 'ningbo-open', TOKYO: 'toray-pan-pacific',
  'WTA FINALS': 'wta-finals', 'UNITED CUP': 'united-cup',
  AUCKLAND: 'adelaide',
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
}

async function fetchMatches(wtaId: string | number, year: number): Promise<WtaMatch[]> {
  const response = await fetch(
    `https://api.wtatennis.com/tennis/players/${wtaId}/matches?year=${year}&page=0&pageSize=200`,
    {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) throw new Error(`WTA API returned HTTP ${response.status}`);
  const data = await response.json() as WtaMatchesResponse;
  return (data.matches || data.content || []).filter(
    match => match.s_d_flag === 'S' && match.reason_code !== 'B',
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const player = playersData.players.find(item => item.id === id);

  if (!player?.wtaId) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  try {
    const year = new Date().getFullYear();
    const [allMatchesThisYear, allMatchesLastYear] = await Promise.all([
      fetchMatches(player.wtaId, year),
      fetchMatches(player.wtaId, year - 1),
    ]);

    const fiftyTwoWeeksAgo = new Date(Date.now() - 52 * 7 * 24 * 60 * 60 * 1000);
    const matches = [...allMatchesThisYear, ...allMatchesLastYear].filter(match => {
      const startDate = new Date(match.StartDate || '');
      return startDate >= fiftyTwoWeeksAgo;
    });

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
    }

    const tournaments = Object.values(tournamentMap);
    const tournamentIds: string[] = [];
    const results = tournaments.map(tournament => {
      const nameUpper = tournament.name.toUpperCase();
      let tournamentId = NAME_TO_ID[nameUpper];
      if (!tournamentId) {
        for (const [name, mappedId] of Object.entries(NAME_TO_ID)) {
          if (nameUpper.includes(name) || name.includes(nameUpper)) {
            tournamentId = mappedId;
            break;
          }
        }
      }
      if (tournamentId) tournamentIds.push(tournamentId);

      const points = matches
        .filter(match => (match.TournamentName || '').trim() === tournament.name)
        .reduce((highest, match) => match.points_1 && match.points_1 > highest ? match.points_1 : highest, 0);

      return {
        name: tournament.name,
        startDate: tournament.startDate,
        bestRound: tournament.bestRound,
        isChampion: tournament.isChampion,
        tournamentId: tournamentId || null,
        points,
        level: tournament.level,
      };
    });

    const thisYearTournaments = tournaments.filter(
      tournament => tournament.startDate && new Date(tournament.startDate).getFullYear() === year,
    );

    return NextResponse.json({
      tournamentIds,
      totalTournaments: tournaments.length,
      totalWins: tournaments.reduce((sum, tournament) => sum + tournament.wins, 0),
      totalLosses: tournaments.reduce((sum, tournament) => sum + tournament.losses, 0),
      titles: tournaments.filter(tournament => tournament.isChampion).length,
      thisYearTournaments: thisYearTournaments.length,
      thisYearWins: thisYearTournaments.reduce((sum, tournament) => sum + tournament.wins, 0),
      thisYearLosses: thisYearTournaments.reduce((sum, tournament) => sum + tournament.losses, 0),
      thisYearTitles: thisYearTournaments.filter(tournament => tournament.isChampion).length,
      results,
    });
  } catch (error) {
    console.error(`Player stats fetch error (${id}):`, error);
    return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 502 });
  }
}
