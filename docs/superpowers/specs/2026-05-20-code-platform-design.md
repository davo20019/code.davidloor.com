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
                         │ Next.js 16 (output:'export')│
                         │ on Cloudflare Workers       │
                         │ Static Assets               │
                         │  - Problem list / problem   │
                         │    page / CodeMirror 6      │
                         │  - Local progress (IDB)     │
                         └──────────────┬──────────────┘
                                        │ postMessage
                                        ▼
                    runner.code.davidloor.com (sandbox subdomain)
                         ┌─────────────────────────────┐
                         │ Static HTML hosting two     │
                         │ Web Workers (per language): │
                         │  - python-worker.js         │
                         │    (Pyodide, warm cache)    │
                         │  - js-worker.js             │
                         │  Each worker:               │
                         │   - frozen network APIs     │
                         │   - in-frame wall-clock     │
                         │     timeout, respawn-only-  │
                         │     affected-worker         │
                         │   - connect-src 'self' CSP  │
                         └─────────────────────────────┘
```

The runner subdomain is the security boundary. All user code executes inside an iframe loaded from `runner.code.davidloor.com`. The main app speaks to the runner via `postMessage` only.

## Stack

- **Framework:** Next.js 16 App Router with **`output: 'export'`** (full static export).
- **Host:** Cloudflare **Workers Static Assets** (the unified Workers + assets model, which is what Pages is converging into). No OpenNext, no SSR layer for v1.
  - Rationale: v1 has no server-side rendering, no database, no auth, no API routes. Static export removes the OpenNext compatibility surface entirely and matches the user-stated "Workers, not Pages" preference via the modern Static Assets binding.
  - Trade-off accepted: no Next.js middleware available, so per-request CSP nonces are not possible without a separate Worker in front. v1 falls back to `script-src 'self' 'unsafe-inline'` for the main app (acceptable: no user-generated HTML; problem Markdown is sanitized via DOMPurify). v1.1 hardening path: a thin CF Worker in front using HTMLRewriter to inject per-request nonces and tighten the CSP.
  - No Worker script bundle to size-budget in v1 (static-only deployment). Static-asset limits apply per-file (well under any Pyodide artifact). If the v1.1 HTMLRewriter Worker is added later, *its* size becomes the new budget.
- **Editor:** **CodeMirror 6**. ~150-300 KB, modular, excellent touch/mobile support (the platform should be usable from an iPad). Monaco rejected for v1 due to size (~4-5 MB), mobile-input bugs, and harder CSP story (relies on workers loaded via blob in some setups).
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

Static export means no middleware → no per-request nonces in v1. Accepted weakening:

```
default-src 'self';
script-src  'self' 'unsafe-inline';                 # Next.js static export hydration
style-src   'self' 'unsafe-inline';                 # Tailwind / shadcn runtime styles
img-src     'self' data:;
frame-src   https://runner.code.davidloor.com;
connect-src 'self';
base-uri    'none';
form-action 'self';
```

Why this is acceptable in v1: the main app renders no user-generated HTML; problem Markdown is sanitized via DOMPurify; no third-party scripts. `'unsafe-inline'` matters only in the presence of an injection vector, and there isn't one. Hardening path (v1.1): place a small CF Worker in front of the static assets that uses HTMLRewriter to inject per-request nonces and remove `'unsafe-inline'`. CodeMirror 6 does not require a `worker-src` entry (it ships no workers by default).

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
- The runner Worker (Cloudflare Worker, not Web Worker) returns 404 for any path not in an explicit static allowlist. Application code ignores query strings and performs no app-level request logging.
- Cloudflare platform logs on the runner subdomain are minimized in project settings and treated as sensitive: not exported to third-party analytics. Platform logs that remain are out of application control and assumed to contain request paths.

**Cookie policy** (project-wide, applies to all of `davidloor.com`):

- **Never** set a non-`HttpOnly` cookie with `Domain=.davidloor.com`. Wildcard cookies with `Domain` set are readable from any subdomain via `document.cookie`, and the runner subdomain runs scripts with `allow-same-origin` for IDB caching.
- All main-app cookies are host-only (no `Domain` attribute) and `HttpOnly` whenever they carry session/auth material.
- This is a soft policy in v1 (no auth yet) and a hard policy when v2 introduces sessions.

The runner has no cookies, no third-party scripts, and serves no HTML to humans — only the iframe.

**Defense-in-depth: freeze network APIs in the Web Worker.** CSP and origin isolation prevent off-domain exfiltration but do not prevent same-origin exfiltration into runner-origin platform logs. Before user code executes, the runner Web Worker permanently disables its networking surface — **on every prototype in the chain, not just on `self`** (since `fetch`, `WebSocket`, etc. live on `WorkerGlobalScope.prototype` / `DedicatedWorkerGlobalScope.prototype` and would otherwise be reachable via `Object.getPrototypeOf(self).fetch.call(self, …)`):

```js
// runner-worker.js — runs after Pyodide finishes booting, before any user code.
const APIS_TO_DISABLE = [
  "fetch", "XMLHttpRequest", "WebSocket", "EventSource",
  "Worker", "SharedWorker", "BroadcastChannel",
  "importScripts", "WebTransport",
];

function killApi(name) {
  // Walk every prototype in the chain and lock the property if defined.
  let proto = Object.getPrototypeOf(self);
  while (proto) {
    if (Object.prototype.hasOwnProperty.call(proto, name)) {
      Object.defineProperty(proto, name, {
        value: undefined, writable: false, configurable: false,
      });
    }
    proto = Object.getPrototypeOf(proto);
  }
  // Shadow on the instance too.
  Object.defineProperty(self, name, {
    value: undefined, writable: false, configurable: false,
  });
}
APIS_TO_DISABLE.forEach(killApi);

// navigator.sendBeacon lives on Navigator.prototype:
if (self.navigator && Navigator.prototype.sendBeacon) {
  Object.defineProperty(Navigator.prototype, "sendBeacon", {
    value: undefined, writable: false, configurable: false,
  });
}
Object.freeze(self.navigator);
```

After this step, neither user code nor a malicious test data structure can initiate any network request — even via the prototype chain. The Cloudflare access log channel is closed by construction, not just by policy.

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
  validator: ValidatorSpec;           // exact | set | set_of_lists | set_of_sets |
                                      //   any_of | linked_list_value_equal |
                                      //   tree_isomorphic
  tests: TestCase[];                  // [{ input: any[], expected: any }, ...]
};
```

### Two separate Web Workers (one per language)

The iframe owns **two** Web Workers — `python-worker.js` and `js-worker.js` — both static assets on the runner origin. Reasons:

- A JS-side runaway terminating its worker must not destroy the Pyodide instance (1-3 second cold start to rehydrate).
- Each language gets a clean global scope tailored to its needs (Pyodide bootstrap vs. plain Worker).
- Both workers freeze their network APIs as described above; the freezing logic is per-runtime.

Per-worker flow:

1. **`python-worker.js`** boots Pyodide once (cached after first load via runner-origin IndexedDB), then waits for `run` messages.
2. **`js-worker.js`** is idle until a `run` arrives.
3. For each test case in a run:
   - Deserialize typed inputs into language-native values (e.g., `linked_list<int> [1,2,3]` → a chain of `ListNode` in Python, equivalent class in JS).
   - Invoke the user's entry function with deserialized arguments.
   - Capture stdout, exceptions, elapsed time.
   - **Serialize the return value to JSON-safe primitives inside the runtime** (see Pyodide proxy lifecycle below).
   - Run the declared `validator` to compare actual vs expected.
4. Reply with a `result` message: per-test pass/fail, captured stdout, error messages, runtime.

### JS scope isolation

User JS code is wrapped via the `Function` constructor (allowed by the runner CSP's `'unsafe-eval'`) so it executes in **global scope only** — never inside the harness's lexical scope. This prevents user code from reading or overwriting harness locals like `tests`, `expected`, or `validator`. Pseudocode:

```js
// Inside js-worker.js, after network APIs are frozen:
// Use a deliberately unlikely parameter name so user code can declare
// `args`, `input`, `data`, etc. without colliding with the parameter
// (a let/const collision is a SyntaxError).
const userFn = new Function(
  "__harness_args__",
  `${userCode}\nreturn ${entry}.apply(null, __harness_args__);`
);
const out = userFn(deserializedArgs);
```

Harness state lives in block-scoped `const`/`let` inside the worker module and is **never** attached to `self`. The double-underscore parameter name is reserved for the harness; problem definitions and CI lint reject reference solutions that mention the literal token `__harness_args__`.

### Pyodide proxy lifecycle

Returning non-primitive Python objects (custom `ListNode`, `TreeNode`, etc.) to JS would create `PyProxy` objects that require explicit `.destroy()` to free WASM heap memory. **All serialization happens inside Python before the boundary.** Concretely:

- The Python harness converts custom types to JSON-native structures (e.g., a `ListNode` chain → `[1,2,3]`) using per-type Python helpers.
- The harness returns only `dict`/`list`/`str`/`int`/`float`/`bool`/`None`, which Pyodide auto-converts to plain JS values with no proxies.
- The JS validator never traverses `PyProxy` instances.

This eliminates a known long-session memory-leak class entirely.

### Timeout and worker lifecycle

- Each iframe-owned Worker enforces its own wall-clock timeout (5s default) via `setTimeout`. On overrun the iframe terminates **only the affected worker** and respawns it. A JS timeout never affects the Python worker, and vice versa.
- The **main app** does not own the workers. It can:
  - Send a `cancel` postMessage (cooperative).
  - Apply an 8s safety timeout and **detach the iframe** as a hard escalation, recreating it on the next run.
- On respawn after a Python timeout, Pyodide reloads from runner-origin IndexedDB cache (cold path ~0.5s); first-ever load is from runner-origin static assets (~1-3s). The UI shows a "Resetting Python engine…" indicator during this window so the user knows the next run is recovering rather than slow.

### Built-in validators

Each validator is implemented once in the app repo (not per problem):

| Validator | Use | Implementation |
|---|---|---|
| `exact` | Strict deep-equal of primitives or ordered lists (order matters). | Recursive structural equality. |
| `set` | Flat list compared as a multiset (outer order doesn't matter). | Sort both arrays, compare element-by-element. |
| `set_of_lists` | Outer collection unordered; inner lists ordered. | `JSON.stringify` each inner list → sort the resulting array of strings → compare. |
| `set_of_sets` | Outer and inner both unordered (canonical 3Sum: any triplet order, any output order). | Sort each inner list → `JSON.stringify` each → sort the array of strings → compare. |
| `any_of` | Multiple acceptable answers explicitly listed in the test case. | Test passes if `actual` matches **any** of `expected[]` under `exact`. |
| `linked_list_value_equal` | Compare linked-list outputs by value sequence. | After Python-side serialization to a plain array, falls through to `exact`. |
| `tree_isomorphic` | Compare BST/binary-tree outputs structurally. | After Python-side BFS-array serialization, falls through to `exact`. |

The canonical-sort approach makes set-based validation deterministic and trivial to audit, avoiding any need for graph/set isomorphism logic. It assumes test inputs are JSON-serializable primitives, which holds for every problem in the v1 set.

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
- Split layout: statement (left) / CodeMirror 6 editor (right) / output panel (bottom).
- Language tab (Python | JS). Switching swaps starter code; user code is autosaved per `(problem, language)` in IndexedDB.
- "Run" sends current code + problem spec to the runner iframe; results stream into the output panel with per-test status, stdout, error messages, runtime. If the Python worker is reloading after a prior timeout, the panel shows "Resetting Python engine…" until the worker reports ready.
- "Reveal solution" gated on at least one run attempt **and** ≥ 60s elapsed since `sessionStorage[`code-start-<problemId>`]` (set on first load of the problem). Storing the start timestamp in `sessionStorage` survives page refresh within the same tab, so the gate can't be reset by reload. A one-line warning appears before the reveal.
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
| Malicious problem PR exfiltrates user state | (1) Problems ship no executable code (data only). (2) Runner is on a separate origin. (3) Network APIs frozen in Worker before user code runs. |
| Exfiltration via external `fetch` from sandbox | `connect-src 'self'` on runner. |
| Exfiltration to runner-origin platform logs | Network APIs (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `Worker`, `importScripts`, `sendBeacon`, etc.) are deleted/frozen in the Web Worker after Pyodide boot, before user code runs. Same-origin requests cannot be initiated. |
| Wildcard-cookie leak from sibling subdomain | Project policy: no non-`HttpOnly` cookies with `Domain=.davidloor.com`. Main-app cookies are host-only. |
| User code reads/writes harness state via scope chain | JS user code compiled via `Function` constructor → executes in global scope only. Harness state is block-scoped and not attached to `self`. |
| Pyodide JS-proxy WASM memory leak | All Python returns serialized to JSON-native types inside Python before crossing the boundary. JS never holds `PyProxy` references. |
| Infinite loop in user code | Iframe-owned Web Worker with 5s wall-clock timeout; iframe terminates only the affected worker (Python or JS) and respawns it. Main app's 8s safety timeout detaches the iframe as escalation. |
| Cold-start UX after a Python timeout | UI indicator "Resetting Python engine…"; Pyodide warm-loads from runner-origin IndexedDB cache. |
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
- Deploys to Cloudflare Workers Static Assets on merges to `main` via GitHub Actions: `next build` produces `out/`, then `wrangler deploy` with a `wrangler.toml` declaring `assets = { directory = "./out", binding = "ASSETS" }` (and no user-facing worker script in v1).

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
| Scaffolding, Next.js static export, Workers Static Assets deploy | ~0.5 day |
| Runner subdomain: two Web Workers (Python, JS) + Pyodide self-hosting + CSP + frozen network APIs + postMessage protocol v1 + cross-browser smoke | ~3 days |
| JS runner specifics: `Function`-constructor scope isolation, structured stdout capture | ~0.5 day |
| Typed signature system + 7 built-in validators (canonical-sort impl) + linked-list/tree/grid serializers (per language, Python-side serialization to JSON) | ~2 days |
| Problem list page, problem page, CodeMirror 6 wiring (incl. mobile), IDB persistence, autosave, SessionStorage reveal gate, warm-up indicator | ~1.5 days |
| 20 coding problems (Python + JS solutions, signatures, validators, tests) + 7 system-design prompts | ~3-4 days |
| CI: pyodide npm validator + GitHub Actions deploy | ~1 day |
| Polish, accessibility, mobile layout, CSP debugging tail | ~1 day |
| **Total** | **~12-14 focused days (~2 weeks) or ~5-6 weekends** |

## Decisions deferred to the implementation plan

- Exact `postMessage` protocol schema, version negotiation, and error taxonomy.
- Final Pyodide version pin and which Python packages preload at boot.
- CodeMirror 6 extension set (Python + JS modes, Vim/Emacs keymaps off by default, line-number gutter, search, theme).
- Theme and visual design.
- Whether to ship the optional Playwright nightly job in v1 or punt to v1.1.
