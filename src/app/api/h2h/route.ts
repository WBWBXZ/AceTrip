import { load, type Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface H2HPlayer {
  id: string;
  name: string;
  wins: number;
  winRate: number;
}

interface H2HMatch {
  year: string;
  tournament: string;
  surface: string;
  round: string;
  winner: string;
  winnerId: string;
  score: string;
}

function text(element: Cheerio<Element>): string {
  return element.text().replace(/\s+/g, ' ').trim();
}

function numberFrom(element: Cheerio<Element>): number {
  const value = element.contents().first().text().trim().match(/\d+/)?.[0];
  return value ? Number(value) : 0;
}

function percentageFrom(element: Cheerio<Element>): number {
  const value = text(element).match(/(\d+(?:\.\d+)?)\s*%/)?.[1];
  return value ? Number(value) : 0;
}

function parseH2H(html: string, p1id: string, p2id: string) {
  const $ = load(html);
  const firstInfo = $('#iH2HDetailInfo1');
  const secondInfo = $('#iH2HDetailInfo2');
  const firstWins = numberFrom(firstInfo.find('#iH2HDetailWin').first());
  const secondWins = numberFrom(secondInfo.find('#iH2HDetailLoss').first());
  const total = firstWins + secondWins;

  const players: [H2HPlayer, H2HPlayer] = [
    {
      id: p1id,
      name: text(firstInfo.find('#iH2HDetailName1').first()) || '球员 1',
      wins: firstWins,
      winRate: percentageFrom(firstInfo.find('.ch2hPortion').first()) || (total ? Math.round((firstWins / total) * 100) : 0),
    },
    {
      id: p2id,
      name: text(secondInfo.find('#iH2HDetailName2').first()) || '球员 2',
      wins: secondWins,
      winRate: percentageFrom(secondInfo.find('.ch2hPortion').first()) || (total ? Math.round((secondWins / total) * 100) : 0),
    },
  ];

  const matches: H2HMatch[] = [];
  $('#iH2HDetailTable tbody tr').each((_, rowNode) => {
    const row = $(rowNode);
    const cells = row.find('td');
    if (cells.length < 7) return;

    const winnerId = row.hasClass('SideHome') ? p1id : row.hasClass('SideAway') ? p2id : '';
    const result = text(cells.eq(5));
    const winner = winnerId === p1id
      ? players[0].name
      : winnerId === p2id
        ? players[1].name
        : result.split(/\s+d\.\s+/i)[0]?.replace(/^\([^)]*\)\s*/, '') || '';

    matches.push({
      year: text(cells.eq(0)),
      surface: text(cells.eq(2)),
      tournament: text(cells.eq(3)),
      round: text(cells.eq(4)),
      winner,
      winnerId,
      score: text(cells.eq(6)),
    });
  });

  if (!$('#iH2HDetail').length) {
    throw new Error('live-tennis returned an unexpected H2H response');
  }

  return { players, total, matches };
}

export async function GET(request: NextRequest) {
  const p1id = request.nextUrl.searchParams.get('p1id')?.trim() ?? '';
  const p2id = request.nextUrl.searchParams.get('p2id')?.trim() ?? '';

  if (!/^\d+$/.test(p1id) || !/^\d+$/.test(p2id)) {
    return NextResponse.json({ error: 'p1id 和 p2id 必须是有效的球员 id' }, { status: 400 });
  }
  if (p1id === p2id) {
    return NextResponse.json({ error: '请选择两位不同的球员' }, { status: 400 });
  }

  const sourceParams = new URLSearchParams({
    p1id,
    p2id,
    type: 'wta',
    surface: 'a',
    level: 'a',
    sd: 's',
    method: 'p',
    status: 'ok',
    onlyMD: '',
    roundOnly: '',
    start_date: '',
    end_date: '',
  });

  try {
    const response = await fetch(`https://www.live-tennis.cn/zh/h2h/query?${sourceParams}`, {
      cache: 'no-store',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        Referer: 'https://www.live-tennis.cn/zh/h2h',
        'User-Agent': 'Mozilla/5.0 AceTrip/1.0',
      },
    });
    if (!response.ok) throw new Error(`live-tennis returned ${response.status}`);

    return NextResponse.json(parseH2H(await response.text(), p1id, p2id));
  } catch (error) {
    console.error('[h2h API]', error);
    return NextResponse.json({ error: '交手记录暂时无法获取，请稍后再试' }, { status: 502 });
  }
}
