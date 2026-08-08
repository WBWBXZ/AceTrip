'use client';

import { useState, useMemo, } from 'react';
import Link from 'next/link';
import type { Tournament, BucketListItem } from '@/types';
import { useAppStore } from '@/lib/store';
import { formatDateRange, getCountryFlag, LEVEL_LABELS } from '@/lib/data';
import {
  Heart, Check, Trash2, MapPin, Calendar, Plane, Globe, Trophy,
  Star, ChevronDown, ChevronUp, BookOpen, BarChart2, Route,
  Stamp, Award, ArrowRight, Sun, Leaf, Snowflake, Wind, X, PartyPopper,
  Share2,
} from 'lucide-react';
import { ShareCard } from '@/components/share/ShareCard';
import type { ShareCardProps } from '@/components/share/ShareCard';
import { useEffect, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const LEVEL_BADGE: Record<string, string> = {
  GS: 'badge-gs',
  WTA1000: 'badge-wta1000',
  WTA500: 'badge-wta500',
  Finals: 'badge-finals',
};

const LEVEL_STRIP: Record<string, string> = {
  GS: '#F59E0B',
  WTA1000: '#7C3AED',
  WTA500: '#3B82F6',
  WTA250: '#14B8A6',
  Finals: '#F43F5E',
};

const SURFACE_CN: Record<string, string> = {
  Hard: '硬地',
  Clay: '红土',
  Grass: '草地',
};

// Continents / regions for "亚洲" detection
const ASIA_COUNTRY_CODES = new Set([
  'CHN', 'JPN', 'KOR', 'THA', 'SGP', 'INA', 'PHI', 'QAT', 'UAE', 'TPE',
]);

const SLAM_IDS_KEYWORDS = ['australian-open', 'roland-garros', 'wimbledon', 'us-open'];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getStatus(t: Tournament): 'upcoming' | 'ongoing' | 'completed' {
  const now = new Date();
  if (now < new Date(t.dateStart)) return 'upcoming';
  if (now <= new Date(t.dateEnd)) return 'ongoing';
  return 'completed';
}

function getSeasonHint(month: number): { label: string; icon: React.ReactNode; color: string } {
  if (month >= 1 && month <= 3) return { label: '温暖季节', icon: <Sun size={12} />, color: 'text-amber-500' };
  if (month >= 4 && month <= 6) return { label: '春季舒适', icon: <Leaf size={12} />, color: 'text-green-600' };
  if (month >= 7 && month <= 9) return { label: '夏日热情', icon: <Wind size={12} />, color: 'text-orange-500' };
  return { label: '秋高气爽', icon: <Snowflake size={12} />, color: 'text-blue-400' };
}

function getTournamentAbbr(name: string): string {
  const cn = name.replace(/[\u4e00-\u9fff]/g, '');
  const parts = (name.match(/[\u4e00-\u9fff]+/g) || name.split(/\s+/));
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value?: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            size={16}
            className={
              n <= (hover || value || 0)
                ? 'fill-amber-400 text-amber-400'
                : 'text-black/15'
            }
          />
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section A — 网球旅行护照
// ─────────────────────────────────────────────────────────────

interface PassportProps {
  completedItems: Array<BucketListItem & { tournament: Tournament }>;
  totalItems: number;
  onSharePassport: () => void;
  onShareSeason: () => void;
}

const ACHIEVEMENTS = [
  {
    id: 'first1',
    emoji: '🌟',
    title: '首站打卡',
    desc: '打卡第一个赛事',
    check: (items: Array<BucketListItem & { tournament: Tournament }>) =>
      items.length >= 1,
  },
  {
    id: 'slam1',
    emoji: '🏆',
    title: '大满贯探索者',
    desc: '打卡任意 1 个大满贯',
    check: (items: Array<BucketListItem & { tournament: Tournament }>) =>
      items.some((b) => b.tournament.level === 'GS'),
  },
  {
    id: 'slam4',
    emoji: '👑',
    title: '大满贯全满贯',
    desc: '打卡全部 4 个大满贯',
    check: (items: Array<BucketListItem & { tournament: Tournament }>) => {
      const slamIds = new Set(items.filter(b => b.tournament.level === 'GS').map(b => b.tournament.id));
      return ['australian-open', 'roland-garros', 'wimbledon', 'us-open'].every(id => slamIds.has(id));
    },
  },
  {
    id: 'clay2',
    emoji: '🎾',
    title: '红土赛季',
    desc: '打卡 2 个红土赛事',
    check: (items: Array<BucketListItem & { tournament: Tournament }>) =>
      items.filter((b) => b.tournament.surface === 'Clay').length >= 2,
  },
  {
    id: 'grass1',
    emoji: '🌿',
    title: '草地赛季',
    desc: '打卡任意 1 个草地赛事',
    check: (items: Array<BucketListItem & { tournament: Tournament }>) =>
      items.some(b => b.tournament.surface === 'Grass'),
  },
  {
    id: 'asia3',
    emoji: '🌏',
    title: '亚洲赛季',
    desc: '打卡 3 个亚洲赛事',
    check: (items: Array<BucketListItem & { tournament: Tournament }>) =>
      items.filter((b) => ASIA_COUNTRY_CODES.has(b.tournament.country)).length >= 3,
  },
  {
    id: 'china3',
    emoji: '🇨🇳',
    title: '主场应援',
    desc: '打卡 3 个中国赛事',
    check: (items: Array<BucketListItem & { tournament: Tournament }>) =>
      items.filter(b => b.tournament.country === 'CHN').length >= 3,
  },
  {
    id: 'globe5',
    emoji: '✈️',
    title: '环球旅人',
    desc: '打卡 5 个不同国家',
    check: (items: Array<BucketListItem & { tournament: Tournament }>) =>
      new Set(items.map((b) => b.tournament.country)).size >= 5,
  },
  {
    id: 'ten10',
    emoji: '🔥',
    title: '赛季达人',
    desc: '打卡 10 站以上',
    check: (items: Array<BucketListItem & { tournament: Tournament }>) =>
      items.length >= 10,
  },
];

function PassportSection({ completedItems, totalItems, onSharePassport, onShareSeason }: PassportProps) {
  const countries = new Set(completedItems.map((b) => b.tournament.country));

  return (
    <div
      className="rounded-3xl overflow-hidden mb-8"
      style={{ background: 'linear-gradient(135deg, #1a3d2b 0%, #2D6A4F 50%, #1a3d2b 100%)' }}
    >
      {/* Passport header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-amber-300/80 mb-1 uppercase">Tennis Passport</p>
            <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-serif)" }}>我的网球护照</h2>
            <p className="text-[11px] text-white/40 mt-1">每一枚印章，都是一段故事</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSharePassport}
              className="w-12 h-12 rounded-full border border-amber-400/40 flex items-center justify-center hover:bg-amber-400/10 transition-colors"
              style={{ background: 'rgba(212,175,55,0.08)' }}
              title="分享护照"
            >
              <Share2 size={20} className="text-amber-400" />
            </button>
            <div
              className="w-12 h-12 rounded-full border-2 border-amber-400/60 flex items-center justify-center"
              style={{ background: 'rgba(212,175,55,0.15)' }}
            >
              <Globe size={20} className="text-amber-400" />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{completedItems.length}</div>
            <div className="text-[10px] text-white/50 mt-0.5">已打卡</div>
          </div>
          <div className="w-px h-8 bg-white/15" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalItems}</div>
            <div className="text-[10px] text-white/50 mt-0.5">心愿站</div>
          </div>
          <div className="w-px h-8 bg-white/15" />
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{countries.size}</div>
            <div className="text-[10px] text-white/50 mt-0.5">个国家</div>
          </div>
        </div>
      </div>

      {/* Stamp wall */}
      {completedItems.length > 0 && (
        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-[10px] tracking-widest text-white/40 uppercase mb-3">足迹印章</p>
          <div className="flex flex-wrap gap-3">
            {completedItems.map((b) => {
              const t = b.tournament;
              const abbr = getTournamentAbbr(t.nameCn || t.name);
              const month = new Date(t.dateStart).getMonth() + 1;
              return (
                <div
                  key={b.tournamentId}
                  className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-amber-400/50 text-center"
                  style={{ background: 'rgba(212,175,55,0.08)' }}
                >
                  <span className="text-[11px] font-bold text-amber-400 leading-tight">{abbr}</span>
                  <span className="text-[8px] text-white/50 leading-tight mt-0.5">
                    {t.cityCn || t.city}
                  </span>
                  <span className="text-[8px] text-white/40 leading-tight">{new Date(t.dateStart).getFullYear()}.{month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="px-6 py-4">
        <p className="text-[10px] tracking-widest text-white/40 uppercase mb-3">成就徽章 · {ACHIEVEMENTS.filter(a => a.check(completedItems)).length}/{ACHIEVEMENTS.length} 已解锁</p>
        <div className="grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = ach.check(completedItems);
            return (
              <div
                key={ach.id}
                className={`rounded-xl px-3 py-2.5 transition-all ${
                  unlocked
                    ? 'bg-amber-400/20 border border-amber-400/40'
                    : 'bg-white/5 border border-white/10 opacity-50 grayscale'
                }`}
              >
                <div className="text-lg mb-1">{ach.emoji}</div>
                <div className={`text-[11px] font-semibold ${unlocked ? 'text-amber-300' : 'text-white/50'}`}>
                  {ach.title}
                </div>
                <div className="text-[9px] text-white/40 mt-0.5">{ach.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Season summary button */}
        <button
          onClick={onShareSeason}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-400/30 text-amber-300 text-sm font-medium hover:bg-amber-400/10 transition-colors"
        >
          <Share2 size={14} />
          生成赛季总结
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section B — Enhanced Bucket Card
// ─────────────────────────────────────────────────────────────

function BucketCard({
  item,
  tournament,
  onToggle,
  onRemove,
  onSaveDiary,
  onRate,
}: {
  item: BucketListItem;
  tournament: Tournament;
  onToggle: () => void;
  onRemove: () => void;
  onSaveDiary: (text: string) => void;
  onRate: (stars: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [diaryText, setDiaryText] = useState(item.diary || '');
  const [diaryDirty, setDiaryDirty] = useState(false);

  const status = getStatus(tournament);
  const daysUntil = getDaysUntil(tournament.dateStart);
  const completed = item.completed;

  function handleDiaryChange(v: string) {
    setDiaryText(v);
    setDiaryDirty(v !== (item.diary || ''));
  }

  function handleSaveDiary() {
    onSaveDiary(diaryText);
    setDiaryDirty(false);
  }

  return (
    <div className={`card-flat overflow-hidden transition-all ${completed ? 'opacity-80' : ''}`}>
      {/* Color strip */}
      <div className="h-1" style={{ background: LEVEL_STRIP[tournament.level] || '#94a3b8' }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Check button */}
          <button
            onClick={onToggle}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
              completed
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-black/20 hover:border-[#2D6A4F] hover:bg-[#2D6A4F]/5'
            }`}
          >
            {completed && <Check size={14} />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`badge text-[10px] ${LEVEL_BADGE[tournament.level] || ''}`}>
                {LEVEL_LABELS[tournament.level]}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 text-[var(--text-secondary)]">
                {SURFACE_CN[tournament.surface] || tournament.surface}
                {tournament.indoor ? ' · 室内' : ''}
              </span>
              {status === 'ongoing' && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  进行中
                </span>
              )}
            </div>

            {/* Title */}
            <Link href={`/tournaments/${tournament.id}`}>
              <h3 className={`text-base font-semibold hover:text-[#2D6A4F] transition-colors ${completed ? 'line-through' : ''}`}>
                {tournament.nameCn || tournament.name}
              </h3>
              {tournament.nameCn && (
                <p className="text-[11px] text-[var(--text-muted)]">{tournament.name}</p>
              )}
            </Link>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {tournament.cityCn || tournament.city}, {tournament.countryCn || tournament.countryName}
                <span>{getCountryFlag(tournament.country)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {formatDateRange(tournament.dateStart, tournament.dateEnd)}
              </span>
            </div>

            {/* Countdown / winner */}
            <div className="mt-2 flex items-center gap-3">
              {status === 'upcoming' && daysUntil > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2D6A4F]/8 text-[#2D6A4F] text-[11px] font-medium">
                  <Plane size={11} />
                  还有 {daysUntil} 天开赛
                </span>
              )}
              {status === 'completed' && tournament.winner && (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                  <Trophy size={12} className="text-amber-500" />
                  冠军：{tournament.winner.nameCn || tournament.winner.name}
                </span>
              )}
              {completed && item.rating && (
                <StarRating value={item.rating} readonly />
              )}
            </div>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[#2D6A4F] transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? '收起详情' : '展开详情'}
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={onRemove}
            className="text-[var(--text-muted)] hover:text-rose-500 transition-colors flex-shrink-0 p-1"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pl-10 space-y-4 border-t border-black/5 pt-4">
            {/* Extra info */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {tournament.venue && (
                <div>
                  <span className="text-[var(--text-muted)]">场馆</span>
                  <div className="font-medium mt-0.5">{tournament.venue}</div>
                </div>
              )}
              {tournament.prizeMoney && (
                <div>
                  <span className="text-[var(--text-muted)]">奖金</span>
                  <div className="font-medium mt-0.5">{tournament.prizeMoney}</div>
                </div>
              )}
              <div>
                <span className="text-[var(--text-muted)]">签表</span>
                <div className="font-medium mt-0.5">{tournament.drawSize} 人</div>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">时区</span>
                <div className="font-medium mt-0.5">{tournament.timezone}</div>
              </div>
            </div>

            {/* Diary & rating — only after check-in */}
            {completed && (
              <div className="space-y-3">
                {/* Star rating */}
                <div>
                  <p className="text-[11px] text-[var(--text-muted)] mb-1.5">观赛评分</p>
                  <StarRating
                    value={item.rating}
                    onChange={(v) => onRate(v)}
                  />
                </div>

                {/* Diary */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <BookOpen size={12} className="text-[var(--text-muted)]" />
                    <p className="text-[11px] text-[var(--text-muted)]">观赛日记</p>
                    {item.diaryDate && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        · {new Date(item.diaryDate).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={diaryDirty ? diaryText : (item.diary || '')}
                    onChange={(e) => handleDiaryChange(e.target.value)}
                    placeholder="记录你的观赛感受、精彩瞬间……"
                    className="w-full text-sm rounded-xl border border-black/10 bg-black/2 px-3 py-2.5 resize-none focus:outline-none focus:border-[#2D6A4F]/50 transition-colors min-h-[80px] placeholder:text-[var(--text-muted)]"
                    rows={3}
                  />
                  {diaryDirty && (
                    <button
                      onClick={handleSaveDiary}
                      className="mt-1.5 text-[11px] font-medium text-[#2D6A4F] hover:underline"
                    >
                      保存日记
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section C — 赛事对比器
// ─────────────────────────────────────────────────────────────

function TournamentComparator({
  tournaments,
}: {
  tournaments: Tournament[];
}) {
  const [open, setOpen] = useState(false);
  const [selA, setSelA] = useState('');
  const [selB, setSelB] = useState('');

  const tA = tournaments.find((t) => t.id === selA);
  const tB = tournaments.find((t) => t.id === selB);

  const rows = [
    { label: '赛事级别', fn: (t: Tournament) => LEVEL_LABELS[t.level] },
    { label: '奖金', fn: (t: Tournament) => t.prizeMoney || '—' },
    { label: '签表大小', fn: (t: Tournament) => `${t.drawSize} 人` },
    { label: '场地类型', fn: (t: Tournament) => `${SURFACE_CN[t.surface] || t.surface}${t.indoor ? ' (室内)' : ''}` },
    { label: '城市', fn: (t: Tournament) => t.cityCn || t.city },
    { label: '国家', fn: (t: Tournament) => `${t.countryCn || t.countryName} ${getCountryFlag(t.country)}` },
    { label: '时区', fn: (t: Tournament) => t.timezone },
    { label: '赛事日期', fn: (t: Tournament) => formatDateRange(t.dateStart, t.dateEnd) },
    { label: '冠军', fn: (t: Tournament) => t.winner ? (t.winner.nameCn || t.winner.name) : '—' },
  ];

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
        style={{ background: '#2D6A4F' }}
      >
        <BarChart2 size={16} />
        对比赛事
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="card-flat mt-4 p-5">
          <h3 className="text-sm font-semibold mb-4">选择两场赛事进行对比</h3>

          <div className="grid grid-cols-2 gap-4 mb-5">
            {[
              { label: '赛事 A', value: selA, set: setSelA, exclude: selB },
              { label: '赛事 B', value: selB, set: setSelB, exclude: selA },
            ].map(({ label, value, set, exclude }) => (
              <div key={label}>
                <p className="text-[11px] text-[var(--text-muted)] mb-1">{label}</p>
                <select
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full text-sm rounded-xl border border-black/10 bg-white px-3 py-2 focus:outline-none focus:border-[#2D6A4F]/50"
                >
                  <option value="">— 请选择 —</option>
                  {tournaments
                    .filter((t) => t.id !== exclude)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameCn || t.name}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>

          {tA && tB && (
            <div className="overflow-x-auto rounded-xl border border-black/8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8">
                    <th className="text-left px-4 py-3 text-[11px] text-[var(--text-muted)] font-medium w-1/4">维度</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold" style={{ color: '#2D6A4F' }}>
                      {tA.nameCn || tA.name}
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-purple-600">
                      {tB.nameCn || tB.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? 'bg-black/2' : ''}>
                      <td className="px-4 py-2.5 text-[11px] text-[var(--text-muted)] font-medium">{row.label}</td>
                      <td className="px-4 py-2.5 text-xs">{row.fn(tA)}</td>
                      <td className="px-4 py-2.5 text-xs">{row.fn(tB)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section D — 智能路线规划
// ─────────────────────────────────────────────────────────────

interface RouteNode {
  tournament: Tournament;
  gapDays: number | null; // gap to NEXT node, null for last
}

function buildRoutes(tournaments: Tournament[]): RouteNode[][] {
  // Sort by date
  const sorted = [...tournaments].sort(
    (a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime()
  );

  const routes: RouteNode[][] = [];
  let current: RouteNode[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const next = sorted[i + 1];
    const gap = next
      ? Math.floor(
          (new Date(next.dateStart).getTime() - new Date(t.dateEnd).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    current.push({ tournament: t, gapDays: gap });

    const shouldBreak = gap === null || gap >= 14;
    if (shouldBreak) {
      if (current.length >= 2) routes.push(current);
      current = [];
    }
  }

  return routes;
}

function RouteTimeline({ routes }: { routes: RouteNode[][] }) {
  if (routes.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Route size={18} style={{ color: '#2D6A4F' }} />
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)" }}>旅程规划</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)] tracking-wide mb-4 ml-[26px]" style={{ fontFamily: "var(--font-serif)" }}>
        顺路的比赛，不如一起看
      </p>

      <div className="space-y-4">
        {routes.map((route, ri) => {
          const countries = new Set(route.map((n) => n.tournament.country)).size;
          return (
            <div key={ri} className="card-flat p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: '#2D6A4F' }}>
                  路线 {ri + 1}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {route.length} 站 · {countries} 国
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {route.map((node, ni) => {
                  const month = new Date(node.tournament.dateStart).getMonth() + 1;
                  const season = getSeasonHint(month);
                  return (
                    <div key={node.tournament.id} className="flex items-center gap-2">
                      {/* Node card */}
                      <div className="flex flex-col items-center text-center min-w-[88px] rounded-2xl bg-black/3 px-3 py-2.5">
                        <span className="text-[10px] text-[var(--text-muted)] leading-tight">
                          {formatDateRange(node.tournament.dateStart, node.tournament.dateEnd)}
                        </span>
                        <span className="text-[12px] font-semibold leading-tight mt-0.5">
                          {node.tournament.nameCn || node.tournament.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] leading-tight mt-0.5">
                          {node.tournament.cityCn || node.tournament.city}
                        </span>
                        <span className={`flex items-center gap-0.5 text-[9px] mt-1 ${season.color}`}>
                          {season.icon}
                          {season.label}
                        </span>
                      </div>

                      {/* Arrow + gap */}
                      {node.gapDays !== null && (
                        <div className="flex flex-col items-center gap-0.5">
                          <ArrowRight size={14} className="text-[var(--text-muted)]" />
                          <span className="text-[9px] text-[var(--text-muted)] whitespace-nowrap">
                            间隔 {node.gapDays} 天
                          </span>
                        </div>
                      )}
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

// ─────────────────────────────────────────────────────────────
// Confetti animation component
// ─────────────────────────────────────────────────────────────

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#F59E0B', '#2D6A4F', '#7C3AED', '#3B82F6', '#F43F5E', '#14B8A6', '#FFD700'];
    const particles: Array<{
      x: number; y: number; w: number; h: number;
      color: string; vx: number; vy: number; rot: number; vrot: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height * 0.5,
        w: 4 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.15,
        opacity: 1,
      });
    }

    let frame = 0;
    const maxFrames = 150;

    function animate() {
      if (!ctx || !canvas) return;
      frame++;
      if (frame > maxFrames) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.vy += 0.08;
        if (frame > maxFrames * 0.6) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Check-in confirmation modal
// ─────────────────────────────────────────────────────────────

interface CheckInModalProps {
  tournament: Tournament;
  onConfirm: () => void;
  onCancel: () => void;
}

function CheckInModal({ tournament, onConfirm, onCancel }: CheckInModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
            <Check size={28} className="text-white" />
          </div>

          <h3 className="text-xl font-bold mb-1">确认打卡</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            {tournament.nameCn || tournament.name}
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            📍 {tournament.cityCn || tournament.city}, {tournament.countryCn || tournament.countryName}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[var(--text-secondary)] hover:bg-black/4 transition-colors"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
            >
              🎾 打卡！
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Celebration overlay
// ─────────────────────────────────────────────────────────────

interface CelebrationData {
  tournament: Tournament;
  newAchievements: string[];
}

function CelebrationOverlay({ data, onClose, onShare }: { data: CelebrationData; onClose: () => void; onShare: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const hasNewAchievement = data.newAchievements.length > 0;

  return (
    <>
      <Confetti />
      <div className="fixed inset-0 z-[95] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="text-center animate-in zoom-in-50 duration-500 max-w-sm">
          {/* Main celebration card */}
          <div className="bg-white rounded-3xl py-10 px-10 shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">打卡成功</h2>
            <p className="text-base font-semibold text-[#2D6A4F] text-center mb-1">
              {data.tournament.nameCn || data.tournament.name}
            </p>
            <p className="text-sm text-gray-500 text-center">
              {data.tournament.cityCn || data.tournament.city}，{data.tournament.countryCn || data.tournament.countryName}
            </p>

            {/* New achievements */}
            {hasNewAchievement && (
              <div className="mt-5 pt-5 border-t border-black/8">
                <p className="text-xs text-gray-400 mb-3">🎊 新成就解锁</p>
                <div className="space-y-2">
                  {data.newAchievements.map(ach => (
                    <div
                      key={ach}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-amber-700 animate-bounce"
                      style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}
                    >
                      <Award size={16} />
                      {ach}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share check-in button */}
            <button
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
            >
              <Share2 size={14} />
              分享打卡
            </button>
          </div>

          <p className="text-xs text-white/70 mt-4">点击任意位置关闭</p>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────

interface Props {
  tournaments: Tournament[];
}

export function BucketListClient({ tournaments }: Props) {
  const { bucketList, toggleBucketItem, removeFromBucketList, updateBucketDiary, updateBucketRating } =
    useAppStore();

  const [checkInTarget, setCheckInTarget] = useState<Tournament | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [shareCard, setShareCard] = useState<ShareCardProps | null>(null);

  // Enrich bucket items with tournament data
  const bucketItems = useMemo(
    () =>
      bucketList
        .map((b) => ({ ...b, tournament: tournaments.find((t) => t.id === b.tournamentId) }))
        .filter((b): b is BucketListItem & { tournament: Tournament } => !!b.tournament),
    [bucketList, tournaments]
  );

  const completedItems = bucketItems.filter((b) => b.completed);
  const pendingItems = bucketItems.filter((b) => !b.completed);

  // Check what achievements are currently unlocked
  const getUnlockedAchievements = useCallback((items: Array<BucketListItem & { tournament: Tournament }>) => {
    return ACHIEVEMENTS.filter(a => a.check(items)).map(a => a.title);
  }, []);

  // Handle toggle with confirmation
  const handleToggleRequest = useCallback((tournament: Tournament, isCurrentlyCompleted: boolean) => {
    if (isCurrentlyCompleted) {
      // Un-check-in: no confirmation needed
      toggleBucketItem(tournament.id);
    } else {
      // Check-in: show confirmation modal
      setCheckInTarget(tournament);
    }
  }, [toggleBucketItem]);

  const handleCheckInConfirm = useCallback(() => {
    if (!checkInTarget) return;

    // Check achievements before
    const achievementsBefore = getUnlockedAchievements(completedItems);

    // Perform check-in
    toggleBucketItem(checkInTarget.id);
    setCheckInTarget(null);

    // Check achievements after (simulate by adding this tournament)
    const simulatedCompleted = [
      ...completedItems,
      { tournamentId: checkInTarget.id, addedAt: '', completed: true, tournament: checkInTarget }
    ];
    const achievementsAfter = getUnlockedAchievements(simulatedCompleted);
    const newAchievements = achievementsAfter.filter(a => !achievementsBefore.includes(a));

    // Show celebration
    setCelebration({ tournament: checkInTarget, newAchievements });
  }, [checkInTarget, completedItems, toggleBucketItem, getUnlockedAchievements]);

  const handleCheckInCancel = useCallback(() => {
    setCheckInTarget(null);
  }, []);

  const handleCelebrationClose = useCallback(() => {
    setCelebration(null);
  }, []);

  // ── Share handlers ──
  const handleSharePassport = useCallback(() => {
    const unlockedAchievements = ACHIEVEMENTS.filter(a => a.check(completedItems));
    setShareCard({
      mode: 'passport',
      onClose: () => setShareCard(null),
      passportData: {
        completedCount: completedItems.length,
        pendingCount: pendingItems.length,
        countries: new Set(completedItems.map(b => b.tournament.country)).size,
        achievements: unlockedAchievements.map(a => ({ emoji: a.emoji, name: a.title, unlocked: true })),
        stamps: completedItems.map(b => ({
          name: (b.tournament.nameCn || b.tournament.name).slice(0, 4),
          city: b.tournament.cityCn || b.tournament.city,
          yearMonth: `${new Date(b.tournament.dateStart).getFullYear()}.${new Date(b.tournament.dateStart).getMonth() + 1}`,
        })),
      },
    });
  }, [completedItems, pendingItems]);

  const handleShareCheckin = useCallback((tournament: Tournament) => {
    setShareCard({
      mode: 'checkin',
      onClose: () => setShareCard(null),
      checkinData: {
        tournamentName: tournament.nameCn || tournament.name,
        city: tournament.cityCn || tournament.city,
        country: tournament.countryCn || tournament.countryName,
        date: new Date(tournament.dateStart).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
        level: tournament.level,
        surface: tournament.surface,
      },
    });
  }, []);

  const handleShareSeason = useCallback(() => {
    const unlockedAchievements = ACHIEVEMENTS.filter(a => a.check(completedItems));
    setShareCard({
      mode: 'season',
      onClose: () => setShareCard(null),
      seasonData: {
        totalCheckins: completedItems.length,
        countries: new Set(completedItems.map(b => b.tournament.country)).size,
        favoritePlayer: '',
        achievements: unlockedAchievements.map(a => ({ emoji: a.emoji, name: a.title })),
      },
    });
  }, [completedItems]);

  if (bucketItems.length === 0) {
    return (
      <div className="container-tight pb-12">
        <div className="card-flat p-12 text-center">
          <Heart size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold mb-2">心愿单还是空的</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-6">
            浏览赛事，把你想去的赛事加入心愿单，开始规划你的网球旅行。
          </p>
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium"
            style={{ background: '#2D6A4F' }}
          >
            探索赛事
          </Link>
        </div>
      </div>
    );
  }

  // Routes for section D
  const routes = buildRoutes(bucketItems.map((b) => b.tournament));

  return (
    <div className="container-tight pb-16">
      {/* Check-in confirmation modal */}
      {checkInTarget && (
        <CheckInModal
          tournament={checkInTarget}
          onConfirm={handleCheckInConfirm}
          onCancel={handleCheckInCancel}
        />
      )}

      {/* Celebration overlay */}
      {celebration && (
        <CelebrationOverlay
          data={celebration}
          onClose={handleCelebrationClose}
          onShare={() => { handleCelebrationClose(); handleShareCheckin(celebration.tournament); }}
        />
      )}

      {/* Share card overlay */}
      {shareCard && <ShareCard {...shareCard} />}

      {/* ─── Section A: 网球旅行护照 ─── */}
      <PassportSection
        completedItems={completedItems}
        totalItems={bucketItems.length}
        onSharePassport={handleSharePassport}
        onShareSeason={handleShareSeason}
      />

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">打卡进度</span>
          <span className="text-sm text-[var(--text-muted)]">
            {completedItems.length} / {bucketItems.length}
          </span>
        </div>
        <div className="h-2 bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(completedItems.length / bucketItems.length) * 100}%`,
              background: '#2D6A4F',
            }}
          />
        </div>
      </div>

      {/* ─── Section D: 智能路线 (before list so it's visible without scrolling far) ─── */}
      <RouteTimeline routes={routes} />

      {/* ─── Section B: 心愿赛事列表 ─── */}
      {pendingItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-serif)" }}>🎯 想去</h2>
          <div className="space-y-3">
            {pendingItems.map((b) => (
              <BucketCard
                key={b.tournamentId}
                item={b}
                tournament={b.tournament}
                onToggle={() => handleToggleRequest(b.tournament, b.completed)}
                onRemove={() => removeFromBucketList(b.tournamentId)}
                onSaveDiary={(text) => updateBucketDiary(b.tournamentId, text)}
                onRate={(stars) => updateBucketRating(b.tournamentId, stars)}
              />
            ))}
          </div>
        </div>
      )}

      {completedItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-serif)" }}>✅ 去过了</h2>
          <div className="space-y-3">
            {completedItems.map((b) => (
              <BucketCard
                key={b.tournamentId}
                item={b}
                tournament={b.tournament}
                onToggle={() => handleToggleRequest(b.tournament, b.completed)}
                onRemove={() => removeFromBucketList(b.tournamentId)}
                onSaveDiary={(text) => updateBucketDiary(b.tournamentId, text)}
                onRate={(stars) => updateBucketRating(b.tournamentId, stars)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Section C: 赛事对比器 ─── */}
      <TournamentComparator tournaments={bucketItems.map((b) => b.tournament)} />
    </div>
  );
}
