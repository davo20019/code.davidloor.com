const APIS = [
  "fetch", "XMLHttpRequest", "WebSocket", "EventSource",
  "Worker", "SharedWorker", "BroadcastChannel",
  "importScripts", "WebTransport",
] as const;

function killOnChain(scope: object, name: string) {
  let proto: object | null = Object.getPrototypeOf(scope);
  while (proto) {
    if (Object.prototype.hasOwnProperty.call(proto, name)) {
      try {
        Object.defineProperty(proto, name, { value: undefined, writable: false, configurable: false });
      } catch {}
    }
    proto = Object.getPrototypeOf(proto);
  }
  try {
    Object.defineProperty(scope, name, { value: undefined, writable: false, configurable: false });
  } catch {}
}

export function freezeNetworkApis(scope: object) {
  for (const name of APIS) killOnChain(scope, name);
  const navObj = (scope as { navigator?: Navigator }).navigator;
  if (navObj && "sendBeacon" in navObj) {
    try {
      const proto = Object.getPrototypeOf(navObj);
      Object.defineProperty(proto, "sendBeacon", { value: undefined, writable: false, configurable: false });
    } catch {}
    try { Object.freeze(navObj); } catch {}
  }
}
