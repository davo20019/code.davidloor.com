"use client";
import type { RunResponse } from "@/lib/runner-protocol";

export function OutputPanel({
  response,
  warming,
}: {
  response: RunResponse | null;
  warming: "python" | "javascript" | null;
}) {
  if (warming) {
    return (
      <div className="border-l-2 border-rust bg-rust-soft/40 px-4 py-3 flex items-center gap-3 text-[0.875rem] text-ink-soft">
        <span aria-hidden className="inline-block w-2.5 h-2.5 bg-rust rounded-full animate-pulse" />
        <span>
          Resetting <span className="font-medium text-ink">{warming === "python" ? "Python" : "JavaScript"}</span>{" "}
          engine…
        </span>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="border-t border-rule pt-4 text-[11px] uppercase tracking-[0.18em] text-ink-dim flex items-center gap-3">
        <span aria-hidden className="inline-block w-1.5 h-1.5 border border-ink-dim rounded-full" />
        Awaiting first run
      </div>
    );
  }

  if (response.type === "error") {
    return (
      <Card tone="error" header="Runtime error">
        <pre className="font-mono text-[0.8rem] leading-relaxed whitespace-pre-wrap text-crimson">
          {response.message}
        </pre>
      </Card>
    );
  }

  if (response.type === "timed_out") {
    return (
      <Card tone="error" header="Timed out">
        <p className="text-[0.875rem] text-ink-soft">
          The execution exceeded the time limit. The {response.language === "python" ? "Python" : "JavaScript"}{" "}
          engine has been reset.
        </p>
      </Card>
    );
  }

  if (response.type === "result") {
    const passed = response.perTest.filter((p) => p.passed).length;
    const total = response.perTest.length;
    const allPassed = passed === total;
    const tone = allPassed ? "success" : "fail";
    const ratioLabel = allPassed ? "All tests passing" : `${total - passed} failing`;
    return (
      <div>
        <header className="flex items-baseline justify-between gap-4 pb-3 border-b border-rule">
          <div className="flex items-baseline gap-3 min-w-0">
            <span
              className={`marker-num text-3xl leading-none ${allPassed ? "text-forest" : "text-crimson"}`}
            >
              {passed}
              <span className="text-ink-dim">/{total}</span>
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-dim truncate">{ratioLabel}</span>
          </div>
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-dim shrink-0">
            {Math.round(response.totalMs)} ms total
          </span>
        </header>

        <ol className="divide-y divide-rule">
          {response.perTest.map((p) => (
            <li key={p.index} className="py-3">
              <div className="flex items-baseline gap-3">
                <Mark passed={p.passed} />
                <span className="font-mono text-[0.75rem] text-ink-dim">
                  test{String(p.index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1" />
                <span className="font-mono text-[0.7rem] text-ink-dim tabular-nums">
                  {Math.round(p.elapsedMs)} ms
                </span>
              </div>

              {!p.passed && (
                <div className="mt-2 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1 font-mono text-[0.78rem]">
                  <span className="text-ink-dim uppercase tracking-[0.16em] text-[0.65rem] pt-0.5">expected</span>
                  <code className="text-ink-soft break-all">{json(p.expected)}</code>
                  <span className="text-ink-dim uppercase tracking-[0.16em] text-[0.65rem] pt-0.5">actual</span>
                  <code className="text-crimson break-all">{json(p.actual)}</code>
                  {p.error && (
                    <>
                      <span className="text-ink-dim uppercase tracking-[0.16em] text-[0.65rem] pt-0.5">error</span>
                      <code className="text-crimson break-all whitespace-pre-wrap">{p.error}</code>
                    </>
                  )}
                </div>
              )}

              {p.stdout && (
                <details className="mt-2 group">
                  <summary className="cursor-pointer text-[10px] uppercase tracking-[0.18em] text-ink-dim hover:text-rust transition-colors">
                    stdout · {p.stdout.length} chars
                  </summary>
                  <pre className="mt-1 text-[0.75rem] leading-relaxed font-mono whitespace-pre-wrap text-ink-soft bg-paper-deep/60 border-l-2 border-rule px-3 py-2">
                    {p.stdout}
                  </pre>
                </details>
              )}
            </li>
          ))}
        </ol>

        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-ink-dim">
          Grading: {tone === "success" ? "Pass" : "Fail"} · {response.perTest.length} tests
        </p>
      </div>
    );
  }

  return null;
}

function Card({
  tone,
  header,
  children,
}: {
  tone: "error";
  header: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-l-2 border-crimson bg-crimson-soft/40 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-crimson mb-1.5">{header}</p>
      {children}
    </div>
  );
}

function Mark({ passed }: { passed: boolean }) {
  return passed ? (
    <span
      aria-label="passed"
      className="inline-flex items-center justify-center w-4 h-4 border border-forest/60 text-forest text-[10px] leading-none"
      style={{ paddingBottom: "1px" }}
    >
      ✓
    </span>
  ) : (
    <span
      aria-label="failed"
      className="inline-flex items-center justify-center w-4 h-4 border border-crimson/60 text-crimson text-[10px] leading-none"
    >
      ✕
    </span>
  );
}

function json(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
