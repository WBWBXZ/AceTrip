'use client';

import { useState, useEffect } from 'react';
import { Heart, Share2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useRequireAuth } from '@/lib/use-require-auth';
import { getCountryFlag, getCountryCn } from '@/lib/data';
import type { Player } from '@/types';
import { ShareCard } from '@/components/share/ShareCard';
import type { ShareCardProps } from '@/components/share/ShareCard';
import playerScheduleData from '../../../data/player_schedule.json';
import tournamentsData from '../../../data/tournaments_2026.json';
import pointsBreakdownData from '../../../data/player_points_breakdown.json';

interface PointsBreakdownEntry { level: string; name: string; points: number; round: string; }
interface PointsBreakdown { total: number; entries: PointsBreakdownEntry[]; }
const pointsMap = pointsBreakdownData as Record<string, PointsBreakdown>;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ScheduleResult {
  name: string;
  startDate: string;
  bestRound: string;
  isChampion: boolean;
  tournamentId: string | null;
  points?: number;
  level?: string;
}

interface PlayerScheduleEntry {
  tournamentIds: string[];
  totalTournaments: number;
  totalWins: number;
  totalLosses: number;
  titles: number;
  thisYearTournaments?: number;
  thisYearWins?: number;
  thisYearLosses?: number;
  thisYearTitles?: number;
  results: ScheduleResult[];
}

interface TournamentEntry {
  id: string; name: string; level: string; city: string; country: string;
  surface: string; indoor: boolean; dateStart: string; dateEnd: string;
  nameCn?: string; cityCn?: string; countryCn?: string;
}

// ─────────────────────────────────────────────
// Lookup tables
// ─────────────────────────────────────────────

const TOURNAMENT_LEVEL_MAP: Record<string, string> = {};
const TOURNAMENT_SURFACE_MAP: Record<string, string> = {};
const TOURNAMENT_NAMECN_MAP: Record<string, string> = {};
const TOURNAMENT_NAME_MAP: Record<string, string> = {};
const TOURNAMENT_CITY_MAP: Record<string, string> = {};

(tournamentsData as { tournaments: TournamentEntry[] }).tournaments.forEach((t) => {
  TOURNAMENT_LEVEL_MAP[t.id] = t.level;
  TOURNAMENT_SURFACE_MAP[t.id] = t.surface;
  if (t.nameCn) TOURNAMENT_NAMECN_MAP[t.id] = t.nameCn;
  TOURNAMENT_NAME_MAP[t.id] = t.name;
  TOURNAMENT_CITY_MAP[t.id] = t.city;
});

const TOURNAMENT_NAME_CN: Record<string, string> = {
  'AUSTRALIAN OPEN': '澳大利亚公开赛', 'ROLAND GARROS': '法国网球公开赛',
  'WIMBLEDON': '温布尔登锦标赛', 'US OPEN': '美国网球公开赛',
  'DOHA': '卡塔尔公开赛', 'DUBAI': '迪拜锦标赛',
  'INDIAN WELLS': '印第安维尔斯大师赛', 'MIAMI': '迈阿密公开赛',
  'MADRID': '马德里公开赛', 'MADRID 1000': '马德里公开赛',
  'ROME': '罗马大师赛', 'TORONTO': '加拿大公开赛',
  'CINCINNATI': '辛辛那提公开赛', 'CHINA OPEN': '中国网球公开赛',
  'BEIJING': '中国网球公开赛', 'WUHAN': '武汉网球公开赛',
  'NINGBO': '宁波公开赛', 'TOKYO': '东京泛太平洋公开赛',
  'WTA FINALS': 'WTA 年终总决赛', 'UNITED CUP': '联合杯',
  'BRISBANE': '布里斯班国际赛', 'ADELAIDE': '阿德莱德国际赛',
  'ABU DHABI': '阿布扎比公开赛', 'CHARLESTON': '查尔斯顿公开赛',
  'LINZ': '林茨公开赛', 'STUTTGART': '斯图加特大奖赛',
  'STRASBOURG': '斯特拉斯堡国际赛', 'BERLIN': '柏林公开赛',
  'BAD HOMBURG': '巴特洪堡公开赛', 'QUEENS': '女王杯',
  "QUEEN'S CLUB": '女王杯', 'EASTBOURNE': '伊斯特本国际赛',
  'SINGAPORE': '新加坡网球公开赛', 'GUADALAJARA': '瓜达拉哈拉公开赛',
  'MONTERREY': '蒙特雷公开赛', 'WASHINGTON': '华盛顿公开赛',
  'MERIDA': '梅里达公开赛', 'MÉRIDA': '梅里达公开赛',
  'AUCKLAND': '奥克兰公开赛', 'HOBART': '霍巴特国际赛',
  'SAN DIEGO': '圣迭戈公开赛', 'CLEVELAND': '克利夫兰公开赛',
  'SEOUL': '首尔公开赛', 'OSAKA': '大阪公开赛',
  'HONG KONG': '香港网球公开赛', 'GUANGZHOU': '广州公开赛',
  'ZHENGZHOU': '郑州公开赛', 'NANCHANG': '南昌公开赛',
  'JIUJIANG': '九江公开赛', 'TIANJIN': '天津公开赛',
  'SHENZHEN': '深圳公开赛', 'BANGKOK': '曼谷公开赛',
  'NOTTINGHAM': '诺丁汉公开赛', 'BIRMINGHAM': '伯明翰经典赛',
  'BUDAPEST': '布达佩斯大奖赛', 'RABAT': '拉巴特公开赛',
  'BOGOTA': '波哥大公开赛', 'PRAGUE': '布拉格公开赛',
  'PALERMO': '巴勒莫公开赛', 'LAUSANNE': '洛桑公开赛',
  'HAMBURG': '汉堡公开赛', 'BUCHAREST': '布加勒斯特公开赛',
  'IASI': '雅西公开赛', 'ATHENS': '雅典公开赛',
  'PARMA': '帕尔马公开赛', 'ROUEN': '鲁昂公开赛',
  'LYON': '里昂公开赛', 'CARY': '卡瑞站',
  'MAANSHAN': '马鞍山站', 'BAOTOU': '包头站',
  'LEXINGTON': '列克星敦公开赛', 'TENERIFE': '特内里费公开赛',
  'MONASTIR': '莫纳斯提尔站', 'CHENNAI': '金奈公开赛',
};

const ROUND_CN: Record<string, string> = {
  'F': '决赛', 'S': '半决赛', 'Q': '1/4决赛',
  'R16': '第四轮', 'R32': '第三轮', 'R64': '第二轮', 'R128': '第一轮',
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function inferLevelFromName(name: string): string {
  const u = name.toUpperCase();
  if (u.includes('125')) return '125';
  if (['AUSTRALIAN OPEN','ROLAND GARROS','WIMBLEDON','US OPEN'].some(g => u.includes(g))) return 'GS';
  if (['DOHA','DUBAI','INDIAN WELLS','MIAMI','MADRID','ROME','TORONTO','CINCINNATI','CHINA OPEN','BEIJING','WUHAN'].some(g => u.includes(g))) return 'PM';
  if (['BRISBANE','ADELAIDE','ABU DHABI','CHARLESTON','LINZ','STUTTGART','STRASBOURG','BERLIN','BAD HOMBURG','QUEENS','EASTBOURNE','SINGAPORE','GUADALAJARA','MONTERREY','WASHINGTON','NINGBO','TOKYO'].some(g => u.includes(g))) return 'P';
  return 'I';
}

function normalizeLevelCode(level: string): string {
  if (level === 'GS') return 'GS';
  if (level === 'WTA1000') return 'PM';
  if (level === 'WTA500') return 'P';
  if (level === 'WTA250') return 'I';
  if (level === 'Finals') return 'FINALS';
  return 'I';
}

function calculatePoints(bestRound: string, isChampion: boolean, level: string): number {
  const table: Record<string, Record<string, number>> = {
    GS: { F_W: 2000, F_L: 1300, S: 780, Q: 430, R16: 240, R32: 130, R64: 70, R128: 10 },
    PM: { F_W: 1000, F_L: 650, S: 390, Q: 215, R16: 120, R32: 65, R64: 10 },
    P: { F_W: 470, F_L: 305, S: 185, Q: 100, R16: 55, R32: 1 },
    I: { F_W: 280, F_L: 180, S: 110, Q: 60, R16: 30, R32: 1 },
    '125': { F_W: 160, F_L: 95, S: 57, Q: 29, R16: 15, R32: 8, R64: 1 },
  };
  const t = table[level];
  if (!t) return 0;
  if (bestRound === 'F') return isChampion ? (t.F_W ?? 0) : (t.F_L ?? 0);
  return t[bestRound] ?? 0;
}

function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    GS: 'Grand Slam', PM: 'WTA 1000', P: 'WTA 500', I: 'WTA 250',
    '125': 'WTA 125', WTA1000: 'WTA 1000', WTA500: 'WTA 500',
    WTA250: 'WTA 250', Finals: 'WTA Finals',
  };
  return labels[level] || level;
}

function getLevelBadgeClass(level: string): string {
  const c: Record<string, string> = {
    GS: 'bg-amber-100 text-amber-800', PM: 'bg-purple-100 text-purple-800',
    P: 'bg-cyan-100 text-cyan-700', I: 'bg-teal-100 text-teal-700',
    '125': 'bg-gray-100 text-gray-600', WTA1000: 'bg-purple-100 text-purple-800',
    WTA500: 'bg-cyan-100 text-cyan-700', WTA250: 'bg-teal-100 text-teal-700',
    Finals: 'bg-rose-100 text-rose-700',
  };
  return c[level] || 'bg-gray-100 text-gray-600';
}

function convertHeightToCm(h: string | null | undefined): number | null {
  if (!h) return null;
  const m = h.match(/(\d+)'\s*(\d+)"?/);
  if (m) return Math.round(parseInt(m[1]) * 30.48 + parseInt(m[2]) * 2.54);
  if (h.includes('cm')) return parseInt(h);
  return null;
}

function convertWeightToKg(w: string | null | undefined): number | null {
  if (!w) return null;
  const m = w.match(/(\d+)\s*lbs?/);
  if (m) return Math.round(parseInt(m[1]) * 0.4536);
  if (w.includes('kg')) return parseInt(w);
  return null;
}

const SURFACE_CN: Record<string, string> = { Hard: '硬地', Clay: '红土', Grass: '草地' };

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

interface Props { player: Player; }

export function PlayerDetailClient({ player }: Props) {
  const { isFollowing, followPlayer, unfollowPlayer, followedPlayers } = useAppStore();
  const { requireAuth } = useRequireAuth();
  const [mounted, setMounted] = useState(false);
  const [shareCard, setShareCard] = useState<ShareCardProps | null>(null);
  const [followConfirm, setFollowConfirm] = useState<'follow' | 'unfollow' | null>(null);
  const [followCelebrate, setFollowCelebrate] = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [schedule, setSchedule] = useState<PlayerScheduleEntry | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  
  // Zustand persistence is only available after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const controller = new AbortController();
    const fallbackSchedule = (playerScheduleData as Record<string, PlayerScheduleEntry>)[player.id] ?? null;

    fetch(`/api/player-stats/${encodeURIComponent(player.id)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<PlayerScheduleEntry>;
      })
      .then(setSchedule)
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Failed to load live player stats, using static fallback:', error);
        setSchedule(fallbackSchedule);
      })
      .finally(() => {
        if (!controller.signal.aborted) setScheduleLoading(false);
      });

    return () => controller.abort();
  }, [player.id]);
  const following = mounted && isFollowing(player.id);

  const handleFollowClick = () => {
    requireAuth(() => {
      if (following) {
        setFollowConfirm('unfollow');
      } else {
        setFollowConfirm('follow');
      }
    });
  };

  const confirmFollow = () => {
    followPlayer(player.id);
    const count = followedPlayers.length + 1;
    setFollowCount(count);
    setFollowConfirm(null);
    setFollowCelebrate(true);
    setTimeout(() => setFollowCelebrate(false), 3000);
  };

  const confirmUnfollow = () => {
    unfollowPlayer(player.id);
    setFollowConfirm(null);
  };



  // Photo URL — prefer torso (half-body), fallback to headshot
  const rawPhoto = player.headshotTorso || player.headshot || '';
  const heroPhoto = rawPhoto
    ? rawPhoto.includes('?') ? rawPhoto.replace(/height=\d+/, 'height=800') : `${rawPhoto}?height=800`
    : '';

  // Schedule data
  const heightCm = convertHeightToCm(player.height);
  const weightKg = convertWeightToKg(player.weight);
  const countryCn = getCountryCn(player.country);
  const flag = getCountryFlag(player.country);
  // 赛季数据只显示当年
  const currentYear = new Date().getFullYear();
  const thisYearResults = schedule ? schedule.results.filter(r => r.startDate && new Date(r.startDate).getFullYear() === currentYear) : [];
  const yearWins = schedule?.thisYearWins ?? 0;
  const yearLosses = schedule?.thisYearLosses ?? 0;
  const thisYearTournaments = schedule?.thisYearTournaments ?? thisYearResults.length;
  const thisYearTitles = schedule?.thisYearTitles ?? thisYearResults.filter(r => r.isChampion).length;
  const winRate = yearWins + yearLosses > 0 ? Math.round((yearWins / (yearWins + yearLosses)) * 100) : null;
  
  const now = new Date();
  const pastResults = schedule ? schedule.results.filter(r => new Date(r.startDate) <= now && new Date(r.startDate).getFullYear() === currentYear) : [];

  // Points breakdown — 使用 live-tennis.cn 的精确数据
  const breakdown = pointsMap[player.id] ?? null;
  const levelOrder = ['Grand Slam', 'WTA Finals', 'WTA 1000', 'WTA 500', 'WTA 250', 'WTA 125'];
  const groupedBreakdown: Record<string, PointsBreakdownEntry[]> = {};
  if (breakdown) {
    for (const e of breakdown.entries) {
      if (!groupedBreakdown[e.level]) groupedBreakdown[e.level] = [];
      groupedBreakdown[e.level].push(e);
    }
  }
  const breakdownTotal = breakdown?.total ?? 0;

  // 冠军积分（Race）：本赛季 results 中有 points 字段的总和
  const racePoints = schedule
    ? schedule.results
        .filter(r => r.startDate && new Date(r.startDate).getFullYear() === currentYear)
        .reduce((sum, r) => sum + (r.points ?? 0), 0)
    : 0;

  // 格式化出生日期
  function formatDob(dob: string | null | undefined): string {
    if (!dob) return '—';
    // Accepts formats like '2000-01-15', '2000/01/15', 'January 15, 2000'
    const d = new Date(dob);
    if (isNaN(d.getTime())) return dob;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  }

  return (
    <div style={{ fontFamily: "var(--font-serif)" }}>
      {/* ══ A. HERO — 左右布局 ══ */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 mb-10">
        {/* 左侧照片 */}
        <div className="md:w-[34%] flex-shrink-0">
          {heroPhoto ? (
            <img
              src={heroPhoto}
              alt={player.displayName}
              className="w-full rounded-2xl object-cover shadow-lg"
              style={{ aspectRatio: '3/4', maxHeight: '420px' }}
            />
          ) : (
            <div
              className="w-full rounded-2xl flex items-center justify-center shadow-lg"
              style={{ aspectRatio: '3/4', maxHeight: '420px', background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)' }}
            >
              <span className="text-7xl font-black text-white/30">{player.firstName?.[0]}{player.lastName?.[0]}</span>
            </div>
          )}
        </div>

        {/* 右侧信息 */}
        <div className="flex-1 flex flex-col justify-center">
          {/* 国旗 + 国家 */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xl leading-none">{flag}</span>
            <span className="text-sm text-gray-400 tracking-wide">{countryCn || player.country}</span>
          </div>

          {/* 中文名 */}
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="font-noto-serif text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight break-words">
              {player.nameCn || player.displayName}
            </h1>
            {/* 关注按钮 */}
            <button
              onClick={handleFollowClick}
              aria-label={following ? '取消关注' : '关注球员'}
              className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-xs transition-all border ${
                following
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-transparent text-gray-400 border-gray-200 hover:text-rose-500 hover:border-rose-200'
              }`}
            >
              <Heart size={18} fill={following ? 'currentColor' : 'none'} strokeWidth={2} />
            </button>
            {/* 分享按钮 */}
            <button
              onClick={() =>
                setShareCard({
                  mode: 'player',
                  onClose: () => setShareCard(null),
                  playerData: {
                    nameCn: player.nameCn || player.displayName,
                    nameEn: player.displayName,
                    rank: player.rank,
                    points: player.points,
                    country: getCountryCn(player.country) || player.country,
                    countryFlag: getCountryFlag(player.country),
                    headshot: player.headshot || '',
                    wins: yearWins,
                    losses: yearLosses,
                    titles: thisYearTitles,
                  },
                })
              }
              aria-label="分享球员卡片"
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-xs font-medium transition-all border bg-transparent text-gray-400 border-gray-200 hover:text-[#2D6A4F] hover:border-[#2D6A4F]/40"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* 英文名 */}
          {player.nameCn && (
            <p className="text-lg text-gray-400 font-light tracking-wide mb-4">{player.displayName}</p>
          )}

          {/* 排名 + 积分 */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-noto-serif text-5xl sm:text-6xl md:text-7xl font-black text-gray-900/8 leading-none">#{player.rank}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">WTA 世界排名</span>
            <span className="text-sm text-gray-300">·</span>
            <span className="text-sm font-medium text-[var(--tennis-green)]">{player.points.toLocaleString()} 积分</span>
          </div>
        </div>
      </div>

      {/* ══ B. 基本信息 — 分隔线风格 ══ */}
      <div className="py-8 border-y border-black/5">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-y-4">
          {[
            { label: '年龄', value: player.age != null ? `${player.age}` : '—', unit: '岁' },
            { label: '身高', value: heightCm != null ? `${heightCm}` : '—', unit: heightCm ? 'cm' : '' },
            { label: '体重', value: weightKg != null ? `${weightKg}` : '—', unit: weightKg ? 'kg' : '' },
            { label: '出生地', value: player.birthPlaceCn || player.birthPlace || '—', unit: '' },
            { label: '出生日期', value: formatDob(player.dateOfBirth), unit: '' },
          ].map((item, idx) => (
            <div
              key={item.label}
              className={`flex flex-col items-center text-center px-3 ${idx > 0 ? 'border-l border-gray-200' : ''}`}
            >
              <span className="font-noto-serif text-[10px] uppercase tracking-[0.25em] text-gray-600 font-light mb-1.5">{item.label}</span>
              <span className="font-noto-serif text-xl font-light tracking-tight text-gray-900">
                {item.value}
                {item.unit && <span className="text-xs font-light text-gray-400 ml-0.5">{item.unit}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ C. 赛季数据 ══ */}
      <div className="py-8 border-b border-black/5">
        {scheduleLoading ? (
          <p className="py-4 text-center text-sm text-gray-400">赛季数据加载中...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4">
          <div className="flex flex-col items-center text-center px-3">
            <span className="font-noto-serif text-[10px] uppercase tracking-[0.25em] text-gray-600 font-light mb-1.5">参赛</span>
            <span className="font-noto-serif text-xl font-light tracking-tight text-gray-900">{schedule ? `${thisYearTournaments} 站` : '—'}</span>
          </div>
          <div className="flex flex-col items-center text-center px-3 border-l border-gray-200">
            <span className="font-noto-serif text-[10px] uppercase tracking-[0.25em] text-gray-600 font-light mb-1.5">战绩</span>
            {schedule ? (
              <span className="font-noto-serif text-xl font-light tracking-tight">
                <span className="text-emerald-600">{yearWins}胜</span>
                <span className="text-gray-300 mx-1">/</span>
                <span className="text-rose-500">{yearLosses}负</span>
              </span>
            ) : <span className="font-noto-serif text-xl font-light text-gray-900">—</span>}
          </div>
          <div className="flex flex-col items-center text-center px-3 md:border-l border-gray-200">
            <span className="font-noto-serif text-[10px] uppercase tracking-[0.25em] text-gray-600 font-light mb-1.5">胜率</span>
            <span className="font-noto-serif text-xl font-light tracking-tight text-gray-900">{winRate != null ? `${winRate}%` : '—'}</span>
          </div>
          <div className="flex flex-col items-center text-center px-3 border-l border-gray-200">
            <span className="font-noto-serif text-[10px] uppercase tracking-[0.25em] text-gray-600 font-light mb-1.5">🏆 冠军</span>
            <span className="font-noto-serif text-xl font-light tracking-tight text-amber-600">{schedule != null ? thisYearTitles : '—'}</span>
          </div>
          </div>
        )}
      </div>

      {/* ══ D. 赛季故事线 ══ */}
      <div className="py-10 border-b border-black/5">
        <h2 className="font-noto-serif text-2xl font-bold text-gray-900 mb-1">{currentYear} 赛季故事线</h2>
        <p className="text-xs text-gray-400 tracking-wide mb-8">本赛季参赛记录</p>

        {scheduleLoading ? (
          <p className="text-sm text-gray-400 py-4">参赛记录加载中...</p>
        ) : pastResults.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">暂无 {currentYear} 赛季参赛记录</p>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
            {pastResults.map((result, idx) => {
              const storedLevel = TOURNAMENT_LEVEL_MAP[result.tournamentId ?? ''] || '';
              const nameCn = TOURNAMENT_NAMECN_MAP[result.tournamentId ?? ''] || TOURNAMENT_NAME_CN[result.name.toUpperCase()] || result.name;
              const nameEn = TOURNAMENT_NAME_MAP[result.tournamentId ?? ''] || result.name;
              const city = TOURNAMENT_CITY_MAP[result.tournamentId ?? ''] || '';
              const surface = TOURNAMENT_SURFACE_MAP[result.tournamentId ?? ''] || '';
              const roundCn = ROUND_CN[result.bestRound] || result.bestRound;
              const isChampion = result.isChampion;
              const displayLevel = storedLevel || inferLevelFromName(result.name);

              return (
                <div key={`${result.tournamentId}-${idx}`} className="relative flex items-start gap-4 py-5 border-b border-black/5 last:border-0">
                  {/* 时间线圆点 */}
                  <div className={`absolute -left-6 top-6 w-2 h-2 rounded-full ${isChampion ? 'bg-amber-400 ring-2 ring-amber-200' : 'bg-gray-300'}`}
                    style={{ transform: 'translateX(-50%)' }} />

                  {/* 赛事信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isChampion && <span className="text-sm">🏆</span>}
                      <span className={`font-semibold text-sm ${isChampion ? 'text-amber-700' : 'text-gray-900'}`}>{nameCn}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getLevelBadgeClass(displayLevel)}`}>
                        {getLevelLabel(displayLevel)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 tracking-wide">
                      {nameEn}{city ? ` · ${city}` : ''}{surface ? ` · ${SURFACE_CN[surface] || surface}` : ''}
                    </p>
                  </div>

                  {/* 轮次 — 右对齐 */}
                  <span className={`flex-shrink-0 text-xs font-semibold whitespace-nowrap ${isChampion ? 'text-amber-600' : 'text-gray-500'}`}>
                    {isChampion ? '冠军' : roundCn}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ E. 积分来源 — 左右双栏表格 ══ */}
      {breakdown && breakdown.entries.length > 0 && (
        <div className="py-10">
          <h2 className="font-noto-serif text-2xl font-bold text-gray-900 mb-2">积分来源</h2>

          {/* 双积分大字 */}
          <div className="flex flex-col items-start gap-4 mb-8 sm:flex-row sm:items-baseline sm:gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-light">世界排名积分</p>
              <p className="font-noto-serif text-3xl font-light tracking-tight text-gray-900 tabular-nums">{breakdownTotal.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">过去 52 周</p>
            </div>
            <div className="border-l border-black/10 pl-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-700 font-light">冠军积分（Race）</p>
              <p className="font-noto-serif text-3xl font-light tracking-tight text-amber-700 tabular-nums">{racePoints.toLocaleString()}</p>
              <p className="text-[10px] text-amber-500/70">{currentYear} 赛季</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* ── 左栏：世界排名积分明细（52周）── */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-3 border-b border-black/5 pb-2">世界排名积分明细</p>
              {levelOrder.map(levelKey => {
                const entries = groupedBreakdown[levelKey];
                if (!entries || entries.length === 0) return null;
                const groupTotal = entries.reduce((s, e) => s + e.points, 0);
                return (
                  <div key={levelKey} className="mb-4">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500">{levelKey}</span>
                      <span className="text-[10px] font-mono text-gray-400">{groupTotal.toLocaleString()}</span>
                    </div>
                    {entries.map((entry, idx) => {
                      const isChampion = entry.round === 'W';
                      const yearPrefix = entry.name.match(/^(\d+['’])/) ? entry.name.match(/^(\d+['’])/)?.[1] + ' ' : '';
                      const rawName = entry.name.replace(/^\d+['’]\s*/, '');
                      const cnName = TOURNAMENT_NAME_CN[rawName.toUpperCase()] || rawName;
                      const displayName = yearPrefix + cnName;
                      const displayNameEn = rawName;
                      const roundLabel = entry.round === 'W' ? '冠军' : entry.round === 'F' ? '亚军' : entry.round === 'SF' ? '半决赛' : entry.round === 'QF' ? '1/4决赛' : entry.round;
                      return (
                        <div key={idx} className={`flex items-center justify-between py-2 border-b border-black/5 ${isChampion ? 'bg-amber-50/30' : ''}`}>
                          <div className="min-w-0 flex-1">
                            <span className={`text-sm ${isChampion ? 'font-medium text-amber-800' : 'text-gray-700'}`}>
                              {isChampion ? '🏆 ' : ''}{displayName}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-1.5">{displayNameEn}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-gray-400 w-14 text-center">{roundLabel}</span>
                            <span className="font-mono text-sm text-[var(--tennis-green)] font-medium tabular-nums w-12 text-right">+{entry.points}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div className="flex items-center justify-between py-3 border-t-2 border-gray-300">
                <span className="text-sm font-bold text-gray-900">合计</span>
                <span className="font-mono font-bold text-gray-900 tabular-nums">{breakdownTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* ── 右栏：冠军积分明细（2026 Race）── */}
            <div>
              <p className="text-xs font-medium text-amber-700/70 mb-3 border-b border-amber-200/50 pb-2">冠军积分明细（2026）</p>
              {(() => {
                const raceEntries = schedule
                  ? schedule.results
                      .filter((r) => r.startDate && new Date(r.startDate).getFullYear() === 2026 && (r.points ?? 0) > 0)
                      .sort((a, b) => new Date(a.startDate ?? "").getTime() - new Date(b.startDate ?? "").getTime())
                  : [];
                if (raceEntries.length === 0) {
                  return <p className="text-sm text-gray-400 py-4">暂无 2026 赛季积分记录</p>;
                }
                return (
                  <>
                    {raceEntries.map((r, idx) => {
                      const displayName = TOURNAMENT_NAMECN_MAP[r.tournamentId ?? ''] || TOURNAMENT_NAME_CN[r.name.toUpperCase()] || r.name;
                      const roundLabel = r.isChampion ? '冠军' : r.bestRound === 'F' ? '亚军' : r.bestRound === 'S' ? '半决赛' : r.bestRound === 'Q' ? '1/4决赛' : ROUND_CN[r.bestRound] || r.bestRound;
                      return (
                        <div key={idx} className={`flex items-center justify-between py-2 border-b border-black/5 ${r.isChampion ? 'bg-amber-50/30' : ''}`}>
                          <span className={`text-sm ${r.isChampion ? 'font-medium text-amber-800' : 'text-gray-700'}`}>
                            {r.isChampion ? '🏆 ' : ''}{displayName}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-gray-400 w-14 text-center">{roundLabel}</span>
                            <span className="font-mono text-sm text-amber-600 font-medium tabular-nums w-12 text-right">+{r.points}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between py-3 border-t-2 border-amber-300/50">
                      <span className="text-sm font-bold text-amber-800">合计</span>
                      <span className="font-mono font-bold text-amber-800 tabular-nums">{racePoints.toLocaleString()}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Share card overlay */}
      {/* 关注确认弹窗 */}
      {followConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setFollowConfirm(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full mx-4 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            {followConfirm === 'follow' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                  <Heart size={28} className="text-rose-500" />
                </div>
                <h3 className="font-noto-serif text-lg font-bold text-gray-900 mb-2">关注 {player.nameCn || player.displayName}</h3>
                <p className="text-sm text-gray-500 mb-6">将追踪她的赛季征程和比赛动态</p>
                <div className="flex gap-3">
                  <button onClick={() => setFollowConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">取消</button>
                  <button onClick={confirmFollow} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">❤️ 关注</button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Heart size={28} className="text-gray-400" />
                </div>
                <h3 className="font-noto-serif text-lg font-bold text-gray-900 mb-2">取消关注</h3>
                <p className="text-sm text-gray-500 mb-6">确定不再关注 {player.nameCn || player.displayName} 吗？</p>
                <div className="flex gap-3">
                  <button onClick={() => setFollowConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">再想想</button>
                  <button onClick={confirmUnfollow} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 transition-colors">取消关注</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 关注成功庆祝 */}
      {followCelebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }} onClick={() => setFollowCelebrate(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full mx-4 text-center shadow-2xl animate-bounce-in" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-4">❤️</div>
            <h3 className="font-noto-serif text-xl font-bold text-gray-900 mb-2">关注成功</h3>
            <p className="text-base font-medium text-rose-500 mb-1">{player.nameCn || player.displayName}</p>
            <p className="text-sm text-gray-400">这是你关注的第 {followCount} 位球员</p>
          </div>
        </div>
      )}

      {shareCard && <ShareCard {...shareCard} />}
    </div>
  );
}
