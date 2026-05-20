import { deepEqual } from "./shared";
export function anyOfEqual(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(expected)) return false;
  return expected.some((cand) => deepEqual(actual, cand));
}
