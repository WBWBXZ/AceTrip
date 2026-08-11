import type { Metadata } from 'next';
import { H2HClient, type SelectedPlayer } from '@/components/h2h/H2HClient';
import { getAllPlayers } from '@/lib/data';

export const metadata: Metadata = {
  title: '交手记录 | AceTrip',
  description: '查询 WTA 球员之间的历史交手战绩、胜率与逐场比分。',
};

interface Props {
  searchParams: Promise<{ p1?: string; p2?: string }>;
}

export default async function H2HPage({ searchParams }: Props) {
  const { p1, p2 } = await searchParams;
  const players = getAllPlayers();
  const availablePlayers: SelectedPlayer[] = players
    .filter(player => player.wtaId)
    .sort((a, b) => a.rank - b.rank)
    .map(player => ({
      id: String(player.wtaId),
      name: player.nameCn || player.displayName,
      nameCn: player.nameCn,
      nameEn: player.displayName,
      country: player.country,
      rank: player.rank,
      headshot: player.headshot,
    }));

  function resolvePlayer(id: string | undefined): SelectedPlayer | null {
    if (!id) return null;
    return availablePlayers.find(player => player.id === id)
      ?? (/^\d+$/.test(id) ? { id, name: `球员 ${id}`, nameCn: `球员 ${id}`, nameEn: '' } : null);
  }

  return (
    <main className="animate-fade-in pb-24 md:pb-28">
      <section className="border-b border-[var(--tennis-green-dark)]/[0.06] bg-gradient-to-br from-[#edf7ef] via-white to-[var(--warm-cream)]/55">
        <div className="container-tight py-10 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--tennis-green)]">Head to Head</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--tennis-green-dark)] md:text-5xl" style={{ fontFamily: 'var(--font-serif)' }}>
            球员交手记录
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
            选择两位 WTA 球员，查看她们的历史对战、胜率与每场比分。
          </p>
        </div>
      </section>

      <div className="container-tight pt-8 md:pt-10">
        <H2HClient initialPlayers={[resolvePlayer(p1), resolvePlayer(p2)]} availablePlayers={availablePlayers} />
      </div>
    </main>
  );
}
