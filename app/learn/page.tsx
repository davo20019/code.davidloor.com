import Link from "next/link";
import { getLearnGuides } from "@/lib/learn/loader";

export const dynamic = "force-static";

export default function LearnPage() {
  const guides = getLearnGuides();

  return (
    <main className="max-w-5xl mx-auto px-6 pt-12 pb-24">
      <header className="mb-12 grid grid-cols-12 gap-6 items-baseline">
        <div className="col-span-12 lg:col-span-9 animate-fade-up" style={{ animationDelay: "40ms" }}>
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-dim mb-3">Field guides</p>
          <h1
            className="font-display font-light text-ink leading-[0.95] tracking-tighter text-[clamp(2.5rem,6vw,4.25rem)]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 1' }}
          >
            Learn enough to solve<br />
            <span className="italic">all twenty</span>.
          </h1>
        </div>
        <div
          className="col-span-12 lg:col-span-3 lg:border-l lg:border-rule lg:pl-6 animate-fade-up"
          style={{ animationDelay: "140ms" }}
        >
          <p className="text-[0.875rem] leading-relaxed text-ink-soft">
            Four short guides covering the language fundamentals and algorithmic patterns this site's
            problems exercise. Read in order or jump in. No prerequisites beyond &quot;I can write
            a function.&quot;
          </p>
        </div>
      </header>

      <ol className="divide-y divide-rule border-y border-rule">
        {guides.map((g, i) => (
          <li key={g.meta.id} className="animate-fade-up" style={{ animationDelay: `${200 + i * 50}ms` }}>
            <Link
              href={`/learn/${g.meta.id}/`}
              className="group focus-ring grid grid-cols-12 gap-4 items-baseline py-6 hover:bg-elevated transition-colors px-2 -mx-2"
            >
              <span className="col-span-2 sm:col-span-1 marker-num text-3xl sm:text-4xl text-lime leading-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="col-span-10 sm:col-span-9 min-w-0">
                <h2
                  className="font-display text-ink text-xl sm:text-2xl mb-1 group-hover:italic transition-all"
                  style={{ fontVariationSettings: '"opsz" 24, "SOFT" 30' }}
                >
                  {g.meta.title}
                </h2>
                <p className="text-[0.875rem] leading-relaxed text-ink-soft">{g.meta.blurb}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.16em] text-ink-dim">
                  {g.meta.topics.map((t) => (
                    <span key={t}>· {t}</span>
                  ))}
                </div>
              </div>
              <span
                className="col-span-12 sm:col-span-2 text-right font-display italic text-ink-dim text-sm shrink-0"
                style={{ fontVariationSettings: '"opsz" 14, "WONK" 1' }}
              >
                {g.meta.estMinutes} min
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <aside className="mt-16 grid grid-cols-12 gap-6 items-baseline animate-fade-up" style={{ animationDelay: "500ms" }}>
        <div className="col-span-12 lg:col-span-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-dim">A note on use</p>
        </div>
        <div className="col-span-12 lg:col-span-9 text-[0.95rem] leading-relaxed text-ink-soft">
          <p>
            These guides assume you&apos;ll bounce between them and the{" "}
            <Link href="/problems/" className="text-lime hover:underline">problems</Link>. Read a
            pattern, try a related problem, come back to read the next. Repetition is the point.
          </p>
        </div>
      </aside>
    </main>
  );
}
