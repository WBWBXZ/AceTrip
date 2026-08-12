import type { Metadata } from 'next';
import ScheduleClient from '@/components/schedule/ScheduleClient';
import { createSeoMetadata } from '@/lib/seo';

export const metadata: Metadata = createSeoMetadata({
  title: '今日赛程与赛果 | AceTrip',
  description: '查看 WTA 今日赛程、昨日赛果与明日预告，快速掌握女子网球比赛安排和实时赛果。',
  path: '/schedule',
});

export default function SchedulePage() {
  return (
    <main className="min-h-screen animate-fade-in bg-[var(--warm-cream)]">
      <ScheduleClient />
    </main>
  );
}
