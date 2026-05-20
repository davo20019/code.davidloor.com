export function setOfListsEqual(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
  if (actual.length !== expected.length) return false;
  if (!actual.every(Array.isArray) || !expected.every(Array.isArray)) return false;
  const a = (actual as unknown[][]).map((x) => JSON.stringify(x)).sort();
  const b = (expected as unknown[][]).map((x) => JSON.stringify(x)).sort();
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
