import { describe, it, expect, beforeEach } from "vitest";
import { canReveal, getRevealStart } from "@/lib/persistence/session";

const memStore: Record<string, string> = {};
(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
  getItem: (k: string) => (k in memStore ? memStore[k] : null),
  setItem: (k: string, v: string) => { memStore[k] = v; },
  removeItem: (k: string) => { delete memStore[k]; },
  clear: () => { for (const k of Object.keys(memStore)) delete memStore[k]; },
  key: () => null,
  length: 0,
} as unknown as Storage;

describe("reveal gate", () => {
  beforeEach(() => { for (const k of Object.keys(memStore)) delete memStore[k]; });
  it("requires both a run and elapsed time", () => {
    expect(canReveal("p1", false, 1000)).toBe(false);
    expect(canReveal("p1", true, 1_000_000)).toBe(false);
  });
  it("persists start timestamp across calls", () => {
    const t1 = getRevealStart("p1", 1000);
    const t2 = getRevealStart("p1", 2000);
    expect(t1).toBe(t2);
  });
});
