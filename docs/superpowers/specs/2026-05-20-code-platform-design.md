# code.davidloor.com — Design Spec

**Date:** 2026-05-20
**Status:** Approved
**Audience:** Solo (author) for v1, designed to extend to public multi-user in v2.

## Goal

An open-source coding interview prep platform at `code.davidloor.com`. The author's primary use is preparing for Python interviews; the platform supports both Python and JavaScript from day one, plus a system-design / critical-thinking section for open-ended practice.

## Non-goals (v1)

- No user accounts, cloud submissions, or leaderboards.
- No contests or competitive features.
- No languages other than Python and JavaScript.
- No discussions, comments, or other community features.
- No paid features or monetization.

These are revisited in the v2 forward path below.

## Architecture overview

```
                         code.davidloor.com (main app)
                         ┌─────────────────────────────┐
                         │ Next.js 16 App Router       │
                         │ on Cloudflare Workers       │
                         │ via @opennextjs/cloudflare  │
                         │  - Problem list / problem   │
                         │    page / Monaco editor     │
                         │  - Local progress (IDB)     │
                         └──────────────┬──────────────┘
                                        │ postMessage
                                        ▼
                    runner.code.davidloor.com (sandbox subdomain)
                         ┌─────────────────────────────┐
                         │ Static HTML page hosting a  │
                         │ Web Worker:                 │
                         │  - Pyodide (Python)         │
                         │  - JS runtime               │
                         │  - 5s wall-clock timeout    │
                         └─────────────────────────────┘
```

The runner subdomain is the security boundary. All user/contributor code executes only inside an `<iframe sandbox="allow-scripts">` loaded from `runner.code.davidloor.com`. The main app has no direct execution path; it speaks to the runner via `postMessage` only.

## Stack

- **Framework:** Next.js 16 App Router.
- **Host:** Cloudflare Workers via `@opennextjs/cloudflare`. Mirrors the `examcoachai` deploy approach (`scripts/safe-deploy.mjs`).
- **Editor:** Monaco.
- **UI:** Tailwind + shadcn/ui.
- **Python runtime:** Pyodide (CPython 3.12 on WebAssembly) in a Web Worker.
- **JS runtime:** Dynamic JS evaluation inside a Web Worker (see Execution model below).
- **Local persistence (v1):** IndexedDB for user code, notes, and completion state. No backend storage.
- **License:** MIT.

## The runner subdomain (security boundary)

Why a separate origin: an `<iframe sandbox>` on the same origin still shares cookies and storage with the parent unless `allow-same-origin` is omitted *and* the iframe is served from a different origin (browsers treat sandboxed same-origin iframes as same-origin for storage). Serving the runner from `runner.code.davidloor.com` guarantees true origin isolation: even if a malicious problem PR ships test code that reads `document.cookie` or `localStorage`, it sees an empty runner-subdomain store with no main-app secrets.

Properties:

- Served as static assets by a separate Cloudflare Worker route bound to `runner.code.davidloor.com`.
- Page contains only: bootstrapping JS, a Web Worker, Pyodide assets (lazy-loaded from CDN or self-hosted), and the postMessage protocol.
- No cookies set. No third-party scripts. CSP locked to `'self'` plus the Pyodide asset origin.
- Main app embeds `<iframe src="https://runner.code.davidloor.com/" sandbox="allow-scripts">`.
- Communication protocol: a small, versioned message schema (`run`, `result`, `error`, `progress`). Specified in detail in the implementation plan.

## Execution model

Every "Run" submits one request to the runner iframe:

```
{
  type: "run",
  language: "python" | "javascript",
  code: string,                  // user code
  tests: TestCase[],             // from problem's tests.json
  harness: string,               // small per-language wrapper that imports
                                 // user code and runs each test case
  timeLimitMs: number            // default 5000
}
```

The runner Worker:

1. For Python: ensures Pyodide is loaded (warm after first call), evaluates the harness with user code injected via Pyodide's `runPython`.
2. For JS: compiles the harness + user code into a dynamic function via the standard dynamic-evaluation API, scoped to the Worker (no DOM, no `window`).
3. Iterates test cases, captures stdout, return value, exceptions, and runtime per case.
4. Enforces wall-clock timeout via a parent-side `setTimeout` that terminates the Worker.
5. Replies with a `result` message containing per-test pass/fail, captured output, and total runtime.

The harness is part of the problem repo so it can evolve per problem if needed, but ships as a default per language. The dynamic JS evaluation is intentional (running user code is the product) and is isolated by the iframe + subdomain boundary; it never executes content that the user did not author or knowingly accept from a problem PR.

## Problem repository shape

Problems live in the same git repo as the app:

```
problems/
  coding/
    001-two-sum/
      problem.md         # statement + examples + constraints
      starter.py
      starter.js
      tests.json         # language-agnostic [{ input, expected }, ...]
      solution.py        # reference solution (hidden in UI)
      solution.js
      meta.yaml          # difficulty, tags, topics, time_limit_ms
  system-design/
    001-design-url-shortener/
      problem.md         # prompt, hints, talking points
      meta.yaml          # est_minutes, tags
```

Design rules:

- `tests.json` is language-agnostic. The same `{input, expected}` pairs grade both Python and JS submissions.
- Adding a problem is a folder + a PR; no app code changes needed.
- CI validates every new/changed coding problem by running the reference solutions against `tests.json` in both languages.

## v1 problem set

**Coding (20 problems, Python + JS each):**

1. Two Sum
2. Valid Parentheses
3. Merge Two Sorted Lists
4. Best Time to Buy and Sell Stock
5. Valid Anagram
6. Reverse Linked List
7. Maximum Subarray
8. Climbing Stairs
9. Binary Search
10. Linked List Cycle
11. Number of Islands
12. Group Anagrams
13. Container With Most Water
14. 3Sum
15. Longest Substring Without Repeating Characters
16. Search in Rotated Sorted Array
17. Trapping Rain Water
18. Word Break
19. Course Schedule
20. Lowest Common Ancestor of a BST

**System design (7 prompts, no auto-grading):**

- URL Shortener
- Rate Limiter
- News Feed
- Chat App
- Distributed Cache
- Web Crawler
- Pastebin

Each system-design problem has: prompt, suggested timer, hints, and a reveal-on-demand reference of expected talking points.

## UX

### Coding problem page
- Split layout: statement (left) / Monaco editor (right) / output panel (bottom).
- Language tab (Python | JS). Switching swaps starter code; user code is autosaved per `(problem, language)` in IndexedDB.
- "Run" sends current code + tests to the runner iframe; results stream into the output panel with per-test status, stdout, error messages, runtime.
- "Reveal solution" available after first attempt.
- "Mark complete" stores progress locally.

### System design problem page
- Prompt + visible timer (default per problem).
- Freeform notes pane, autosaved to IndexedDB.
- "Reveal reference points" button (typically used after timer ends).

### Problem list
- Grouped tabs: Coding / System Design.
- Within coding: filterable by topic and difficulty.
- Completion checkmarks driven by local IDB state.

## Security posture

| Risk | Mitigation |
|---|---|
| Malicious problem PR exfiltrates user state | Runner subdomain + sandboxed iframe = no shared storage with main app |
| Infinite loop in user code | Web Worker with 5s wall-clock timeout; terminate worker on overrun |
| XSS via problem Markdown | Sanitize all problem Markdown with DOMPurify; never set raw HTML |
| Pyodide sandbox escape | Out of scope: WASM sandbox is browser-vendor responsibility |
| Cost-bomb (server compute abuse) | Not applicable: execution happens in the user's browser |
| Grader spoofing | Acceptable for v1 (personal practice). Re-verify server-side only if v2 adds contests |

## Open-source story

- MIT license.
- Public GitHub repo.
- README explains: run locally with `npm dev`, contribute a problem by adding a folder.
- GitHub Action runs `scripts/validate-problem.mjs` on every PR: for each added/changed coding problem, runs the reference solutions against `tests.json` in both languages via the same runner harness used in the app.
- Deploys to Cloudflare Workers on merges to `main` via GitHub Actions.

## v2 forward path (designed-for, not built)

When and only when there's reason to go public:

- Add Worker routes `/api/auth/*` (Clerk on the Vercel/Cloudflare Marketplace or Cloudflare Access) and `/api/submissions/*`.
- Add a database: Turso (libSQL) or Cloudflare D1. Schema: users, submissions, problem-completion.
- Cross-device progress sync replaces (but does not remove) IDB local storage.
- If/when adding non-Python/JS languages (C++, Java, Go): introduce a single self-hosted Piston instance on a small Hetzner or Cloud Run box. The runner adapter swaps from postMessage-to-iframe to fetch-to-Piston for those languages only.
- Add contest mode: server-side re-execution of winning submissions to defeat client-side spoofing.

None of these require touching the v1 problem repo shape or the core runner protocol.

## Effort estimate

| Component | Effort |
|---|---|
| Scaffolding, Next.js, OpenNext deploy pipeline (cribbed from examcoachai) | ~0.5 day |
| Runner subdomain: iframe + Web Worker + Pyodide + postMessage protocol | ~1 day |
| JS runner branch in the same worker | ~2 hours |
| Problem list page, problem page, Monaco wiring, IDB persistence | ~0.5 day |
| 20 coding problems + 7 system-design prompts (authoring + tests) | ~1-2 days |

| CI validate-problem script + GitHub Actions deploy | ~0.5 day |
| Polish, accessibility, mobile layout | ~0.5 day |
| **Total** | ~1 focused week or ~3 weekends |

## Decisions deferred to the implementation plan

- Exact `postMessage` protocol schema and version.
- Pyodide asset hosting: CDN (`cdn.jsdelivr.net`) vs self-hosted under `runner.code.davidloor.com`.
- Test-case input/output format for non-trivial types (e.g., linked lists, binary trees) — likely a small per-problem deserializer.
- Monaco vs CodeMirror 6 final pick (default: Monaco; revisit if bundle size becomes a problem on Workers).
- Theme and visual design.
