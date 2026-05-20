import "./globals.css";
import type { ReactNode } from "react";
import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { RunnerProvider } from "@/components/runner-frame";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "code.davidloor.com — interview problems",
  description:
    "A small studio of coding and system-design problems. Python and JavaScript, in your browser.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-ground text-ink font-body antialiased">
        <RunnerProvider>
          <Masthead />
          {children}
          <Colophon />
        </RunnerProvider>
      </body>
    </html>
  );
}

function Masthead() {
  return (
    <header className="border-b border-rule">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-baseline justify-between gap-6">
        <a href="/" className="group inline-flex items-baseline gap-3">
          <span className="font-display text-[1.35rem] leading-none tracking-tight text-ink">
            <span className="italic">code</span>
            <span className="text-ink-dim">.</span>davidloor
            <span className="text-ink-dim">.</span>com
          </span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.18em] text-ink-dim">
            A studio of problems
          </span>
        </a>
        <nav className="text-[12px] uppercase tracking-[0.16em] text-ink-dim flex gap-5">
          <a href="/problems/" className="hover:text-lime transition-colors">
            Problems
          </a>
          <a
            href="https://github.com/davidloor/code.davidloor.com"
            className="hover:text-lime transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

function Colophon() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row gap-4 sm:items-baseline sm:justify-between text-[11px] uppercase tracking-[0.16em] text-ink-dim">
        <span>
          Set in{" "}
          <span className="font-display italic normal-case tracking-normal text-ink">Fraunces</span>,
          Inter Tight, &amp; JetBrains Mono.
        </span>
        <span>
          Open source · MIT ·{" "}
          <a
            href="https://github.com/davidloor/code.davidloor.com"
            className="hover:text-lime transition-colors"
          >
            fork on GitHub
          </a>
        </span>
      </div>
    </footer>
  );
}
