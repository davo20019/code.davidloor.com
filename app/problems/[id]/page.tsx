import { notFound } from "next/navigation";
import { getAll, getById } from "@/lib/problems/loader";
import { CodingProblemPage } from "@/components/coding-problem-page";
import { SystemDesignPage } from "@/components/system-design-page";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return getAll().map((p) => ({ id: p.meta.id }));
}

export default function ProblemPage({ params }: { params: { id: string } }) {
  const p = getById(params.id);
  if (!p) return notFound();
  if (p.type === "coding") return <CodingProblemPage problem={p} />;
  return <SystemDesignPage problem={p} />;
}
