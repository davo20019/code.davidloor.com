import type { MetadataRoute } from "next";
import { getAll } from "@/lib/problems/loader";
import { getLearnGuides } from "@/lib/learn/loader";

export const dynamic = "force-static";

const BASE = "https://code.davidloor.com";
// Bump this when the content corpus changes significantly. Search engines use
// it as a hint; precision-per-page isn't worth the bookkeeping.
const LAST_MODIFIED = "2026-05-20";

export default function sitemap(): MetadataRoute.Sitemap {
  const top: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,          lastModified: LAST_MODIFIED, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/problems/`, lastModified: LAST_MODIFIED, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/learn/`,    lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 0.9 },
  ];

  const problems = getAll().map((p) => ({
    url: `${BASE}/problems/${p.meta.id}/`,
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const learn = getLearnGuides().map((g) => ({
    url: `${BASE}/learn/${g.meta.id}/`,
    lastModified: LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...top, ...problems, ...learn];
}
