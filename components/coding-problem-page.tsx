"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRunner } from "@/components/runner-frame";
import { CodeEditor } from "@/components/code-editor";
import { OutputPanel } from "@/components/output-panel";
import { Markdown } from "@/components/markdown";
import { loadCode, saveCode, markComplete } from "@/lib/persistence/idb";
import { canReveal, getRevealStart } from "@/lib/persistence/session";
import type { CodingProblem } from "@/lib/problems/types";
import type { RunResponse } from "@/lib/runner-protocol";

const difficultyTone: Record<string, { letter: string; cls: string; name: string }> = {
  easy: { letter: "E", cls: "text-mint border-mint/40 bg-mint-soft", name: "Easy" },
  medium: { letter: "M", cls: "text-amber border-amber/40 bg-amber-soft", name: "Medium" },
  hard: { letter: "H", cls: "text-magenta border-magenta/40 bg-magenta-soft", name: "Hard" },
};

export function CodingProblemPage({ problem }: { problem: CodingProblem }) {
  const [lang, setLang] = useState<"python" | "javascript">("python");
  const [code, setCode] = useState(problem.starters[lang]);
  const [response, setResponse] = useState<RunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [hadRun, setHadRun] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const runner = useRunner();

  useEffect(() => {
    getRevealStart(problem.meta.id);
  }, [problem.meta.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadCode(problem.meta.id, lang);
      if (!cancelled) setCode(saved ?? problem.starters[lang]);
    })();
    return () => {
      cancelled = true;
    };
  }, [problem.meta.id, lang, problem.starters]);

  useEffect(() => {
    const t = setTimeout(() => {
      void saveCode(problem.meta.id, lang, code);
    }, 400);
    return () => clearTimeout(t);
  }, [code, lang, problem.meta.id]);

  async function onRun() {
    setRunning(true);
    try {
      const resp = await runner.run({
        language: lang,
        code,
        problem: { meta: problem.meta, tests: problem.tests },
        timeLimitMs: problem.meta.timeLimitMs ?? 5000,
      });
      setResponse(resp);
      setHadRun(true);
      if (
        resp.type === "result" &&
        resp.perTest.length > 0 &&
        resp.perTest.every((p) => p.passed)
      ) {
        void markComplete(problem.meta.id);
      }
    } finally {
      setRunning(false);
    }
  }

  function onReset() {
    setCode(problem.starters[lang]);
    setResponse(null);
  }

  const d = difficultyTone[problem.meta.difficulty] ?? difficultyTone.easy;
  const allPassed =
    response?.type === "result" && response.perTest.length > 0 && response.perTest.every((p) => p.passed);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <nav className="text-[11px] uppercase tracking-[0.18em] text-ink-dim mb-6 flex gap-3 items-center animate-fade-up">
        <Link href="/problems/" className="hover:text-lime transition-colors">
          ← Problems
        </Link>
        <span className="text-rule">/</span>
        <span>Coding · No. {problem.meta.id.split("-")[0]}</span>
      </nav>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        {/* LEFT — statement */}
        <article className="lg:col-span-5 min-w-0 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <header className="mb-6 pb-6 border-b border-rule">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 border ${d.cls} text-[10px] font-semibold`}
                title={d.name}
              >
                {d.letter}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-ink-dim">{d.name}</span>
              {problem.meta.tags.map((t) => (
                <span key={t} className="text-[10px] uppercase tracking-[0.18em] text-ink-dim">
                  · {t}
                </span>
              ))}
            </div>
            <h1
              className="font-display text-ink leading-[1.02] tracking-tighter text-[clamp(2rem,5vw,3.25rem)]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1' }}
            >
              {problem.meta.title}
            </h1>
          </header>

          <Markdown source={problem.statementMarkdown} className="editorial" />

          <div className="mt-10 pt-5 border-t border-rule text-[11px] uppercase tracking-[0.16em] text-ink-dim space-y-1">
            <p>
              Entry —{" "}
              <span className="font-mono normal-case tracking-normal text-ink-soft">
                {problem.meta.entry}
              </span>
            </p>
            <p>
              Grading —{" "}
              <span className="font-mono normal-case tracking-normal text-ink-soft">
                {problem.meta.validator.kind}
              </span>{" "}
              over {problem.tests.length} {problem.tests.length === 1 ? "test" : "tests"}
            </p>
          </div>
          <div className="mt-6 text-[11px] uppercase tracking-[0.18em] text-ink-dim">
            Stuck?{" "}
            <Link href="/learn/03-algorithmic-patterns/" className="text-lime hover:underline">
              Browse algorithmic patterns →
            </Link>{" "}
            or read the{" "}
            <Link href="/learn/01-python-foundations/" className="text-lime hover:underline">
              Python
            </Link>{" "}
            /{" "}
            <Link href="/learn/02-javascript-foundations/" className="text-lime hover:underline">
              JS
            </Link>{" "}
            foundations.
          </div>
        </article>

        {/* RIGHT — workspace */}
        <section className="lg:col-span-7 min-w-0 animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="border border-rule bg-elevated">
            {/* control strip — two rows on mobile, single row from sm */}
            <div className="flex flex-wrap items-stretch border-b border-rule">
              <div className="flex items-stretch order-1 w-full sm:w-auto border-b sm:border-b-0 border-rule">
                <LangTab active={lang === "python"} onClick={() => setLang("python")} label="Python" />
                <LangTab
                  active={lang === "javascript"}
                  onClick={() => setLang("javascript")}
                  label="JavaScript"
                />
              </div>
              <div className="hidden sm:block flex-1 order-2" aria-hidden />
              <div className="flex items-stretch order-3 w-full sm:w-auto ml-auto">
                <button
                  onClick={onReset}
                  className="btn-tactile focus-ring px-3 py-3 text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-ink-dim hover:text-lime sm:border-l border-rule"
                >
                  Reset
                </button>
                <button
                  onClick={onRun}
                  disabled={!runner.ready || running}
                  aria-busy={running}
                  className="btn-tactile focus-ring inline-flex flex-1 sm:flex-none items-center justify-center gap-2 bg-lime text-ground px-5 py-3 text-[12px] uppercase tracking-[0.18em] sm:tracking-[0.2em] disabled:opacity-50 hover:bg-lime-deep transition-colors border-l border-lime"
                >
                  {running ? (
                    <>
                      <Spinner /> Running
                    </>
                  ) : (
                    <>
                      <PlayMark /> Run
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* editor */}
            <div className="bg-ground">
              <CodeEditor value={code} language={lang} onChange={setCode} />
            </div>
          </div>

          {/* output */}
          <div className="mt-6">
            <OutputPanel response={response} warming={runner.warming} />
          </div>

          {/* reveal */}
          <div className="mt-8 pt-5 border-t border-rule text-[0.875rem]">
            {canReveal(problem.meta.id, hadRun) ? (
              <button
                onClick={() => setShowSolution((v) => !v)}
                className="focus-ring text-ink-soft hover:text-lime transition-colors inline-flex items-center gap-2"
              >
                <span className="text-[11px] uppercase tracking-[0.18em]">
                  {showSolution ? "Hide" : "Reveal"} reference solution
                </span>
                <span aria-hidden className="text-lime">
                  {showSolution ? "↑" : "↓"}
                </span>
              </button>
            ) : (
              <span className="text-[11px] uppercase tracking-[0.18em] text-ink-dim">
                Reference solution unlocks after a run &amp; 60 s of work.
              </span>
            )}
            {showSolution && (
              <pre className="mt-3 text-[0.8rem] leading-relaxed whitespace-pre-wrap bg-ground-deep border-l-2 border-lime p-4 font-mono text-ink-soft">
                {problem.solutions[lang]}
              </pre>
            )}
          </div>

          {allPassed && (
            <div className="mt-6 border border-mint/40 bg-mint-soft px-4 py-3 text-[0.875rem] text-mint flex items-baseline gap-3 animate-fade-up">
              <span className="font-display italic text-lg leading-none">✓</span>
              <span>
                All tests pass. <span className="text-ink-dim">Saved to your local progress.</span>
              </span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function LangTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-tactile focus-ring px-4 py-3 text-[12px] uppercase tracking-[0.2em] border-r border-rule transition-colors ${
        active ? "text-ink bg-ground" : "text-ink-dim hover:text-ink"
      }`}
      aria-pressed={active}
    >
      <span className="relative">
        {label}
        {active && (
          <span aria-hidden className="absolute -bottom-3 left-0 right-0 h-[2px] bg-lime" />
        )}
      </span>
    </button>
  );
}

function PlayMark() {
  return (
    <svg width="9" height="11" viewBox="0 0 9 11" aria-hidden>
      <path d="M0 0 L9 5.5 L0 11 Z" fill="currentColor" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block w-3 h-3 border-2 border-ground/40 border-t-ground rounded-full animate-spin"
    />
  );
}
