import type { Metadata } from 'next';
import ScheduleClient from '@/components/schedule/ScheduleClient';

export const metadata: Metadata = {
  title: '赛程赛果 | AceTrip',
  description: '查看 WTA 昨日赛果、今日赛程与明日预告。',
};

export default function SchedulePage() {
  return (
    <main className="min-h-screen animate-fade-in bg-[var(--warm-cream)]">
      <ScheduleClient />
    </main>
  );
}
