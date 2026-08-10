import { getPlayersWithLiveRankings } from '@/lib/data';
import { PlayerList } from '@/components/players/PlayerList';

export const metadata = {
  title: '球员 | AceTrip',
  description: 'WTA 单打排名 — 全球顶尖女子网球球员',
};

export default async function PlayersPage() {
  const players = await getPlayersWithLiveRankings();
  const liveUpdatedAt = players.find(player => player.rankingSource === 'live-tennis')?.rankingUpdatedAt;
  const updateDate = liveUpdatedAt
    ? (() => { const d = new Date(liveUpdatedAt); return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`; })()
    : (() => { const d = new Date(); return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`; })();

  return (
    <div className="animate-fade-in">
      <div className="container-tight pt-16 md:pt-20">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>球员图鉴</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 mb-2 tracking-wide" style={{ fontFamily: "var(--font-serif)" }}>
          {players.length} 位 WTA 球员 · 数据更新于 {updateDate}
        </p>
      </div>

      <div className="container-tight pb-12">
        <PlayerList players={players} />
      </div>
    </div>
  );
}
