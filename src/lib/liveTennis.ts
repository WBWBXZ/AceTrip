export interface LiveRankingItem {
  rank: number;
  previousRank: number | null;
  points: number;
  playerName: string;
  engName: string;
  country: string;
  age: number | null;
  change: number;
  wtaId?: string;
}

export interface LiveRankingsResult {
  rankings: LiveRankingItem[];
  updatedAt: string;
  total: number;
}

const LIVE_TENNIS_RANKINGS_URL = 'https://www.live-tennis.cn/zh/rank/wta/s/year/query';
const LIVE_TENNIS_RANKINGS_BODY = 'draw=1&start=0&length=150&device=0';

interface LiveTennisRankingRow {
  c_rank?: string | number;
  rank?: string | number;
  c_point?: string | number;
  points?: string | number;
  name?: string;
  eng_name?: string;
  engName?: string;
  ioc?: string;
  country?: string;
  age?: string | number;
  change?: string | number;
  previous_rank?: string | number;
  pre_rank?: string | number;
  player_id?: string | number;
  id?: string | number;
}

interface LiveTennisRankingsResponse {
  data?: LiveTennisRankingRow[];
  recordsTotal?: number;
  recordsFiltered?: number;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return fallback;
  const parsed = parseInt(value.replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: unknown): number | null {
  const parsed = toNumber(value, NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRankingRow(row: LiveTennisRankingRow): LiveRankingItem {
  const rank = toNumber(row.c_rank ?? row.rank);
  const change = toNumber(row.change);
  const previousRank = toNullableNumber(row.previous_rank ?? row.pre_rank) ?? (change ? rank + change : null);

  return {
    rank,
    previousRank,
    points: toNumber(row.c_point ?? row.points),
    playerName: row.name ?? '',
    engName: row.eng_name ?? row.engName ?? row.name ?? '',
    country: row.ioc ?? row.country ?? '',
    age: toNullableNumber(row.age),
    change,
    wtaId: row.player_id?.toString() ?? row.id?.toString(),
  };
}

export async function fetchLiveTennisRankings(): Promise<LiveRankingsResult> {
  const response = await fetch(LIVE_TENNIS_RANKINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: LIVE_TENNIS_RANKINGS_BODY,
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch live-tennis rankings: ${response.status}`);
  }

  const data = (await response.json()) as LiveTennisRankingsResponse;
  const rankings = (data.data ?? []).map(normalizeRankingRow).filter(item => item.rank > 0 && item.engName);

  return {
    rankings,
    updatedAt: new Date().toISOString(),
    total: data.recordsTotal ?? data.recordsFiltered ?? rankings.length,
  };
}

export function normalizePlayerName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
