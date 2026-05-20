import { describe, it, expect } from "vitest";
import { setOfSetsEqual } from "@/lib/validators/set-of-sets";

describe("set_of_sets (3Sum-style)", () => {
  it("both outer and inner unordered", () => {
    expect(setOfSetsEqual([[1, 2, 3], [4, 5, 6]], [[6, 5, 4], [3, 2, 1]])).toBe(true);
    expect(setOfSetsEqual([[1, 2]], [[1, 3]])).toBe(false);
  });
});
