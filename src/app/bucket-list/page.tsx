import { BucketListClient } from '@/components/tournaments/BucketListClient';
import { getAllTournaments } from '@/lib/data';

export const metadata = {
  title: '心愿单 | AceTrip',
  description: '你的网球旅行心愿单 — 想要亲临现场的赛事',
};

export default function BucketListPage() {
  const tournaments = getAllTournaments();

  return (
    <div className="animate-fade-in">
      <div className="container-tight pt-16 md:pt-20">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>心愿单</h1>
        <p className="text-sm tracking-wide text-[var(--text-muted)] mt-1 mb-2" style={{ fontFamily: "var(--font-serif)" }}>
          每一站都值得期待
        </p>
      </div>
      <BucketListClient tournaments={tournaments} />
    </div>
  );
}
