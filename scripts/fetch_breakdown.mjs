import { readFileSync, writeFileSync } from 'fs';

const BREAKDOWN_PATH = '/home/node/.openclaw/workspace/tennis-app/data/player_points_breakdown.json';
const PLAYERS_PATH = '/home/node/.openclaw/workspace/tennis-app/data/players_final.json';

const players = JSON.parse(readFileSync(PLAYERS_PATH, 'utf8')).players;
const breakdown = JSON.parse(readFileSync(BREAKDOWN_PATH, 'utf8'));

const withWtaId = players.filter(p => p.wtaId);
const missing = withWtaId.filter(p => !breakdown[p.id]);

console.log(`Total with wtaId: ${withWtaId.length}, already have: ${Object.keys(breakdown).length}, to fetch: ${missing.length}`);

const LEVEL_MAP = {
  'WTA YEC': 'WTA Finals',
  'W1000': 'WTA 1000',
  'W500': 'WTA 500',
  'W250': 'WTA 250',
};

function cleanText(s) {
  if (!s) return '';
  return s
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x1f512;/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')  // strip remaining HTML tags
    .replace(/\s+/g, ' ')
    .trim();
}

function mapLevel(raw) {
  const cleaned = cleanText(raw);
  return LEVEL_MAP[cleaned] || cleaned;
}

function extractTableContent(html) {
  // The structure is: <div id=iBreakdownContentLevelTable ...><table><tbody>...</tbody></table></div>
  // Find the position of the id
  const idIdx = html.indexOf('iBreakdownContentLevelTable');
  if (idIdx === -1) return null;
  
  // Find the inner <table> after the id
  const tableStart = html.indexOf('<table', idIdx);
  if (tableStart === -1) return null;
  
  // Find the matching </table>
  const tableEnd = html.indexOf('</table>', tableStart);
  if (tableEnd === -1) return null;
  
  return html.slice(tableStart, tableEnd + 8);
}

function extractRows(tableContent) {
  // Extract all <tr>...</tr> blocks
  const rows = [];
  const trRegex = /<tr([^>]*)>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = trRegex.exec(tableContent)) !== null) {
    rows.push({ attrs: m[1], content: m[2] });
  }
  return rows;
}

function extractCells(rowContent) {
  const cells = [];
  const tdRegex = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = tdRegex.exec(rowContent)) !== null) {
    cells.push({ attrs: m[1], content: m[2] });
  }
  return cells;
}

function parseHTML(html, playerId) {
  // Extract total from echarts config: { name: "Total", value: XXXX, }
  let total = 0;
  const totalMatch = html.match(/\{[^}]*name\s*:\s*["']Total["'][^}]*value\s*:\s*(\d+)[^}]*\}/i)
    || html.match(/\{[^}]*value\s*:\s*(\d+)[^}]*,\s*name\s*:\s*["']Total["'][^}]*\}/i);
  if (totalMatch) {
    total = parseInt(totalMatch[1], 10);
  }

  const tableContent = extractTableContent(html);
  if (!tableContent) {
    console.warn(`  No table found for ${playerId}`);
    return total > 0 ? { total, entries: [] } : null;
  }

  const rows = extractRows(tableContent);
  const entries = [];
  let currentLevel = '';

  for (const row of rows) {
    // Check if it's a title row
    if (row.attrs.includes('cBreakdownContentTitleRow')) {
      // Extract td with colspan=4
      const colspanMatch = row.content.match(/<td[^>]*colspan=["']?4["']?[^>]*>([\s\S]*?)<\/td>/i);
      if (colspanMatch) {
        currentLevel = mapLevel(colspanMatch[1]);
      }
      continue;
    }

    const cells = extractCells(row.content);
    if (cells.length === 4) {
      const name = cleanText(cells[0].content);
      const pointsStr = cleanText(cells[1].content);
      const round = cleanText(cells[2].content);
      const expiry = cleanText(cells[3].content);
      const points = parseInt(pointsStr.replace(/,/g, '').replace(/\s/g, ''), 10);
      if (!isNaN(points) && points > 0 && name) {
        const entry = { level: currentLevel, name, points, round };
        if (expiry && expiry !== '') entry.expiry = expiry;
        entries.push(entry);
      }
    }
  }

  return { total, entries };
}

async function fetchPlayer(player) {
  const url = `https://www.live-tennis.cn/en/breakdown/wta/s/year/query?id=${player.wtaId}`;
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.live-tennis.cn/',
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) {
      console.error(`  HTTP ${resp.status} for ${player.id}`);
      return null;
    }
    const html = await resp.text();
    if (html.length < 100) {
      console.error(`  Empty response for ${player.id}`);
      return null;
    }
    return parseHTML(html, player.id);
  } catch (e) {
    console.error(`  Error fetching ${player.id}: ${e.message}`);
    return null;
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

let successCount = 0;
let failCount = 0;
const failed = [];

// Process in batches of 5
const BATCH_SIZE = 5;
for (let i = 0; i < missing.length; i += BATCH_SIZE) {
  const batch = missing.slice(i, i + BATCH_SIZE);
  console.log(`\nBatch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(missing.length/BATCH_SIZE)}: ${batch.map(p=>p.id).join(', ')}`);
  
  for (const player of batch) {
    const result = await fetchPlayer(player);
    if (result) {
      breakdown[player.id] = result;
      successCount++;
      console.log(`  ✓ ${player.id}: total=${result.total}, entries=${result.entries.length}`);
    } else {
      failCount++;
      failed.push(player.id);
      console.log(`  ✗ ${player.id}: failed`);
    }
    await sleep(500);
  }
  
  // Save after each batch
  writeFileSync(BREAKDOWN_PATH, JSON.stringify(breakdown, null, 2));
  console.log(`  Saved. Progress: ${successCount} success, ${failCount} fail`);
}

console.log(`\n=== DONE ===`);
console.log(`Success: ${successCount}`);
console.log(`Failed: ${failCount}`);
if (failed.length) console.log(`Failed players: ${failed.join(', ')}`);
