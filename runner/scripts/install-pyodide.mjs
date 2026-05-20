#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as tar from "tar";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNNER_ROOT = path.resolve(__dirname, "..");
const VERSION = "0.27.0";
const TGT = path.join(RUNNER_ROOT, "pyodide-assets");

if (existsSync(path.join(TGT, "pyodide.js"))) {
  console.log("pyodide assets already present");
  process.exit(0);
}

mkdirSync(TGT, { recursive: true });

// npm pack pyodide@<version> --pack-destination <RUNNER_ROOT>
const out = execFileSync(
  "npm",
  ["pack", `pyodide@${VERSION}`, "--pack-destination", RUNNER_ROOT],
  { encoding: "utf8" },
).trim();
const tarball = path.join(RUNNER_ROOT, out.split("\n").pop().trim());

await tar.x({ file: tarball, cwd: RUNNER_ROOT });
const extracted = path.join(RUNNER_ROOT, "package");
// Move everything from package/ into pyodide-assets/.
const { readdirSync, statSync, cpSync } = await import("node:fs");
for (const name of readdirSync(extracted)) {
  cpSync(path.join(extracted, name), path.join(TGT, name), { recursive: true });
}
rmSync(extracted, { recursive: true, force: true });
rmSync(tarball, { force: true });
console.log("pyodide assets extracted to", TGT);
