import { problems, codingProblems, systemDesignProblems } from "./manifest";
import type { Problem } from "./types";

export function getAll(): Problem[] { return problems; }
export function getCoding(): Problem[] { return codingProblems; }
export function getSystemDesign(): Problem[] { return systemDesignProblems; }
export function getById(id: string): Problem | undefined {
  return problems.find((p) => p.meta.id === id);
}
