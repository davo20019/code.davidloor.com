#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadPyodide } from "pyodide";
import yaml from "js-yaml";

const ROOT = path.resolve(process.cwd(), "problems/coding");

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    if (ka.length !== kb.length) return false;
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i] || !deepEqual(a[ka[i]], b[ka[i]])) return false;
    return true;
  }
  return false;
}

function validateLocal(spec, actual, expected) {
  switch (spec.kind) {
    case "exact": return deepEqual(actual, expected);
    case "set": {
      if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return false;
      const a = [...actual].map(JSON.stringify).sort();
      const b = [...expected].map(JSON.stringify).sort();
      return a.every((v, i) => v === b[i]);
    }
    case "set_of_lists": {
      if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return false;
      const a = actual.map((l) => JSON.stringify(l)).sort();
      const b = expected.map((l) => JSON.stringify(l)).sort();
      return a.every((v, i) => v === b[i]);
    }
    case "set_of_sets": {
      if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return false;
      const canon = (xs) => xs.map((l) => JSON.stringify([...l].sort((x, y) => (JSON.stringify(x) < JSON.stringify(y) ? -1 : 1)))).sort();
      const a = canon(actual), b = canon(expected);
      return a.every((v, i) => v === b[i]);
    }
    case "any_of":
      return Array.isArray(expected) && expected.some((c) => deepEqual(actual, c));
    case "linked_list_value_equal":
    case "tree_isomorphic":
      return deepEqual(actual, expected);
    default: return false;
  }
}

async function validateDir(dir) {
  const id = path.basename(dir);
  const metaRaw = yaml.load(await readFile(path.join(dir, "meta.yaml"), "utf8"));
  const meta = { id, ...metaRaw };
  const tests = JSON.parse(await readFile(path.join(dir, "tests.json"), "utf8"));
  const solution = await readFile(path.join(dir, "solution.py"), "utf8");
  const harness = await readFile(path.resolve(process.cwd(), "runner/src/python-harness.py"), "utf8");

  const py = await loadPyodide({});
  py.runPython(harness);
  py.globals.set("__USER_CODE__", solution);
  py.globals.set("__PROBLEM_META_JSON__", JSON.stringify(meta));
  py.globals.set("__TESTS_JSON__", JSON.stringify(tests));
  const result = py.runPython("run_problem(__USER_CODE__, __PROBLEM_META_JSON__, __TESTS_JSON__)");
  const perTest = JSON.parse(String(result));

  let failed = 0;
  for (const r of perTest) {
    const expected = tests[r.index].expected;
    const ok = !r.error && validateLocal(meta.validator, r.actual, expected);
    if (!ok) {
      failed++;
      console.error(`FAIL ${id} test ${r.index}: expected ${JSON.stringify(expected)} got ${JSON.stringify(r.actual)} ${r.error ?? ""}`);
    }
  }
  if (failed === 0) console.log(`OK   ${id}`);
  return failed;
}

const dirs = (await readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory());
let total = 0;
for (const d of dirs) total += await validateDir(path.join(ROOT, d.name));
process.exit(total > 0 ? 1 : 0);
