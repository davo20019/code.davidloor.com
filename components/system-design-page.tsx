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
        placeholder="Your notes..."
        className="w-full h-64 p-3 border rounded font-mono text-sm dark:bg-gray-900 dark:border-gray-700"
      />
      <button onClick={() => setShow((s) => !s)} className="text-sm underline focus:outline focus:outline-2 focus:outline-blue-600 focus-visible:outline">
        {show ? "Hide" : "Reveal"} reference talking points
      </button>
      {show && (
        <article className="prose dark:prose-invert text-sm border-t pt-3" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </main>
  );
}
