# code.davidloor.com

> A small studio of coding and system-design interview problems. **Python** and **JavaScript** code is graded entirely in your browser — no accounts, no telemetry, no servers between you and the work.

**Live:** [code.davidloor.com](https://code.davidloor.com)

[![CI](https://github.com/davidloor/code.davidloor.com/actions/workflows/ci.yml/badge.svg)](https://github.com/davidloor/code.davidloor.com/actions/workflows/ci.yml)
&nbsp;
[![License: MIT](https://img.shields.io/badge/License-MIT-A8421B.svg)](./LICENSE)

---

## What this is

I built this as my own interview-prep notebook and made it public on the chance it's useful to anyone else. v1 covers:

- **20 coding problems** — the staples (two-pointer, hash maps, BFS, DP, linked lists, trees, graphs). Each problem has reference solutions in both Python and JavaScript, validated in CI.
- **7 system-design prompts** — open-ended, time-yourself prompts with reference talking points hidden until you ask for them.
- **Zero-backend execution** — Python runs in real CPython 3.12 via [Pyodide](https://pyodide.org) on WebAssembly; JavaScript runs in a sandboxed Web Worker. Both inside an iframe on a separate origin (`runner.code.davidloor.com`) with frozen network APIs and a strict CSP, so user code can't reach your storage or the network.
- **Declarative grading** — problems are pure data: `problem.md` + `tests.json` + `meta.yaml` + reference solutions. The harness handles deserialization, execution, timeout, and validation. Adding a problem is a folder + a PR.

## Why the architecture matters

The hard problem in a LeetCode clone is running untrusted code safely. The usual answer is server-side sandboxing (Judge0, Firecracker, gVisor), which means real ops, real cost, and real attack surface. This project does it differently:

- The browser already has a battle-hardened sandbox (WebAssembly + Web Workers).
- Pyodide is real CPython, not a transpiler — your `collections.deque` and `heapq` behave exactly as in any interview environment.
- Execution cost: free at any scale, because every visitor pays the CPU cost on their own machine.

Trade-off accepted: a client-side grader is trivially "cheatable" with devtools. For solo interview practice that's a non-issue; for a competitive platform you'd re-run winning submissions server-side.

## Run locally

In one terminal — start the runner subdomain locally via Wrangler:
```bash
cd runner
npm install                # installs esbuild, wrangler, tar
npm run install-pyodide    # downloads Pyodide 0.27 assets (~10 MB)
npm run build
npx wrangler dev --port 8788
```

In another terminal — start the Next.js dev server:
```bash
npm install
NEXT_PUBLIC_RUNNER_ORIGIN=http://localhost:8788 npm run dev
```

Open <http://localhost:3000>. Pick a problem, paste your solution, hit **Run**.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router (`output: 'export'`) |
| Hosting | Cloudflare Workers Static Assets (main app + runner) |
| Editor | CodeMirror 6 |
| Python runtime | Pyodide 0.27 (CPython 3.12 → WASM) in a Web Worker |
| JS runtime | Sandboxed Web Worker with frozen network APIs |
| Persistence | IndexedDB (code autosave, progress) + sessionStorage (reveal gate) |
| CI | GitHub Actions — lint, vitest, both-language problem validation, build |
| License | MIT |

## Repository tour

```
app/                # Next.js App Router pages
components/         # CodeEditor, OutputPanel, RunnerFrame, problem pages
lib/
  validators/       # 7 declarative validators (exact, set, set_of_sets, …)
  problems/         # ProblemSpec types + build-time manifest loader
  persistence/      # IDB autosave + sessionStorage reveal gate
runner/             # Sandbox subdomain — separate Wrangler deploy
  src/
    python-worker.ts, python-harness.py   # Pyodide-side runner
    js-worker.ts,     js-harness.ts       # JS-side runner
    api-freeze.ts                         # prototype-chain network API freeze
    runner-host.ts                        # iframe orchestrator
problems/           # all problem content (open-source contributions land here)
  coding/NNN-slug/{problem.md, starter.py, starter.js, solution.py, solution.js, tests.json, meta.yaml}
  system-design/NNN-slug/{problem.md, meta.yaml}
scripts/
  build-manifest.mjs       # generates lib/problems/manifest.ts at build
  validate-problem.mjs     # CI: runs both Python & JS reference solutions
docs/superpowers/
  specs/2026-05-20-code-platform-design.md     # full design spec
  plans/2026-05-20-code-platform.md            # implementation plan
```

The `docs/superpowers/` folder has the original design spec and the step-by-step implementation plan. They're useful if you want to see how the thing was built before it was built.

## Contributing

PR a new problem in five minutes — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Acknowledgements

Pyodide team for making real CPython run in a browser. CodeMirror 6 for an editor that's tiny *and* good on mobile. Anthropic's Claude Code for an unreasonable amount of help shipping this.

## License

[MIT](./LICENSE) © 2026 David Loor
