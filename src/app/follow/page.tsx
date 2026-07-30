import { FollowPageClient } from '@/components/map/FollowPageClient';
import { getAllPlayers, getAllTournaments } from '@/lib/data';

export const metadata = {
  title: '追踪球员 | AceTrip',
  description: '追踪你喜爱的 WTA 球员在全球的参赛路线',
};

export default function FollowPage() {
  const players = getAllPlayers();
  const tournaments = getAllTournaments();

  return (
    <div className="animate-fade-in">
      <div className="container-tight pt-16 md:pt-20">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>关注球员</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 mb-2 tracking-wide" style={{ fontFamily: "var(--font-serif)" }}>
          她的每一场比赛，都值得被记住
        </p>
      </div>
      <FollowPageClient players={players} tournaments={tournaments} />
    </div>
  );
}
