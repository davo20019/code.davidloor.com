import { describe, it, expect } from "vitest";
import { getAll, getById } from "@/lib/problems/loader";
describe("loader", () => {
  it("manifest is an array", () => { expect(Array.isArray(getAll())).toBe(true); });
  it("getById returns undefined for missing ids", () => { expect(getById("nope")).toBeUndefined(); });
});
