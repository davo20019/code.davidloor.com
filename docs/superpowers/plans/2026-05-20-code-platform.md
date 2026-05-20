# code.davidloor.com Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v1 of code.davidloor.com — an open-source interview-prep platform where users solve Python and JavaScript problems in the browser (via Pyodide and a sandboxed JS runtime), plus a system-design section, all hosted on Cloudflare Workers Static Assets with no backend.

**Architecture:** Two-origin design. Main app (`code.davidloor.com`) is a Next.js 16 static export hosted via Cloudflare Workers Static Assets. The execution sandbox (`runner.code.davidloor.com`) is a separate Workers Static Assets deployment serving an iframe + two Web Workers (Python and JS). The main app embeds the runner iframe with `sandbox="allow-scripts allow-same-origin"` and communicates via `postMessage`. Problems are static content in the repo; community contributors PR folders.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`), React 19, TypeScript, Tailwind CSS, CodeMirror 6, Pyodide (0.27.x), Cloudflare Workers (Static Assets), Wrangler, Vitest, Playwright, GitHub Actions, npm, MIT license.

**Repo Layout:**
```
.
├── app/                          # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx                  # landing → /problems
│   ├── problems/
│   │   ├── page.tsx              # problem list
│   │   └── [id]/page.tsx         # problem detail
│   └── globals.css
├── components/                   # UI components
│   ├── code-editor.tsx           # CodeMirror 6 wrapper
│   ├── output-panel.tsx
│   ├── runner-frame.tsx          # iframe + postMessage adapter
│   ├── coding-problem-page.tsx
│   └── system-design-page.tsx
├── lib/
│   ├── problems/
│   │   ├── loader.ts             # reads /problems at build time
│   │   ├── manifest.ts           # generated manifest
│   │   └── types.ts              # ProblemSpec, ValidatorSpec, etc.
│   ├── validators/
│   │   ├── index.ts              # dispatch
│   │   ├── exact.ts
│   │   ├── set.ts
│   │   ├── set-of-lists.ts
│   │   ├── set-of-sets.ts
│   │   ├── any-of.ts
│   │   └── shared.ts             # canonical-sort helpers
│   ├── runner-protocol.ts        # shared message types
│   ├── persistence/
│   │   ├── idb.ts                # autosave per (problem, language)
│   │   └── session.ts            # sessionStorage reveal gate
│   └── utils.ts
├── problems/                     # CONTENT (open-source contributions)
│   ├── coding/
│   │   └── 001-two-sum/
│   │       ├── problem.md
│   │       ├── starter.py
│   │       ├── starter.js
│   │       ├── solution.py
│   │       ├── solution.js
│   │       ├── tests.json
│   │       └── meta.yaml
│   └── system-design/
│       └── 001-design-url-shortener/
│           ├── problem.md
│           └── meta.yaml
├── runner/                       # runner.code.davidloor.com (separate deploy)
│   ├── public/
│   │   ├── runner.html
│   │   └── _headers
│   ├── src/
│   │   ├── runner-host.ts
│   │   ├── python-worker.ts
│   │   ├── js-worker.ts
│   │   ├── api-freeze.ts
│   │   ├── python-harness.py
│   │   └── js-harness.ts
│   ├── pyodide-assets/           # self-hosted Pyodide artifacts
│   ├── wrangler.toml
│   └── package.json
├── scripts/
│   ├── validate-problem.mjs      # CI validator using pyodide npm
│   └── build-manifest.mjs        # generates lib/problems/manifest.ts
├── tests/                        # Vitest unit tests
├── e2e/                          # Playwright tests
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── docs/superpowers/             # spec, plan
├── public/_headers               # main-app CSP headers
├── wrangler.toml                 # main app deploy
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── README.md
├── CONTRIBUTING.md
└── LICENSE                       # MIT
```

---

## Phase 1 — Foundations & Scaffolding

### Task 1: Bootstrap Next.js + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `.prettierrc`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `LICENSE`, `README.md`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "code-davidloor-com",
  "version": "0.0.1",
  "private": true,
  "license": "MIT",
  "scripts": {
    "dev": "next dev",
    "build": "node scripts/build-manifest.mjs && next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "validate:problems": "node scripts/validate-problem.mjs",
    "deploy": "npm run build && wrangler deploy"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@codemirror/lang-javascript": "^6.2.2",
    "@codemirror/lang-python": "^6.1.6",
    "@codemirror/state": "^6.4.1",
    "@codemirror/view": "^6.32.0",
    "@uiw/react-codemirror": "^4.23.0",
    "isomorphic-dompurify": "^2.16.0",
    "marked": "^14.1.2",
    "idb": "^8.0.0",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.7.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/js-yaml": "^4.0.9",
    "typescript": "^5.6.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0",
    "prettier": "^3.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^2.1.0",
    "happy-dom": "^15.7.0",
    "@playwright/test": "^1.48.0",
    "pyodide": "^0.27.0",
    "wrangler": "^3.80.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext", "WebWorker"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "runner/**"]
}
```

- [ ] **Step 3: Create `next.config.mjs`** (static export)

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
```

- [ ] **Step 4: Create `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`** (standard Tailwind init).

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

`postcss.config.mjs`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
:root { color-scheme: light dark; }
html, body { height: 100%; }
```

- [ ] **Step 5: Create minimal `app/layout.tsx` and `app/page.tsx`**

`app/layout.tsx`:
```tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "code.davidloor.com", description: "Interview prep" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
```

`app/page.tsx`:
```tsx
import { redirect } from "next/navigation";
export default function Home() { redirect("/problems"); }
```

- [ ] **Step 6: Create `.gitignore`, `.eslintrc.json`, `.prettierrc`, `LICENSE`, and a minimal `README.md`.**

`.gitignore`:
```
node_modules
.next
out
.env*.local
.wrangler
playwright-report
test-results
.DS_Store
runner/dist
runner/pyodide-assets
runner/package
runner/pyodide-*.tgz
```

`.eslintrc.json`:
```json
{ "extends": ["next/core-web-vitals", "next/typescript"] }
```

`.prettierrc`:
```json
{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 100 }
```

`LICENSE` is the standard MIT License text, year 2026, copyright holder "David Loor".

`README.md`:
```md
# code.davidloor.com

Open-source coding interview prep platform. Python + JavaScript, runs entirely in your browser. MIT licensed.

Status: in development. See `docs/superpowers/specs/` for design.
```

- [ ] **Step 7: Install and verify build**

```bash
npm install
npm run build
```
Expected: `next build` completes; `out/` directory created with `index.html` and `_next/` assets. (The `build-manifest.mjs` step in `build` will fail until Task 11; for now, run `next build` directly to verify the Next.js setup, or stub the script.)

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs .eslintrc.json .prettierrc .gitignore app/ LICENSE README.md
git commit -m "feat: bootstrap Next.js 16 static export with Tailwind"
```

---

### Task 2: Wrangler configs + CSP headers

**Files:**
- Create: `wrangler.toml`, `runner/wrangler.toml`, `runner/public/runner.html`, `runner/public/_headers`, `public/_headers`, `runner/package.json` (stub)

- [ ] **Step 1: Create root `wrangler.toml` for the main app**

```toml
name = "code-davidloor-com"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
assets = { directory = "./out", binding = "ASSETS" }

[[routes]]
pattern = "code.davidloor.com"
custom_domain = true
```

- [ ] **Step 2: Create `public/_headers`** (main-app CSP)

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src https://runner.code.davidloor.com; connect-src 'self'; base-uri 'none'; form-action 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

- [ ] **Step 3: Scaffold `runner/` directory**

```bash
mkdir -p runner/public runner/src runner/pyodide-assets
```

- [ ] **Step 4: Create `runner/package.json`**

```json
{
  "name": "code-davidloor-runner",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "node build.mjs",
    "deploy": "npm run build && wrangler deploy",
    "install-pyodide": "node scripts/install-pyodide.mjs"
  },
  "devDependencies": {
    "esbuild": "^0.24.0",
    "wrangler": "^3.80.0",
    "tar": "^7.4.0"
  }
}
```

- [ ] **Step 5: Create `runner/wrangler.toml`**

```toml
name = "code-davidloor-runner"
compatibility_date = "2024-09-23"
assets = { directory = "./dist", binding = "ASSETS" }

[[routes]]
pattern = "runner.code.davidloor.com"
custom_domain = true
```

- [ ] **Step 6: Create `runner/public/runner.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>code.davidloor.com runner</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body>
    <script type="module" src="/runner-host.js"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `runner/public/_headers`** (runner CSP — the source of truth)

```
/*
  Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; img-src 'none'; style-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'
  Cross-Origin-Resource-Policy: cross-origin
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
```

- [ ] **Step 8: Commit**

```bash
git add wrangler.toml runner/wrangler.toml runner/package.json runner/public/ public/_headers
git commit -m "feat: wrangler configs and CSP headers for main app + runner"
```

---

## Phase 2 — Shared Types, Validators, Persistence

### Task 3: Define ProblemSpec and protocol types

**Files:**
- Create: `lib/problems/types.ts`, `lib/runner-protocol.ts`, `vitest.config.ts`
- Test: `tests/types.test.ts`

- [ ] **Step 1: Create `lib/problems/types.ts`**

```ts
export type ParamType =
  | "int" | "float" | "bool" | "string"
  | { array: ParamType }
  | { linked_list: ParamType }
  | { tree: ParamType }     // BFS-array form
  | { grid: ParamType };

export type ValidatorSpec =
  | { kind: "exact" }
  | { kind: "set" }
  | { kind: "set_of_lists" }
  | { kind: "set_of_sets" }
  | { kind: "any_of" }      // `expected` is an array of acceptable answers
  | { kind: "linked_list_value_equal" }
  | { kind: "tree_isomorphic" };

export interface Signature {
  params: ParamType[];
  returns: ParamType;
}

export interface TestCase {
  input: unknown[];
  expected: unknown;
}

export interface ProblemMeta {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  topics: string[];
  entry: string;        // function name
  signature: Signature;
  validator: ValidatorSpec;
  timeLimitMs: number;  // default 5000
}

export interface CodingProblem {
  type: "coding";
  meta: ProblemMeta;
  statementMarkdown: string;
  starters: { python: string; javascript: string };
  solutions: { python: string; javascript: string };
  tests: TestCase[];
}

export interface SystemDesignMeta {
  id: string;
  title: string;
  estMinutes: number;
  tags: string[];
}

export interface SystemDesignProblem {
  type: "system_design";
  meta: SystemDesignMeta;
  promptMarkdown: string;
}

export type Problem = CodingProblem | SystemDesignProblem;
```

- [ ] **Step 2: Create `lib/runner-protocol.ts`**

```ts
import type { ProblemMeta, TestCase } from "./problems/types";

export const PROTOCOL_VERSION = 1;
export type Language = "python" | "javascript";

export interface RunRequest {
  type: "run";
  requestId: string;
  protocolVersion: 1;
  language: Language;
  code: string;
  problem: {
    meta: ProblemMeta;
    tests: TestCase[];
  };
  timeLimitMs: number;
}

export interface PerTestResult {
  index: number;
  passed: boolean;
  actual: unknown;
  expected: unknown;
  stdout: string;
  error?: string;
  elapsedMs: number;
}

export type RunResponse =
  | { type: "ready" }
  | { type: "result"; requestId: string; perTest: PerTestResult[]; totalMs: number }
  | { type: "error"; requestId: string; message: string; stack?: string }
  | { type: "warming"; requestId: string; language: Language; reason: "timeout_reload" | "first_boot" }
  | { type: "timed_out"; requestId: string; language: Language };
```

- [ ] **Step 3: Add `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: { environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

- [ ] **Step 4: Write smoke test**

`tests/types.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import type { ProblemMeta } from "@/lib/problems/types";
import { PROTOCOL_VERSION } from "@/lib/runner-protocol";

describe("types", () => {
  it("protocol version is 1", () => { expect(PROTOCOL_VERSION).toBe(1); });
  it("ProblemMeta accepts a minimal shape", () => {
    const m: ProblemMeta = {
      id: "001-two-sum",
      title: "Two Sum",
      difficulty: "easy",
      tags: ["array"],
      topics: ["arrays"],
      entry: "twoSum",
      signature: { params: [{ array: "int" }, "int"], returns: { array: "int" } },
      validator: { kind: "set" },
      timeLimitMs: 5000,
    };
    expect(m.entry).toBe("twoSum");
  });
});
```

- [ ] **Step 5: Run tests, commit**

```bash
npm test
git add lib/problems/types.ts lib/runner-protocol.ts vitest.config.ts tests/types.test.ts
git commit -m "feat: ProblemSpec and runner-protocol types + smoke tests"
```

---

### Task 4: Validator — `exact`

**Files:**
- Create: `lib/validators/shared.ts`, `lib/validators/exact.ts`
- Test: `tests/validators/exact.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { exactEqual } from "@/lib/validators/exact";

describe("exact", () => {
  it("primitives", () => {
    expect(exactEqual(1, 1)).toBe(true);
    expect(exactEqual("a", "a")).toBe(true);
    expect(exactEqual(true, false)).toBe(false);
    expect(exactEqual(null, null)).toBe(true);
  });
  it("arrays (order matters)", () => {
    expect(exactEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(exactEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });
  it("nested arrays", () => {
    expect(exactEqual([[1, 2], [3]], [[1, 2], [3]])).toBe(true);
    expect(exactEqual([[1, 2], [3]], [[1, 2], [4]])).toBe(false);
  });
  it("objects (key order ignored)", () => {
    expect(exactEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect fail.** `npx vitest run tests/validators/exact.test.ts`

- [ ] **Step 3: Implement `lib/validators/shared.ts`**

```ts
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object).sort();
    const kb = Object.keys(b as object).sort();
    if (ka.length !== kb.length) return false;
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return false;
      if (!deepEqual((a as Record<string, unknown>)[ka[i]], (b as Record<string, unknown>)[ka[i]])) return false;
    }
    return true;
  }
  return false;
}
```

- [ ] **Step 4: Implement `lib/validators/exact.ts`**

```ts
import { deepEqual } from "./shared";
export function exactEqual(actual: unknown, expected: unknown): boolean {
  return deepEqual(actual, expected);
}
```

- [ ] **Step 5: Re-run tests; expect pass. Commit.**

```bash
git add lib/validators/shared.ts lib/validators/exact.ts tests/validators/exact.test.ts
git commit -m "feat: exact validator with deep-equal"
```

---

### Task 5: Validator — `set`

**Files:**
- Create: `lib/validators/set.ts`
- Test: `tests/validators/set.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { setEqual } from "@/lib/validators/set";

describe("set (multiset)", () => {
  it("equal regardless of order", () => {
    expect(setEqual([1, 2, 3], [3, 2, 1])).toBe(true);
    expect(setEqual(["a", "b"], ["b", "a"])).toBe(true);
  });
  it("counts must match", () => {
    expect(setEqual([1, 1, 2], [1, 2, 2])).toBe(false);
  });
  it("non-array inputs are not equal", () => {
    expect(setEqual([1], 1 as unknown)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

```ts
export function setEqual(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
  if (actual.length !== expected.length) return false;
  const a = [...actual].map((x) => JSON.stringify(x)).sort();
  const b = [...expected].map((x) => JSON.stringify(x)).sort();
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
```

- [ ] **Step 3: Pass + commit**

```bash
git add lib/validators/set.ts tests/validators/set.test.ts
git commit -m "feat: set (multiset) validator via canonical sort"
```

---

### Task 6: Validator — `set_of_lists`

**Files:**
- Create: `lib/validators/set-of-lists.ts`
- Test: `tests/validators/set-of-lists.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { setOfListsEqual } from "@/lib/validators/set-of-lists";

describe("set_of_lists", () => {
  it("outer unordered, inner ordered", () => {
    expect(setOfListsEqual([[1, 2], [3, 4]], [[3, 4], [1, 2]])).toBe(true);
    expect(setOfListsEqual([[1, 2], [3, 4]], [[2, 1], [3, 4]])).toBe(false);
  });
  it("rejects non-2D inputs", () => {
    expect(setOfListsEqual([1, 2], [1, 2] as unknown)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

```ts
export function setOfListsEqual(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
  if (actual.length !== expected.length) return false;
  if (!actual.every(Array.isArray) || !expected.every(Array.isArray)) return false;
  const a = (actual as unknown[][]).map((x) => JSON.stringify(x)).sort();
  const b = (expected as unknown[][]).map((x) => JSON.stringify(x)).sort();
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
```

- [ ] **Step 3: Pass + commit**

```bash
git add lib/validators/set-of-lists.ts tests/validators/set-of-lists.test.ts
git commit -m "feat: set_of_lists validator"
```

---

### Task 7: Validator — `set_of_sets`

**Files:**
- Create: `lib/validators/set-of-sets.ts`
- Test: `tests/validators/set-of-sets.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { setOfSetsEqual } from "@/lib/validators/set-of-sets";

describe("set_of_sets (3Sum-style)", () => {
  it("both outer and inner unordered", () => {
    expect(setOfSetsEqual([[1, 2, 3], [4, 5, 6]], [[6, 5, 4], [3, 2, 1]])).toBe(true);
    expect(setOfSetsEqual([[1, 2]], [[1, 3]])).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

```ts
export function setOfSetsEqual(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
  if (actual.length !== expected.length) return false;
  if (!actual.every(Array.isArray) || !expected.every(Array.isArray)) return false;
  const canon = (lists: unknown[][]) =>
    lists
      .map((l) =>
        JSON.stringify(
          [...l].sort((x, y) => (JSON.stringify(x) < JSON.stringify(y) ? -1 : 1)),
        ),
      )
      .sort();
  const a = canon(actual as unknown[][]);
  const b = canon(expected as unknown[][]);
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
```

- [ ] **Step 3: Pass + commit**

```bash
git add lib/validators/set-of-sets.ts tests/validators/set-of-sets.test.ts
git commit -m "feat: set_of_sets validator (sort-inner-then-outer)"
```

---

### Task 8: Validator — `any_of`

**Files:**
- Create: `lib/validators/any-of.ts`
- Test: `tests/validators/any-of.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { anyOfEqual } from "@/lib/validators/any-of";

describe("any_of", () => {
  it("passes if actual matches any expected", () => {
    expect(anyOfEqual([1, 2], [[1, 2], [2, 1]])).toBe(true);
    expect(anyOfEqual([3, 4], [[1, 2], [2, 1]])).toBe(false);
  });
  it("requires expected to be an array", () => {
    expect(anyOfEqual(1, 1 as unknown)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement**

```ts
import { deepEqual } from "./shared";
export function anyOfEqual(actual: unknown, expected: unknown): boolean {
  if (!Array.isArray(expected)) return false;
  return expected.some((cand) => deepEqual(actual, cand));
}
```

- [ ] **Step 3: Pass + commit**

```bash
git add lib/validators/any-of.ts tests/validators/any-of.test.ts
git commit -m "feat: any_of validator"
```

---

### Task 9: Validator dispatch + linked-list / tree (passthrough)

**Files:**
- Create: `lib/validators/index.ts`
- Test: `tests/validators/index.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from "vitest";
import { validate } from "@/lib/validators";

describe("validator dispatch", () => {
  it("dispatches by kind", () => {
    expect(validate({ kind: "exact" }, 1, 1)).toBe(true);
    expect(validate({ kind: "set" }, [1, 2], [2, 1])).toBe(true);
    expect(validate({ kind: "set_of_sets" }, [[1, 2]], [[2, 1]])).toBe(true);
    expect(validate({ kind: "any_of" }, [1, 2], [[1, 2], [2, 1]])).toBe(true);
    // Pass-through validators expect Python/JS-side serialization to plain arrays.
    expect(validate({ kind: "linked_list_value_equal" }, [1, 2, 3], [1, 2, 3])).toBe(true);
    expect(validate({ kind: "tree_isomorphic" }, [1, 2, null, 3], [1, 2, null, 3])).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

```ts
import type { ValidatorSpec } from "@/lib/problems/types";
import { exactEqual } from "./exact";
import { setEqual } from "./set";
import { setOfListsEqual } from "./set-of-lists";
import { setOfSetsEqual } from "./set-of-sets";
import { anyOfEqual } from "./any-of";

export function validate(spec: ValidatorSpec, actual: unknown, expected: unknown): boolean {
  switch (spec.kind) {
    case "exact": return exactEqual(actual, expected);
    case "set": return setEqual(actual, expected);
    case "set_of_lists": return setOfListsEqual(actual, expected);
    case "set_of_sets": return setOfSetsEqual(actual, expected);
    case "any_of": return anyOfEqual(actual, expected);
    case "linked_list_value_equal":
    case "tree_isomorphic":
      // The Python/JS harness serializes these to plain arrays before crossing
      // the worker boundary, so an exact compare is correct here.
      return exactEqual(actual, expected);
  }
}
```

- [ ] **Step 3: Pass + commit**

```bash
git add lib/validators/index.ts tests/validators/index.test.ts
git commit -m "feat: validator dispatch + linked-list/tree passthrough"
```

---

### Task 10: Persistence — IDB autosave + sessionStorage reveal gate

**Files:**
- Create: `lib/persistence/idb.ts`, `lib/persistence/session.ts`
- Test: `tests/persistence/session.test.ts`

- [ ] **Step 1: Implement `lib/persistence/idb.ts`**

```ts
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "code-davidloor";
const DB_VERSION = 1;
const CODE_STORE = "code";
const NOTES_STORE = "notes";
const PROGRESS_STORE = "progress";

let dbPromise: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(CODE_STORE)) d.createObjectStore(CODE_STORE);
        if (!d.objectStoreNames.contains(NOTES_STORE)) d.createObjectStore(NOTES_STORE);
        if (!d.objectStoreNames.contains(PROGRESS_STORE)) d.createObjectStore(PROGRESS_STORE);
      },
    });
  }
  return dbPromise;
}
const codeKey = (id: string, lang: "python" | "javascript") => `${id}:${lang}`;

export async function saveCode(id: string, lang: "python" | "javascript", code: string) {
  (await db()).put(CODE_STORE, code, codeKey(id, lang));
}
export async function loadCode(id: string, lang: "python" | "javascript"): Promise<string | undefined> {
  return (await db()).get(CODE_STORE, codeKey(id, lang));
}
export async function saveNotes(id: string, notes: string) { (await db()).put(NOTES_STORE, notes, id); }
export async function loadNotes(id: string): Promise<string | undefined> { return (await db()).get(NOTES_STORE, id); }
export async function markComplete(id: string) { (await db()).put(PROGRESS_STORE, { completed: true, at: Date.now() }, id); }
export async function isComplete(id: string): Promise<boolean> {
  const v = await (await db()).get(PROGRESS_STORE, id);
  return !!(v && v.completed);
}
```

- [ ] **Step 2: Implement `lib/persistence/session.ts`**

```ts
export function getRevealStart(problemId: string, now = Date.now()): number {
  if (typeof sessionStorage === "undefined") return now;
  const key = `code-start-${problemId}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return Number(existing);
  sessionStorage.setItem(key, String(now));
  return now;
}

export function canReveal(problemId: string, hadAtLeastOneRun: boolean, minMs = 60_000): boolean {
  if (!hadAtLeastOneRun) return false;
  const start = getRevealStart(problemId);
  return Date.now() - start >= minMs;
}
```

- [ ] **Step 3: Test the session module**

`tests/persistence/session.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { canReveal, getRevealStart } from "@/lib/persistence/session";

const memStore: Record<string, string> = {};
(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
  getItem: (k: string) => (k in memStore ? memStore[k] : null),
  setItem: (k: string, v: string) => { memStore[k] = v; },
  removeItem: (k: string) => { delete memStore[k]; },
  clear: () => { for (const k of Object.keys(memStore)) delete memStore[k]; },
  key: () => null,
  length: 0,
} as unknown as Storage;

describe("reveal gate", () => {
  beforeEach(() => { for (const k of Object.keys(memStore)) delete memStore[k]; });
  it("requires both a run and elapsed time", () => {
    expect(canReveal("p1", false, 1000)).toBe(false);
    expect(canReveal("p1", true, 1_000_000)).toBe(false);
  });
  it("persists start timestamp across calls", () => {
    const t1 = getRevealStart("p1", 1000);
    const t2 = getRevealStart("p1", 2000);
    expect(t1).toBe(t2);
  });
});
```

- [ ] **Step 4: Run, commit**

```bash
npm test
git add lib/persistence/ tests/persistence/
git commit -m "feat: IndexedDB autosave + sessionStorage reveal gate"
```

---

## Phase 3 — Problem Loader & Build Manifest

### Task 11: Build manifest + loader

**Files:**
- Create: `scripts/build-manifest.mjs`, `lib/problems/manifest.ts`, `lib/problems/loader.ts`
- Test: `tests/problems/loader.test.ts`

- [ ] **Step 1: Write `scripts/build-manifest.mjs`**

```js
#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = path.resolve(process.cwd(), "problems");
const OUT = path.resolve(process.cwd(), "lib/problems/manifest.ts");

async function readDirSafe(p) {
  try { return await readdir(p, { withFileTypes: true }); } catch { return []; }
}

async function loadCoding(dir) {
  const id = path.basename(dir);
  const meta = yaml.load(await readFile(path.join(dir, "meta.yaml"), "utf8"));
  const statementMarkdown = await readFile(path.join(dir, "problem.md"), "utf8");
  const starterPython = await readFile(path.join(dir, "starter.py"), "utf8");
  const starterJs = await readFile(path.join(dir, "starter.js"), "utf8");
  const solutionPython = await readFile(path.join(dir, "solution.py"), "utf8");
  const solutionJs = await readFile(path.join(dir, "solution.js"), "utf8");
  const tests = JSON.parse(await readFile(path.join(dir, "tests.json"), "utf8"));
  return {
    type: "coding",
    meta: { id, ...meta },
    statementMarkdown,
    starters: { python: starterPython, javascript: starterJs },
    solutions: { python: solutionPython, javascript: solutionJs },
    tests,
  };
}
async function loadSystemDesign(dir) {
  const id = path.basename(dir);
  const meta = yaml.load(await readFile(path.join(dir, "meta.yaml"), "utf8"));
  const promptMarkdown = await readFile(path.join(dir, "problem.md"), "utf8");
  return { type: "system_design", meta: { id, ...meta }, promptMarkdown };
}

const codingDirs = (await readDirSafe(path.join(ROOT, "coding"))).filter((d) => d.isDirectory());
const sysDirs = (await readDirSafe(path.join(ROOT, "system-design"))).filter((d) => d.isDirectory());
const coding = await Promise.all(codingDirs.map((d) => loadCoding(path.join(ROOT, "coding", d.name))));
const sys = await Promise.all(sysDirs.map((d) => loadSystemDesign(path.join(ROOT, "system-design", d.name))));

const all = [...coding, ...sys];
const body = `// AUTO-GENERATED by scripts/build-manifest.mjs — do not edit by hand.
import type { Problem } from "./types";
export const problems: Problem[] = ${JSON.stringify(all, null, 2)} as const;
export const codingProblems = problems.filter((p) => p.type === "coding");
export const systemDesignProblems = problems.filter((p) => p.type === "system_design");
`;
await writeFile(OUT, body, "utf8");
console.log(`Wrote ${OUT} with ${coding.length} coding and ${sys.length} system-design problems.`);
```

- [ ] **Step 2: Create placeholder `lib/problems/manifest.ts`**

```ts
// Placeholder; the real version is generated by scripts/build-manifest.mjs.
import type { Problem } from "./types";
export const problems: Problem[] = [];
export const codingProblems: Problem[] = [];
export const systemDesignProblems: Problem[] = [];
```

- [ ] **Step 3: Implement `lib/problems/loader.ts`**

```ts
import { problems, codingProblems, systemDesignProblems } from "./manifest";
import type { Problem } from "./types";

export function getAll(): Problem[] { return problems; }
export function getCoding(): Problem[] { return codingProblems; }
export function getSystemDesign(): Problem[] { return systemDesignProblems; }
export function getById(id: string): Problem | undefined {
  return problems.find((p) => p.meta.id === id);
}
```

- [ ] **Step 4: Add loader smoke test**

`tests/problems/loader.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getAll, getById } from "@/lib/problems/loader";
describe("loader", () => {
  it("manifest is an array", () => { expect(Array.isArray(getAll())).toBe(true); });
  it("getById returns undefined for missing ids", () => { expect(getById("nope")).toBeUndefined(); });
});
```

- [ ] **Step 5: Run, commit**

```bash
npm test
git add lib/problems/loader.ts lib/problems/manifest.ts scripts/build-manifest.mjs tests/problems/loader.test.ts
git commit -m "feat: build-time problem manifest + loader"
```

---

## Phase 4 — Runner Subdomain

### Task 12: Pyodide asset install script (safe execFile)

**Files:**
- Create: `runner/scripts/install-pyodide.mjs`

Downloads the pinned Pyodide release as an npm tarball and extracts it into `runner/pyodide-assets/`. Uses `execFileSync` (no shell) and the `tar` package — no command-injection surface.

- [ ] **Step 1: Implement**

```js
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
for (const entry of (await import("node:fs/promises")).then) {} // no-op import warm
const { readdirSync, statSync, cpSync } = await import("node:fs");
for (const name of readdirSync(extracted)) {
  cpSync(path.join(extracted, name), path.join(TGT, name), { recursive: true });
}
rmSync(extracted, { recursive: true, force: true });
rmSync(tarball, { force: true });
console.log("pyodide assets extracted to", TGT);
```

- [ ] **Step 2: Run**

```bash
cd runner && npm install && npm run install-pyodide
ls pyodide-assets/pyodide.js
```
Expected: file exists.

- [ ] **Step 3: Commit**

```bash
git add runner/scripts/install-pyodide.mjs
git commit -m "feat: pyodide asset install script (execFileSync, no shell)"
```

---

### Task 13: Runner build (esbuild)

**Files:**
- Create: `runner/build.mjs`

- [ ] **Step 1: Implement**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add runner/build.mjs
git commit -m "feat: runner esbuild config"
```

---

### Task 14: API-freeze module (prototype-chain walk)

**Files:**
- Create: `runner/src/api-freeze.ts`
- Test: `runner/tests/api-freeze.test.ts`

- [ ] **Step 1: Write failing test**

`runner/tests/api-freeze.test.ts`:
```ts
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
```

Add a separate vitest config under `runner/`:

`runner/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "happy-dom" } });
```

Add `runner/package.json` script:
```json
"test": "vitest run"
```

And install `vitest` + `happy-dom` as dev deps in `runner/`:
```json
"vitest": "^2.1.0",
"happy-dom": "^15.7.0"
```

- [ ] **Step 2: Implement `runner/src/api-freeze.ts`**

```ts
const APIS = [
  "fetch", "XMLHttpRequest", "WebSocket", "EventSource",
  "Worker", "SharedWorker", "BroadcastChannel",
  "importScripts", "WebTransport",
] as const;

function killOnChain(scope: object, name: string) {
  let proto: object | null = Object.getPrototypeOf(scope);
  while (proto) {
    if (Object.prototype.hasOwnProperty.call(proto, name)) {
      try {
        Object.defineProperty(proto, name, { value: undefined, writable: false, configurable: false });
      } catch {}
    }
    proto = Object.getPrototypeOf(proto);
  }
  try {
    Object.defineProperty(scope, name, { value: undefined, writable: false, configurable: false });
  } catch {}
}

export function freezeNetworkApis(scope: object) {
  for (const name of APIS) killOnChain(scope, name);
  const navObj = (scope as { navigator?: Navigator }).navigator;
  if (navObj && "sendBeacon" in navObj) {
    try {
      const proto = Object.getPrototypeOf(navObj);
      Object.defineProperty(proto, "sendBeacon", { value: undefined, writable: false, configurable: false });
    } catch {}
    try { Object.freeze(navObj); } catch {}
  }
}
```

- [ ] **Step 3: Run, commit**

```bash
cd runner && npm test
git add runner/src/api-freeze.ts runner/tests/api-freeze.test.ts runner/vitest.config.ts runner/package.json
git commit -m "feat: prototype-chain network API freeze module"
```

---

### Task 15: Python worker + harness

**Files:**
- Create: `runner/src/python-harness.py`, `runner/src/python-worker.ts`

- [ ] **Step 1: Create `runner/src/python-harness.py`**

```python
import json, sys, io, time

class _Capture(io.StringIO):
    pass

class ListNode:
    def __init__(self, val=0, nxt=None):
        self.val = val; self.next = nxt
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def _deserialize(arg, t):
    if isinstance(t, str): return arg
    if isinstance(t, dict):
        if "array" in t: return [_deserialize(x, t["array"]) for x in arg]
        if "grid" in t:
            inner = t["grid"]
            return [[_deserialize(x, inner) for x in row] for row in arg]
        if "linked_list" in t:
            if not arg: return None
            head = ListNode(arg[0]); cur = head
            for v in arg[1:]:
                cur.next = ListNode(v); cur = cur.next
            return head
        if "tree" in t:
            if not arg: return None
            it = iter(arg); root = TreeNode(next(it)); q = [root]
            while q:
                node = q.pop(0)
                try: lv = next(it)
                except StopIteration: break
                if lv is not None: node.left = TreeNode(lv); q.append(node.left)
                try: rv = next(it)
                except StopIteration: break
                if rv is not None: node.right = TreeNode(rv); q.append(node.right)
            return root
    return arg

def _serialize(val, t):
    if isinstance(t, str): return val
    if isinstance(t, dict):
        if "array" in t: return [_serialize(x, t["array"]) for x in (val or [])]
        if "grid" in t:
            inner = t["grid"]
            return [[_serialize(x, inner) for x in row] for row in (val or [])]
        if "linked_list" in t:
            out = []; n = val
            while n is not None:
                out.append(n.val); n = n.next
            return out
        if "tree" in t:
            if val is None: return []
            out = []; q = [val]
            while q:
                node = q.pop(0)
                if node is None: out.append(None); continue
                out.append(node.val); q.append(node.left); q.append(node.right)
            while out and out[-1] is None: out.pop()
            return out
    return val

def run_problem(user_code, problem_meta_json, tests_json):
    meta = json.loads(problem_meta_json); tests = json.loads(tests_json)
    entry = meta["entry"]; params = meta["signature"]["params"]; returns = meta["signature"]["returns"]
    ns = {"ListNode": ListNode, "TreeNode": TreeNode}
    exec(user_code, ns, ns)
    if entry not in ns:
        return json.dumps({"error": f"entry function '{entry}' not defined"})
    fn = ns[entry]
    per = []
    for i, tc in enumerate(tests):
        cap = _Capture(); old = sys.stdout; sys.stdout = cap
        t0 = time.perf_counter()
        try:
            args = [_deserialize(a, params[j]) for j, a in enumerate(tc["input"])]
            actual_raw = fn(*args)
            actual = _serialize(actual_raw, returns)
            per.append({"index": i, "actual": actual, "stdout": cap.getvalue(), "elapsedMs": (time.perf_counter() - t0) * 1000.0})
        except Exception as e:
            per.append({"index": i, "actual": None, "stdout": cap.getvalue(), "error": f"{type(e).__name__}: {e}", "elapsedMs": (time.perf_counter() - t0) * 1000.0})
        finally:
            sys.stdout = old
    return json.dumps(per)
```

- [ ] **Step 2: Create `runner/src/python-worker.ts`**

```ts
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
```

- [ ] **Step 3: Build the runner**

```bash
cd runner && npm install && npm run build
ls dist/python-worker.js dist/python-harness.py dist/pyodide/pyodide.js
```
Expected: all three present.

- [ ] **Step 4: Commit**

```bash
git add runner/src/python-harness.py runner/src/python-worker.ts
git commit -m "feat: Pyodide worker + Python harness (serializers + run_problem)"
```

---

### Task 16: JS worker + harness

**Files:**
- Create: `runner/src/js-harness.ts`, `runner/src/js-worker.ts`

- [ ] **Step 1: Create `runner/src/js-harness.ts`**

```ts
import type { ProblemMeta, TestCase } from "../../lib/problems/types";

class JsListNode { constructor(public val: number, public next: JsListNode | null = null) {} }
class JsTreeNode { constructor(public val: number, public left: JsTreeNode | null = null, public right: JsTreeNode | null = null) {} }

type ParamType = ProblemMeta["signature"]["params"][number];

function deserialize(arg: unknown, t: ParamType): unknown {
  if (typeof t === "string") return arg;
  if ("array" in t) return (arg as unknown[]).map((x) => deserialize(x, t.array));
  if ("grid" in t) return (arg as unknown[][]).map((row) => row.map((x) => deserialize(x, (t as { grid: ParamType }).grid)));
  if ("linked_list" in t) {
    const vs = arg as unknown[];
    if (!vs || vs.length === 0) return null;
    const head = new JsListNode(vs[0] as number);
    let cur: JsListNode = head;
    for (let i = 1; i < vs.length; i++) { cur.next = new JsListNode(vs[i] as number); cur = cur.next; }
    return head;
  }
  if ("tree" in t) {
    const arr = arg as Array<number | null>;
    if (!arr || arr.length === 0) return null;
    const root = new JsTreeNode(arr[0] as number);
    const q: JsTreeNode[] = [root]; let i = 1;
    while (q.length && i < arr.length) {
      const node = q.shift()!;
      if (arr[i] !== null && arr[i] !== undefined) { node.left = new JsTreeNode(arr[i] as number); q.push(node.left); }
      i++;
      if (i >= arr.length) break;
      if (arr[i] !== null && arr[i] !== undefined) { node.right = new JsTreeNode(arr[i] as number); q.push(node.right); }
      i++;
    }
    return root;
  }
  return arg;
}

function serialize(val: unknown, t: ParamType): unknown {
  if (typeof t === "string") return val;
  if ("array" in t) return ((val as unknown[]) ?? []).map((x) => serialize(x, t.array));
  if ("grid" in t) return ((val as unknown[][]) ?? []).map((row) => row.map((x) => serialize(x, (t as { grid: ParamType }).grid)));
  if ("linked_list" in t) {
    const out: number[] = []; let n = val as JsListNode | null;
    while (n) { out.push(n.val); n = n.next; }
    return out;
  }
  if ("tree" in t) {
    if (!val) return [];
    const out: Array<number | null> = []; const q: Array<JsTreeNode | null> = [val as JsTreeNode];
    while (q.length) {
      const node = q.shift()!;
      if (node === null) { out.push(null); continue; }
      out.push(node.val); q.push(node.left); q.push(node.right);
    }
    while (out.length && out[out.length - 1] === null) out.pop();
    return out;
  }
  return val;
}

export interface RawResult {
  index: number; actual: unknown; stdout: string; error?: string; elapsedMs: number;
}

export function runTests(userCode: string, meta: ProblemMeta, tests: TestCase[]): RawResult[] {
  const params = meta.signature.params; const returns = meta.signature.returns;
  (globalThis as Record<string, unknown>).ListNode = JsListNode;
  (globalThis as Record<string, unknown>).TreeNode = JsTreeNode;
  // The Function constructor scopes user code to globalThis only.
  // __harness_args__ is reserved (CI lint rejects this token in reference solutions).
  const userFn = new Function(
    "__harness_args__",
    `${userCode}\nreturn ${meta.entry}.apply(null, __harness_args__);`,
  ) as (a: unknown[]) => unknown;

  return tests.map((tc, i): RawResult => {
    const captured: string[] = [];
    const origLog = console.log;
    console.log = (...a) => { captured.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ")); };
    const t0 = performance.now();
    try {
      const args = tc.input.map((v, j) => deserialize(v, params[j]));
      const out = userFn(args);
      const actual = serialize(out, returns);
      return { index: i, actual, stdout: captured.join("\n"), elapsedMs: performance.now() - t0 };
    } catch (e) {
      const err = e as Error;
      return { index: i, actual: null, stdout: captured.join("\n"), error: `${err.name}: ${err.message}`, elapsedMs: performance.now() - t0 };
    } finally {
      console.log = origLog;
    }
  });
}
```

- [ ] **Step 2: Create `runner/src/js-worker.ts`**

```ts
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
```

- [ ] **Step 3: Build, commit**

```bash
cd runner && npm run build
git add runner/src/js-worker.ts runner/src/js-harness.ts
git commit -m "feat: JS worker with Function-constructor and harness"
```

---

### Task 17: Runner host (iframe orchestrator)

**Files:**
- Create: `runner/src/runner-host.ts`

- [ ] **Step 1: Implement**

```ts
import type { RunRequest, RunResponse } from "../../lib/runner-protocol";

const MAIN_ORIGIN = (new URLSearchParams(location.search).get("parent")) || "https://code.davidloor.com";
const TIMEOUT_PADDING_MS = 200;

let pythonWorker: Worker | null = null;
let jsWorker: Worker | null = null;

function spawnPython() {
  pythonWorker = new Worker("/python-worker.js", { type: "module" });
  pythonWorker.addEventListener("message", (ev: MessageEvent<RunResponse>) => window.parent.postMessage(ev.data, MAIN_ORIGIN));
}
function spawnJs() {
  jsWorker = new Worker("/js-worker.js", { type: "module" });
  jsWorker.addEventListener("message", (ev: MessageEvent<RunResponse>) => window.parent.postMessage(ev.data, MAIN_ORIGIN));
}

function handle(req: RunRequest) {
  const w = req.language === "python"
    ? (pythonWorker ?? (spawnPython(), pythonWorker!))
    : (jsWorker ?? (spawnJs(), jsWorker!));

  const t = setTimeout(() => {
    if (req.language === "python") { pythonWorker?.terminate(); pythonWorker = null; spawnPython(); }
    else { jsWorker?.terminate(); jsWorker = null; spawnJs(); }
    window.parent.postMessage({ type: "timed_out", requestId: req.requestId, language: req.language } as RunResponse, MAIN_ORIGIN);
    window.parent.postMessage({ type: "warming", requestId: req.requestId, language: req.language, reason: "timeout_reload" } as RunResponse, MAIN_ORIGIN);
  }, req.timeLimitMs + TIMEOUT_PADDING_MS);

  const onMsg = (ev: MessageEvent<RunResponse>) => {
    const d = ev.data;
    if ((d.type === "result" || d.type === "error") && d.requestId === req.requestId) {
      clearTimeout(t);
      w!.removeEventListener("message", onMsg);
    }
  };
  w!.addEventListener("message", onMsg);
  w!.postMessage(req);
}

window.addEventListener("message", (ev) => {
  if (ev.origin !== MAIN_ORIGIN) return;
  const data = ev.data as RunRequest;
  if (data?.type === "run" && data.protocolVersion === 1) handle(data);
});

spawnPython();
spawnJs();
window.parent.postMessage({ type: "ready" } as RunResponse, MAIN_ORIGIN);
```

(Reading `parent` from a query param lets us configure the expected parent origin from the main app's iframe URL, helpful for local dev with `localhost:3000`.)

- [ ] **Step 2: Build runner end-to-end**

```bash
cd runner && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add runner/src/runner-host.ts
git commit -m "feat: runner-host (iframe orchestrator, timeout, respawn)"
```

---

## Phase 5 — Main App UI

### Task 18: Runner-frame React provider (main-app side)

**Files:**
- Create: `components/runner-frame.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Implement `components/runner-frame.tsx`**

```tsx
"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import type { RunRequest, RunResponse } from "@/lib/runner-protocol";

const RUNNER_ORIGIN = process.env.NEXT_PUBLIC_RUNNER_ORIGIN ?? "https://runner.code.davidloor.com";

interface Ctx {
  run: (req: Omit<RunRequest, "type" | "protocolVersion" | "requestId">) => Promise<RunResponse>;
  ready: boolean;
  warming: "python" | "javascript" | null;
}
const RunnerCtx = createContext<Ctx | null>(null);

export function useRunner() {
  const c = useContext(RunnerCtx);
  if (!c) throw new Error("useRunner must be used inside <RunnerProvider>");
  return c;
}

export function RunnerProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [warming, setWarming] = useState<"python" | "javascript" | null>(null);
  const inflight = useRef(new Map<string, (r: RunResponse) => void>());

  useEffect(() => {
    function onMessage(ev: MessageEvent<RunResponse>) {
      if (ev.origin !== RUNNER_ORIGIN) return;
      const data = ev.data;
      if (data.type === "ready") setReady(true);
      else if (data.type === "warming") setWarming(data.language);
      else if (data.type === "result" || data.type === "error" || data.type === "timed_out") {
        setWarming(null);
        if ("requestId" in data) {
          const cb = inflight.current.get(data.requestId);
          if (cb) { cb(data); inflight.current.delete(data.requestId); }
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const run = useCallback((req: Omit<RunRequest, "type" | "protocolVersion" | "requestId">) => {
    return new Promise<RunResponse>((resolve) => {
      const requestId = crypto.randomUUID();
      const full: RunRequest = { type: "run", protocolVersion: 1, requestId, ...req };
      inflight.current.set(requestId, resolve);
      ref.current!.contentWindow!.postMessage(full, RUNNER_ORIGIN);
    });
  }, []);

  const iframeUrl = `${RUNNER_ORIGIN}/runner.html?parent=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`;

  return (
    <RunnerCtx.Provider value={{ run, ready, warming }}>
      <iframe
        ref={ref}
        src={iframeUrl}
        sandbox="allow-scripts allow-same-origin"
        title="runner"
        style={{ width: 0, height: 0, border: 0, position: "absolute" }}
      />
      {children}
    </RunnerCtx.Provider>
  );
}
```

- [ ] **Step 2: Wire into `app/layout.tsx`**

```tsx
import "./globals.css";
import type { ReactNode } from "react";
import { RunnerProvider } from "@/components/runner-frame";

export const metadata = { title: "code.davidloor.com", description: "Interview prep" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <RunnerProvider>{children}</RunnerProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/runner-frame.tsx app/layout.tsx
git commit -m "feat: RunnerProvider for iframe + postMessage protocol"
```

---

### Task 19: CodeEditor + OutputPanel

**Files:**
- Create: `components/code-editor.tsx`, `components/output-panel.tsx`

- [ ] **Step 1: `components/code-editor.tsx`**

```tsx
"use client";
import CodeMirror, { type Extension } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { useMemo } from "react";

export function CodeEditor({
  value, language, onChange, height = "400px",
}: {
  value: string;
  language: "python" | "javascript";
  onChange: (next: string) => void;
  height?: string;
}) {
  const extensions = useMemo<Extension[]>(
    () => [language === "python" ? python() : javascript({ jsx: false, typescript: false })],
    [language],
  );
  return (
    <CodeMirror
      value={value}
      height={height}
      theme="light"
      extensions={extensions}
      onChange={onChange}
      basicSetup={{ lineNumbers: true, foldGutter: true, history: true, autocompletion: false }}
      className="border border-gray-200 dark:border-gray-800 rounded"
    />
  );
}
```

- [ ] **Step 2: `components/output-panel.tsx`**

```tsx
"use client";
import type { RunResponse } from "@/lib/runner-protocol";

export function OutputPanel({
  response, warming,
}: { response: RunResponse | null; warming: "python" | "javascript" | null }) {
  if (warming) {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-3 text-sm">
        Resetting {warming === "python" ? "Python" : "JavaScript"} engine…
      </div>
    );
  }
  if (!response) return <div className="text-sm text-gray-500">No runs yet. Click <kbd>Run</kbd>.</div>;
  if (response.type === "error") return <pre className="text-red-700 text-sm whitespace-pre-wrap">{response.message}</pre>;
  if (response.type === "timed_out") return <div className="text-red-700">Timed out.</div>;
  if (response.type === "result") {
    const passed = response.perTest.filter((p) => p.passed).length;
    return (
      <div className="space-y-2 text-sm">
        <div className="font-medium">{passed} / {response.perTest.length} passed · {Math.round(response.totalMs)} ms</div>
        {response.perTest.map((p) => (
          <div
            key={p.index}
            className={`rounded border p-2 ${p.passed ? "border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800" : "border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800"}`}
          >
            <div className="font-mono text-xs">Test {p.index + 1} · {Math.round(p.elapsedMs)} ms</div>
            {!p.passed && (
              <>
                <div className="font-mono text-xs"><span className="text-gray-500">expected:</span> {JSON.stringify(p.expected)}</div>
                <div className="font-mono text-xs"><span className="text-gray-500">actual:&nbsp;&nbsp;</span> {JSON.stringify(p.actual)}</div>
                {p.error && <div className="text-red-700 text-xs">{p.error}</div>}
              </>
            )}
            {p.stdout && <pre className="text-xs whitespace-pre-wrap text-gray-700 dark:text-gray-300">{p.stdout}</pre>}
          </div>
        ))}
      </div>
    );
  }
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add components/code-editor.tsx components/output-panel.tsx
git commit -m "feat: CodeEditor (CodeMirror 6) and OutputPanel"
```

---

### Task 20: Problem list page

**Files:**
- Create: `app/problems/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";
import { getCoding, getSystemDesign } from "@/lib/problems/loader";
export const dynamic = "force-static";

export default function ProblemsPage() {
  const coding = getCoding();
  const sys = getSystemDesign();
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Problems</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Solve in Python or JavaScript. Everything runs in your browser.</p>
      </header>
      <section>
        <h2 className="text-lg font-medium mb-2">Coding</h2>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {coding.map((p) => p.type === "coding" && (
            <li key={p.meta.id} className="py-2">
              <Link href={`/problems/${p.meta.id}/`} className="hover:underline">{p.meta.title}</Link>
              <span className="ml-2 text-xs uppercase text-gray-500">{p.meta.difficulty}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-medium mb-2">System Design</h2>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {sys.map((p) => p.type === "system_design" && (
            <li key={p.meta.id} className="py-2">
              <Link href={`/problems/${p.meta.id}/`} className="hover:underline">{p.meta.title}</Link>
              <span className="ml-2 text-xs text-gray-500">{p.meta.estMinutes} min</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/problems/page.tsx
git commit -m "feat: problem list page (statically generated)"
```

---

### Task 21: Problem detail pages

**Files:**
- Create: `app/problems/[id]/page.tsx`, `components/coding-problem-page.tsx`, `components/system-design-page.tsx`

- [ ] **Step 1: `app/problems/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getAll, getById } from "@/lib/problems/loader";
import { CodingProblemPage } from "@/components/coding-problem-page";
import { SystemDesignPage } from "@/components/system-design-page";

export const dynamic = "force-static";
export function generateStaticParams() {
  return getAll().map((p) => ({ id: p.meta.id }));
}

export default function ProblemPage({ params }: { params: { id: string } }) {
  const p = getById(params.id);
  if (!p) return notFound();
  if (p.type === "coding") return <CodingProblemPage problem={p} />;
  return <SystemDesignPage problem={p} />;
}
```

- [ ] **Step 2: `components/coding-problem-page.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import { useRunner } from "@/components/runner-frame";
import { CodeEditor } from "@/components/code-editor";
import { OutputPanel } from "@/components/output-panel";
import { loadCode, saveCode } from "@/lib/persistence/idb";
import { canReveal, getRevealStart } from "@/lib/persistence/session";
import type { CodingProblem } from "@/lib/problems/types";
import type { RunResponse } from "@/lib/runner-protocol";

export function CodingProblemPage({ problem }: { problem: CodingProblem }) {
  const [lang, setLang] = useState<"python" | "javascript">("python");
  const [code, setCode] = useState(problem.starters[lang]);
  const [response, setResponse] = useState<RunResponse | null>(null);
  const [hadRun, setHadRun] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const runner = useRunner();

  useEffect(() => { getRevealStart(problem.meta.id); }, [problem.meta.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadCode(problem.meta.id, lang);
      if (!cancelled) setCode(saved ?? problem.starters[lang]);
    })();
    return () => { cancelled = true; };
  }, [problem.meta.id, lang, problem.starters]);

  useEffect(() => {
    const t = setTimeout(() => { void saveCode(problem.meta.id, lang, code); }, 400);
    return () => clearTimeout(t);
  }, [code, lang, problem.meta.id]);

  async function onRun() {
    const resp = await runner.run({
      language: lang,
      code,
      problem: { meta: problem.meta, tests: problem.tests },
      timeLimitMs: problem.meta.timeLimitMs ?? 5000,
    });
    setResponse(resp);
    setHadRun(true);
  }

  const html = DOMPurify.sanitize(marked.parse(problem.statementMarkdown) as string);

  return (
    <main className="grid lg:grid-cols-2 gap-4 max-w-7xl mx-auto p-4">
      <article className="prose dark:prose-invert max-w-none">
        <h1>{problem.meta.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <section className="space-y-3">
        <div className="flex gap-2 items-center">
          <button onClick={() => setLang("python")} className={`px-3 py-1 rounded ${lang === "python" ? "bg-black text-white" : "bg-gray-200 dark:bg-gray-800"}`}>Python</button>
          <button onClick={() => setLang("javascript")} className={`px-3 py-1 rounded ${lang === "javascript" ? "bg-black text-white" : "bg-gray-200 dark:bg-gray-800"}`}>JavaScript</button>
          <button onClick={onRun} disabled={!runner.ready} className="ml-auto px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50">Run</button>
        </div>
        <CodeEditor value={code} language={lang} onChange={setCode} />
        <OutputPanel response={response} warming={runner.warming} />
        <div className="text-sm">
          {canReveal(problem.meta.id, hadRun) ? (
            <button onClick={() => setShowSolution((v) => !v)} className="underline">
              {showSolution ? "Hide" : "Reveal"} reference solution
            </button>
          ) : (
            <span className="text-gray-500">Reveal solution after at least one run and 60s of work.</span>
          )}
          {showSolution && (
            <pre className="mt-2 text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-2 rounded">
              {problem.solutions[lang]}
            </pre>
          )}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: `components/system-design-page.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import { loadNotes, saveNotes } from "@/lib/persistence/idb";
import type { SystemDesignProblem } from "@/lib/problems/types";

export function SystemDesignPage({ problem }: { problem: SystemDesignProblem }) {
  const [notes, setNotes] = useState("");
  const [show, setShow] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    (async () => { setNotes((await loadNotes(problem.meta.id)) ?? ""); })();
  }, [problem.meta.id]);

  useEffect(() => {
    const t = setTimeout(() => { void saveNotes(problem.meta.id, notes); }, 400);
    return () => clearTimeout(t);
  }, [notes, problem.meta.id]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const elapsedMin = Math.floor((now - startedAt) / 60_000);
  const html = DOMPurify.sanitize(marked.parse(problem.promptMarkdown) as string);

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-4">
      <header className="flex items-baseline gap-4">
        <h1 className="text-2xl font-semibold">{problem.meta.title}</h1>
        <span className="text-sm text-gray-500">{elapsedMin} / {problem.meta.estMinutes} min</span>
      </header>
      <article className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Your notes…"
        className="w-full h-64 p-3 border rounded font-mono text-sm dark:bg-gray-900 dark:border-gray-700"
      />
      <button onClick={() => setShow((s) => !s)} className="text-sm underline">
        {show ? "Hide" : "Reveal"} reference talking points
      </button>
      {show && (
        <article className="prose dark:prose-invert text-sm border-t pt-3" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/problems/[id]/page.tsx components/coding-problem-page.tsx components/system-design-page.tsx
git commit -m "feat: problem detail pages (coding + system design)"
```

---

## Phase 6 — First Problem End-to-End

### Task 22: First coding problem — Two Sum

**Files:**
- Create: `problems/coding/001-two-sum/{problem.md,starter.py,starter.js,solution.py,solution.js,tests.json,meta.yaml}`

We use `twoSum` (JS-style) as the entry name in BOTH languages to keep the grader uniform.

- [ ] **Step 1: `problems/coding/001-two-sum/problem.md`**

```md
# Two Sum

Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.

You may assume each input has exactly one solution, and you may not use the same element twice.

## Example

Input: `nums = [2, 7, 11, 15]`, `target = 9`
Output: `[0, 1]` (because `nums[0] + nums[1] == 9`)

## Constraints
- 2 ≤ nums.length ≤ 10⁴
- -10⁹ ≤ nums[i] ≤ 10⁹
- -10⁹ ≤ target ≤ 10⁹
```

- [ ] **Step 2: Starters**

`starter.py`:
```python
def twoSum(nums, target):
    # Return [i, j] such that nums[i] + nums[j] == target.
    pass
```
`starter.js`:
```js
function twoSum(nums, target) {
  // Return [i, j] such that nums[i] + nums[j] === target.
}
```

- [ ] **Step 3: Solutions**

`solution.py`:
```python
def twoSum(nums, target):
    seen = {}
    for i, v in enumerate(nums):
        if target - v in seen:
            return [seen[target - v], i]
        seen[v] = i
    return []
```
`solution.js`:
```js
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
```

- [ ] **Step 4: `tests.json`**

```json
[
  { "input": [[2, 7, 11, 15], 9], "expected": [0, 1] },
  { "input": [[3, 2, 4], 6],       "expected": [1, 2] },
  { "input": [[3, 3], 6],          "expected": [0, 1] }
]
```

- [ ] **Step 5: `meta.yaml`**

```yaml
title: Two Sum
difficulty: easy
tags: [array, hash-map]
topics: [arrays]
entry: twoSum
signature:
  params:
    - { array: int }
    - int
  returns: { array: int }
validator: { kind: set }
timeLimitMs: 5000
```

(`set` because `[0,1]` and `[1,0]` are both valid for the `[3,3], 6` test.)

- [ ] **Step 6: Rebuild manifest and verify**

```bash
node scripts/build-manifest.mjs
npm run build
```
Expected: build succeeds; `out/problems/001-two-sum/index.html` exists.

- [ ] **Step 7: Local end-to-end smoke**

In one terminal:
```bash
cd runner && npx wrangler dev --port 8788
```
In another:
```bash
NEXT_PUBLIC_RUNNER_ORIGIN=http://localhost:8788 npm run dev
```
Open `http://localhost:3000/problems/001-two-sum/`. Click Run. Expect 3/3 passed with the starter replaced by the reference solution. (Starter returns nothing → all tests fail; paste the solution → all pass.)

- [ ] **Step 8: Commit**

```bash
git add problems/coding/001-two-sum/
git commit -m "feat: problem 001 — Two Sum (Python + JS)"
```

---

## Phase 7 — CI

### Task 23: CI problem validator (pyodide npm)

**Files:**
- Create: `scripts/validate-problem.mjs`

The validator runs each coding problem's Python reference solution against `tests.json` using Pyodide-in-Node, then evaluates the result with an inlined copy of the validator dispatch (kept in sync with `lib/validators/index.ts`).

- [ ] **Step 1: Implement**

```js
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
```

- [ ] **Step 2: Run locally**

```bash
node scripts/validate-problem.mjs
```
Expected: `OK 001-two-sum` and exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-problem.mjs
git commit -m "feat: CI validator using pyodide npm package"
```

---

### Task 24: GitHub Actions (CI + deploy)

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`

- [ ] **Step 1: `.github/workflows/ci.yml`**

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run validate:problems
      - run: npm run build
```

- [ ] **Step 2: `.github/workflows/deploy.yml`**

```yaml
name: deploy
on:
  push:
    branches: [main]
jobs:
  deploy-main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
  deploy-runner:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - working-directory: runner
        run: |
          npm ci
          npm run install-pyodide
          npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: runner
          command: deploy
```

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: lint + tests + validate-problems + cloudflare deploy"
```

---

## Phase 8 — Remaining v1 Problems (Tasks 25–28)

Each task follows the exact procedure from Task 22:
1. Create the six files in `problems/coding/NNN-<slug>/`.
2. Run `npm run validate:problems` (must pass).
3. Smoke-test in dev (load `/problems/NNN-<slug>/`, paste solution, click Run).
4. `git add problems/coding/NNN-<slug>/ && git commit -m "feat: problem NNN — <Title>"`.

Choose `entry` consistently across Python and JS using the JS naming convention (camelCase). Inputs use plain JSON values; the harness deserializes them to native types via the declared signature.

### Task 25: Coding problems batch 1 (#2 – #6)

| # | id | entry | signature.params | returns | validator | sample test |
|---|---|---|---|---|---|---|
| 2 | `002-valid-parentheses` | `isValid` | `["string"]` | `"bool"` | `{kind:"exact"}` | `["()[]{}"] → true` |
| 3 | `003-merge-two-sorted-lists` | `mergeTwoLists` | `[{linked_list:"int"}, {linked_list:"int"}]` | `{linked_list:"int"}` | `{kind:"linked_list_value_equal"}` | `[[1,2,4],[1,3,4]] → [1,1,2,3,4,4]` |
| 4 | `004-best-time-buy-sell` | `maxProfit` | `[{array:"int"}]` | `"int"` | `{kind:"exact"}` | `[[7,1,5,3,6,4]] → 5` |
| 5 | `005-valid-anagram` | `isAnagram` | `["string","string"]` | `"bool"` | `{kind:"exact"}` | `["anagram","nagaram"] → true` |
| 6 | `006-reverse-linked-list` | `reverseList` | `[{linked_list:"int"}]` | `{linked_list:"int"}` | `{kind:"linked_list_value_equal"}` | `[[1,2,3,4,5]] → [5,4,3,2,1]` |

- [ ] **For each row above:** create the six files, paste a clear `problem.md`, write idiomatic solutions, add 3-5 tests covering the example + edge cases (empty input, single element, all-same values, very large/small bounds), run `npm run validate:problems`, smoke-test, commit.

Concrete reference solutions for each (use exactly these to keep CI green; alternates allowed but verify with the validator):

**#2 `solution.py`:**
```python
def isValid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]: return False
        else:
            stack.append(c)
    return not stack
```
**#2 `solution.js`:**
```js
function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const c of s) {
    if (c in pairs) {
      if (!stack.length || stack.pop() !== pairs[c]) return false;
    } else stack.push(c);
  }
  return stack.length === 0;
}
```

**#3 `solution.py`:**
```python
def mergeTwoLists(l1, l2):
    dummy = ListNode(0); cur = dummy
    while l1 and l2:
        if l1.val <= l2.val: cur.next = l1; l1 = l1.next
        else: cur.next = l2; l2 = l2.next
        cur = cur.next
    cur.next = l1 or l2
    return dummy.next
```
**#3 `solution.js`:**
```js
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0); let cur = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { cur.next = l1; l1 = l1.next; }
    else { cur.next = l2; l2 = l2.next; }
    cur = cur.next;
  }
  cur.next = l1 || l2;
  return dummy.next;
}
```

**#4 `solution.py`:**
```python
def maxProfit(prices):
    best, lo = 0, float('inf')
    for p in prices:
        lo = min(lo, p); best = max(best, p - lo)
    return best
```
**#4 `solution.js`:**
```js
function maxProfit(prices) {
  let best = 0, lo = Infinity;
  for (const p of prices) { lo = Math.min(lo, p); best = Math.max(best, p - lo); }
  return best;
}
```

**#5 `solution.py`:**
```python
def isAnagram(s, t):
    return sorted(s) == sorted(t)
```
**#5 `solution.js`:**
```js
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  return [...s].sort().join('') === [...t].sort().join('');
}
```

**#6 `solution.py`:**
```python
def reverseList(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next; cur.next = prev; prev = cur; cur = nxt
    return prev
```
**#6 `solution.js`:**
```js
function reverseList(head) {
  let prev = null, cur = head;
  while (cur) { const nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; }
  return prev;
}
```

### Task 26: Coding problems batch 2 (#7 – #11)

| # | id | entry | signature.params | returns | validator | sample |
|---|---|---|---|---|---|---|
| 7 | `007-maximum-subarray` | `maxSubArray` | `[{array:"int"}]` | `"int"` | `{kind:"exact"}` | `[[-2,1,-3,4,-1,2,1,-5,4]] → 6` |
| 8 | `008-climbing-stairs` | `climbStairs` | `["int"]` | `"int"` | `{kind:"exact"}` | `[5] → 8` |
| 9 | `009-binary-search` | `search` | `[{array:"int"}, "int"]` | `"int"` | `{kind:"exact"}` | `[[-1,0,3,5,9,12], 9] → 4` |
| 10 | `010-linked-list-cycle` | `hasCycle` | `[{linked_list:"int"}]` | `"bool"` | `{kind:"exact"}` | `[[3,2,0,-4]] → false` |
| 11 | `011-number-of-islands` | `numIslands` | `[{grid:"string"}]` | `"int"` | `{kind:"exact"}` | example below |

For #10: the v1 test schema cannot express a cycle, so all tests use acyclic lists (answer always `false`). `problem.md` notes this with: "v1 limitation: tests are acyclic; v1.1 will extend the schema to attach `cycleIndex` per test."

For #11 sample: `[[["1","1","0"],["1","0","0"],["0","0","1"]]] → 2`.

**#7 `solution.py`:**
```python
def maxSubArray(nums):
    best = cur = nums[0]
    for v in nums[1:]:
        cur = max(v, cur + v); best = max(best, cur)
    return best
```
**#7 `solution.js`:**
```js
function maxSubArray(nums) {
  let best = nums[0], cur = nums[0];
  for (let i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); best = Math.max(best, cur); }
  return best;
}
```

**#8 `solution.py`:**
```python
def climbStairs(n):
    a, b = 1, 1
    for _ in range(n): a, b = b, a + b
    return a
```
**#8 `solution.js`:**
```js
function climbStairs(n) { let a = 1, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; }
```

**#9 `solution.py`:**
```python
def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        if nums[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1
```
**#9 `solution.js`:**
```js
function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}
```

**#10 `solution.py`:**
```python
def hasCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
        if slow is fast: return True
    return False
```
**#10 `solution.js`:**
```js
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; if (slow === fast) return true; }
  return false;
}
```

**#11 `solution.py`:**
```python
def numIslands(grid):
    if not grid: return 0
    rows, cols = len(grid), len(grid[0]); seen = set(); count = 0
    def dfs(r, c):
        if (r, c) in seen or r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1": return
        seen.add((r, c))
        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1" and (r, c) not in seen:
                count += 1; dfs(r, c)
    return count
```
**#11 `solution.js`:**
```js
function numIslands(grid) {
  if (!grid.length) return 0;
  const rows = grid.length, cols = grid[0].length; const seen = new Set(); let count = 0;
  const dfs = (r, c) => {
    const k = `${r},${c}`;
    if (seen.has(k) || r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== "1") return;
    seen.add(k); dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    if (grid[r][c] === "1" && !seen.has(`${r},${c}`)) { count++; dfs(r, c); }
  return count;
}
```

- [ ] Create files, validate, smoke-test, commit per problem (commits 7–11).

### Task 27: Coding problems batch 3 (#12 – #16)

| # | id | entry | signature.params | returns | validator | sample |
|---|---|---|---|---|---|---|
| 12 | `012-group-anagrams` | `groupAnagrams` | `[{array:"string"}]` | `{array:{array:"string"}}` | `{kind:"set_of_sets"}` | `[["eat","tea","tan","ate","nat","bat"]] → [["eat","tea","ate"],["tan","nat"],["bat"]]` |
| 13 | `013-container-most-water` | `maxArea` | `[{array:"int"}]` | `"int"` | `{kind:"exact"}` | `[[1,8,6,2,5,4,8,3,7]] → 49` |
| 14 | `014-three-sum` | `threeSum` | `[{array:"int"}]` | `{array:{array:"int"}}` | `{kind:"set_of_sets"}` | `[[-1,0,1,2,-1,-4]] → [[-1,-1,2],[-1,0,1]]` |
| 15 | `015-longest-substr-no-repeat` | `lengthOfLongestSubstring` | `["string"]` | `"int"` | `{kind:"exact"}` | `["abcabcbb"] → 3` |
| 16 | `016-search-rotated-sorted` | `search` | `[{array:"int"}, "int"]` | `"int"` | `{kind:"exact"}` | `[[4,5,6,7,0,1,2], 0] → 4` |

**#12 `solution.py`:**
```python
def groupAnagrams(strs):
    g = {}
    for s in strs:
        k = "".join(sorted(s))
        g.setdefault(k, []).append(s)
    return list(g.values())
```
**#12 `solution.js`:**
```js
function groupAnagrams(strs) {
  const g = new Map();
  for (const s of strs) {
    const k = [...s].sort().join('');
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(s);
  }
  return [...g.values()];
}
```

**#13 `solution.py`:**
```python
def maxArea(h):
    i, j, best = 0, len(h) - 1, 0
    while i < j:
        best = max(best, (j - i) * min(h[i], h[j]))
        if h[i] < h[j]: i += 1
        else: j -= 1
    return best
```
**#13 `solution.js`:**
```js
function maxArea(h) {
  let i = 0, j = h.length - 1, best = 0;
  while (i < j) { best = Math.max(best, (j - i) * Math.min(h[i], h[j])); if (h[i] < h[j]) i++; else j--; }
  return best;
}
```

**#14 `solution.py`:**
```python
def threeSum(nums):
    nums = sorted(nums); res = []
    n = len(nums)
    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i-1]: continue
        l, r = i + 1, n - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s == 0:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l+1]: l += 1
                while l < r and nums[r] == nums[r-1]: r -= 1
                l += 1; r -= 1
            elif s < 0: l += 1
            else: r -= 1
    return res
```
**#14 `solution.js`:**
```js
function threeSum(nums) {
  nums = [...nums].sort((a, b) => a - b);
  const res = []; const n = nums.length;
  for (let i = 0; i < n - 2; i++) {
    if (i > 0 && nums[i] === nums[i-1]) continue;
    let l = i + 1, r = n - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s === 0) { res.push([nums[i], nums[l], nums[r]]); while (l < r && nums[l] === nums[l+1]) l++; while (l < r && nums[r] === nums[r-1]) r--; l++; r--; }
      else if (s < 0) l++; else r--;
    }
  }
  return res;
}
```

**#15 `solution.py`:**
```python
def lengthOfLongestSubstring(s):
    seen = {}; best = 0; left = 0
    for i, c in enumerate(s):
        if c in seen and seen[c] >= left: left = seen[c] + 1
        seen[c] = i; best = max(best, i - left + 1)
    return best
```
**#15 `solution.js`:**
```js
function lengthOfLongestSubstring(s) {
  const seen = new Map(); let best = 0, left = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (seen.has(c) && seen.get(c) >= left) left = seen.get(c) + 1;
    seen.set(c, i); best = Math.max(best, i - left + 1);
  }
  return best;
}
```

**#16 `solution.py`:**
```python
def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]: hi = mid - 1
            else: lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]: lo = mid + 1
            else: hi = mid - 1
    return -1
```
**#16 `solution.js`:**
```js
function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
    }
  }
  return -1;
}
```

- [ ] Create files, validate, smoke-test, commit per problem.

### Task 28: Coding problems batch 4 (#17 – #20)

| # | id | entry | signature.params | returns | validator | sample |
|---|---|---|---|---|---|---|
| 17 | `017-trapping-rain-water` | `trap` | `[{array:"int"}]` | `"int"` | `{kind:"exact"}` | `[[0,1,0,2,1,0,1,3,2,1,2,1]] → 6` |
| 18 | `018-word-break` | `wordBreak` | `["string", {array:"string"}]` | `"bool"` | `{kind:"exact"}` | `["leetcode", ["leet","code"]] → true` |
| 19 | `019-course-schedule` | `canFinish` | `["int", {array:{array:"int"}}]` | `"bool"` | `{kind:"exact"}` | `[2, [[1,0]]] → true` |
| 20 | `020-lca-bst` | `lowestCommonAncestor` | `[{tree:"int"}, "int", "int"]` | `"int"` | `{kind:"exact"}` | `[[6,2,8,0,4,7,9,null,null,3,5], 2, 8] → 6` |

For #20: return the **value** at the LCA (not a node) so the serialization is a simple int.

**#17 `solution.py`:**
```python
def trap(h):
    n = len(h); l = [0]*n; r = [0]*n; best = 0
    for i in range(1, n): l[i] = max(l[i-1], h[i-1])
    for i in range(n-2, -1, -1): r[i] = max(r[i+1], h[i+1])
    for i in range(n): best += max(0, min(l[i], r[i]) - h[i])
    return best
```
**#17 `solution.js`:**
```js
function trap(h) {
  const n = h.length; const l = Array(n).fill(0), r = Array(n).fill(0);
  for (let i = 1; i < n; i++) l[i] = Math.max(l[i-1], h[i-1]);
  for (let i = n-2; i >= 0; i--) r[i] = Math.max(r[i+1], h[i+1]);
  let best = 0;
  for (let i = 0; i < n; i++) best += Math.max(0, Math.min(l[i], r[i]) - h[i]);
  return best;
}
```

**#18 `solution.py`:**
```python
def wordBreak(s, words):
    words = set(words); n = len(s); dp = [False]*(n+1); dp[0] = True
    for i in range(1, n+1):
        for j in range(i):
            if dp[j] and s[j:i] in words: dp[i] = True; break
    return dp[n]
```
**#18 `solution.js`:**
```js
function wordBreak(s, words) {
  const dict = new Set(words); const n = s.length; const dp = Array(n+1).fill(false); dp[0] = true;
  for (let i = 1; i <= n; i++) for (let j = 0; j < i; j++) if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; break; }
  return dp[n];
}
```

**#19 `solution.py`:**
```python
def canFinish(n, prereqs):
    from collections import defaultdict, deque
    g = defaultdict(list); indeg = [0]*n
    for a, b in prereqs:
        g[b].append(a); indeg[a] += 1
    q = deque([i for i in range(n) if indeg[i] == 0]); seen = 0
    while q:
        v = q.popleft(); seen += 1
        for w in g[v]:
            indeg[w] -= 1
            if indeg[w] == 0: q.append(w)
    return seen == n
```
**#19 `solution.js`:**
```js
function canFinish(n, prereqs) {
  const g = Array.from({length: n}, () => []); const indeg = Array(n).fill(0);
  for (const [a, b] of prereqs) { g[b].push(a); indeg[a]++; }
  const q = []; for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  let seen = 0;
  while (q.length) { const v = q.shift(); seen++; for (const w of g[v]) if (--indeg[w] === 0) q.push(w); }
  return seen === n;
}
```

**#20 `solution.py`:**
```python
def lowestCommonAncestor(root, p, q):
    while root:
        if p < root.val and q < root.val: root = root.left
        elif p > root.val and q > root.val: root = root.right
        else: return root.val
    return -1
```
**#20 `solution.js`:**
```js
function lowestCommonAncestor(root, p, q) {
  while (root) {
    if (p < root.val && q < root.val) root = root.left;
    else if (p > root.val && q > root.val) root = root.right;
    else return root.val;
  }
  return -1;
}
```

- [ ] Create files, validate, smoke-test, commit per problem.

---

### Task 29: System design prompts (7)

**Files:**
- Create: 7 folders under `problems/system-design/`, each with `problem.md` and `meta.yaml`.

Template for `problem.md`:
```md
# <Title>

You have <N> minutes. Sketch the system in this notes pane.

## Scope
- Functional requirements
- Non-functional requirements (latency, throughput, durability)
- Out of scope

## Suggested approach
- Step 1: clarify requirements
- Step 2: high-level design
- Step 3: API + data model
- Step 4: storage + caching
- Step 5: bottlenecks + mitigations

## Reference talking points
- ...
- ...
- ...
```

Template for `meta.yaml`:
```yaml
title: <Title>
estMinutes: <N>
tags: [<tag>]
```

Prompts and times:

| id | title | estMinutes |
|---|---|---|
| `001-design-url-shortener` | URL Shortener | 30 |
| `002-design-rate-limiter` | Rate Limiter | 30 |
| `003-design-news-feed` | News Feed | 45 |
| `004-design-chat-app` | Chat App | 45 |
| `005-design-distributed-cache` | Distributed Cache | 45 |
| `006-design-web-crawler` | Web Crawler | 30 |
| `007-design-pastebin` | Pastebin | 30 |

- [ ] **Step 1:** Create folders + files for all 7 (use authoritative public references like the systeminterview.com / Designing Data-Intensive Applications recap notes; write in your own words).
- [ ] **Step 2:** `git add problems/system-design/ && git commit -m "feat: 7 system-design prompts"`.

---

## Phase 9 — Polish & Verification

### Task 30: E2E test (Playwright)

**Files:**
- Create: `playwright.config.ts`, `e2e/run-flow.spec.ts`

- [ ] **Step 1: `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NEXT_PUBLIC_RUNNER_ORIGIN: "http://localhost:8788" },
  },
  use: { baseURL: "http://localhost:3000" },
});
```

- [ ] **Step 2: `e2e/run-flow.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("two-sum reference solution passes all tests", async ({ page }) => {
  const solution = readFileSync(path.resolve("problems/coding/001-two-sum/solution.js"), "utf8");

  await page.goto("/problems/001-two-sum/");
  await page.getByRole("button", { name: "JavaScript" }).click();

  // Replace the editor's contents with the reference solution.
  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(solution);

  await page.getByRole("button", { name: "Run" }).click();
  await expect(page.getByText(/3\s*\/\s*3 passed/)).toBeVisible({ timeout: 30_000 });
});
```

- [ ] **Step 3: Run locally**

```bash
cd runner && npx wrangler dev --port 8788 &
npm run e2e
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts e2e/
git commit -m "test: e2e run-flow against Two Sum"
```

---

### Task 31: Mobile + accessibility pass

- [ ] **Step 1:** Open `/problems/001-two-sum/` in DevTools device emulator (iPhone 14). Verify the split layout collapses to a stack on `lg:` breakpoint. Fix any overflow by adding `min-w-0` / `overflow-auto` on the editor column.
- [ ] **Step 2:** Run `npx @axe-core/cli http://localhost:3000/problems` and resolve **critical** + **serious** violations on the problem list and one detail page.
- [ ] **Step 3:** Add explicit focus styles to all buttons (Tailwind: `focus:outline focus:outline-2 focus:outline-blue-600 focus-visible:outline`).
- [ ] **Step 4: Commit**

```bash
git add app/ components/
git commit -m "fix: mobile layout + focus styles + a11y violations"
```

---

### Task 32: CSP smoke test in real deploy

- [ ] **Step 1:** Push to a `preview-*` branch; run `wrangler deploy` from a workflow_dispatch trigger if not auto.
- [ ] **Step 2:** In the deployed preview, open browser DevTools console while running Two Sum. Confirm:
  - No CSP violation errors from the main app.
  - The runner iframe loads, Pyodide loads, harness runs, results return.
  - No blocked-fetch console errors.
- [ ] **Step 3:** If `'unsafe-inline'` raises future concerns, document the v1.1 nonce-via-HTMLRewriter path in `docs/v1.1-hardening.md` (single page).
- [ ] **Step 4: Commit any tweaks**

```bash
git add public/_headers runner/public/_headers
git commit -m "chore: CSP smoke-test fixes from preview deploy"
```

---

### Task 33: README + CONTRIBUTING

**Files:**
- Modify: `README.md`
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Rewrite `README.md`**

```md
# code.davidloor.com

Open-source coding interview prep. Python and JavaScript problems graded in your browser via Pyodide and a sandboxed JS runtime. System-design prompts too.

## Run locally

In one terminal:
```bash
cd runner
npm install
npm run install-pyodide
npx wrangler dev --port 8788
```

In another:
```bash
npm install
NEXT_PUBLIC_RUNNER_ORIGIN=http://localhost:8788 npm run dev
```

Open http://localhost:3000.

## Stack
- Next.js 16 (static export) on Cloudflare Workers Static Assets
- Runner: separate Cloudflare deployment on `runner.code.davidloor.com`
- Pyodide for Python; sandboxed `Function` constructor for JS
- CodeMirror 6 editor
- MIT license

## Contributing problems

See [CONTRIBUTING.md](./CONTRIBUTING.md).
```

- [ ] **Step 2: Create `CONTRIBUTING.md`**

```md
# Contributing

## Add a new coding problem

1. Create `problems/coding/NNN-slug/` (next free number, kebab-case slug).
2. Add six files (see existing problems for examples):
   - `problem.md` — statement
   - `starter.py`, `starter.js` — stubs
   - `solution.py`, `solution.js` — reference solutions used by CI
   - `tests.json` — list of `{ input, expected }`
   - `meta.yaml` — title, difficulty, entry function name, signature, validator
3. Run `npm run validate:problems` locally — it must pass.
4. Open a PR.

## Validators

| kind | when to use |
| - | - |
| `exact` | order-sensitive |
| `set` | order-insensitive flat list |
| `set_of_lists` | unordered outer, ordered inner |
| `set_of_sets` | both unordered (e.g., 3Sum) |
| `any_of` | multiple valid answers (`expected` is an array of acceptable answers) |
| `linked_list_value_equal` | linked-list output (serialized to array by harness) |
| `tree_isomorphic` | tree output (BFS-array form) |

## Conventions

- Use the JS naming convention (camelCase) for `entry` in both languages.
- Do NOT use the identifier `__harness_args__` in user-visible code (reserved by the JS harness).

## Add a new system-design prompt

1. Create `problems/system-design/NNN-slug/` with `problem.md` + `meta.yaml`.
2. PR.
```

- [ ] **Step 3: Commit**

```bash
git add README.md CONTRIBUTING.md
git commit -m "docs: README + CONTRIBUTING"
```

---

## Self-Review Notes

**Spec coverage:**
- Static export on Workers Static Assets → Task 1, 2.
- Runner subdomain + sandbox iframe → Task 2, 17, 18.
- Per-origin CSP via `_headers` → Task 2.
- Two Web Workers (Python + JS) per language → Tasks 15 (Python), 16 (JS), 17 (host).
- Frozen network APIs with prototype-chain walk → Task 14.
- `Function`-constructor with `__harness_args__` parameter → Task 16.
- Python-side serialization (no PyProxy leaks) → Task 15.
- 7 validators with canonical sort → Tasks 4-9.
- Typed signature system + serializers → Tasks 3, 15 (Python), 16 (JS).
- Problem repo shape + manifest → Task 11.
- IDB autosave + sessionStorage reveal gate → Tasks 10, 21.
- Warm-up indicator → Task 19.
- Cookie policy → none in v1 (no cookies set); documented in CONTRIBUTING via "no auth secrets".
- CI validator using pyodide npm → Task 23.
- GitHub Actions deploy (main + runner) → Task 24.
- 20 coding + 7 system-design problems → Tasks 22, 25-29.
- Mobile / a11y / CSP / E2E → Tasks 30-32.
- README + CONTRIBUTING → Task 33.

**Known deferrals (matching spec's "deferred to plan" list):**
- Pyodide version pin → 0.27.0 in `runner/scripts/install-pyodide.mjs`.
- CodeMirror extension set → minimal (lineNumbers, foldGutter, history, no autocompletion).
- Theme → default light/dark via Tailwind.
- Optional Playwright nightly → punted to v1.1.
