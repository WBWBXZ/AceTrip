import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('/home/node/.openclaw/workspace/tennis-app/data/players_final.json', 'utf8'));
const featured = data.players.filter(p => p.tier === 'featured' && p.wtaId);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanText(text) {
  return text
    .replace(/&#039;/g, "'")
    .replace(/&amp;#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;nbsp;/g, ' ')
    .replace(/&#x1f512;/gi, '')
    .replace(/🔒/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function mapLevel(level) {
  const map = {
    'WTA YEC': 'WTA Finals',
    'W1000': 'WTA 1000',
    'W500': 'WTA 500',
    'W250': 'WTA 250',
  };
  return map[level] || level;
}

function parseBreakdown(html, playerName) {
  // Extract total from echarts config
  let total = 0;
  const totalMatch = html.match(/\{\s*name\s*:\s*["']?Total["']?\s*,\s*value\s*:\s*(\d+)\s*,?\s*\}/);
  if (totalMatch) {
    total = parseInt(totalMatch[1], 10);
  }

  // Find the breakdown table div - it contains a <table> inside
  const divMatch = html.match(/id=["']?iBreakdownContentLevelTable["']?[^>]*>([\s\S]*?)(?:<\/div>\s*<\/div>\s*<\/div>|<div id=["']?iBreakdownContentSurface)/i);
  if (!divMatch) {
    console.error(`  No breakdown table div found for ${playerName}`);
    return null;
  }
  // Extract just the table inside
  const tableBlockMatch = divMatch[1].match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableBlockMatch) {
    console.error(`  No table inside breakdown div for ${playerName}`);
    return null;
  }

  const tableHtml = tableBlockMatch[1];
  const entries = [];
  let currentLevel = '';

  // Parse rows
  const rowRegex = /<tr([^>]*)>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowAttrs = rowMatch[1];
    const rowContent = rowMatch[2];

    // Check if this is a title row
    if (rowAttrs.includes('cBreakdownContentTitleRow') || rowContent.includes('cBreakdownContentTitleRow')) {
      // Extract level name from <td colspan=4>
      const tdMatch = rowContent.match(/<td[^>]*colspan[^>]*>([\s\S]*?)<\/td>/i);
      if (tdMatch) {
        const rawLevel = cleanText(tdMatch[1].replace(/<[^>]+>/g, ''));
        currentLevel = mapLevel(rawLevel);
      }
      continue;
    }

    // Extract all <td> cells
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let tdMatch2;
    while ((tdMatch2 = tdRegex.exec(rowContent)) !== null) {
      cells.push(cleanText(tdMatch2[1].replace(/<[^>]+>/g, '')));
    }

    if (cells.length >= 4) {
      const name = cells[0];
      const points = parseInt(cells[1], 10) || 0;
      const round = cells[2].trim();
      // const expiry = cells[3].trim();  // not needed in output

      if (points > 0 && name) {
        entries.push({
          level: currentLevel,
          name: name,
          points: points,
          round: round,
        });
      }
    }
  }

  return { total, entries };
}

async function fetchBreakdown(wtaId, playerName) {
  const url = `https://www.live-tennis.cn/en/breakdown/wta/s/year/query?id=${wtaId}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.live-tennis.cn/',
      }
    });
    if (!response.ok) {
      console.error(`  HTTP ${response.status} for ${playerName} (wtaId=${wtaId})`);
      return null;
    }
    const html = await response.text();
    return parseBreakdown(html, playerName);
  } catch (err) {
    console.error(`  Error fetching ${playerName}: ${err.message}`);
    return null;
  }
}

async function main() {
  const result = {};
  
  for (const player of featured) {
    console.log(`Fetching ${player.displayName} (wtaId=${player.wtaId})...`);
    const breakdown = await fetchBreakdown(player.wtaId, player.displayName);
    
    if (breakdown) {
      result[player.id] = breakdown;
      console.log(`  ✓ total=${breakdown.total}, entries=${breakdown.entries.length}`);
    } else {
      console.log(`  ✗ skipped`);
    }
    
    await sleep(1000);
  }

  writeFileSync(
    '/home/node/.openclaw/workspace/tennis-app/data/player_points_breakdown.json',
    JSON.stringify(result, null, 2),
    'utf8'
  );
  
  console.log('\nDone! Saved to player_points_breakdown.json');
  console.log('Summary:');
  for (const [id, bd] of Object.entries(result)) {
    console.log(`  ${id}: total=${bd.total}`);
  }
}

main().catch(console.error);
