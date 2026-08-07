import { getTopPlayers, getUpcomingTournaments, getTournamentsWithStatus, getCountryFlag, LEVEL_LABELS, formatDateRange } from '@/lib/data';
import { SeasonTimeline } from '@/components/tournaments/SeasonTimeline';
import Link from 'next/link';
import GlobeLoader from '@/components/ui/GlobeLoader';
import DailyFeed from '@/components/ui/DailyFeed';


export default function HomePage() {
  const topPlayers = getTopPlayers(20);
  const upcoming = getUpcomingTournaments().slice(0, 4);
  const allTournaments = getTournamentsWithStatus();
  const ongoing = allTournaments.find(t => t.status === 'ongoing');
  const grandSlams = allTournaments.filter(t => t.level === 'GS');

  return (
    <div className="animate-fade-in">
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #f0faf2 0%, #f7faf5 50%, var(--warm-cream) 100%)' }}>
        <div className="container-tight relative z-10 pt-8 pb-14 md:pt-10 md:pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

            {/* 左：文案 */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--tennis-green)]/10 text-[var(--tennis-green)] text-[11px] font-medium mb-5">
                <span className="w-[6px] h-[6px] rounded-full bg-[var(--tennis-green)] animate-pulse" />
                {ongoing ? `LIVE · ${ongoing.nameCn || ongoing.name}` : '2026 WTA Season'}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-[var(--tennis-green-dark)]" style={{ fontFamily: 'var(--font-serif)' }}>
                Game, Set, World
              </h1>
              <p className="mt-4 text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
                追踪 WTA 球员赛程，探索赛事城市，规划你的网球之旅
              </p>
              <div className="flex gap-3 mt-7">
                <Link href="/players" className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md" style={{ background: 'var(--tennis-green-dark)' }}>
                  浏览球员
                </Link>
                <Link href="/tournaments" className="px-6 py-3 rounded-full text-sm font-medium border border-black/10 text-[var(--text-primary)] hover:bg-white/60 transition-all">
                  探索赛事
                </Link>
              </div>
              <div className="flex gap-6 mt-8">
                <div><span className="text-lg font-bold text-[var(--tennis-green-dark)]">33</span><span className="text-[10px] text-[var(--text-muted)] ml-1">赛事</span></div>
                <div><span className="text-lg font-bold text-[var(--tennis-green-dark)]">31</span><span className="text-[10px] text-[var(--text-muted)] ml-1">城市</span></div>
                <div><span className="text-lg font-bold text-[var(--tennis-green-dark)]">15</span><span className="text-[10px] text-[var(--text-muted)] ml-1">国家</span></div>
              </div>
            </div>

            {/* 右：动态地球 */}
            <div className="hidden md:flex items-center justify-center" style={{ minHeight: 420 }}>
              <div style={{ width: 420, height: 420 }}>
                <GlobeLoader />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========== DAILY FEED ========== */}
      {/* ========== 功能特色 ========== */}
      <section className="container-tight pt-8 pb-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FeatureCard emoji="🎾" title="实时排名" desc="每日更新积分与排名数据" />
          <FeatureCard emoji="📋" title="完整签表" desc="覆盖所有重要赛事" />
          <FeatureCard emoji="✈️" title="旅行指南" desc="天气 · 汇率 · 交通攻略" />
          <FeatureCard emoji="❤️" title="关注球员" desc="追踪你喜爱球员的征程" />
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

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-black/[0.05] shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-[var(--tennis-green)]/10 flex items-center justify-center text-lg flex-shrink-0">{emoji}</div>
      <div>
        <h4 className="text-xs font-bold text-[var(--tennis-green-dark)]">{title}</h4>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}
