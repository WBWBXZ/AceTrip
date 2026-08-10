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

export interface LiveTennisSeasonTournament {
  name: string;
  startDate: string;
  bestRound: string;
  isChampion: boolean;
  wins: number;
  losses: number;
  level: string;
  points: number;
}

const LIVE_TENNIS_ACTIVITY_QUERY_URL = 'https://www.live-tennis.cn/en/history/activity/query';
const LIVE_TENNIS_ACTIVITY_REFERER = 'https://www.live-tennis.cn/en/history/activity';
const LIVE_TENNIS_REQUEST_TIMEOUT_MS = 15000;
const LIVE_TENNIS_ROUND_ORDER: Record<string, number> = {
  R128: 1,
  R64: 2,
  R32: 3,
  R16: 4,
  Q: 5,
  S: 6,
  F: 7,
};

function decodeHtml(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] !== '#') return namedEntities[code.toLowerCase()] ?? entity;
    const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10;
    const rawCodePoint = radix === 16 ? code.slice(2) : code.slice(1);
    const codePoint = parseInt(rawCodePoint, radix);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
  });
}

function textContent(html: string): string {
  return decodeHtml(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normalizeActivityRound(round: string): string {
  if (round === 'QF') return 'Q';
  if (round === 'SF') return 'S';
  return round;
}

function inferActivityLevel(headerHtml: string, tournamentName: string): string {
  const logo = headerHtml.match(/class=["']?cActivityLogo["']?[^>]*src=["']([^"']+)/i)?.[1] ?? '';
  const normalized = `${logo} ${tournamentName}`.toUpperCase();

  if (/GS-|AUSTRALIAN OPEN|FRENCH OPEN|ROLAND GARROS|WIMBLEDON|US OPEN/.test(normalized)) return 'GS';
  if (/WTA[-_]?FINALS|WTA FINALS/.test(normalized)) return 'FINALS';
  if (/WTA[-_]?1000/.test(normalized)) return 'PM';
  if (/WTA[-_]?500/.test(normalized)) return 'P';
  if (/WTA[-_]?250/.test(normalized)) return 'I';
  if (/WTA[-_]?125/.test(normalized)) return '125';
  return '';
}

function parseActivityTournament(headerHtml: string, matchesHtml: string): LiveTennisSeasonTournament | null {
  const headerSpans = [...headerHtml.matchAll(/<span(?:\s[^>]*)?>([\s\S]*?)<\/span>/gi)];
  const name = textContent(headerSpans[0]?.[1] ?? '');
  const startDate = textContent(headerSpans[1]?.[1] ?? '');
  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;

  const pointsHtml = headerHtml.match(/class=["'][^"']*\bcActivityPoint\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? '';
  const points = toNumber(textContent(pointsHtml));
  let bestRound = '';
  let bestRoundOrder = 0;
  let wins = 0;
  let losses = 0;
  let isChampion = false;

  for (const rowMatch of matchesHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (cells.length < 2) continue;

    const round = normalizeActivityRound(textContent(cells[0][1]));
    const outcome = textContent(cells[1][1]).toUpperCase();
    const roundOrder = LIVE_TENNIS_ROUND_ORDER[round] ?? 0;
    if (roundOrder > bestRoundOrder) {
      bestRound = round;
      bestRoundOrder = roundOrder;
    }

    if (outcome === 'W') {
      wins++;
      if (round === 'F') isChampion = true;
    } else if (outcome === 'L') {
      losses++;
    }
  }

  return {
    name,
    startDate,
    bestRound,
    isChampion,
    wins,
    losses,
    level: inferActivityLevel(headerHtml, name),
    points,
  };
}

export function parseLiveTennisSeasonHtml(html: string): LiveTennisSeasonTournament[] {
  const headerPattern = /<tr[^>]*>\s*<td[^>]*class=["']?cActivityTour["']?[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  const headers = [...html.matchAll(headerPattern)];

  return headers.flatMap((header, index) => {
    const headerEnd = (header.index ?? 0) + header[0].length;
    const nextHeaderStart = headers[index + 1]?.index ?? html.length;
    const tournament = parseActivityTournament(header[1], html.slice(headerEnd, nextHeaderStart));
    return tournament ? [tournament] : [];
  });
}

export async function fetchLiveTennisPlayerSeason(
  wtaId: string | number,
  year: number,
): Promise<LiveTennisSeasonTournament[]> {
  const url = new URL(LIVE_TENNIS_ACTIVITY_QUERY_URL);
  const query = {
    status: 'ok',
    sd: 's',
    p1id: String(wtaId),
    year: String(year),
    type: 'wta',
    surface: 'a',
    level: 't',
    onlyMD: 'y',
    roundOnly: '',
    bagel: '',
    vstop: '0',
    vsrank: '',
    onlyH2H: 'n',
  };
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: {
      Accept: 'text/html',
      Referer: LIVE_TENNIS_ACTIVITY_REFERER,
      'User-Agent': 'Mozilla/5.0',
      'X-Requested-With': 'XMLHttpRequest',
    },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(LIVE_TENNIS_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch live-tennis player season: ${response.status}`);
  }

  const tournaments = parseLiveTennisSeasonHtml(await response.text());
  if (!tournaments.length) {
    throw new Error(`live-tennis returned no season data for player ${wtaId}`);
  }
  return tournaments;
}
