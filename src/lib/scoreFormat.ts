function formatTiebreakSide(value: string, opponent: string): string {
  if (!/^\d{2}$/.test(value)) return value;

  const tiebreakPoints = Number(value[1]);
  if (!Number.isFinite(tiebreakPoints)) return value;

  const games = value[0] === '0' || opponent === '7' ? 6 : Number(value[0]);
  if (!Number.isFinite(games)) return value;

  return `${games}(${tiebreakPoints})`;
}

export function formatScore(score: string): string {
  return score.replace(/\b(\d{2})-(\d)\b|\b(\d)-(\d{2})\b/g, (match, leftTiebreak: string | undefined, rightNormal: string | undefined, leftNormal: string | undefined, rightTiebreak: string | undefined) => {
    if (leftTiebreak && rightNormal) return `${formatTiebreakSide(leftTiebreak, rightNormal)}-${rightNormal}`;
    if (leftNormal && rightTiebreak) return `${leftNormal}-${formatTiebreakSide(rightTiebreak, leftNormal)}`;
    return match;
  });
}

export function scoreGames(value: string | undefined): number {
  if (!value) return Number.NaN;
  if (/^\d{2}$/.test(value)) return value[0] === '0' ? 6 : Number(value[0]);
  return Number(value);
}
