export function setEqual(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
  if (actual.length !== expected.length) return false;
  const a = [...actual].map((x) => JSON.stringify(x)).sort();
  const b = [...expected].map((x) => JSON.stringify(x)).sort();
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
