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
      <div className="container-tight pt-16 md:pt-20">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>赛事日历</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 mb-2 tracking-wide" style={{ fontFamily: "var(--font-serif)" }}>
          2026 赛季 · 大满贯 · WTA 1000 · WTA 500
        </p>
      </div>

      <div className="container-tight pb-12">
        <TournamentGrid tournaments={tournaments} key="tournaments" />
      </div>
    </div>
  );
}
