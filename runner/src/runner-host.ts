import type { RunRequest, RunResponse } from "../../lib/runner-protocol";

const MAIN_ORIGIN = (new URLSearchParams(location.search).get("parent")) || "https://code.davidloor.com";
const TIMEOUT_PADDING_MS = 200;

let pythonWorker: Worker | null = null;
let jsWorker: Worker | null = null;

function spawnPython() {
  pythonWorker = new Worker("/python-worker.js", { type: "module" });
  pythonWorker.addEventListener("message", (ev: MessageEvent<RunResponse>) => window.parent.postMessage(ev.data, MAIN_ORIGIN));
}
function spawnJs() {
  jsWorker = new Worker("/js-worker.js", { type: "module" });
  jsWorker.addEventListener("message", (ev: MessageEvent<RunResponse>) => window.parent.postMessage(ev.data, MAIN_ORIGIN));
}

function handle(req: RunRequest) {
  const w = req.language === "python"
    ? (pythonWorker ?? (spawnPython(), pythonWorker!))
    : (jsWorker ?? (spawnJs(), jsWorker!));

  const t = setTimeout(() => {
    if (req.language === "python") { pythonWorker?.terminate(); pythonWorker = null; spawnPython(); }
    else { jsWorker?.terminate(); jsWorker = null; spawnJs(); }
    window.parent.postMessage({ type: "timed_out", requestId: req.requestId, language: req.language } as RunResponse, MAIN_ORIGIN);
    window.parent.postMessage({ type: "warming", requestId: req.requestId, language: req.language, reason: "timeout_reload" } as RunResponse, MAIN_ORIGIN);
  }, req.timeLimitMs + TIMEOUT_PADDING_MS);

  const onMsg = (ev: MessageEvent<RunResponse>) => {
    const d = ev.data;
    if ((d.type === "result" || d.type === "error") && d.requestId === req.requestId) {
      clearTimeout(t);
      w!.removeEventListener("message", onMsg);
    }
  };
  w!.addEventListener("message", onMsg);
  w!.postMessage(req);
}

window.addEventListener("message", (ev) => {
  if (ev.origin !== MAIN_ORIGIN) return;
  const data = ev.data as RunRequest;
  if (data?.type === "run" && data.protocolVersion === 1) handle(data);
});

spawnPython();
spawnJs();
window.parent.postMessage({ type: "ready" } as RunResponse, MAIN_ORIGIN);
