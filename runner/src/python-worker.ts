import type { RunRequest, RunResponse, PerTestResult } from "../../lib/runner-protocol";
import { validate } from "../../lib/validators";
import { freezeNetworkApis } from "./api-freeze";

declare const loadPyodide: (opts: { indexURL: string }) => Promise<{
  runPython: (src: string) => unknown;
  globals: { set: (k: string, v: unknown) => void };
}>;

// importScripts is permitted on first boot to load Pyodide; it is removed by
// freezeNetworkApis() AFTER boot so user code cannot use it.
// @ts-ignore -- importScripts is global in workers
importScripts("/pyodide/pyodide.js");

let bootPromise: Promise<{ runPython: (s: string) => unknown; globals: { set: (k: string, v: unknown) => void } }> | null = null;

async function boot() {
  const pyodide = await loadPyodide({ indexURL: "/pyodide/" });
  const harnessSrc = await (await fetch("/python-harness.py")).text();
  pyodide.runPython(harnessSrc);
  freezeNetworkApis(self as unknown as object);
  return pyodide;
}

self.addEventListener("message", async (ev: MessageEvent<RunRequest>) => {
  const req = ev.data;
  if (!req || req.type !== "run") return;
  try {
    if (!bootPromise) {
      (self as unknown as Worker).postMessage({
        type: "warming", requestId: req.requestId, language: "python", reason: "first_boot",
      } satisfies RunResponse);
      bootPromise = boot();
    }
    const pyodide = await bootPromise;
    pyodide.globals.set("__USER_CODE__", req.code);
    pyodide.globals.set("__PROBLEM_META_JSON__", JSON.stringify(req.problem.meta));
    pyodide.globals.set("__TESTS_JSON__", JSON.stringify(req.problem.tests));
    const resultJson = pyodide.runPython("run_problem(__USER_CODE__, __PROBLEM_META_JSON__, __TESTS_JSON__)");
    const perTestRaw = JSON.parse(String(resultJson)) as Array<{
      index: number; actual: unknown; stdout: string; error?: string; elapsedMs: number;
    }>;
    const perTest: PerTestResult[] = perTestRaw.map((p) => {
      const expected = req.problem.tests[p.index].expected;
      const passed = !p.error && validate(req.problem.meta.validator, p.actual, expected);
      return { index: p.index, passed, actual: p.actual, expected, stdout: p.stdout, error: p.error, elapsedMs: p.elapsedMs };
    });
    const totalMs = perTest.reduce((s, r) => s + r.elapsedMs, 0);
    (self as unknown as Worker).postMessage({ type: "result", requestId: req.requestId, perTest, totalMs } satisfies RunResponse);
  } catch (e) {
    const err = e as Error;
    (self as unknown as Worker).postMessage({ type: "error", requestId: req.requestId, message: err.message, stack: err.stack } satisfies RunResponse);
  }
});
