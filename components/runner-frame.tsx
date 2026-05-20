"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import type { RunRequest, RunResponse } from "@/lib/runner-protocol";

const RUNNER_ORIGIN = process.env.NEXT_PUBLIC_RUNNER_ORIGIN ?? "https://runner.code.davidloor.com";

interface Ctx {
  run: (req: Omit<RunRequest, "type" | "protocolVersion" | "requestId">) => Promise<RunResponse>;
  ready: boolean;
  warming: "python" | "javascript" | null;
}
const RunnerCtx = createContext<Ctx | null>(null);

export function useRunner() {
  const c = useContext(RunnerCtx);
  if (!c) throw new Error("useRunner must be used inside <RunnerProvider>");
  return c;
}

export function RunnerProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [warming, setWarming] = useState<"python" | "javascript" | null>(null);
  const inflight = useRef(new Map<string, (r: RunResponse) => void>());

  useEffect(() => {
    function onMessage(ev: MessageEvent<RunResponse>) {
      if (ev.origin !== RUNNER_ORIGIN) return;
      const data = ev.data;
      if (data.type === "ready") setReady(true);
      else if (data.type === "warming") setWarming(data.language);
      else if (data.type === "result" || data.type === "error" || data.type === "timed_out") {
        setWarming(null);
        if ("requestId" in data) {
          const cb = inflight.current.get(data.requestId);
          if (cb) { cb(data); inflight.current.delete(data.requestId); }
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const run = useCallback((req: Omit<RunRequest, "type" | "protocolVersion" | "requestId">) => {
    return new Promise<RunResponse>((resolve) => {
      const requestId = crypto.randomUUID();
      const full: RunRequest = { type: "run", protocolVersion: 1, requestId, ...req };
      inflight.current.set(requestId, resolve);
      ref.current!.contentWindow!.postMessage(full, RUNNER_ORIGIN);
    });
  }, []);

  // Use the extension-less URL because Cloudflare Workers Static Assets
  // strips ".html" and 307-redirects, which adds a needless round-trip.
  const iframeUrl = `${RUNNER_ORIGIN}/runner?parent=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`;

  return (
    <RunnerCtx.Provider value={{ run, ready, warming }}>
      <iframe
        ref={ref}
        src={iframeUrl}
        sandbox="allow-scripts allow-same-origin"
        title="runner"
        style={{ width: 0, height: 0, border: 0, position: "absolute" }}
      />
      {children}
    </RunnerCtx.Provider>
  );
}
