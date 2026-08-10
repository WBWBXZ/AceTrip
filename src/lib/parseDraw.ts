export interface Player {
  name: string;
  nameCn?: string;
  seed?: number;
  flag?: string;
  bye?: boolean;
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  score?: string;
  time?: string;
  odds?: [string, string];
  winner?: 1 | 2;
}

export interface Round {
  name: string;
  matches: Match[];
}

export interface DrawData {
  rounds: Round[];
}

const EMPTY_PLAYER: Player = { name: 'TBD' };
const ROUND_NAMES: Record<number, string> = {
  128: 'R128',
  64: 'R64',
  32: 'R32',
  16: 'R16',
  8: 'QF',
  4: 'SF',
  2: 'F',
};

function cleanText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function parsePlayer(element: Element | null): Player | null {
  const pname = element?.matches('pname') ? element : element?.querySelector('pname');
  if (!pname) return null;

  const rawName = cleanText(pname.getAttribute('alt')) || cleanText(pname.textContent);
  const displayName = cleanText(pname.querySelector('.draw-en')?.textContent)
    || cleanText(pname.childNodes[pname.childNodes.length - 1]?.textContent)
    || rawName;
  const nameCn = cleanText(pname.querySelector('.draw-cn')?.textContent) || undefined;
  const seedText = cleanText(pname.querySelector('.entrySign')?.textContent);
  const seed = /^\d+$/.test(seedText) ? Number(seedText) : undefined;
  const flagElement = element?.querySelector('img.playerFlag');
  const flagUrl = cleanText(flagElement?.getAttribute('data-original'))
    || cleanText(flagElement?.getAttribute('src'));
  const flagCode = cleanText(flagElement?.getAttribute('alt'));
  const bye = /^(bye|轮空)$/i.test(rawName) || /^(bye|轮空)$/i.test(displayName);

  return {
    name: bye ? 'Bye' : displayName,
    nameCn,
    seed,
    flag: flagUrl || flagCode || undefined,
    bye,
  };
}

function samePlayer(left: Player, right: Player): boolean {
  if (left.bye || right.bye) return left.bye === right.bye;
  return left.name.toLowerCase() === right.name.toLowerCase()
    || (!!left.nameCn && left.nameCn === right.nameCn);
}

function cellsForRow(row: Element): Element[] {
  return Array.from(row.children).filter(cell => cell.tagName === 'TD');
}

function playerInColumn(rows: Element[], column: number): Player | null {
  for (const row of rows) {
    const player = parsePlayer(cellsForRow(row)[column]);
    if (player) return player;
  }
  return null;
}

function formatShanghaiTime(timestamp: number): string | undefined {
  if (!Number.isFinite(timestamp) || timestamp < 1_000_000_000) return undefined;

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp * 1000));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value;
  const month = value('month');
  const day = value('day');
  const hour = value('hour');
  const minute = value('minute');

  return month && day && hour && minute ? `${month}月${day}日 ${hour}:${minute}` : undefined;
}

function metadataInColumn(rows: Element[], column: number): Pick<Match, 'score' | 'time' | 'odds'> {
  let score: string | undefined;
  let time: string | undefined;
  let odds: [string, string] | undefined;

  for (const row of rows) {
    const cell = cellsForRow(row)[column];
    if (!cell) continue;

    const timestampText = cleanText(cell.querySelector('.unixtime')?.textContent);
    if (timestampText && /^\d{10}$/.test(timestampText)) {
      time = formatShanghaiTime(Number(timestampText));
    }

    const text = cleanText(cell.textContent);
    const oddsMatch = text.match(/(?:^|\s)(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)(?:\s|$)/);
    if (oddsMatch) odds = [oddsMatch[2], oddsMatch[1]];

    if (cell.classList.contains('cDrawGridScore') && !timestampText && /\d/.test(text)) {
      score = text;
    }
  }

  return { score, time, odds };
}

function parseTableRounds(table: Element, roundLimit?: number): Match[][] {
  const rows = Array.from(table.querySelectorAll(':scope > tbody > tr, :scope > tr'));
  if (rows.length < 2 || (rows.length & (rows.length - 1)) !== 0) return [];

  const firstRowCells = cellsForRow(rows[0]);
  const availableRounds = Math.min(Math.log2(rows.length), firstRowCells.length - 2);
  const roundsToParse = Math.max(0, Math.min(roundLimit ?? availableRounds, availableRounds));
  const rounds: Match[][] = [];

  for (let roundIndex = 0; roundIndex < roundsToParse; roundIndex += 1) {
    const matchSpan = 2 ** (roundIndex + 1);
    const sourceColumn = roundIndex + 1;
    const resultColumn = roundIndex + 2;
    const matches: Match[] = [];

    for (let start = 0; start < rows.length; start += matchSpan) {
      const midpoint = start + matchSpan / 2;
      const player1 = playerInColumn(rows.slice(start, midpoint), sourceColumn) || EMPTY_PLAYER;
      const player2 = playerInColumn(rows.slice(midpoint, start + matchSpan), sourceColumn) || EMPTY_PLAYER;
      const resultRows = rows.slice(start, start + matchSpan);
      const resultPlayer = playerInColumn(resultRows, resultColumn);
      let winner: 1 | 2 | undefined;

      if (resultPlayer) {
        if (samePlayer(resultPlayer, player1)) winner = 1;
        if (samePlayer(resultPlayer, player2)) winner = 2;
      } else {
        const firstCell = cellsForRow(rows[start])[sourceColumn];
        const secondCell = cellsForRow(rows[midpoint])[sourceColumn];
        if (firstCell?.classList.contains('cDrawEntryWin')) winner = 1;
        if (secondCell?.classList.contains('cDrawEntryWin')) winner = 2;
      }

      const primaryMetadata = metadataInColumn(resultRows, resultColumn);
      const adjacentMetadata = metadataInColumn(resultRows, resultColumn + 1);

      matches.push({
        id: `${table.getAttribute('data-bracket-index') || 'block'}-${roundIndex}-${start / matchSpan}`,
        player1: { ...player1 },
        player2: { ...player2 },
        score: primaryMetadata.score,
        time: winner ? undefined : primaryMetadata.time,
        odds: adjacentMetadata.odds,
        winner,
      });
    }

    rounds.push(matches);
  }

  return rounds;
}

function appendRounds(target: Match[][], source: Match[][]): void {
  source.forEach((matches, index) => {
    if (!target[index]) target[index] = [];
    target[index].push(...matches);
  });
}

export function parseDraw(html: string, partId?: string): DrawData {
  if (typeof DOMParser === 'undefined') {
    throw new Error('Draw parsing requires a browser DOM');
  }

  const document = new DOMParser().parseFromString(html, 'text/html');
  const allParts = Array.from(document.querySelectorAll('.cDrawPart'));
  const parts = partId
    ? allParts.filter(part => part.getAttribute('data-id') === partId)
    : allParts;
  if (!parts.length) throw new Error('Draw section not found');

  const candidates = parts.map(part => {
    const tables = Array.from(part.querySelectorAll('table.cDrawBlock'));
    const rowCount = tables.reduce((sum, table) => (
      sum + table.querySelectorAll(':scope > tbody > tr, :scope > tr').length
    ), 0);
    return { part, tables, rowCount };
  }).filter(candidate => candidate.tables.length > 0);

  if (!candidates.length) throw new Error('Bracket tables not found');

  const detailed = candidates.reduce((best, candidate) => (
    candidate.rowCount > best.rowCount ? candidate : best
  ));
  const summary = candidates
    .filter(candidate => candidate !== detailed && candidate.rowCount < detailed.rowCount)
    .sort((a, b) => b.rowCount - a.rowCount)[0];
  const combinedRounds: Match[][] = [];

  detailed.tables.forEach((table, index) => {
    table.setAttribute('data-bracket-index', `detail-${index}`);
    const roundLimit = summary ? Math.max(1, Math.log2(table.querySelectorAll(':scope > tbody > tr, :scope > tr').length) - 1) : undefined;
    appendRounds(combinedRounds, parseTableRounds(table, roundLimit));
  });

  if (summary) {
    summary.tables.forEach((table, index) => {
      table.setAttribute('data-bracket-index', `summary-${index}`);
      const summaryRounds = parseTableRounds(table);
      summaryRounds.forEach(matches => combinedRounds.push(matches));
    });
  }

  const initialSize = combinedRounds[0]?.length ? combinedRounds[0].length * 2 : 0;
  const rounds = combinedRounds
    .filter(matches => matches.length > 0)
    .map((matches, index) => ({
      name: ROUND_NAMES[initialSize / (2 ** index)] || `R${initialSize / (2 ** index)}`,
      matches,
    }));

  if (!rounds.length) throw new Error('No bracket matches found');
  return { rounds };
}
