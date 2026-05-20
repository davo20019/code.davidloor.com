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
