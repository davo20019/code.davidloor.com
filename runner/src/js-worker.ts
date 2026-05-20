import type { RunRequest, RunResponse, PerTestResult } from "../../lib/runner-protocol";
import { validate } from "../../lib/validators";
import { freezeNetworkApis } from "./api-freeze";
import { runTests } from "./js-harness";

// JS worker has no boot dependency; freeze immediately.
freezeNetworkApis(self as unknown as object);

self.addEventListener("message", (ev: MessageEvent<RunRequest>) => {
  const req = ev.data;
  if (!req || req.type !== "run") return;
  try {
    const raw = runTests(req.code, req.problem.meta, req.problem.tests);
    const perTest: PerTestResult[] = raw.map((r) => {
      const expected = req.problem.tests[r.index].expected;
      const passed = !r.error && validate(req.problem.meta.validator, r.actual, expected);
      return { ...r, passed, expected };
    });
    const totalMs = perTest.reduce((s, r) => s + r.elapsedMs, 0);
    (self as unknown as Worker).postMessage({ type: "result", requestId: req.requestId, perTest, totalMs } satisfies RunResponse);
  } catch (e) {
    const err = e as Error;
    (self as unknown as Worker).postMessage({ type: "error", requestId: req.requestId, message: err.message, stack: err.stack } satisfies RunResponse);
  }
});
