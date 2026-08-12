import { getPlayersWithLiveRankings } from '@/lib/data';
import { createSeoMetadata } from '@/lib/seo';
import { PlayerList } from '@/components/players/PlayerList';

export const metadata = createSeoMetadata({
  title: 'WTA 球员排名与资料 | AceTrip',
  description: '查看 WTA 女子网球球员排名、积分、国籍、头像与详细资料，持续追踪全球顶尖球员动态。',
  path: '/players',
});

export default async function PlayersPage() {
  const players = await getPlayersWithLiveRankings();
  const liveUpdatedAt = players.find(player => player.rankingSource === 'live-tennis')?.rankingUpdatedAt;
  const updateDate = liveUpdatedAt
    ? (() => { const d = new Date(liveUpdatedAt); return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`; })()
    : (() => { const d = new Date(); return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`; })();

  return (
    <div className="animate-fade-in">
      <div className="container-tight pt-10 md:pt-20">
        <h1 className="text-2xl font-semibold tracking-tight md:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>球员图鉴</h1>
        <p className="mb-4 mt-1 text-xs tracking-wide text-[var(--text-muted)] md:mb-2 md:text-sm" style={{ fontFamily: "var(--font-serif)" }}>
          {players.length} 位 WTA 球员 · 数据更新于 {updateDate}
        </p>
      </div>

      <div className="container-tight pb-12">
        <PlayerList players={players} />
      </div>
    </div>
  );
}
