export function getRevealStart(problemId: string, now = Date.now()): number {
  if (typeof sessionStorage === "undefined") return now;
  const key = `code-start-${problemId}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return Number(existing);
  sessionStorage.setItem(key, String(now));
  return now;
}

export function canReveal(problemId: string, hadAtLeastOneRun: boolean, minMs = 60_000): boolean {
  if (!hadAtLeastOneRun) return false;
  const start = getRevealStart(problemId);
  return Date.now() - start >= minMs;
}
