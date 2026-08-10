import { getTopPlayersWithLiveRankings, getUpcomingTournaments, getTournamentsWithStatus, getCountryFlag, LEVEL_LABELS, formatDateRange } from '@/lib/data';
import { SeasonTimeline } from '@/components/tournaments/SeasonTimeline';
import Link from 'next/link';
import GlobeLoader from '@/components/ui/GlobeLoader';
import DailyFeed from '@/components/ui/DailyFeed';
import { Heart, MapPin, Trophy, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export default async function HomePage() {
  const topPlayers = await getTopPlayersWithLiveRankings(20);
  const upcoming = getUpcomingTournaments().slice(0, 4);
  const allTournaments = getTournamentsWithStatus();
  const ongoing = allTournaments.find(t => t.status === 'ongoing');
  const grandSlams = allTournaments.filter(t => t.level === 'GS');

  return (
    <div className="animate-fade-in">
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden border-b border-[var(--tennis-green-dark)]/10" style={{ background: 'linear-gradient(145deg, #edf7ef 0%, #f5f8f1 52%, var(--warm-cream) 100%)' }}>
        <div className="pointer-events-none absolute -left-20 top-24 h-56 w-56 rounded-full border border-[var(--tennis-green)]/10 md:h-80 md:w-80" />
        <div className="pointer-events-none absolute left-10 top-44 h-36 w-36 rounded-full border border-[var(--tennis-green)]/10 md:h-52 md:w-52" />
        <div className="container-tight relative z-10 pb-8 pt-7 md:pb-10 md:pt-9">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8">
            <div className="relative z-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--tennis-green)]/10 bg-white/65 px-3 py-1.5 text-[11px] font-medium text-[var(--tennis-green)] shadow-sm backdrop-blur-sm">
                <span className="h-[6px] w-[6px] rounded-full bg-[var(--tennis-green)] animate-pulse" />
                {ongoing ? `LIVE · ${ongoing.nameCn || ongoing.name}` : '2026 WTA Season'}
              </div>
              <h1 className="max-w-xl whitespace-nowrap text-[clamp(2.1rem,10vw,3.75rem)] font-bold leading-[1.04] tracking-[-0.035em] text-[var(--tennis-green-dark)] sm:text-5xl md:text-6xl" style={{ fontFamily: 'var(--font-serif)' }}>
                Game, Set, World
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                沿着 WTA 赛历探索世界，把每一场热爱变成下一段旅程。
              </p>
              <div className="mt-5 flex gap-3">
                <Link href="/tournaments" className="rounded-full bg-[var(--tennis-green-dark)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  探索赛事
                </Link>
                <Link href="/players" className="rounded-full border border-[var(--tennis-green-dark)]/15 bg-white/45 px-6 py-3 text-sm font-medium text-[var(--tennis-green-dark)] transition-all hover:bg-white/80">
                  浏览球员
                </Link>
              </div>

              <div className="mt-6 grid max-w-lg grid-cols-3 overflow-hidden rounded-2xl bg-[var(--tennis-green-dark)] text-white shadow-xl shadow-[var(--tennis-green-dark)]/10">
                {[
                  ['33', '赛事'],
                  ['31', '城市'],
                  ['15', '国家'],
                ].map(([value, label], index) => (
                  <div key={label} className={`px-4 py-4 sm:px-5 ${index > 0 ? 'border-l border-white/15' : ''}`}>
                    <div className="text-2xl font-semibold leading-none tracking-[-0.04em] sm:text-3xl" style={{ fontFamily: 'var(--font-serif)' }}>{value}</div>
                    <div className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/55">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden min-h-[350px] items-center justify-center md:flex">
              <div className="h-[370px] w-[370px] lg:h-[400px] lg:w-[400px]">
                <GlobeLoader />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--warm-cream)]/45 to-transparent" />
      </section>

      {/* ========== 功能入口 ========== */}
      <section className="container-tight py-6 md:py-7">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FeatureCard href="/players" icon={Users} title="实时排名" desc="每日积分与排名" />
          <FeatureCard href={ongoing ? `/tournaments/${ongoing.id}` : '/tournaments'} icon={Trophy} title="完整签表" desc="查看赛事对阵进程" />
          <FeatureCard href="/tournaments" icon={MapPin} title="旅行指南" desc="天气、汇率与交通" />
          <FeatureCard href="/follow" icon={Heart} title="关注球员" desc="追踪喜爱球员征程" />
        </div>
      </section>

      {/* ========== 球员排名 — 横向滑动卡片 ========== */}
      <section className="mt-10">
        <div className="container-tight">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--tennis-green-dark)]" style={{ fontFamily: 'var(--font-serif)' }}>球员排名</h2>
            <Link href="/players" className="text-xs font-medium text-[var(--tennis-green)] hover:underline">查看全部 →</Link>
          </div>

          {/* 横向滑动 */}
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {topPlayers.map((player) => (
              <Link key={player.id} href={`/players/${player.id}`} className="group flex-shrink-0 w-[160px] md:w-[180px] snap-start">
                <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-md group-hover:shadow-xl transition-all">
                  <div className="absolute inset-0 bg-gradient-to-b from-[var(--tennis-green)] to-[var(--tennis-green-dark)]">
                    {player.headshotTorso && (
                      <img src={`${player.headshotTorso}?height=400`} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 backdrop-blur text-white text-xs font-bold">{player.rank}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-bold text-white leading-tight">{player.nameCn || player.displayName}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs">{getCountryFlag(player.country)}</span>
                      <span className="text-[10px] text-white/50">{player.displayName}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 即将开赛 ========== */}
      <section className="mt-10">
        <div className="container-tight">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--tennis-green-dark)]" style={{ fontFamily: 'var(--font-serif)' }}>即将开赛</h2>
            <Link href="/tournaments" className="text-xs font-medium text-[var(--tennis-green)] hover:underline">全部赛事 →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcoming.map(t => (
              <Link key={t.id} href={`/tournaments/${t.id}`} className="group p-4 rounded-xl border border-black/[0.05] hover:border-black/[0.1] hover:shadow-md transition-all flex flex-col min-h-[150px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge text-[10px] ${
                    t.level === 'GS' ? 'badge-gs' : t.level === 'WTA1000' ? 'badge-wta1000' : t.level === 'Finals' ? 'badge-finals' : 'badge-wta500'
                  }`}>{LEVEL_LABELS[t.level]}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{t.surface === 'Hard' ? '硬地' : t.surface === 'Clay' ? '红土' : '草地'}</span>
                </div>
                <h3 className="text-sm font-semibold group-hover:text-[var(--tennis-green)] transition-colors leading-snug line-clamp-2">{t.nameCn || t.name}</h3>
                <div className="text-[11px] text-[var(--text-muted)] mt-1.5">📍 {t.cityCn || t.city}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">📅 {formatDateRange(t.dateStart, t.dateEnd)}</div>
                {t.daysUntil !== null && t.daysUntil <= 14 && (
                  <div className="mt-2 text-[11px] font-medium text-[var(--tennis-green)]">
                    {t.daysUntil === 0 ? '🔴 今天开赛' : `⏳ ${t.daysUntil} 天后`}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 四大满贯 ========== */}
      <section className="mt-10 pb-10">
        <div className="container-tight">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--tennis-green-dark)] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>四大满贯</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {grandSlams.map(gs => (
              <Link key={gs.id} href={`/tournaments/${gs.id}`} className="group p-4 rounded-xl border border-black/[0.05] hover:border-black/[0.1] hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">
                    {gs.id === 'australian-open' ? '🇦🇺' : gs.id === 'roland-garros' ? '🇫🇷' : gs.id === 'wimbledon' ? '🇬🇧' : '🇺🇸'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${gs.status === 'completed' ? 'bg-amber-400' : gs.status === 'ongoing' ? 'bg-emerald-400 animate-pulse' : 'bg-black/10'}`} />
                </div>
                <h4 className="text-sm font-bold text-[var(--tennis-green-dark)] group-hover:text-[var(--tennis-green)] transition-colors">{gs.nameCn || gs.name}</h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{gs.surface === 'Hard' ? '硬地' : gs.surface === 'Clay' ? '红土' : '草地'} · {gs.cityCn || gs.city}</p>
                <div className="mt-2 text-xs">
                  {gs.status === 'completed' && gs.winner ? (
                    <span className="text-amber-600 font-medium">🏆 {gs.winner.nameCn || gs.winner.name}</span>
                  ) : gs.status === 'ongoing' ? (
                    <span className="text-emerald-600 font-medium">🔴 进行中</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">{formatDateRange(gs.dateStart, gs.dateEnd)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 赛季总览 ========== */}
      <section className="container-tight mt-10 pb-10">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--tennis-green-dark)]" style={{ fontFamily: 'var(--font-serif)' }}>2026 赛季总览</h2>
          <p className="text-[var(--text-muted)] mt-1 text-xs">大满贯 · WTA 1000 · WTA 500</p>
        </div>
        <SeasonTimeline tournaments={allTournaments} />
      </section>

      {/* ========== Daily Feed ========== */}
      <DailyFeed />

      {/* ========== 彩蛋：开发者寄语 ========== */}
      <section className="container-tight" style={{ paddingTop: '16px', paddingBottom: '36px', marginBottom: '24px' }}>
        <p
          className="text-[var(--text-muted)] text-center"
          style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: '1.05rem', lineHeight: '1.8rem' }}
        >
          I'm not a developer. I'm a humanities grad who fell down the Rybakina rabbit hole and never climbed back out. AceTrip started as a question: <em>why isn't there an app for people like me, who plan trips around WTA draws?</em> So I built one, with AI as my co-pilot and way too many late nights. If you're here, you probably understand. Thanks for visiting — and go Elena 🎾
        </p>
      </section>

    </div>
  );
}

function FeatureCard({ href, icon: Icon, title, desc }: { href: string; icon: LucideIcon; title: string; desc: string }) {
  return (
    <Link href={href} className="group flex min-h-[92px] items-center gap-3 rounded-2xl border border-[var(--tennis-green-dark)]/[0.08] bg-white/80 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--tennis-green)]/20 hover:bg-white hover:shadow-md sm:p-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--tennis-green)]/10 text-[var(--tennis-green)] transition-colors group-hover:bg-[var(--tennis-green)] group-hover:text-white">
        <Icon size={19} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-xs font-bold text-[var(--tennis-green-dark)]">{title}</h4>
          <span className="text-xs text-[var(--tennis-green)]/45 transition-transform group-hover:translate-x-0.5">→</span>
        </div>
        <p className="mt-1 text-[10px] leading-snug text-[var(--text-muted)]">{desc}</p>
      </div>
    </Link>
  );
}
