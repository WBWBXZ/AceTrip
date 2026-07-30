import { NextRequest, NextResponse } from 'next/server';
import playerNameCnData from '../../../../data/player_name_cn.json';

const playerNameCn: Record<string, string> = playerNameCnData as Record<string, string>;

function findChineseName(altName: string): string | null {
  if (!altName) return null;
  const upper = altName.toUpperCase();
  
  // Direct match
  if (playerNameCn[upper]) return playerNameCn[upper];
  
  // Try "First Last" <-> "Last First" swap
  const parts = altName.split(/\s+/);
  if (parts.length >= 2) {
    const swapped = `${parts[parts.length - 1]} ${parts.slice(0, -1).join(' ')}`.toUpperCase();
    if (playerNameCn[swapped]) return playerNameCn[swapped];
    
    // Also try just last name + first name
    const simple = `${parts[0]} ${parts[parts.length - 1]}`.toUpperCase();
    if (playerNameCn[simple]) return playerNameCn[simple];
  }
  
  return null;
}

function injectChineseNames(html: string): string {
  // Replace <pname> tags to add Chinese names
  // Format: <pname data-id="320760" alt="Aryna SABALENKA"><span class=entrySign>1</span>A Sabalenka</pname>
  // Target: <pname ...><span class=entrySign>1</span><span class="cn-name">萨巴伦卡</span><span class="en-name">A Sabalenka</span></pname>
  
  return html.replace(
    /<pname([^>]*?)alt="([^"]*)"([^>]*)>((?:<span class=entrySign>[^<]*<\/span>)?)(.*?)<\/pname>/g,
    (match, before, altName, after, seedSpan, shortName) => {
      const cn = findChineseName(altName);
      const trimmedName = shortName.trim();
      
      if (cn && trimmedName !== 'Bye' && trimmedName !== 'Qualifier') {
        return `<pname${before}alt="${altName}"${after}>${seedSpan}<span class="draw-cn">${cn}</span><span class="draw-en">${trimmedName}</span></pname>`;
      }
      return match;
    }
  );
}

export async function GET(request: NextRequest) {
  const ltId = request.nextUrl.searchParams.get('ltId');
  const year = request.nextUrl.searchParams.get('year') || '2026';

  if (!ltId) {
    return NextResponse.json({ error: 'Missing ltId' }, { status: 400 });
  }

  try {
    const url = `https://www.live-tennis.cn/en/draw/ajax/${ltId}/${year}/device/0/horizontal/true`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 AceTrip/1.0' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json({ html: '', error: 'No draw available' }, { status: 200 });
    }

    let html = await response.text();

    if (html.includes('NO Tournament this year')) {
      return NextResponse.json({ html: '', error: 'No draw available yet' }, { status: 200 });
    }

    // Clean up
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<link[^>]*>/gi, '');
    html = html.replace(/href="https?:\/\/[^"]*"/gi, 'href="#"');

    // Inject Chinese names
    html = injectChineseNames(html);

    // Check available parts
    const hasWS = html.includes('data-id="WS"');
    const hasMS = html.includes('data-id="MS"');
    const isCombined = hasWS && hasMS;
    const hasTrophy = html.includes('data-id="TROPHY"');

    const parts: string[] = [];
    if (hasWS) parts.push('WS');
    if (html.includes('data-id="WD"')) parts.push('WD');
    if (html.includes('data-id="PS"')) parts.push('PS');
    if (html.includes('data-id="WS_ENTRY"')) parts.push('WS_ENTRY');
    if (hasTrophy) parts.push('TROPHY');

    if (!hasWS && !isCombined) {
      if (hasMS) parts.unshift('MS');
      if (html.includes('data-id="MD"')) parts.push('MD');
      if (html.includes('data-id="QS"')) parts.push('QS');
      if (html.includes('data-id="MS_ENTRY"')) parts.push('MS_ENTRY');
      if (!parts.includes('TROPHY') && hasTrophy) parts.push('TROPHY');
    }

    // If only TROPHY part exists (no actual draw), mark as draw not published
    const hasActualDraw = parts.some(p => ['WS', 'MS', 'WD', 'MD', 'QS', 'PS'].includes(p));
    const drawNotPublished = !hasActualDraw;

    return NextResponse.json({
      html,
      isCombined,
      parts,
      drawNotPublished,
    });
  } catch {
    return NextResponse.json({ html: '', error: 'Failed to fetch draw' }, { status: 200 });
  }
}
