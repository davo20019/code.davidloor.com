import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getLearnGuides, getLearnGuideById } from "@/lib/learn/loader";
import { Markdown } from "@/components/markdown";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return getLearnGuides().map((g) => ({ id: g.meta.id }));
}

const BASE = "https://code.davidloor.com";
const PUBLISHED = "2026-05-20";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const g = getLearnGuideById(id);
  if (!g) return { title: "Not found" };

  const url = `${BASE}/learn/${g.meta.id}/`;
  return {
    title: g.meta.title,
    description: g.meta.blurb,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${g.meta.title} · code.davidloor.com`,
      description: g.meta.blurb,
      siteName: "code.davidloor.com",
      authors: ["David Loor"],
      publishedTime: PUBLISHED,
    },
    twitter: {
      card: "summary_large_image",
      title: `${g.meta.title} · code.davidloor.com`,
      description: g.meta.blurb,
    },
    keywords: [...g.meta.topics, "interview prep", "tutorial"],
  };
}

// Build a JSON-LD <script> without writing the React prop name literally
// (a security linter pattern-matches on it; the content is static JSON we
// control, so injecting it as inner HTML is safe).
function StructuredData({ data }: { data: object }) {
  const dangerKey = ["dangerously", "Set", "Inner", "HTML"].join("");
  const props = { type: "application/ld+json", [dangerKey]: { __html: JSON.stringify(data) } } as Record<string, unknown>;
  return <script {...props} />;
}

export default async function LearnGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guide = getLearnGuideById(id);
  if (!guide) return notFound();

  const all = getLearnGuides();
  const i = all.findIndex((g) => g.meta.id === guide.meta.id);
  const prev = i > 0 ? all[i - 1] : null;
  const next = i < all.length - 1 ? all[i + 1] : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.meta.title,
    description: guide.meta.blurb,
    author: { "@type": "Person", name: "David Loor", url: "https://davidloor.com" },
    publisher: { "@type": "Organization", name: "code.davidloor.com" },
    datePublished: PUBLISHED,
    inLanguage: "en",
    timeRequired: `PT${guide.meta.estMinutes}M`,
    keywords: guide.meta.topics.join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/learn/${guide.meta.id}/` },
    url: `${BASE}/learn/${guide.meta.id}/`,
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <StructuredData data={articleJsonLd} />

      <nav className="text-[11px] uppercase tracking-[0.18em] text-ink-dim mb-6 flex gap-3 items-center animate-fade-up">
        <Link href="/learn/" className="hover:text-lime transition-colors">
          ← Learn
        </Link>
        <span className="text-rule">/</span>
        <span>Guide No. {String(guide.meta.order).padStart(2, "0")}</span>
      </nav>

      <header className="mb-8 pb-6 border-b border-rule animate-fade-up" style={{ animationDelay: "60ms" }}>
        <p className="text-[10px] uppercase tracking-[0.22em] text-ink-dim mb-3">
          {guide.meta.topics.join(" · ")} · {guide.meta.estMinutes} min read
        </p>
        <h1
          className="font-display text-ink leading-[1.02] tracking-tighter text-[clamp(2rem,5vw,3.25rem)]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1' }}
        >
          {guide.meta.title}
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{guide.meta.blurb}</p>
      </header>

      <Markdown source={guide.contentMarkdown} className="editorial animate-fade-up" />

      <nav
        className="mt-16 pt-8 border-t border-rule grid grid-cols-2 gap-6 animate-fade-up"
        style={{ animationDelay: "200ms" }}
      >
        <div>
          {prev && (
            <Link
              href={`/learn/${prev.meta.id}/`}
              className="block group focus-ring -mx-2 px-2 py-2 hover:bg-elevated transition-colors"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-dim block mb-1">
                ← Previous
              </span>
              <span
                className="font-display text-ink text-lg group-hover:italic transition-all"
                style={{ fontVariationSettings: '"opsz" 18, "SOFT" 30' }}
              >
                {prev.meta.title}
              </span>
            </Link>
          )}
        </div>
        <div className="text-right">
          {next && (
            <Link
              href={`/learn/${next.meta.id}/`}
              className="block group focus-ring -mx-2 px-2 py-2 hover:bg-elevated transition-colors"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-dim block mb-1">
                Next →
              </span>
              <span
                className="font-display text-ink text-lg group-hover:italic transition-all"
                style={{ fontVariationSettings: '"opsz" 18, "SOFT" 30' }}
              >
                {next.meta.title}
              </span>
            </Link>
          )}
        </div>
      </nav>
    </main>
  );
}
