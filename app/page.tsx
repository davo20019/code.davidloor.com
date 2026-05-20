import Link from "next/link";
import { getCoding, getSystemDesign } from "@/lib/problems/loader";

export const dynamic = "force-static";

export default function Home() {
  const codingCount = getCoding().length;
  const sysCount = getSystemDesign().length;

  return (
    <main className="max-w-6xl mx-auto px-6 pt-12 pb-24">
      <section className="grid grid-cols-12 gap-6 items-end">
        <div className="col-span-12 lg:col-span-9 animate-fade-up" style={{ animationDelay: "40ms" }}>
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-dim mb-5">
            Vol. I · Interview Practice · 2026
          </p>
          <h1
            className="font-display font-light text-ink leading-[0.92] tracking-tighter"
            style={{
              fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1',
              fontSize: "clamp(3rem, 9vw, 6.5rem)",
            }}
          >
            Read the problem.<br />
            <span className="italic" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
              Write the answer.
            </span>{" "}
            <span className="text-lime">Run it.</span>
          </h1>
        </div>
        <div
          className="col-span-12 lg:col-span-3 lg:pl-6 lg:border-l lg:border-rule animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          <p className="text-[0.95rem] leading-relaxed text-ink-soft">
            A small, open studio of coding and system-design problems. Python and JavaScript, graded
            entirely in your browser. No accounts, no telemetry, no servers between you and the work.
          </p>
        </div>
      </section>

      <section className="mt-20 grid grid-cols-12 gap-6 items-baseline border-t border-rule pt-10">
        <div className="col-span-12 lg:col-span-3 animate-fade-up" style={{ animationDelay: "240ms" }}>
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-dim mb-2">In this volume</p>
        </div>
        <div className="col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card
            index="I"
            count={codingCount}
            label="Coding Problems"
            blurb="Twenty staples — arrays, hash maps, two-pointer, BFS, DP. Python and JavaScript both required to pass."
            href="/problems/#coding"
            delayMs={320}
          />
          <Card
            index="II"
            count={sysCount}
            label="System Design"
            blurb="Open prompts to time yourself against. Sketch in the notes pane, then reveal reference talking points."
            href="/problems/#system-design"
            delayMs={400}
          />
        </div>
      </section>

      <section
        className="mt-16 grid grid-cols-12 gap-6 items-baseline border-t border-rule pt-10 animate-fade-up"
        style={{ animationDelay: "500ms" }}
      >
        <div className="col-span-12 lg:col-span-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-dim mb-2">On the press</p>
        </div>
        <div className="col-span-12 lg:col-span-9 text-[0.95rem] leading-relaxed text-ink-soft space-y-3">
          <p>
            Code runs in <strong className="text-ink">Pyodide</strong> (real CPython 3.12 on
            WebAssembly) and a sandboxed JavaScript Worker. Each problem is a folder in the repo —
            contributing a new one is the same as opening a pull request with a Markdown file and a
            tests.json.
          </p>
          <p>
            The grader is declarative: every problem declares a signature and a validator
            (<code className="font-mono text-[0.85em] bg-lime/10 text-lime px-1.5 py-0.5">exact</code>,{" "}
            <code className="font-mono text-[0.85em] bg-lime/10 text-lime px-1.5 py-0.5">set</code>,{" "}
            <code className="font-mono text-[0.85em] bg-lime/10 text-lime px-1.5 py-0.5">set_of_sets</code>
            , ...). The harness handles the rest, so problem authors never ship executable code.
          </p>
        </div>
      </section>

      <div
        className="mt-14 flex flex-wrap items-center gap-4 animate-fade-up"
        style={{ animationDelay: "580ms" }}
      >
        <Link
          href="/problems/"
          className="btn-tactile focus-ring inline-flex items-center gap-3 bg-lime text-ground px-7 py-3.5 text-[13px] uppercase tracking-[0.18em] hover:bg-lime-deep transition-colors"
        >
          Open the problem set
          <span aria-hidden>→</span>
        </Link>
        <span className="text-[11px] uppercase tracking-[0.16em] text-ink-dim">
          MIT licensed · Pyodide 0.27 · Next.js 16
        </span>
      </div>
    </main>
  );
}

function Card({
  index,
  count,
  label,
  blurb,
  href,
  delayMs,
}: {
  index: string;
  count: number;
  label: string;
  blurb: string;
  href: string;
  delayMs: number;
}) {
  return (
    <Link
      href={href}
      className="group block bg-elevated border border-rule p-6 hover:border-lime transition-colors animate-fade-up focus-ring"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="marker-num text-[3rem] text-lime leading-none">{index}</span>
        <span
          className="font-display italic text-ink-dim text-xl"
          style={{ fontVariationSettings: '"opsz" 24, "WONK" 1' }}
        >
          {count}
        </span>
      </div>
      <h3
        className="font-display text-ink text-xl mb-2"
        style={{ fontVariationSettings: '"opsz" 24, "SOFT" 30' }}
      >
        {label}
      </h3>
      <p className="text-[0.875rem] leading-relaxed text-ink-soft">{blurb}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-dim group-hover:text-lime transition-colors">
        Browse <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
