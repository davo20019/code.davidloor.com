import { deepEqual } from "./shared";
export function exactEqual(actual: unknown, expected: unknown): boolean {
  return deepEqual(actual, expected);
}
