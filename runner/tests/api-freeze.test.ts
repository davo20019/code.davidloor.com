/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from "vitest";
import { freezeNetworkApis } from "../src/api-freeze";

describe("api-freeze", () => {
  it("removes fetch on globalThis", () => {
    expect(typeof (globalThis as { fetch?: unknown }).fetch).toBe("function");
    freezeNetworkApis(globalThis);
    expect((globalThis as { fetch?: unknown }).fetch).toBeUndefined();
  });
});
