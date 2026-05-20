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
