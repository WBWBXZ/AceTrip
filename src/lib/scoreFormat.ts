function numericScore(value: string): number {
  return Number(value.replace(/^0+/, '') || '0');
}

function formatSuperTiebreak(left: string, right: string): string | null {
  if (/^0\d$/.test(left)) return `10-${numericScore(left)}`;
  if (/^0\d$/.test(right)) return `10-${numericScore(right)}`;
  return null;
}

function formatRegularTiebreak(left: string, right: string): string | null {
  if (/^6\d$/.test(left) && right === '7') return `6(${left[1]})-7`;
  if (left === '7' && /^6\d$/.test(right)) return `7-6(${right[1]})`;
  return null;
}

export function formatScore(score: string): string {
  return score.replace(/\b(\d{1,2})-(\d{1,2})\b/g, (match, left: string, right: string) => {
    return formatSuperTiebreak(left, right) ?? formatRegularTiebreak(left, right) ?? match;
  });
}

export function scoreGames(value: string | undefined): number {
  if (!value) return Number.NaN;
  if (/^0\d$/.test(value)) return numericScore(value);
  if (/^6\d$/.test(value)) return 6;
  return Number(value);
}
