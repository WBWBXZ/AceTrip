'use client';

import Link from 'next/link';
import { useAppStore } from '@/lib/store';

export function HomeCTA() {
  const { followedPlayers } = useAppStore();
  const hasFollowed = followedPlayers.length > 0;

  if (hasFollowed) {
    return (
      <section className="container-tight py-20 md:py-28 text-center">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
          你正在追踪 <span style={{ color: 'var(--tennis-green)' }}>{followedPlayers.length}</span> 位球员
        </h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
          查看她们的赛季旅程，规划你的下一段网球之旅。
        </p>
        <Link
          href="/follow"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium text-sm transition-all hover:opacity-90"
          style={{ background: 'var(--tennis-green)' }}
        >
          查看追踪
        </Link>
      </section>
    );
  }

  return (
    <section className="container-tight py-20 md:py-28 text-center">
      <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">
        追随你喜爱的球员<br />
        <span style={{ color: 'var(--tennis-green)' }}>探索世界。</span>
      </h2>
      <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
        追踪 WTA 球员的全球参赛路线，规划你的网球旅行之旅。
      </p>
      <Link
        href="/players"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium text-sm transition-all hover:opacity-90"
        style={{ background: 'var(--tennis-green)' }}
      >
        开始追踪
      </Link>
    </section>
  );
}
