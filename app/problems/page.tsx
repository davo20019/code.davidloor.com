import Link from "next/link";
import { getCoding, getSystemDesign } from "@/lib/problems/loader";

export const dynamic = "force-static";

const difficultyMark: Record<string, { letter: string; tone: string; label: string }> = {
  easy: { letter: "E", tone: "text-mint border-mint/40 bg-mint-soft", label: "easy" },
  medium: { letter: "M", tone: "text-amber border-amber/40 bg-amber-soft", label: "medium" },
  hard: { letter: "H", tone: "text-magenta border-magenta/40 bg-magenta-soft", label: "hard" },
};

export default function ProblemsPage() {
  const coding = getCoding();
  const sys = getSystemDesign();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-20 sm:pb-24">
      <header className="mb-10 sm:mb-12 grid grid-cols-12 gap-x-6 gap-y-5 items-baseline">
        <div className="col-span-12 lg:col-span-9 animate-fade-up" style={{ animationDelay: "40ms" }}>
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-dim mb-3">Table of contents</p>
          <h1
            className="font-display font-light text-ink leading-[0.95] tracking-tighter text-[clamp(2.5rem,6vw,4.25rem)]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 1' }}
          >
            Twenty problems,<br />
            <span className="italic">seven prompts</span>.
          </h1>
        </div>
        <div
          className="col-span-12 lg:col-span-3 lg:border-l lg:border-rule lg:pl-6 animate-fade-up"
          style={{ animationDelay: "140ms" }}
        >
          <p className="text-[0.875rem] leading-relaxed text-ink-soft">
            Solve in Python or JavaScript. Everything runs in your browser via Pyodide and a sandboxed
            Worker. Progress is saved locally.
          </p>
        </div>
      </header>

      <Section id="coding" number="I" title="Coding" subtitle="auto-graded, both languages" delayMs={200}>
        <ol className="divide-y divide-rule border-y border-rule">
          {coding.map((p, i) => {
            if (p.type !== "coding") return null;
            const d = difficultyMark[p.meta.difficulty] ?? difficultyMark.easy;
            return (
              <li key={p.meta.id} className="animate-fade-up" style={{ animationDelay: `${260 + i * 14}ms` }}>
                <Link
                  href={`/problems/${p.meta.id}/`}
                  className="group focus-ring grid grid-cols-12 gap-x-3 sm:gap-x-4 items-center py-3.5 sm:py-4 hover:bg-elevated transition-colors px-2 -mx-2"
                >
                  <span className="col-span-2 sm:col-span-1 marker-num text-[1.65rem] sm:text-3xl text-ink-dim group-hover:text-lime transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="col-span-8 sm:col-span-7 font-display text-ink text-[1.0625rem] sm:text-xl leading-snug group-hover:italic transition-all"
                    style={{ fontVariationSettings: '"opsz" 24, "SOFT" 30' }}
                  >
                    {p.meta.title}
                  </span>
                  <span className="hidden sm:flex sm:col-span-3 flex-wrap gap-2 justify-end text-[10px] uppercase tracking-[0.14em] text-ink-dim">
                    {p.meta.tags.slice(0, 2).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </span>
                  <span
                    className={`col-span-2 sm:col-span-1 inline-flex items-center justify-center w-7 h-7 border ${d.tone} text-[11px] font-semibold ml-auto`}
                    title={d.label}
                  >
                    {d.letter}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section
        id="system-design"
        number="II"
        title="System Design"
        subtitle="open-ended, time yourself"
        delayMs={520}
      >
        <ol className="divide-y divide-rule border-y border-rule">
          {sys.map((p, i) => {
            if (p.type !== "system_design") return null;
            return (
              <li key={p.meta.id} className="animate-fade-up" style={{ animationDelay: `${580 + i * 30}ms` }}>
                <Link
                  href={`/problems/${p.meta.id}/`}
                  className="group focus-ring grid grid-cols-12 gap-x-3 sm:gap-x-4 items-center py-3.5 sm:py-4 hover:bg-elevated transition-colors px-2 -mx-2"
                >
                  <span className="col-span-2 sm:col-span-1 marker-num text-[1.65rem] sm:text-3xl text-ink-dim group-hover:text-lime transition-colors">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="col-span-7 sm:col-span-9 font-display text-ink text-[1.0625rem] sm:text-xl leading-snug group-hover:italic transition-all"
                    style={{ fontVariationSettings: '"opsz" 24, "SOFT" 30' }}
                  >
                    {p.meta.title}
                  </span>
                  <span
                    className="col-span-3 sm:col-span-2 text-right font-display italic text-ink-dim text-xs sm:text-sm whitespace-nowrap"
                    style={{ fontVariationSettings: '"opsz" 14, "WONK" 1' }}
                  >
                    {p.meta.estMinutes} min
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </Section>
    </main>
  );
}

function Section({
  id,
  number,
  title,
  subtitle,
  delayMs,
  children,
}: {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  delayMs: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-14 sm:mt-16 scroll-mt-20">
      <div
        className="flex items-baseline justify-between gap-3 mb-4 animate-fade-up"
        style={{ animationDelay: `${delayMs}ms` }}
      >
        <h2 className="flex items-baseline gap-3 sm:gap-4 min-w-0">
          <span className="marker-num text-lime text-[2.25rem] sm:text-4xl">{number}</span>
          <span
            className="font-display text-ink text-xl sm:text-2xl truncate"
            style={{ fontVariationSettings: '"opsz" 24, "SOFT" 30' }}
          >
            {title}
          </span>
        </h2>
        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-ink-dim text-right shrink-0">{subtitle}</span>
      </div>
      {children}
    </section>
  );
}
