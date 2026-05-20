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
        paper: "#F4F0E6",
        "paper-deep": "#EAE3D2",
        ink: "#171411",
        "ink-soft": "#3A332B",
        "ink-dim": "#7A6F60",
        rule: "#D5CDB8",
        "rule-soft": "#E4DCC8",
        rust: {
          DEFAULT: "#A8421B",
          soft: "#E9D2C0",
          deep: "#7A2F12",
        },
        forest: {
          DEFAULT: "#324F37",
          soft: "#D5DED2",
        },
        crimson: {
          DEFAULT: "#8A1F1F",
          soft: "#EDD3D3",
        },
        ochre: "#9C7A14",
      },
      letterSpacing: {
        tighter: "-0.025em",
      },
      borderRadius: {
        none: "0",
      },
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
