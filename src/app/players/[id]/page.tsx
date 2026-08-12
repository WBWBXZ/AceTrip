import { notFound } from 'next/navigation';
import { getAllPlayers, getPlayerSeasonSummary, getPlayerWithLiveRanking } from '@/lib/data';
import { createSeoMetadata } from '@/lib/seo';
import { PlayerDetailClient } from '@/components/players/PlayerDetailClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const players = getAllPlayers().filter(p => p.tier !== 'basic');
  return players.map(p => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const player = await getPlayerWithLiveRanking(id);
  if (!player) return { title: '球员未找到 | AceTrip' };

  const name = player.nameCn || player.displayName;
  const seasonSummary = getPlayerSeasonSummary(player);
  const description = `${name} WTA 球员资料：当前排名第 ${player.rank} 位，${player.points} 积分，${seasonSummary}。`;

  return createSeoMetadata({
    title: `${name} - WTA 球员资料 | AceTrip`,
    description,
    path: `/players/${player.id}`,
    image: player.headshot || undefined,
    type: 'article',
  });
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params;
  const player = await getPlayerWithLiveRanking(id);
  if (!player) notFound();

  return (
    <div className="animate-fade-in">
      {/* Back nav */}
      <div className="container-tight pt-4 pb-2">
        <Link
          href="/players"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={16} />
          返回球员列表
        </Link>
      </div>

      {/* Full player detail — client component handles Hero, Stats, Timeline, Points */}
      <div className="container-tight pt-4 pb-12">
        <PlayerDetailClient player={player} />
      </div>
    </div>
  );
}
