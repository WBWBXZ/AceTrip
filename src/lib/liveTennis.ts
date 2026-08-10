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

const LIVE_TENNIS_RANKINGS_PAGE_URL = 'https://www.live-tennis.cn/zh/rank/wta/s/year';
const LIVE_TENNIS_RANKINGS_QUERY_URL = 'https://www.live-tennis.cn/zh/rank/wta/s/year/query';

const LIVE_TENNIS_COLUMNS = [
  'c_rank', 'point', 'full_name', 'eng_name', 'change', 'f_rank', 'highest', 'alt_point',
  'flop', 'w_point', 'engname', 'name_for_search', 'age', 'birth', 'nation', 'noc_rank',
  'id', 'ioc', 'titles', 'tour_c', 'mand_0', 'streak', 'prize', 'win', 'lose', 'win_r',
  'q_tour', 'q_point', 'w_in', 'w_tour', 'partner', 'next_oppo', 'next_h2h', 'predict_R64',
  'predict_R32', 'predict_R16', 'predict_QF', 'predict_SF', 'predict_F', 'predict_W',
];

interface LiveTennisRankingRow {
  c_rank?: string | number;
  rank?: string | number;
  point?: string | number;
  c_point?: string | number;
  points?: string | number;
  name?: string;
  full_name?: string;
  eng_name?: string;
  engname?: string;
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

function parseSetCookieHeader(setCookie: string | null): string {
  if (!setCookie) return '';
  return setCookie
    .split(/,(?=\s*[^;,]+=)/)
    .map(cookie => cookie.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

function extractCsrfToken(html: string): string {
  return html.match(/<meta name="csrf-token" content="([^"]+)"/)?.[1]
    ?? html.match(/<meta name="_token" content="([^"]+)"/)?.[1]
    ?? '';
}

function buildRankingsBody(csrfToken: string, length = 300): URLSearchParams {
  const body = new URLSearchParams({
    draw: '1',
    start: '0',
    length: String(length),
    'search[value]': '',
    'search[regex]': 'false',
    'order[0][column]': '0',
    'order[0][dir]': 'asc',
    device: '0',
  });

  if (csrfToken) body.set('_token', csrfToken);

  LIVE_TENNIS_COLUMNS.forEach((column, index) => {
    body.set(`columns[${index}][data]`, column);
    body.set(`columns[${index}][name]`, column);
    body.set(`columns[${index}][searchable]`, 'true');
    body.set(`columns[${index}][orderable]`, 'true');
    body.set(`columns[${index}][search][value]`, '');
    body.set(`columns[${index}][search][regex]`, 'false');
  });

  return body;
}

function normalizeAge(value: unknown): number | null {
  const age = toNullableNumber(value);
  if (age == null) return null;
  return age > 120 ? Math.floor(age / 10) : age;
}

function normalizeRankingRow(row: LiveTennisRankingRow): LiveRankingItem {
  const rank = toNumber(row.c_rank ?? row.rank);
  const change = toNumber(row.change);
  const previousRank = toNullableNumber(row.previous_rank ?? row.pre_rank) ?? (change ? rank + change : null);
  const engName = row.eng_name ?? row.engname ?? row.engName ?? row.name ?? '';

  return {
    rank,
    previousRank,
    points: toNumber(row.point ?? row.c_point ?? row.points),
    playerName: row.name ?? row.full_name ?? engName,
    engName,
    country: row.ioc ?? row.country ?? '',
    age: normalizeAge(row.age),
    change,
    wtaId: row.player_id?.toString() ?? row.id?.toString(),
  };
}

export async function fetchLiveTennisRankings(): Promise<LiveRankingsResult> {
  const pageResponse = await fetch(LIVE_TENNIS_RANKINGS_PAGE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 3600 },
  });

  if (!pageResponse.ok) {
    throw new Error(`Failed to fetch live-tennis rankings page: ${pageResponse.status}`);
  }

  const cookie = parseSetCookieHeader(pageResponse.headers.get('set-cookie'));
  const csrfToken = extractCsrfToken(await pageResponse.text());

  const response = await fetch(LIVE_TENNIS_RANKINGS_QUERY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': csrfToken,
      'Referer': LIVE_TENNIS_RANKINGS_PAGE_URL,
      'User-Agent': 'Mozilla/5.0',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: buildRankingsBody(csrfToken),
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
