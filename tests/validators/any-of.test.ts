import { describe, it, expect } from "vitest";
import { anyOfEqual } from "@/lib/validators/any-of";

describe("any_of", () => {
  it("passes if actual matches any expected", () => {
    expect(anyOfEqual([1, 2], [[1, 2], [2, 1]])).toBe(true);
    expect(anyOfEqual([3, 4], [[1, 2], [2, 1]])).toBe(false);
  });
  it("requires expected to be an array", () => {
    expect(anyOfEqual(1, 1 as unknown)).toBe(false);
  });
});
