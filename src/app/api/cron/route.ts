import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function fetchJSON(url: string) {
  const resp = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${url}`);
  return resp.json();
}

export async function GET(request: Request) {
  // 验证 Vercel Cron 密钥（防止外部调用）
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // 1. 更新排名（ESPN API）
    const espnData = await fetchJSON(
      'https://site.api.espn.com/apis/site/v2/sports/tennis/wta/rankings'
    );
    const ranks = espnData.rankings?.[0]?.ranks || [];
    results.push(`排名: 获取了 ${ranks.length} 个球员`);

    // 2. 更新赛事冠军（WTA API）
    const year = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];
    const wtaData = await fetchJSON(
      `https://api.wtatennis.com/tennis/tournaments/?page=0&pageSize=200&excludeLevels=ITF&from=${year}-01-01&to=${today}&updates=true`
    );

    let winnersCount = 0;
    for (const t of wtaData.content || []) {
      const level = t.level || '';
      if (['Grand Slam', 'WTA 1000', 'WTA 500'].includes(level)) {
        const winners = t.winners || [];
        if (winners.length > 0 && winners[0].singles?.player) {
          winnersCount++;
        }
      }
    }
    results.push(`冠军: ${winnersCount} 个赛事有冠军数据`);

    // 3. 触发 Vercel 重新部署（通过 Deploy Hook）
    if (process.env.VERCEL_DEPLOY_HOOK) {
      await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
      results.push('部署: 已触发重新部署');
    } else {
      results.push('部署: 未配置 VERCEL_DEPLOY_HOOK，跳过自动部署');
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results,
    }, { status: 500 });
  }
}
