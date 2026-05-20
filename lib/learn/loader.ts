import { learnGuides } from "./manifest";
import type { LearnGuide } from "./types";

export function getLearnGuides(): LearnGuide[] {
  return [...learnGuides].sort((a, b) => a.meta.order - b.meta.order);
}

export function getLearnGuideById(id: string): LearnGuide | undefined {
  return learnGuides.find((g) => g.meta.id === id);
}
