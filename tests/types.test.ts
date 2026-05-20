import { describe, it, expect } from "vitest";
import type { ProblemMeta } from "@/lib/problems/types";
import { PROTOCOL_VERSION } from "@/lib/runner-protocol";

describe("types", () => {
  it("protocol version is 1", () => { expect(PROTOCOL_VERSION).toBe(1); });
  it("ProblemMeta accepts a minimal shape", () => {
    const m: ProblemMeta = {
      id: "001-two-sum",
      title: "Two Sum",
      difficulty: "easy",
      tags: ["array"],
      topics: ["arrays"],
      entry: "twoSum",
      signature: { params: [{ array: "int" }, "int"], returns: { array: "int" } },
      validator: { kind: "set" },
      timeLimitMs: 5000,
    };
    expect(m.entry).toBe("twoSum");
  });
});
