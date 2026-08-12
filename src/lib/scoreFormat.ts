function isEncodedMatchTiebreak(value: string): boolean {
  return /^0\d$/.test(value) || /^1\d$/.test(value);
}

function matchTiebreakPoints(value: string): number {
  if (/^0\d$/.test(value)) return 10;
  return Number(value);
}

function formatMatchTiebreak(left: string, right: string): string | null {
  const isMatchTiebreak = isEncodedMatchTiebreak(left) || isEncodedMatchTiebreak(right) || Number(left) >= 10 || Number(right) >= 10;
  if (!isMatchTiebreak) return null;

  const leftPoints = matchTiebreakPoints(left);
  const rightPoints = matchTiebreakPoints(right);
  if (!Number.isFinite(leftPoints) || !Number.isFinite(rightPoints)) return null;

  return `[${Math.max(leftPoints, rightPoints)}-${Math.min(leftPoints, rightPoints)}]`;
}

function formatTiebreakSide(value: string, opponent: string): string {
  if (!/^\d{2}$/.test(value)) return value;

  const tiebreakPoints = Number(value[1]);
  if (!Number.isFinite(tiebreakPoints)) return value;

  const games = value[0] === '0' || opponent === '7' ? 6 : Number(value[0]);
  if (!Number.isFinite(games)) return value;

  return `${games}(${tiebreakPoints})`;
}

export function formatScore(score: string): string {
  return score.replace(/\b(\d{1,2})-(\d{1,2})\b/g, (match, left: string, right: string) => {
    const matchTiebreak = formatMatchTiebreak(left, right);
    if (matchTiebreak) return matchTiebreak;

    if (/^\d{2}$/.test(left) && /^\d$/.test(right)) return `${formatTiebreakSide(left, right)}-${right}`;
    if (/^\d$/.test(left) && /^\d{2}$/.test(right)) return `${left}-${formatTiebreakSide(right, left)}`;
    return match;
  });
}

export function scoreGames(value: string | undefined): number {
  if (!value) return Number.NaN;
  if (isEncodedMatchTiebreak(value) || Number(value) >= 10) return matchTiebreakPoints(value);
  if (/^\d{2}$/.test(value)) return Number(value[0]);
  return Number(value);
}
