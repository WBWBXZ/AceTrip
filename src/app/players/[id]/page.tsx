import { notFound } from 'next/navigation';
import { getAllPlayers, getPlayerById } from '@/lib/data';
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
  const player = getPlayerById(id);
  if (!player) return { title: '球员未找到' };
  return {
    title: `${player.nameCn || player.displayName} | AceTrip`,
    description: `${player.nameCn || player.displayName} — WTA #${player.rank}，来自${player.country}，${player.points} 积分。`,
  };
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params;
  const player = getPlayerById(id);
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
