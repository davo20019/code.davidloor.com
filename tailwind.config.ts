import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "ui-serif", "serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // Dark graphite ground; warm parchment text; one electric accent.
        ground: "#131419",
        "ground-deep": "#0C0D11",
        elevated: "#1B1D24",
        ink: "#ECE7D8",
        "ink-soft": "#C0BAA9",
        "ink-dim": "#7A7565",
        rule: "#2C2F3A",
        "rule-soft": "#21232B",
        // ACCENT: electric chartreuse — deliberately not warm orange/rust.
        lime: {
          DEFAULT: "#C8F049",
          soft: "rgba(200, 240, 73, 0.12)",
          deep: "#93B92A",
        },
        // Difficulty + status palette tuned for dark ground.
        mint: { DEFAULT: "#6FDCA0", soft: "rgba(111, 220, 160, 0.12)" },
        amber: { DEFAULT: "#E5B445", soft: "rgba(229, 180, 69, 0.12)" },
        magenta: { DEFAULT: "#FF5577", soft: "rgba(255, 85, 119, 0.12)" },
      },
      letterSpacing: { tighter: "-0.025em" },
      borderRadius: { none: "0" },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
