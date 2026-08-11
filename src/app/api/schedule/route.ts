import { load, type Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SchedulePlayer {
  names: string[];
  rank: number | null;
  country: string | null;
  scores: string[];
}

interface ScheduleMatch {
  id: string;
  court: string;
  playerA: SchedulePlayer;
  playerB: SchedulePlayer;
  status: 'upcoming' | 'live' | 'completed';
  startTime: number | null;
  round: string;
  event: string;
}

interface ScheduleTournament {
  id: string;
  name: string;
  nameEn: string;
  level: string;
  matches: ScheduleMatch[];
}

function text(element: Cheerio<Element>): string {
  return element.text().replace(/\s+/g, ' ').trim();
}

function extractLevel(title: string, logoUrls: string[]): string {
  const logo = logoUrls.find(url => /(?:WTA|ITF-W|\/W\d)/i.test(url)) ?? '';
  const source = `${logo} ${title}`.toUpperCase();
  const wtaLevel = source.match(/WTA[-_ ]?(1000|500|250|125)/)?.[1];
  if (wtaLevel) return `WTA ${wtaLevel}`;
  if (/WTA[-_ ]?FINALS/.test(source)) return 'WTA Finals';

  const itfLevel = source.match(/(?:ITF[-_])?W(100|75|50|35|25|15)/)?.[1];
  if (itfLevel) return `W${itfLevel}`;
  if (/GRAND[-_ ]?SLAM|\bGS\b/.test(source)) return '大满贯';
  return 'WTA';
}

function cleanTournamentName(title: string): string {
  return title
    .replace(/^WTA\s*(?:1000|500|250|125)\s*/i, '')
    .replace(/^W(?:100|75|50|35|25|15)(?:\/M\d+)?\s*/i, '')
    .trim() || title;
}

function parsePlayer(row: Cheerio<Element>): SchedulePlayer {
  const cell = row.find('td').first();
  const names = cell
    .children('span').first()
    .find('span:not(.entrySign)')
    .map((_, node) => text(load(node)(node)))
    .get()
    .filter(Boolean);
  const rankText = text(cell.find('sub').first());
  const country = cell.find('img.playerFlag').first().attr('alt')?.trim() || null;
  const scores = cell
    .children('div').first()
    .children('div')
    .slice(0, 5)
    .filter((_, node) => !load(node)(node).hasClass('hidden'))
    .map((_, node) => text(load(node)(node)))
    .get()
    .filter(Boolean);

  return {
    names,
    rank: /^\d+$/.test(rankText) ? Number(rankText) : null,
    country,
    scores,
  };
}

function parseStatus(value: string | undefined): ScheduleMatch['status'] {
  if (value === '2') return 'completed';
  if (value === '1' || value === '1.5') return 'live';
  return 'upcoming';
}

function parseSchedule(html: string): ScheduleTournament[] {
  const $ = load(html);
  const tournaments: ScheduleTournament[] = [];

  $('.cResultTour').each((tourIndex, tourNode) => {
    const tour = $(tourNode);
    const title = text(tour.find('.cResultTourInfoCity').first());
    const nameEn = text(tour.find('.cResultTourInfoName').first());
    const logoUrls = tour.find('.cResultTourTitleLevelLogo[data-original]')
      .map((_, node) => $(node).attr('data-original') ?? '')
      .get();
    const matches: ScheduleMatch[] = [];

    tour.find('.cResultCourt').each((_, courtNode) => {
      const court = $(courtNode);
      const courtName = text(court.find('.cResultCourtTitle').first());

      court.find('.cResultMatch').each((matchIndex, matchNode) => {
        const match = $(matchNode);
        const statAction = match.find('.cResultMatchStat a').attr('onclick') ?? '';
        const event = text(match.find('.cResultMatchGender').first());
        if (!/['\"]wta['\"]/i.test(statAction) && !event.startsWith('女')) return;

        const rows = match.find('.cResultMatchMid table tr');
        if (rows.length < 2) return;

        const timestampText = text(match.find('.cResultMatchTime').first());
        matches.push({
          id: match.attr('match-id') || `${tourIndex}-${matchIndex}`,
          court: courtName || '待定球场',
          playerA: parsePlayer(rows.eq(0)),
          playerB: parsePlayer(rows.eq(1)),
          status: parseStatus(match.attr('match-status')),
          startTime: /^\d+$/.test(timestampText) ? Number(timestampText) : null,
          round: text(match.find('.cResultMatchRound').first()) || '轮次待定',
          event: event || '女子比赛',
        });
      });
    });

    if (matches.length > 0) {
      tournaments.push({
        id: tour.attr('data-eid') || tour.attr('tour-id') || `tournament-${tourIndex}`,
        name: cleanTournamentName(title || nameEn),
        nameEn,
        level: extractLevel(title, logoUrls),
        matches,
      });
    }
  });

  return tournaments;
}

function dateInShanghai(timestamp: number | null): string | null {
  if (!timestamp) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp * 1000));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function previousDate(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function mergeSchedules(schedules: ScheduleTournament[][], date: string): ScheduleTournament[] {
  const tournaments = new Map<string, ScheduleTournament>();

  for (const schedule of schedules) {
    for (const tournament of schedule) {
      const existing = tournaments.get(tournament.id);
      const matches = tournament.matches.filter(match => {
        const matchDate = dateInShanghai(match.startTime);
        return !matchDate || matchDate === date;
      });
      if (matches.length === 0) continue;

      if (!existing) {
        tournaments.set(tournament.id, { ...tournament, matches });
        continue;
      }

      const knownMatches = new Set(existing.matches.map(match => match.id));
      existing.matches.push(...matches.filter(match => !knownMatches.has(match.id)));
    }
  }

  return Array.from(tournaments.values());
}

async function fetchSchedule(date: string): Promise<ScheduleTournament[]> {
  const url = `https://www.live-tennis.cn/zh/result/${date}/only_content?_=${Date.now()}`;
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 AceTrip/1.0',
    },
  });

  if (!response.ok) throw new Error(`live-tennis returned ${response.status}`);
  return parseSchedule(await response.text());
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date 参数格式应为 YYYY-MM-DD' }, { status: 400 });
  }

  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return NextResponse.json({ error: 'date 参数不是有效日期' }, { status: 400 });
  }

  try {
    // live-tennis 按比赛地日期归档；北美晚场在中国时区已是次日。
    // 同时读取前一天并按 Asia/Shanghai 日期合并，避免漏掉多伦多、辛辛那提等赛事。
    const schedules = await Promise.all([
      fetchSchedule(previousDate(date)),
      fetchSchedule(date),
    ]);
    return NextResponse.json({ date, tournaments: mergeSchedules(schedules, date) });
  } catch (error) {
    console.error('[schedule API]', error);
    return NextResponse.json({ error: '赛程数据暂时无法获取，请稍后再试' }, { status: 502 });
  }
}
