// ============================================================
// Data access layer — loads static JSON, provides helpers
// ============================================================

import playersRaw from '../../data/players_final.json';
import tournamentsRaw from '../../data/tournaments_2026.json';
import type { Player, Tournament, TournamentLevel, TournamentWithStatus } from '@/types';
import { fetchLiveTennisRankings, normalizePlayerName, type LiveRankingItem } from '@/lib/liveTennis';

// ---- Players -----------------------------------------------

const allPlayers: Player[] = (playersRaw as { players: Player[] }).players;

function withStaticRankingSource(players: Player[]): Player[] {
  return players.map(player => ({ ...player, rankingSource: 'static' as const }));
}

function buildLiveRankingIndexes(rankings: LiveRankingItem[]) {
  const byWtaId = new Map<string, LiveRankingItem>();
  const byName = new Map<string, LiveRankingItem>();

  rankings.forEach(ranking => {
    if (ranking.wtaId) byWtaId.set(ranking.wtaId, ranking);
    const normalizedName = normalizePlayerName(ranking.engName || ranking.playerName);
    if (normalizedName) byName.set(normalizedName, ranking);
  });

  return { byWtaId, byName };
}

function mergePlayerWithLiveRanking(player: Player, ranking: LiveRankingItem | undefined, updatedAt: string): Player {
  if (!ranking) return { ...player, rankingSource: 'static' };

  return {
    ...player,
    rank: ranking.rank,
    previousRank: ranking.previousRank,
    points: ranking.points,
    country: ranking.country || player.country,
    age: ranking.age ?? player.age,
    rankingSource: 'live-tennis',
    rankingUpdatedAt: updatedAt,
  };
}

export async function getPlayersWithLiveRankings(): Promise<Player[]> {
  try {
    const { rankings, updatedAt } = await fetchLiveTennisRankings();
    const { byWtaId, byName } = buildLiveRankingIndexes(rankings);

    return allPlayers
      .map(player => {
        const wtaId = player.wtaId?.toString();
        const ranking = (wtaId ? byWtaId.get(wtaId) : undefined) ?? byName.get(normalizePlayerName(player.displayName));
        return mergePlayerWithLiveRanking(player, ranking, updatedAt);
      })
      .sort((a, b) => a.rank - b.rank);
  } catch (err) {
    console.error('Live rankings merge failed, using static player data:', err);
    return withStaticRankingSource(allPlayers);
  }
}

export async function getPlayerWithLiveRanking(id: string): Promise<Player | undefined> {
  const players = await getPlayersWithLiveRankings();
  return players.find(p => p.id === id);
}

export async function getTopPlayersWithLiveRankings(n: number = 20): Promise<Player[]> {
  const players = await getPlayersWithLiveRankings();
  return players.slice(0, n);
}

export function getAllPlayers(): Player[] {
  return allPlayers;
}

export function getFeaturedPlayers(): Player[] {
  return allPlayers.filter(p => p.tier === 'featured');
}

export function getTopPlayers(n: number = 20): Player[] {
  return allPlayers.slice(0, n);
}

export function getPlayerById(id: string): Player | undefined {
  return allPlayers.find(p => p.id === id);
}

export function getPlayersByCountry(country: string): Player[] {
  return allPlayers.filter(p => p.country === country);
}

export function searchPlayers(query: string): Player[] {
  const q = query.toLowerCase();
  return allPlayers.filter(
    p =>
      p.displayName.toLowerCase().includes(q) ||
      p.nameCn.includes(q) ||
      p.country.toLowerCase().includes(q)
  );
}

// ---- Tournaments -------------------------------------------

const allTournaments: Tournament[] = (tournamentsRaw as { tournaments: Tournament[] }).tournaments;

export function getAllTournaments(): Tournament[] {
  return allTournaments;
}

export function getTournamentById(id: string): Tournament | undefined {
  return allTournaments.find(t => t.id === id);
}

export function getTournamentsByLevel(level: TournamentLevel): Tournament[] {
  return allTournaments.filter(t => t.level === level);
}

export function getTournamentsWithStatus(): TournamentWithStatus[] {
  const now = new Date();
  return allTournaments.map(t => {
    const start = new Date(t.dateStart);
    const end = new Date(t.dateEnd);
    let status: 'upcoming' | 'ongoing' | 'completed';
    let daysUntil: number | null = null;

    if (now < start) {
      status = 'upcoming';
      daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else if (now > end) {
      status = 'completed';
    } else {
      status = 'ongoing';
    }

    return { ...t, status, daysUntil };
  });
}

export function getUpcomingTournaments(): TournamentWithStatus[] {
  return getTournamentsWithStatus()
    .filter(t => t.status === 'upcoming')
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
}

export function getOngoingTournaments(): TournamentWithStatus[] {
  return getTournamentsWithStatus().filter(t => t.status === 'ongoing');
}

// ---- Formatting helpers ------------------------------------

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()} – ${e.getDate()}`;
  }
  return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}`;
}

export const LEVEL_LABELS: Record<string, string> = {
  GS: 'Grand Slam',
  WTA1000: 'WTA 1000',
  WTA500: 'WTA 500',
  WTA250: 'WTA 250',
  WTA125: 'WTA 125',
  Finals: 'WTA Finals',
};

export const LEVEL_COLORS: Record<TournamentLevel, string> = {
  GS: 'bg-amber-500 text-white',
  WTA1000: 'bg-purple-600 text-white',
  WTA500: 'bg-blue-500 text-white',
  WTA250: 'bg-teal-500 text-white',
  Finals: 'bg-rose-500 text-white',
};

export const SURFACE_COLORS: Record<string, string> = {
  Hard: 'bg-blue-100 text-blue-800',
  Clay: 'bg-orange-100 text-orange-800',
  Grass: 'bg-green-100 text-green-800',
};

export function getRankTrend(current: number, previous: number | null): { direction: 'up' | 'down' | 'same'; diff: number } {
  if (!previous) return { direction: 'same', diff: 0 };
  if (current < previous) return { direction: 'up', diff: previous - current };
  if (current > previous) return { direction: 'down', diff: current - previous };
  return { direction: 'same', diff: 0 };
}

const COUNTRY_CN: Record<string, string> = {
  'BLR': '白俄罗斯', 'KAZ': '哈萨克斯坦', 'USA': '美国', 'RUS': '俄罗斯', 'CZE': '捷克',
  'POL': '波兰', 'UKR': '乌克兰', 'CAN': '加拿大', 'JPN': '日本', 'SUI': '瑞士',
  'ITA': '意大利', 'ROM': '罗马尼亚', 'BEL': '比利时', 'AUS': '澳大利亚', 'DEN': '丹麦',
  'AUT': '奥地利', 'PHI': '菲律宾', 'FRA': '法国', 'ESP': '西班牙', 'GBR': '英国',
  'GER': '德国', 'CHN': '中国', 'KOR': '韩国', 'GRE': '希腊', 'CRO': '克罗地亚',
  'ARG': '阿根廷', 'BRA': '巴西', 'NED': '荷兰', 'SRB': '塞尔维亚', 'SVK': '斯洛伐克',
  'COL': '哥伦比亚', 'TUR': '土耳其', 'INA': '印度尼西亚', 'THA': '泰国',
  'MEX': '墨西哥', 'HUN': '匈牙利', 'SGP': '新加坡', 'QAT': '卡塔尔', 'UAE': '阿联酋',
};

export function getCountryCn(countryCode: string): string {
  return COUNTRY_CN[countryCode.toUpperCase()] || '';
}

export function getCountryFlag(countryCode: string): string {
  // Convert country code to flag emoji
  const cc = countryCode.toUpperCase();
  // Map some non-standard codes
  const codeMap: Record<string, string> = {
    'ROM': 'RO', 'GER': 'DE', 'SUI': 'CH', 'CRO': 'HR', 'LAT': 'LV',
    'GRE': 'GR', 'PHI': 'PH', 'INA': 'ID', 'BUL': 'BG', 'RSA': 'ZA',
    'CHI': 'CL', 'TPE': 'TW', 'KOR': 'KR', 'BLR': 'BY', 'KAZ': 'KZ',
    'AUS': 'AU', 'USA': 'US', 'GBR': 'GB', 'FRA': 'FR', 'ESP': 'ES',
    'ITA': 'IT', 'CZE': 'CZ', 'POL': 'PL', 'UKR': 'UA', 'RUS': 'RU',
    'CAN': 'CA', 'JPN': 'JP', 'CHN': 'CN', 'BEL': 'BE', 'DEN': 'DK',
    'NED': 'NL', 'SWE': 'SE', 'NOR': 'NO', 'AUT': 'AT', 'HUN': 'HU',
    'SRB': 'RS', 'SGP': 'SG', 'QAT': 'QA', 'UAE': 'AE', 'TUR': 'TR',
    'EGY': 'EG', 'TUN': 'TN', 'ARG': 'AR', 'BRA': 'BR', 'COL': 'CO',
    'MEX': 'MX', 'PER': 'PE', 'ECU': 'EC',
  };
  const iso = codeMap[cc] || cc.slice(0, 2);
  return String.fromCodePoint(
    ...[...iso].map(c => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
