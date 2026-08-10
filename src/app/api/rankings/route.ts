import { NextResponse } from 'next/server';
import { fetchLiveTennisRankings } from '@/lib/liveTennis';

export const revalidate = 3600;

export async function GET() {
  try {
    const result = await fetchLiveTennisRankings();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Rankings fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 502 });
  }
}
