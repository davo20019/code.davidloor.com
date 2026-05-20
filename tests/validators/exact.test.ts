import { describe, it, expect } from "vitest";
import { exactEqual } from "@/lib/validators/exact";

describe("exact", () => {
  it("primitives", () => {
    expect(exactEqual(1, 1)).toBe(true);
    expect(exactEqual("a", "a")).toBe(true);
    expect(exactEqual(true, false)).toBe(false);
    expect(exactEqual(null, null)).toBe(true);
  });
  it("arrays (order matters)", () => {
    expect(exactEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(exactEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });
  it("nested arrays", () => {
    expect(exactEqual([[1, 2], [3]], [[1, 2], [3]])).toBe(true);
    expect(exactEqual([[1, 2], [3]], [[1, 2], [4]])).toBe(false);
  });
  it("objects (key order ignored)", () => {
    expect(exactEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });
});
