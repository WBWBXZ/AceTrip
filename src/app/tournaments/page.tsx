import { getTournamentsWithStatus } from '@/lib/data';
import { TournamentGrid } from '@/components/tournaments/TournamentGrid';

export const metadata = {
  title: '赛事 | AceTrip',
  description: '2026 WTA 巡回赛 — 大满贯、WTA 1000、WTA 500 及年终总决赛',
};

export default function TournamentsPage() {
  const tournaments = getTournamentsWithStatus();

  return (
    <div className="animate-fade-in">
      <div className="container-tight pt-10 md:pt-20">
        <h1 className="text-2xl font-semibold tracking-tight md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>赛事日历</h1>
        <p className="mb-4 mt-1 text-xs tracking-wide text-[var(--text-muted)] md:mb-2 md:text-sm" style={{ fontFamily: "var(--font-serif)" }}>
          2026 赛季 · 大满贯 · WTA 1000 · WTA 500
        </p>
      </div>

      <div className="container-tight pb-12">
        <TournamentGrid tournaments={tournaments} key="tournaments" />
      </div>
    </div>
  );
}
