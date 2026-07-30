'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Player, Tournament } from '@/types';
import { useAppStore } from '@/lib/store';
import { useFollowConfirm, FollowDialogs } from '@/components/ui/FollowDialogs';
import { getCountryFlag, LEVEL_LABELS } from '@/lib/data';
import { UserPlus, MapPin, Calendar, X, Heart, Zap, Swords, Trophy, TrendingUp, Star } from 'lucide-react';
import playerScheduleData from '../../../data/player_schedule.json';
import tournamentsData from '../../../data/tournaments_2026.json';

// 赛事名称映射（WTA API 英文名 → 中文名）
const TOURNAMENT_NAME_CN: Record<string, string> = {};
// 赛事名称 → 赛事对象（用于当 tournamentId 为空时按名称查找）
const TOURNAMENT_BY_NAME: Record<string, any> = {};
(tournamentsData as any).tournaments.forEach((t: any) => {
  if (t.nameCn) {
    const upper = t.name.toUpperCase();
    TOURNAMENT_NAME_CN[upper] = t.nameCn;
  }
  // 用城市名做 key（大写）—— player_schedule 里的 name 通常是城市名
  // 注意：同一城市可能有多个赛事（如 London 有 Queens 和 Wimbledon）
  // 城市名不覆盖已有映射，id 和 name 优先
  if (t.city && !TOURNAMENT_BY_NAME[t.city.toUpperCase()]) TOURNAMENT_BY_NAME[t.city.toUpperCase()] = t;
  if (t.cityCn && !TOURNAMENT_BY_NAME[t.cityCn]) TOURNAMENT_BY_NAME[t.cityCn] = t;
  if (t.name) TOURNAMENT_BY_NAME[t.name.toUpperCase()] = t;
  if (t.id) TOURNAMENT_BY_NAME[t.id.toUpperCase()] = t;
});
// 手动补充非 WTA500+ 的赛事中文名
const EXTRA_NAMES: Record<string, string> = {
  // WTA API 赛事名 → 中文名
  'HOBART': '霍巴特国际赛', 'PARMA 125': '帕尔马站', 'PARMA': '帕尔马站',
  'QUEENS': '女王杯', "QUEEN'S CLUB": '女王杯', 'EASTBOURNE': '伊斯特本站',
  'AUCKLAND': '奥克兰站', 'ATHENS': '雅典站', 'ROUEN': '鲁昂站',
  'CLEVELAND': '克利夫兰站', 'SAN DIEGO': '圣迪亚哥站', 'LYON': '里昂站',
  'NOTTINGHAM': '诺丁汉站', 'BIRMINGHAM': '伯明翰站', 'LAUSANNE': '洛桑站',
  'BUDAPEST': '布达佩斯站', 'PRAGUE': '布拉格站', 'PALERMO': '帕勒莫站',
  'PORTOROZ': '波尔托罗兹站', 'TENERIFE': '特内里费站', 'COURMAYEUR': '库尔马耶站',
  'TRANSYLVANIA': '特兰西瓦尼亚站', 'IASI': '亚西站', 'HAMBURG': '汉堡站',
  'MONASTIR': '莫纳斯提尔站', 'TOKYO': '東京站', 'OSAKA': '大阪站',
  'HONG KONG': '香港站', 'GUANGZHOU': '广州站', 'ZHENGZHOU': '郑州站',
  'NANCHANG': '南昌站', 'TIANJIN': '天津站', 'JIANGXI': '江西站',
  'BAOTOU': '包头站', 'MAANSHAN': '马鞍山站', 'CHENNAI': '金奈站',
  'SEOUL': '首尔站', 'TAIPEI': '台北站', 'TASHKENT': '塔什干站',
  'UNITED CUP': '联合杯', 'WTA FINALS': 'WTA 年终总决赛',
  'CARY': '卡瑞站', 'MIDLAND': '米德兰站', 'ANGERS': '昂热站',
  'NINGBO': '宁波公开赛', 'SINGAPORE': '新加坡公开赛',
  'GUADALAJARA': '瓜达拉哈拉站', 'MONTERREY': '蒙特雷站',
  // 城市名映射（WTA API 用城市名而非赛事名）
  'DOHA': '卡塔尔公开赛', 'DUBAI': '迪拜冠军赛',
  'INDIAN WELLS': '印第安维尔斯大师赛', 'MIAMI': '迈阿密公开赛',
  'MADRID': '马德里大师赛', 'MADRID 1000': '马德里大师赛',
  'ROME': '罗马大师赛', 'TORONTO': '加拿大公开赛',
  'CINCINNATI': '辛辛那提公开赛', 'BEIJING': '中国网球公开赛',
  'WUHAN': '武汉网球公开赛',
  'AUSTRALIAN OPEN': '澳大利亚网球公开赛',
  'ROLAND GARROS': '法国网球公开赛',
  'WIMBLEDON': '温布尔登网球锦标赛',
  'US OPEN': '美国网球公开赛',
  'BRISBANE': '布里斯班国际赛', 'ADELAIDE': '阿德莱德国际赛',
  'ABU DHABI': '阿布扎比站', 'MERIDA': '梅里达站', 'MÉRIDA': '梅里达站',
  'CHARLESTON': '查尔斯顿站', 'LINZ': '林茨站',
  'STUTTGART': '斯图加特大奖赛', 'STRASBOURG': '斯特拉斯堡站',
  'BERLIN': '柏林公开赛', 'BAD HOMBURG': '巴德洪堡站',
  'WASHINGTON': '华盛顿站', 'WASHINGTON DC': '华盛顿站',
};
Object.assign(TOURNAMENT_NAME_CN, EXTRA_NAMES);

interface Props {
  players: Player[];
  tournaments: Tournament[];
}

// ── 常量映射 ──────────────────────────────────────────────

const LEVEL_BADGE: Record<string, string> = {
  GS: 'badge-gs',
  WTA1000: 'badge-wta1000',
  WTA500: 'badge-wta500',
  WTA250: 'badge-wta250',
  WTA125: 'badge-wta125',
  Finals: 'badge-finals',
};

const SURFACE_CN: Record<string, string> = {
  Hard: '硬地',
  Clay: '红土',
  Grass: '草地',
};

const ROUND_CN: Record<string, string> = {
  F: '决赛',
  S: '半决赛',
  Q: '1/4决赛',
  R16: '第四轮',
  R32: '第三轮',
  R64: '第二轮',
  R128: '第一轮',
};

// ── 类型 ─────────────────────────────────────────────────

interface ScheduleResult {
  name: string;
  startDate: string;
  bestRound: string;
  isChampion: boolean;
  tournamentId: string | null;
}

interface PlayerScheduleData {
  tournamentIds: string[];
  totalTournaments: number;
  totalWins: number;
  totalLosses: number;
  titles: number;
  results: ScheduleResult[];
}

const scheduleMap = playerScheduleData as Record<string, PlayerScheduleData>;

// ── 工具函数 ──────────────────────────────────────────────

function formatCnDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDotDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── 功能 A：数据看板 ──────────────────────────────────────

interface StatsDashboardProps {
  player: Player;
}

function StatsDashboard({ player }: StatsDashboardProps) {
  const schedule = scheduleMap[player.id];
  if (!schedule) return null;

  // 只统计当年数据
  const currentYear = new Date().getFullYear();
  const thisYearResults = schedule.results
    ? schedule.results.filter((r: any) => r.startDate && new Date(r.startDate).getFullYear() === currentYear)
    : [];
  const totalTournaments = (schedule as any).thisYearTournaments ?? thisYearResults.length;
  const titles = (schedule as any).thisYearTitles ?? thisYearResults.filter((r: any) => r.isChampion).length;
  const totalWins = (schedule as any).thisYearWins ?? schedule.totalWins;
  const totalLosses = (schedule as any).thisYearLosses ?? schedule.totalLosses;
  const winRate = totalWins + totalLosses > 0
    ? Math.round((totalWins / (totalWins + totalLosses)) * 100)
    : 0;

  // conic-gradient 环形图角度
  const winRateDeg = Math.round((winRate / 100) * 360);
  const tourProgress = Math.min(totalTournaments / 20, 1); // 20站为满环参考值
  const tourDeg = Math.round(tourProgress * 360);

  return (
    <div className="card-flat p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={15} className="text-[var(--tennis-green)]" />
        <span className="text-sm font-bold tracking-tight">赛季数据</span>
      </div>
      <div className="flex items-center justify-around gap-2">

        {/* 参赛站数 — 圆形进度 */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative w-14 h-14">
            <div
              className="w-14 h-14 rounded-full"
              style={{
                background: `conic-gradient(var(--tennis-green) ${tourDeg}deg, #e5e7eb ${tourDeg}deg)`,
              }}
            />
            <div className="absolute inset-[4px] rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-[15px] font-bold leading-none">{totalTournaments}</span>
              <span className="text-[8px] text-[var(--text-muted)] leading-none">站</span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">参赛站</span>
        </div>

        {/* 胜率 — 环形图 */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative w-14 h-14">
            <div
              className="w-14 h-14 rounded-full"
              style={{
                background: `conic-gradient(#3b82f6 ${winRateDeg}deg, #e5e7eb ${winRateDeg}deg)`,
              }}
            />
            <div className="absolute inset-[4px] rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-[13px] font-bold leading-none">{winRate}%</span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">胜率</span>
        </div>

        {/* 冠军数 */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-14 h-14 flex flex-col items-center justify-center rounded-full bg-amber-50 border-2 border-amber-200">
            <span className="text-xl leading-none">🏆</span>
            <span className="text-[14px] font-bold text-amber-700 leading-none">{titles}</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">冠军数</span>
        </div>

        {/* 当前排名 */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-14 h-14 flex flex-col items-center justify-center rounded-full bg-purple-50 border-2 border-purple-200">
            <span className="text-[10px] text-purple-400 leading-none">WTA</span>
            <span className="text-[18px] font-bold text-purple-700 leading-none">#{player.rank}</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">当前排名</span>
        </div>

        {/* 战绩 */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-14 h-14 flex flex-col items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-700 leading-none">{totalWins}W</span>
            <span className="text-[10px] text-[var(--text-muted)] leading-none">{totalLosses}L</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">胜负</span>
        </div>

      </div>
    </div>
  );
}

// ── 功能 B：赛季对决回顾 ──────────────────────────────────

interface H2HConflict {
  playerA: Player;
  playerB: Player;
  tournamentName: string;
  tournamentId: string | null;
  roundA: string;
  roundB: string;
}

function buildH2H(followedPlayers: Player[]): H2HConflict[] {
  if (followedPlayers.length < 2) return [];
  const conflicts: H2HConflict[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < followedPlayers.length; i++) {
    for (let j = i + 1; j < followedPlayers.length; j++) {
      const pA = followedPlayers[i];
      const pB = followedPlayers[j];
      const schedA = scheduleMap[pA.id];
      const schedB = scheduleMap[pB.id];
      if (!schedA || !schedB) continue;

      // 找她们参加过的共同赛事（以 tournamentId 或 name 匹配）
      for (const rA of schedA.results) {
        for (const rB of schedB.results) {
          const matchById = rA.tournamentId && rB.tournamentId && rA.tournamentId === rB.tournamentId;
          const matchByName = !matchById && rA.name.toUpperCase() === rB.name.toUpperCase();
          if (!matchById && !matchByName) continue;

          const key = `${pA.id}-${pB.id}-${rA.tournamentId ?? rA.name}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const tournamentName =
            TOURNAMENT_NAME_CN[rA.name.toUpperCase()] || rA.name;

          conflicts.push({
            playerA: pA,
            playerB: pB,
            tournamentName,
            tournamentId: rA.tournamentId ?? rB.tournamentId ?? null,
            roundA: rA.bestRound,
            roundB: rB.bestRound,
          });
        }
      }
    }
  }
  return conflicts;
}

interface HeadToHeadSectionProps {
  followedPlayers: Player[];
}

function HeadToHeadSection({ followedPlayers }: HeadToHeadSectionProps) {
  const conflicts = useMemo(() => buildH2H(followedPlayers), [followedPlayers]);
  if (conflicts.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Swords size={16} className="text-rose-500" />
        <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>赛季交锋</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {conflicts.map((c, i) => {
          const nameA = c.playerA.nameCn || c.playerA.displayName;
          const nameB = c.playerB.nameCn || c.playerB.displayName;
          const roundALabel = c.playerA ? (ROUND_CN[c.roundA] ?? c.roundA) : '—';
          const roundBLabel = c.playerB ? (ROUND_CN[c.roundB] ?? c.roundB) : '—';
          const isChampA = c.roundA === 'F' && scheduleMap[c.playerA.id]?.results
            .find(r => (r.tournamentId ?? r.name) === (c.tournamentId ?? c.tournamentName))?.isChampion;
          const isChampB = c.roundB === 'F' && scheduleMap[c.playerB.id]?.results
            .find(r => (r.tournamentId ?? r.name) === (c.tournamentId ?? c.tournamentName))?.isChampion;

          return (
            <div key={i} className="card-flat p-4 flex flex-col gap-2">
              <div className="text-xs font-medium text-[var(--text-muted)] text-center">@ {c.tournamentName}</div>
              <div className="flex items-center justify-between gap-2">
                {/* Player A */}
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  {c.playerA.headshot && (
                    <img src={c.playerA.headshot} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-black/8" />
                  )}
                  <span className="text-xs font-semibold text-center truncate max-w-full">{nameA}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isChampA ? 'bg-amber-100 text-amber-700' :
                    c.roundA === 'S' ? 'bg-blue-50 text-blue-700' :
                    c.roundA === 'Q' ? 'bg-green-50 text-green-700' :
                    'bg-black/5 text-[var(--text-secondary)]'
                  }`}>
                    {isChampA ? '🏆冠军' : roundALabel}
                  </span>
                </div>

                {/* VS */}
                <div className="text-sm font-bold text-rose-400">🆚</div>

                {/* Player B */}
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  {c.playerB.headshot && (
                    <img src={c.playerB.headshot} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-black/8" />
                  )}
                  <span className="text-xs font-semibold text-center truncate max-w-full">{nameB}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isChampB ? 'bg-amber-100 text-amber-700' :
                    c.roundB === 'S' ? 'bg-blue-50 text-blue-700' :
                    c.roundB === 'Q' ? 'bg-green-50 text-green-700' :
                    'bg-black/5 text-[var(--text-secondary)]'
                  }`}>
                    {isChampB ? '🏆冠军' : roundBLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 功能 C：赛季高光 ─────────────────────────────────────

interface HighlightItem {
  result: ScheduleResult;
  tournamentName: string;
}

interface SeasonHighlightSectionProps {
  followedPlayers: Player[];
}

function SeasonHighlightSection({ followedPlayers }: SeasonHighlightSectionProps) {
  const now = new Date();

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Star size={16} className="text-amber-500" />
        <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>赛季高光</h2>
      </div>
      <div className="space-y-4">
        {followedPlayers.map(player => {
          const schedule = scheduleMap[player.id];
          if (!schedule) return null;

          // 只显示当年高光
          const thisYr = new Date().getFullYear();
          const highlights: HighlightItem[] = schedule.results
            .filter(r => {
              const d = new Date(r.startDate);
              if (d > now || d.getFullYear() !== thisYr) return false;
              return r.isChampion || r.bestRound === 'F' || r.bestRound === 'S' || r.bestRound === 'Q';
            })
            .map(r => ({
              result: r,
              tournamentName: TOURNAMENT_NAME_CN[r.name.toUpperCase()] || r.name,
            }))
            .sort((a, b) => new Date(b.result.startDate).getTime() - new Date(a.result.startDate).getTime());

          if (highlights.length === 0) return null;

          const yrResults = schedule.results.filter((r: any) => r.startDate && new Date(r.startDate).getFullYear() === thisYr);
          const yrTournaments = yrResults.length;
          const yrTitles = yrResults.filter((r: any) => r.isChampion).length;
          const yrW = (schedule as any).thisYearWins ?? schedule.totalWins;
          const yrL = (schedule as any).thisYearLosses ?? schedule.totalLosses;
          const totalMatches = yrW + yrL;
          const winRate = totalMatches > 0
            ? Math.round((yrW / totalMatches) * 100)
            : 0;

          return (
            <div key={player.id} className="rounded-2xl overflow-hidden border border-white/60 shadow-sm" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
              {/* 球员卡片头部 */}
              <div className="flex items-center gap-2.5 p-4 pb-3 border-b border-black/5">
                {player.headshot && (
                  <img src={player.headshot} alt="" className="w-9 h-9 rounded-full object-cover border border-black/8" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{player.nameCn || player.displayName}</span>
                    <span className="text-xs text-[var(--text-muted)]">{getCountryFlag(player.country)} #{player.rank}</span>
                  </div>
                  {/* 赛季摘要统计 */}
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[var(--text-muted)]">
                    <span>{yrTournaments}站</span>
                    <span className="text-black/20">·</span>
                    <span>{yrW}胜{yrL}负</span>
                    <span className="text-black/20">·</span>
                    <span>胜率{winRate}%</span>
                    {yrTitles > 0 && (
                      <>
                        <span className="text-black/20">·</span>
                        <span className="text-amber-600 font-medium">🏆{yrTitles}冠</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 高光列表 */}
              <div className="divide-y divide-black/5">
                {highlights.map((item, idx) => {
                  const { result, tournamentName } = item;
                  const isChamp = result.isChampion;

                  // 只有夺冠有特殊样式，其他统一简洁
                  const rowStyle = isChamp
                    ? 'bg-gradient-to-r from-amber-50/60 to-transparent backdrop-blur-sm'
                    : '';

                  // 成绩文字
                  const badgeText = isChamp ? '夺冠' : result.bestRound === 'F' ? '决赛' : result.bestRound === 'S' ? '半决赛' : '八强';
                  const badgeColor = isChamp
                    ? 'text-amber-700 font-semibold'
                    : 'text-[var(--text-secondary)]';

                  return (
                    <div key={idx} className={`flex items-center gap-3 px-4 py-3 ${rowStyle}`}>
                      {/* 左侧 emoji */}
                      <span className="text-base flex-shrink-0 w-6 text-center">
                        {isChamp ? '🏆' : result.bestRound === 'F' ? '⭐' : result.bestRound === 'S' ? '💪' : '💥'}
                      </span>

                      {/* 中间赛事名 */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${isChamp ? 'font-semibold text-amber-800' : 'text-[var(--text-primary)]'}`}>{tournamentName}</span>
                      </div>

                      {/* 右侧成绩+日期 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs ${badgeColor}`}>{badgeText}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">{formatDotDate(result.startDate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 赛事时间轴卡片 ─────────────────────────────────────────

interface TimelineEntry {
  month: number;
  tournament: Tournament | null;
  result: ScheduleResult | null;
  isPast: boolean;
  isOngoing: boolean;
  isFuturePredicted: boolean;
  isBucketListed: boolean;
}

interface TimelineCardProps {
  entry: TimelineEntry;
  isFirst: boolean;
  isLast: boolean;
}

function TimelineCard({ entry, isFirst, isLast }: TimelineCardProps) {
  const { result, tournament, isPast, isOngoing, isFuturePredicted, isBucketListed } = entry;

  const isChampion = result?.isChampion ?? false;
  const startDateStr = result?.startDate ?? tournament?.dateStart ?? '';
  const startDate = startDateStr ? new Date(startDateStr) : null;
  const tournamentName = tournament?.nameCn ?? tournament?.name ?? TOURNAMENT_NAME_CN[(result?.name ?? '').toUpperCase()] ?? result?.name ?? '—';
  const city = tournament?.cityCn ?? tournament?.city ?? '';
  // 级别推断：优先用赛事数据，没有则根据名称推断
  const inferLevel = (name: string): string | undefined => {
    const upper = name.toUpperCase();
    if (upper.includes('125')) return 'WTA125';
    return 'WTA250'; // 默认未匹配的都是 WTA 250
  };
  const level = tournament?.level ?? (result?.name ? inferLevel(result.name) : undefined);
  const surface = tournament?.surface;
  const roundCn = result?.bestRound ? (ROUND_CN[result.bestRound] ?? result.bestRound) : null;

  const cardClass = isChampion
    ? 'relative rounded-xl border-2 border-amber-400 p-3 shadow-md min-h-[72px]'
    : isFuturePredicted
    ? 'relative rounded-xl border border-dashed border-black/20 p-3 opacity-70 min-h-[72px]'
    : 'relative card-flat p-3 min-h-[72px]';

  const cardBg = isChampion
    ? 'bg-gradient-to-br from-amber-50 to-yellow-50'
    : isFuturePredicted
    ? 'bg-white/60'
    : '';

  return (
    <div className="flex gap-3 items-start">
      <div className="flex flex-col items-center flex-shrink-0 w-4">
        {!isFirst && (
          <div
            className={`w-px flex-none ${isFuturePredicted ? 'border-l-2 border-dashed border-black/20 h-3' : 'bg-black/15 h-3'}`}
            style={{ width: 1 }}
          />
        )}
        <div
          className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
            isOngoing
              ? 'bg-emerald-500 border-emerald-500 animate-pulse'
              : isChampion
              ? 'bg-amber-400 border-amber-400'
              : isFuturePredicted
              ? 'bg-white border-black/25'
              : 'bg-white border-black/30'
          }`}
        />
        {!isLast && (
          <div
            className={`flex-1 min-h-4 ${isFuturePredicted ? 'border-l-2 border-dashed border-black/20' : 'bg-black/15'}`}
            style={{ width: 1 }}
          />
        )}
      </div>

      <div className={`flex-1 mb-3 ${cardClass} ${cardBg}`}>
        {isChampion && (
          <div className="absolute -top-2 -right-2 text-lg">🏆</div>
        )}
        {isBucketListed && (
          <div className="flex items-center gap-1 text-[10px] text-pink-500 font-medium bg-pink-50 px-1.5 py-0.5 rounded-full mt-1 w-fit ml-auto">
            💕 你也想去
          </div>
        )}

        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {tournament ? (
                <Link
                  href={`/tournaments/${tournament.id}`}
                  className={`text-sm font-semibold hover:text-[var(--tennis-green)] transition-colors ${isChampion ? 'text-amber-800' : ''}`}
                >
                  {tournamentName}
                </Link>
              ) : (
                <span className={`text-sm font-semibold ${isChampion ? 'text-amber-800' : ''}`}>
                  {tournamentName}
                </span>
              )}

              {level && (
                <span className={`badge text-[10px] ${LEVEL_BADGE[level] ?? ''}`}>
                  {LEVEL_LABELS[level]}
                </span>
              )}

              {isOngoing && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  进行中
                </span>
              )}

              {isFuturePredicted && (
                <span className="text-[10px] text-[var(--text-muted)] bg-black/5 px-1.5 py-0.5 rounded-full">
                  预计参赛
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-muted)]">
              {city && (
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {city}
                </span>
              )}
              {surface && <span>{SURFACE_CN[surface] ?? surface}</span>}
              {startDate && (
                <span>{formatDotDate(result?.startDate ?? tournament?.dateStart ?? '')}</span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 text-right ml-2">
            {isChampion ? (
              <span className="text-xs font-semibold text-amber-700">🏆 冠军</span>
            ) : roundCn ? (
              <span className="text-xs text-[var(--text-secondary)]">{roundCn}</span>
            ) : isFuturePredicted && tournament ? (
              <span className="text-xs text-[var(--text-muted)]">
                {getDaysUntil(tournament.dateStart) > 0
                  ? `${getDaysUntil(tournament.dateStart)}天后`
                  : '即将开始'}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────

export function FollowPageClient({ players, tournaments }: Props) {
  const { followedPlayers, unfollowPlayer, reorderFollowedPlayers, bucketList } = useAppStore();
  const followConfirm = useFollowConfirm();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // 拖拽状态
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  // bounce 动画触发
  const [bouncingIdx, setBouncingIdx] = useState<number | null>(null);

  const followedPlayerData = followedPlayers
    .map(fp => players.find(p => p.id === fp.playerId))
    .filter(Boolean) as Player[];

  const currentPlayerId = activeTab || (followedPlayerData.length > 0 ? followedPlayerData[0].id : null);
  const currentPlayer = followedPlayerData.find(p => p.id === currentPlayerId);

  // 心愿单 tournamentId 集合
  const bucketListIds = useMemo(
    () => new Set(bucketList.map(b => b.tournamentId)),
    [bucketList]
  );

  // ── 当前球员时间轴
  const timeline = useMemo(() => {
    if (!currentPlayer) return [];
    const schedule = scheduleMap[currentPlayer.id];
    const now = new Date();
    const entries: (TimelineEntry & { idx: number })[] = [];
    const tournamentMap = new Map<string, Tournament>(tournaments.map(t => [t.id, t]));

    if (schedule) {
      const thisYr = new Date().getFullYear();
      for (const result of schedule.results) {
        // 只显示当年数据
        if (result.startDate && new Date(result.startDate).getFullYear() !== thisYr) continue;
        const t = result.tournamentId
          ? tournamentMap.get(result.tournamentId) ?? null
          : (result.name ? (TOURNAMENT_BY_NAME[result.name.toUpperCase()] ?? null) : null);
        const startDate = new Date(result.startDate);
        const endDate = t ? new Date(t.dateEnd) : new Date(result.startDate);
        endDate.setDate(endDate.getDate() + 7);
        const isOngoing = t ? now >= new Date(t.dateStart) && now <= new Date(t.dateEnd) : false;
        const isPast = now > endDate;
        entries.push({
          month: startDate.getMonth() + 1,
          tournament: t,
          result,
          isPast: isPast && !isOngoing,
          isOngoing,
          isFuturePredicted: false,
          isBucketListed: result.tournamentId ? bucketListIds.has(result.tournamentId) : false,
          idx: 0,
        });
      }
    }

    const participatedIds = new Set(
      schedule?.results
        .filter(r => r.startDate && new Date(r.startDate).getFullYear() === new Date().getFullYear())
        .map(r => r.tournamentId).filter(Boolean) as string[]
    );
    for (const t of tournaments) {
      if (participatedIds.has(t.id)) continue;
      if (new Date(t.dateStart) <= now) continue;
      if (t.level !== 'GS' && t.level !== 'WTA1000') continue;
      entries.push({
        month: new Date(t.dateStart).getMonth() + 1,
        tournament: t,
        result: null,
        isPast: false,
        isOngoing: false,
        isFuturePredicted: true,
        isBucketListed: bucketListIds.has(t.id),
        idx: 0,
      });
    }

    entries.sort((a, b) => {
      const dateA = a.result?.startDate ?? a.tournament?.dateStart ?? '';
      const dateB = b.result?.startDate ?? b.tournament?.dateStart ?? '';
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
    entries.forEach((e, i) => { e.idx = i; });
    return entries;
  }, [currentPlayer, tournaments, bucketListIds]);

  // 按月份分组
  const timelineByMonth = useMemo(() => {
    const groups: { month: number; entries: (TimelineEntry & { idx: number })[] }[] = [];
    const monthMap = new Map<number, (TimelineEntry & { idx: number })[]>();
    timeline.forEach(entry => {
      if (!monthMap.has(entry.month)) {
        monthMap.set(entry.month, []);
        groups.push({ month: entry.month, entries: monthMap.get(entry.month)! });
      }
      monthMap.get(entry.month)!.push(entry);
    });
    return groups;
  }, [timeline]);

  // ── 我和球员的交集
  const intersection = useMemo(() => {
    if (!currentPlayer) return [];
    const schedule = scheduleMap[currentPlayer.id];
    if (!schedule) return [];
    const allTournamentIds = [...new Set([
      ...(schedule.results.map(r => r.tournamentId).filter(Boolean) as string[]),
      ...tournaments
        .filter(t => (t.level === 'GS' || t.level === 'WTA1000') && new Date(t.dateStart) > new Date())
        .map(t => t.id),
    ])];
    return allTournamentIds
      .filter(tid => bucketListIds.has(tid))
      .map(tid => {
        const t = tournaments.find(tour => tour.id === tid);
        const result = schedule.results.find(r => r.tournamentId === tid && r.startDate && new Date(r.startDate).getFullYear() === new Date().getFullYear());
        const isFuture = t ? new Date(t.dateEnd) > new Date() : false;
        return { tournament: t, result: isFuture ? null : result };
      })
      .filter(item => item.tournament != null) as { tournament: Tournament; result: ScheduleResult | null }[];
  }, [currentPlayer, tournaments, bucketListIds]);

  // ── 空状态
  if (followedPlayerData.length === 0) {
    return (
      <div className="container-tight pb-12">
        <div className="card-flat p-12 text-center">
          <UserPlus size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold mb-2">还没有关注任何球员</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-6">
            关注你喜爱的 WTA 球员，追踪她们在全球巡回赛的参赛行程。
          </p>
          <Link
            href="/players"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium"
            style={{ background: 'var(--tennis-green)' }}
          >
            浏览球员
          </Link>
        </div>
      </div>
    );
  }

  // ── 拖拽处理
  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (idx: number) => {
    if (dragIdx !== null && dragIdx !== idx) {
      const ids = followedPlayerData.map(p => p.id);
      const [moved] = ids.splice(dragIdx, 1);
      ids.splice(idx, 0, moved);
      reorderFollowedPlayers(ids);
      // 触发 bounce 动画
      setBouncingIdx(idx > dragIdx ? idx - 1 : idx);
      setTimeout(() => setBouncingIdx(null), 400);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="container-tight pb-12">

      {/* ── 球员卡片横滑（可拖拽排序）── */}
      <div className="flex gap-3 mb-5 overflow-x-auto pb-2 scrollbar-hide">
        {followedPlayerData.map((player, idx) => {
          const isActive = currentPlayerId === player.id;
          const ps = scheduleMap[player.id];
          const isDragging = dragIdx === idx;
          const isDragTarget = dragOverIdx === idx && dragIdx !== idx;
          const isBouncing = bouncingIdx === idx;

          return (
            <div
              key={player.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onClick={() => setActiveTab(player.id)}
              className={`flex-shrink-0 rounded-2xl p-3 cursor-grab active:cursor-grabbing select-none ${
                isActive
                  ? 'bg-[var(--tennis-green)] text-white shadow-lg'
                  : 'bg-white border hover:shadow-md'
              } ${
                isDragTarget
                  ? 'border-2 border-dashed border-[var(--tennis-green)] scale-[1.01]'
                  : isActive
                  ? ''
                  : 'border-black/8'
              }`}
              style={{
                minWidth: 160,
                // 拖拽时：放大 + 阴影加深 + 透明度 0.8
                transform: isDragging
                  ? 'scale(1.06)'
                  : isBouncing
                  ? 'scale(1.04)'
                  : isActive
                  ? 'scale(1.02)'
                  : 'scale(1)',
                opacity: isDragging ? 0.8 : 1,
                boxShadow: isDragging
                  ? '0 12px 32px rgba(0,0,0,0.22)'
                  : undefined,
                transition: isDragging
                  ? 'transform 0.1s ease, opacity 0.1s ease, box-shadow 0.1s ease'
                  : isBouncing
                  ? 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  : 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div className="flex items-center gap-2.5">
                {player.headshot && (
                  <img
                    src={player.headshot}
                    alt=""
                    className={`w-10 h-10 rounded-full object-cover border-2 ${isActive ? 'border-white/40' : 'border-black/8'}`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{player.nameCn || player.displayName}</div>
                  <div className={`text-[11px] mt-0.5 ${isActive ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                    #{player.rank} {getCountryFlag(player.country)}
                    {ps && ((ps as any).thisYearTitles ?? ps.titles) > 0 && <span className="ml-1">🏆{(ps as any).thisYearTitles ?? ps.titles}</span>}
                  </div>
                </div>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); followConfirm.requestFollow(player.id, player.nameCn || player.displayName); }}
                  className={`rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${isActive ? 'hover:bg-white/20' : 'hover:bg-black/10'}`}
                >
                  <X size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 当前球员内容区 ── */}
      {currentPlayer && (
        <>
          {/* 功能 A：数据看板 */}
          <StatsDashboard player={currentPlayer} />

          {/* 赛季故事线 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-[var(--tennis-green)]" />
              <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
                {currentPlayer.nameCn || currentPlayer.displayName} 的赛季故事线
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              已参赛成绩 · 未来大满贯 / WTA1000 预计参赛
            </p>

            {timelineByMonth.length === 0 ? (
              <div className="card-flat p-6 text-center text-sm text-[var(--text-muted)]">
                暂无赛事数据
              </div>
            ) : (
              <div>
                {timelineByMonth.map(group => (
                  <div key={group.month} className="flex gap-4 mb-2">
                    <div className="w-8 flex-shrink-0 pt-2 text-right">
                      <span className="text-xs font-semibold text-[var(--text-muted)] leading-none">
                        {group.month}月
                      </span>
                    </div>
                    <div className="flex-1">
                      {group.entries.map((entry, i) => (
                        <TimelineCard
                          key={`${entry.result?.tournamentId ?? entry.tournament?.id ?? i}-${i}`}
                          entry={entry}
                          isFirst={entry.idx === 0}
                          isLast={entry.idx === timeline.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 赛季高光 */}
          <SeasonHighlightSection followedPlayers={followedPlayerData} />

          {/* 我和她的交集（放最后） */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Heart size={16} className="text-pink-500" />
              <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>我和她的交集</h2>
            </div>

            {intersection.length > 0 ? (
              <div className="card-flat p-4 mb-3 bg-pink-50/60 border border-pink-100">
                <p className="text-sm font-medium text-pink-700 mb-3">
                  💕 你的心愿单中有 <strong>{intersection.length}</strong> 站可能看到{' '}
                  {currentPlayer.nameCn || currentPlayer.displayName} 的比赛
                </p>
                <div className="space-y-2">
                  {intersection.map(({ tournament: t, result }, intIdx) => {
                    const now = new Date();
                    const isFuture = new Date(t.dateStart) > now;
                    const days = isFuture ? getDaysUntil(t.dateStart) : null;
                    return (
                      <Link key={`overlap-${t.id}-${intIdx}`} href={`/tournaments/${t.id}`} className="flex items-center gap-3 group">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium group-hover:text-[var(--tennis-green)] transition-colors">
                            {t.nameCn ?? t.name}
                          </span>
                          <span className={`ml-2 badge text-[10px] ${LEVEL_BADGE[t.level] ?? ''}`}>
                            {LEVEL_LABELS[t.level]}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] flex-shrink-0">
                          {result?.isChampion
                            ? '🏆 夺冠'
                            : result?.bestRound
                            ? ROUND_CN[result.bestRound] ?? result.bestRound
                            : isFuture && days !== null
                            ? `${days} 天后`
                            : formatCnDate(t.dateStart)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card-flat p-5 text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  去心愿单添加赛事，也许能在现场看到她 🎾
                </p>
                <Link
                  href="/bucket-list"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[var(--tennis-green)]"
                >
                  <Heart size={14} />
                  前往心愿单
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      <FollowDialogs
        state={followConfirm.state}
        confirmFollow={followConfirm.confirmFollow}
        confirmUnfollow={followConfirm.confirmUnfollow}
        dismiss={followConfirm.dismiss}
      />
    </div>
  );
}
