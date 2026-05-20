import type { ProblemMeta, TestCase } from "./problems/types";

export const PROTOCOL_VERSION = 1;
export type Language = "python" | "javascript";

export interface RunRequest {
  type: "run";
  requestId: string;
  protocolVersion: 1;
  language: Language;
  code: string;
  problem: {
    meta: ProblemMeta;
    tests: TestCase[];
  };
  timeLimitMs: number;
}

export interface PerTestResult {
  index: number;
  passed: boolean;
  actual: unknown;
  expected: unknown;
  stdout: string;
  error?: string;
  elapsedMs: number;
}

export type RunResponse =
  | { type: "ready" }
  | { type: "result"; requestId: string; perTest: PerTestResult[]; totalMs: number }
  | { type: "error"; requestId: string; message: string; stack?: string }
  | { type: "warming"; requestId: string; language: Language; reason: "timeout_reload" | "first_boot" }
  | { type: "timed_out"; requestId: string; language: Language };
