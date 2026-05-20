import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAll, getById } from "@/lib/problems/loader";
import { CodingProblemPage } from "@/components/coding-problem-page";
import { SystemDesignPage } from "@/components/system-design-page";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return getAll().map((p) => ({ id: p.meta.id }));
}

const BASE = "https://code.davidloor.com";

function firstSentence(markdown: string): string {
  // Strip the leading "# Title" line and lift the first prose sentence
  // (or the first 180 chars, whichever is shorter) for a meta description.
  const lines = markdown
    .split("\n")
    .filter((l) => !l.startsWith("#") && !l.startsWith("```") && l.trim().length > 0);
  const body = lines.join(" ").replace(/`/g, "").replace(/\s+/g, " ").trim();
  const dot = body.search(/(?<=[.?!])\s/);
  const snippet = dot > 40 ? body.slice(0, dot + 1) : body.slice(0, 180);
  return snippet.length < body.length ? snippet : body;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = getById(id);
  if (!p) return { title: "Not found" };

  const url = `${BASE}/problems/${p.meta.id}/`;
  if (p.type === "coding") {
    const description = firstSentence(p.statementMarkdown);
    return {
      title: p.meta.title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: "article",
        url,
        title: `${p.meta.title} · code.davidloor.com`,
        description,
        siteName: "code.davidloor.com",
      },
      twitter: {
        card: "summary_large_image",
        title: `${p.meta.title} · code.davidloor.com`,
        description,
      },
      keywords: [
        p.meta.title.toLowerCase(),
        "coding interview",
        "python",
        "javascript",
        ...p.meta.tags,
        ...p.meta.topics,
      ],
    };
  }

  const description = firstSentence(p.promptMarkdown);
  return {
    title: p.meta.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${p.meta.title} · System Design · code.davidloor.com`,
      description,
      siteName: "code.davidloor.com",
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.meta.title} · code.davidloor.com`,
      description,
    },
    keywords: ["system design", p.meta.title.toLowerCase(), ...p.meta.tags],
  };
}

export default async function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getById(id);
  if (!p) return notFound();
  if (p.type === "coding") return <CodingProblemPage problem={p} />;
  return <SystemDesignPage problem={p} />;
}
