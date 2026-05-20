# code.davidloor.com — Design Spec

**Date:** 2026-05-20
**Status:** Approved (revised after technical review 2026-05-20)
**Audience:** Solo (author) for v1, designed to extend to public multi-user in v2.

## Goal

An open-source coding interview prep platform at `code.davidloor.com`. The author's primary use is preparing for Python interviews; the platform supports both Python and JavaScript from day one, plus a system-design / critical-thinking section for open-ended practice.

## Non-goals (v1)

- No user accounts, cloud submissions, or leaderboards.
- No contests or competitive features.
- No languages other than Python and JavaScript.
- No discussions, comments, or other community features.
- No paid features or monetization.

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
                         │ Static HTML hosting a       │
                         │ Web Worker:                 │
                         │  - Pyodide (Python)         │
                         │  - JS runtime               │
                         │  - In-frame wall-clock      │
                         │    timeout enforcement      │
                         │  - connect-src 'self' CSP   │
                         └─────────────────────────────┘
```

The runner subdomain is the security boundary. All user code executes inside an iframe loaded from `runner.code.davidloor.com`. The main app speaks to the runner via `postMessage` only.

## Stack

- **Framework:** Next.js 16 App Router.
- **Host:** Cloudflare Workers via `@opennextjs/cloudflare`.
  - Requires `compatibility_flags = ["nodejs_compat"]` in `wrangler.toml`.
  - Requires `compatibility_date >= "2024-09-23"`.
  - Verify Worker bundle size against the active Cloudflare plan. Keep Pyodide and Monaco assets **out** of the Worker bundle; serve them as static assets via Workers Static Assets binding so only the Next.js server code counts against the Worker script limit.
- **Editor:** Monaco.
- **UI:** Tailwind + shadcn/ui.
- **Python runtime:** Pyodide (CPython 3.12 on WebAssembly), bundled as static assets on the runner subdomain.
- **JS runtime:** Dynamic JS evaluation inside a Web Worker (see Execution model).
- **Local persistence (v1):** IndexedDB for user code, notes, and completion state. No backend storage.
- **License:** MIT.

## The runner subdomain (security boundary)

Two boundaries combine to contain user-submitted code:

1. **Sandboxed iframe on a different origin.** Main app embeds:
   ```html
   <iframe src="https://runner.code.davidloor.com/runner.html"
           sandbox="allow-scripts allow-same-origin">
   </iframe>
   ```
   `allow-same-origin` is intentional here: the iframe needs IndexedDB on its own origin (Pyodide caches wheels). Because the runner is on a **different origin** from the main app, cross-origin policy prevents the iframe from reading main-app cookies, localStorage, or IndexedDB. The `event.origin` on incoming `postMessage` calls is the runner subdomain (not `"null"`), so the main app validates strictly.

2. **Tight CSP on the runner origin.** Self-hosted Pyodide assets + `connect-src 'self'` block all **external** network exfiltration: user code cannot `fetch`/XHR/WebSocket to anything outside the runner subdomain. User code can still hit *runner-origin* URLs (e.g., `fetch('/x?leak=...')`), which means any access logs/analytics on the runner origin must be treated as sensitive (see runner operational policy below).

### CSP per origin

**Main app (`code.davidloor.com`):**

Next.js App Router emits inline hydration scripts, so a strict CSP requires a **per-request nonce** set in middleware and threaded onto every framework-rendered `<script>` tag (this is the official Next.js pattern). Monaco loads syntax workers, so `worker-src 'self' blob:` is required.

```
default-src 'self';
script-src  'self' 'nonce-<per-request>' 'strict-dynamic';
style-src   'self' 'unsafe-inline';                 # Tailwind / shadcn runtime styles
worker-src  'self' blob:;                           # Monaco workers
img-src     'self' data:;
frame-src   https://runner.code.davidloor.com;
connect-src 'self';
base-uri    'none';
form-action 'self';
```

If nonce-based CSP proves flaky on OpenNext during implementation, fallback is `script-src 'self' 'unsafe-inline'` — documented as a known weakening and revisited before going public.

**Runner subdomain (`runner.code.davidloor.com`):**

Worker scripts are served as static assets (e.g., `/runner-worker.js`) from the runner origin. **Blob workers are forbidden** — they have inconsistent CSP-inheritance behavior across browsers, and a non-blob worker is also easier to reason about. CSP applies identically to `/runner.html`, `/runner-worker.js`, and any Pyodide-loaded script.

```
default-src 'none';
script-src  'self' 'unsafe-eval' 'wasm-unsafe-eval';   # mandatory for Pyodide + JS exec
worker-src  'self';                                    # no blob: — static worker only
connect-src 'self';                                    # NO external endpoints
img-src     'none';
style-src   'self';
font-src    'self';
base-uri    'none';
form-action 'none';
```

**Runner operational policy** (because `connect-src 'self'` only blocks *external* exfiltration):

- Runner origin serves static assets only; no API routes, no analytics, no third-party scripts.
- The runner Worker (Cloudflare Worker, not Web Worker) returns 404 for any path not in an explicit static allowlist. Query strings are ignored / not logged.
- Cloudflare access logs on the runner subdomain are treated as sensitive: not exported to third-party analytics, and request logging on this subdomain is minimized in the Cloudflare project settings.

The runner has no cookies, no third-party scripts, and serves no HTML to humans — only the iframe.

## Execution model

### Trusted harness, declarative tests

User code is the only untrusted code that runs in the sandbox. **Problems do not ship executable harnesses.** A single trusted harness per language lives in the app repo and is bundled into the runner. Per-problem variability is fully declarative.

Every "Run" submits one request to the runner iframe:

```ts
type RunRequest = {
  type: "run";
  protocolVersion: 1;
  language: "python" | "javascript";
  code: string;                       // user code (the only dynamic content)
  problem: ProblemSpec;               // declarative — see below
  timeLimitMs: number;                // default 5000
};

type ProblemSpec = {
  id: string;                         // e.g. "001-two-sum"
  entry: string;                      // function name to call, e.g. "twoSum"
  signature: {
    params: ParamType[];              // typed: int, int[], string, linked_list<int>,
                                      //        tree<int>, grid<int>, etc.
    returns: ParamType;
  };
  validator: ValidatorSpec;           // exact | set | set_of_sets | any_of |
                                      //   tree_isomorphic | linked_list_value_equal
  tests: TestCase[];                  // [{ input: any[], expected: any }, ...]
};
```

The runner Worker:

1. Loads Pyodide once (warm on first run), or initializes the JS Worker scope.
2. For each test case:
   - Deserializes typed inputs (e.g., `linked_list<int> [1,2,3]` → linked-list nodes in the target language).
   - Invokes the user's entry function with deserialized arguments.
   - Captures stdout, exceptions, and elapsed time.
   - Serializes the return value.
   - Runs the declared `validator` to compare actual vs expected.
3. Replies with a `result` message: per-test pass/fail, captured stdout, error messages, runtime.

### Timeout and worker lifecycle

- The **runner iframe owns the Worker** and enforces the wall-clock timeout via its own `setTimeout`. On overrun the iframe terminates the Worker and returns a `result` with `timed_out: true`.
- The **main app** does not own the Worker. It can:
  - Send a `cancel` postMessage (cooperative).
  - Apply a longer safety timeout (e.g., 8s) and **detach the iframe** as a hard escalation, recreating it on the next run.
- On a fresh worker boot, Pyodide reloads from the runner-origin IndexedDB cache; first-ever load is from runner-origin static assets.

### Built-in validators

Each validator is implemented once in the app repo (not per problem):

| Validator | Use |
|---|---|
| `exact` | Strict deep-equal of primitives or ordered lists (order matters). |
| `set` | Flat list compared as a multiset (outer order doesn't matter). |
| `set_of_lists` | Outer collection unordered; inner lists ordered (e.g., a list of paths where path order within each path matters). |
| `set_of_sets` | Outer and inner both unordered (canonical 3Sum: any triplet order, any output order). |
| `any_of` | Multiple acceptable answers explicitly listed in the test case. |
| `linked_list_value_equal` | Compare linked-list outputs by value sequence, regardless of node identity. |
| `tree_isomorphic` | Compare BST/binary-tree outputs structurally. |

If a problem ever needs a custom validator (rare), it adds an entry to a fixed allowlist in the repo; the runner code change is reviewed and bundled into the trusted harness. Problems still ship no executable code.

## Problem repository shape

Problems live in the same git repo as the app:

```
problems/
  coding/
    001-two-sum/
      problem.md         # statement + examples + constraints
      starter.py
      starter.js
      tests.json         # ProblemSpec.tests
      solution.py        # reference solution (hidden in UI)
      solution.js
      meta.yaml          # difficulty, tags, topics, entry name,
                         # signature, validator, time_limit_ms
  system-design/
    001-design-url-shortener/
      problem.md         # prompt, hints, talking points
      meta.yaml          # est_minutes, tags
```

Design rules:

- A problem is data: Markdown + JSON + YAML + a reference solution per language. **No problem ships executable harness code.**
- The same `tests.json` grades both Python and JS submissions.
- Adding a problem is a folder + a PR; no app code changes needed (unless a new validator type is justified).

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

URL Shortener, Rate Limiter, News Feed, Chat App, Distributed Cache, Web Crawler, Pastebin. Each has prompt, suggested timer, hints, and a reveal-on-demand reference of expected talking points.

## UX

### Coding problem page
- Split layout: statement (left) / Monaco editor (right) / output panel (bottom).
- Language tab (Python | JS). Switching swaps starter code; user code is autosaved per `(problem, language)` in IndexedDB.
- "Run" sends current code + problem spec to the runner iframe; results stream into the output panel with per-test status, stdout, error messages, runtime.
- "Reveal solution" gated on at least one run attempt **and** ≥ 60s elapsed since the page first loaded; a one-line warning appears before the reveal.
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
| Malicious problem PR exfiltrates user state | (1) Problems ship no executable code. (2) Runner is on a separate origin under a strict CSP. |
| Exfiltration via fetch from sandbox | `connect-src 'self'` on runner; Pyodide assets self-hosted under the runner origin. No external endpoints reachable. |
| Infinite loop in user code | Iframe-owned Web Worker with 5s wall-clock timeout; iframe terminates the Worker. Main app applies an 8s safety timeout and detaches the iframe as escalation. |
| XSS via problem Markdown | Sanitize all problem Markdown with DOMPurify; never set raw HTML. |
| Pyodide / WASM sandbox escape | Out of scope: browser-vendor sandbox is the trust anchor. |
| Cost-bomb (server compute abuse) | Not applicable: execution happens in the user's browser. |
| Grader spoofing (devtools) | Acceptable for v1 (personal practice). Re-verify server-side only if v2 adds contests. |

## Open-source story

- MIT license.
- Public GitHub repo.
- README explains: run locally with `npm dev`, contribute a problem by adding a folder.
- **CI architecture:** GitHub Actions runs `scripts/validate-problem.mjs` using the **`pyodide` npm package running in Node.js** (same WASM build as the browser, per Pyodide's official Node.js usage docs) plus standard Node for JS. The validator imports the same harness modules that the runner bundles, deserializes test inputs identically, and runs the reference solutions. Drift surface vs the browser runtime is small (Pyodide is the same WASM artifact; JS runtime semantics are equivalent for problem-scoped code with no DOM access).
- Optional follow-up: a nightly Playwright job that re-runs the same problems through the real browser runner end-to-end, catching any divergence. Not required for v1.
- Deploys to Cloudflare Workers on merges to `main` via GitHub Actions (`opennextjs-cloudflare build && wrangler deploy`).

## v2 forward path (designed-for, not built)

When and only when there's reason to go public:

- Add Worker routes `/api/auth/*` (Clerk on the Vercel/Cloudflare Marketplace or Cloudflare Access) and `/api/submissions/*`.
- Add a database: Turso (libSQL) or Cloudflare D1. Schema: users, submissions, problem-completion.
- Cross-device progress sync layered on top of (not replacing) IDB local storage.
- If/when adding non-Python/JS languages: introduce a single self-hosted Piston instance. The runner protocol gains a server-runner adapter for those languages only; the trusted-harness/declarative-test contract is unchanged.
- Add contest mode: server-side re-execution of declared winners to defeat client-side spoofing.

None of these require changes to the v1 runner protocol or problem repo shape.

## Effort estimate (realistic)

| Component | Effort |
|---|---|
| Scaffolding, Next.js, OpenNext deploy pipeline | ~1 day |
| Runner subdomain: iframe + Web Worker + Pyodide self-hosting + CSP + postMessage protocol v1 + cross-browser smoke | ~3 days |
| JS runner branch in the same worker | ~0.5 day |
| Typed signature system + 6 built-in validators + linked-list/tree/grid serializers (per language) | ~2 days |
| Problem list page, problem page, Monaco wiring, IDB persistence, autosave | ~1 day |
| 20 coding problems (Python + JS solutions, signatures, validators, tests) + 7 system-design prompts | ~3-4 days |
| CI: Pyodide-Node validator + GitHub Actions deploy | ~1 day |
| Polish, accessibility, mobile layout, CSP debugging tail | ~1 day |
| **Total** | **~12-14 focused days (~2 weeks) or ~5-6 weekends** |

## Decisions deferred to the implementation plan

- Exact `postMessage` protocol schema, version negotiation, and error taxonomy.
- Final Pyodide version pin and which Python packages preload at boot.
- Monaco vs CodeMirror 6 final pick (default: Monaco; revisit if Worker size becomes a problem).
- Theme and visual design.
- Whether to ship the optional Playwright nightly job in v1 or punt to v1.1.
