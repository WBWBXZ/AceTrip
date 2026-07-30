import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.live-tennis.cn/zh/rank/wta/s/year/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: 'draw=1&start=0&length=150&device=0',
      next: { revalidate: 3600 }, // 缓存1小时
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 502 });
    }

    const data = await res.json();
    
    // 提取排名数据
    const rankings = (data.data || []).map((p: Record<string, string>) => ({
      rank: parseInt(p.c_rank) || 0,
      name: p.name || '',
      engName: p.eng_name || '',
      points: parseInt(p.c_point) || 0,
      change: parseInt(p.change) || 0,
      country: p.ioc || '',
      age: p.age || '',
    }));

    return NextResponse.json({
      rankings,
      updatedAt: new Date().toISOString(),
      total: data.recordsTotal || rankings.length,
    });
  } catch (err) {
    console.error('Rankings fetch error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
