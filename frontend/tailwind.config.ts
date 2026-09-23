import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c16",
        surface: "#0e1526",
        "surface-card": "#131c31",
        "surface-border": "#1e293b",
        "surface-hover": "#1a253e",
        pharma: {
          primary: "#0284c7",       // Scientific blue
          cyan: "#06b6d4",          // Crisp cyan
          accent: "#38bdf8",        // Light highlight
          ai: "#8b5cf6",            // Subtle purple AI accent
          ai_glow: "#a855f7",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          text: "#f8fafc",
          muted: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains)", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
