import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 验证 Vercel Cron 密钥（防止外部调用）
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    message: 'AceTrip static data is refreshed by GitHub Actions daily-update.yml. This Vercel Cron endpoint is intentionally kept as a lightweight heartbeat only.',
  });
}
