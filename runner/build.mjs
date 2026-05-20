import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNNER_ROOT = __dirname;
const DIST = path.join(RUNNER_ROOT, "dist");

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

// Static files from public/.
await cp(path.join(RUNNER_ROOT, "public"), DIST, { recursive: true });
// Pyodide static assets.
await cp(path.join(RUNNER_ROOT, "pyodide-assets"), path.join(DIST, "pyodide"), { recursive: true });
// Python harness as a fetchable text asset.
await cp(path.join(RUNNER_ROOT, "src/python-harness.py"), path.join(DIST, "python-harness.py"));

const common = { bundle: true, format: "esm", target: "es2022", platform: "browser", sourcemap: true };
await build({ ...common, entryPoints: [path.join(RUNNER_ROOT, "src/runner-host.ts")], outfile: path.join(DIST, "runner-host.js") });
await build({ ...common, entryPoints: [path.join(RUNNER_ROOT, "src/python-worker.ts")], outfile: path.join(DIST, "python-worker.js") });
await build({ ...common, entryPoints: [path.join(RUNNER_ROOT, "src/js-worker.ts")], outfile: path.join(DIST, "js-worker.js") });

console.log("runner build complete →", DIST);
