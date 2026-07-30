export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--tennis-green-dark)' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(64,145,108,0.4) 0%, transparent 70%)' }} />
      </div>

      <div className="container-tight relative z-10 py-20 md:py-28 lg:py-36">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-8 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            2026 WTA 赛季
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05]">
            AceTrip
          </h1>

          {/* Subtitle */}
          <p className="mt-5 md:mt-7 text-lg md:text-xl text-white/70 max-w-lg leading-relaxed">
            追随你喜爱的球员，探索世界。
            <span className="block mt-1.5 text-white/50 text-base">
              一款因网球而生的旅行产品。
            </span>
          </p>

          {/* Quick stats */}
          <div className="flex gap-10 mt-10 md:mt-14">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white">33</div>
              <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">赛事</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white">31</div>
              <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">城市</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white">15</div>
              <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">国家</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 mt-10">
            <a
              href="/tournaments"
              className="px-6 py-3 rounded-full bg-white text-[var(--tennis-green-dark)] text-sm font-semibold hover:bg-white/90 transition-all"
            >
              探索赛事
            </a>
            <a
              href="/players"
              className="px-6 py-3 rounded-full bg-white/10 text-white text-sm font-medium border border-white/20 hover:bg-white/20 transition-all"
            >
              浏览球员
            </a>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20"
           style={{ background: `linear-gradient(to top, var(--warm-cream), transparent)` }} />
    </section>
  );
}
