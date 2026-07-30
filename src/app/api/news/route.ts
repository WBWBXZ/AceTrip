import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'wta_news.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ news: [], updatedAt: null }, { status: 500 });
  }
}
