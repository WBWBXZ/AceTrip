import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PlayerSuggestion {
  id: string;
  name: string;
  country?: string;
}

function normalizeSuggestions(value: unknown): PlayerSuggestion[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap(item => {
    if (Array.isArray(item)) {
      const [name, id, , country] = item;
      return name && id ? [{ id: String(id), name: String(name), country: country ? String(country) : undefined }] : [];
    }
    if (!item || typeof item !== 'object') return [];

    const record = item as Record<string, unknown>;
    const id = record.id ?? record.value ?? record.player_id;
    const name = record.name ?? record.label ?? record.text;
    return id && name
      ? [{ id: String(id), name: String(name), country: record.country ? String(record.country) : undefined }]
      : [];
  });
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json,text/plain,*/*',
      Referer: 'https://www.live-tennis.cn/zh/h2h',
      'User-Agent': 'Mozilla/5.0 AceTrip/1.0',
    },
  });
  if (!response.ok) throw new Error(`live-tennis returned ${response.status}`);
  return response.json();
}

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('term')?.trim() ?? '';
  if (keyword.length < 2) return NextResponse.json({ players: [] });
  if (keyword.length > 80) {
    return NextResponse.json({ error: '搜索关键词过长' }, { status: 400 });
  }

  try {
    let players: PlayerSuggestion[] = [];

    try {
      const params = new URLSearchParams({ term: keyword, type: 'player', gender: 'wta' });
      players = normalizeSuggestions(await fetchJson(`https://www.live-tennis.cn/zh/suggestions?${params}`));
    } catch {
      // 当前站点的新接口为 /select/byname，保留上方旧接口以兼容后续恢复。
      const params = new URLSearchParams({ n: keyword, t: 'wta' });
      players = normalizeSuggestions(await fetchJson(`https://www.live-tennis.cn/select/byname?${params}`));
    }

    return NextResponse.json({ players: players.slice(0, 12) });
  } catch (error) {
    console.error('[h2h search API]', error);
    return NextResponse.json({ error: '球员搜索暂时不可用，请稍后再试' }, { status: 502 });
  }
}
