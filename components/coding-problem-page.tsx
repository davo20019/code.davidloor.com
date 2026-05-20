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
