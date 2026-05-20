export function setOfSetsEqual(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
  if (actual.length !== expected.length) return false;
  if (!actual.every(Array.isArray) || !expected.every(Array.isArray)) return false;
  const canon = (lists: unknown[][]) =>
    lists
      .map((l) =>
        JSON.stringify(
          [...l].sort((x, y) => (JSON.stringify(x) < JSON.stringify(y) ? -1 : 1)),
        ),
      )
      .sort();
  const a = canon(actual as unknown[][]);
  const b = canon(expected as unknown[][]);
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
