import Link from "next/link";
import { getCoding, getSystemDesign } from "@/lib/problems/loader";
export const dynamic = "force-static";

export default function ProblemsPage() {
  const coding = getCoding();
  const sys = getSystemDesign();
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Problems</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Solve in Python or JavaScript. Everything runs in your browser.</p>
      </header>
      <section>
        <h2 className="text-lg font-medium mb-2">Coding</h2>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {coding.map((p) => p.type === "coding" && (
            <li key={p.meta.id} className="py-2">
              <Link href={`/problems/${p.meta.id}/`} className="hover:underline">{p.meta.title}</Link>
              <span className="ml-2 text-xs uppercase text-gray-500">{p.meta.difficulty}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-medium mb-2">System Design</h2>
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {sys.map((p) => p.type === "system_design" && (
            <li key={p.meta.id} className="py-2">
              <Link href={`/problems/${p.meta.id}/`} className="hover:underline">{p.meta.title}</Link>
              <span className="ml-2 text-xs text-gray-500">{p.meta.estMinutes} min</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
