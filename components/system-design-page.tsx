"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { loadNotes, saveNotes } from "@/lib/persistence/idb";
import { Markdown } from "@/components/markdown";
import type { SystemDesignProblem } from "@/lib/problems/types";

export function SystemDesignPage({ problem }: { problem: SystemDesignProblem }) {
  const [notes, setNotes] = useState("");
  const [show, setShow] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      setNotes((await loadNotes(problem.meta.id)) ?? "");
    })();
  }, [problem.meta.id]);

  useEffect(() => {
    const t = setTimeout(() => {
      void saveNotes(problem.meta.id, notes);
    }, 400);
    return () => clearTimeout(t);
  }, [notes, problem.meta.id]);

  useEffect(() => {
    if (running && intervalRef.current === null) {
      intervalRef.current = window.setInterval(() => setNow(Date.now()), 1000);
    }
    if (!running && intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  const elapsedMs = now - startedAt;
  const elapsedTotalSec = Math.floor(elapsedMs / 1000);
  const mins = Math.floor(elapsedTotalSec / 60);
  const secs = elapsedTotalSec % 60;
  const targetMs = problem.meta.estMinutes * 60_000;
  const pct = Math.min(100, (elapsedMs / targetMs) * 100);
  const overtime = elapsedMs > targetMs;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <nav className="text-[11px] uppercase tracking-[0.18em] text-ink-dim mb-6 flex gap-3 items-center animate-fade-up">
        <Link href="/problems/" className="hover:text-rust transition-colors">
          ← Problems
        </Link>
        <span className="text-rule">/</span>
        <span>System Design</span>
      </nav>

      <header
        className="grid grid-cols-12 gap-6 items-end pb-6 border-b border-rule animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <div className="col-span-12 sm:col-span-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-ink-dim mb-3">
            Open prompt · {problem.meta.estMinutes} min recommended
          </p>
          <h1
            className="font-display text-ink leading-[1.02] tracking-tighter text-[clamp(2.25rem,5vw,3.5rem)]"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1' }}
          >
            {problem.meta.title}
          </h1>
        </div>
        <div className="col-span-12 sm:col-span-4 sm:text-right">
          <div className="font-mono tabular-nums text-3xl text-ink leading-none">
            {String(mins).padStart(2, "0")}
            <span className="text-ink-dim">:</span>
            {String(secs).padStart(2, "0")}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink-dim">
            {overtime ? "Over the recommended time" : `Target ${problem.meta.estMinutes}:00`}
          </p>
          <div className="mt-2 h-[3px] bg-rule-soft overflow-hidden">
            <div
              className={`h-full ${overtime ? "bg-crimson" : "bg-rust"} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            onClick={() => setRunning((r) => !r)}
            className="btn-tactile focus-ring mt-3 text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-rust transition-colors inline-flex items-center gap-2"
          >
            <span
              aria-hidden
              className={`inline-block w-1.5 h-1.5 ${running ? "bg-rust" : "bg-ink-dim"} rounded-full ${
                running ? "animate-pulse" : ""
              }`}
            />
            {running ? "Pause timer" : elapsedTotalSec === 0 ? "Start timer" : "Resume"}
          </button>
        </div>
      </header>

      <Markdown
        source={problem.promptMarkdown}
        className="editorial mt-8 animate-fade-up"
      />

      <section className="mt-12 animate-fade-up" style={{ animationDelay: "220ms" }}>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink-dim">Your notes</h2>
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink-dim">
            Saved locally · {notes.length} chars
          </span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Sketch the system. Functional requirements, scale, API shape, data model, bottlenecks, mitigations…"
          className="w-full h-72 p-4 bg-paper-deep/50 border border-rule font-mono text-[0.85rem] leading-relaxed text-ink focus:outline-none focus:border-rust transition-colors"
        />
      </section>

      <section className="mt-10 pt-6 border-t border-rule animate-fade-up" style={{ animationDelay: "300ms" }}>
        <button
          onClick={() => setShow((s) => !s)}
          className="focus-ring text-ink-soft hover:text-rust transition-colors inline-flex items-center gap-2"
        >
          <span className="text-[11px] uppercase tracking-[0.18em]">
            {show ? "Hide reference points" : "Reveal reference talking points"}
          </span>
          <span aria-hidden className="text-rust">
            {show ? "↑" : "↓"}
          </span>
        </button>
        {show && (
          <div className="mt-4 pt-4 border-t border-rule">
            <Markdown source={problem.promptMarkdown} className="editorial" />
          </div>
        )}
      </section>
    </main>
  );
}
