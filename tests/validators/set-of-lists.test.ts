import { describe, it, expect } from "vitest";
import { setOfListsEqual } from "@/lib/validators/set-of-lists";

describe("set_of_lists", () => {
  it("outer unordered, inner ordered", () => {
    expect(setOfListsEqual([[1, 2], [3, 4]], [[3, 4], [1, 2]])).toBe(true);
    expect(setOfListsEqual([[1, 2], [3, 4]], [[2, 1], [3, 4]])).toBe(false);
  });
  it("rejects non-2D inputs", () => {
    expect(setOfListsEqual([1, 2], [1, 2] as unknown)).toBe(false);
  });
});
