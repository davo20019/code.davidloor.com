import { describe, it, expect } from "vitest";
import { setEqual } from "@/lib/validators/set";

describe("set (multiset)", () => {
  it("equal regardless of order", () => {
    expect(setEqual([1, 2, 3], [3, 2, 1])).toBe(true);
    expect(setEqual(["a", "b"], ["b", "a"])).toBe(true);
  });
  it("counts must match", () => {
    expect(setEqual([1, 1, 2], [1, 2, 2])).toBe(false);
  });
  it("non-array inputs are not equal", () => {
    expect(setEqual([1], 1 as unknown)).toBe(false);
  });
});
