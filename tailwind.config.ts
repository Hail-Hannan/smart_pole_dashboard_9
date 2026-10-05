import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#f1f4f8",
          900: "#eaeef4",
          850: "#e4e9f0",
          800: "#dde3ec",
          700: "#ccd5e1",
          600: "#adb9c9",
        },
        panel: "#ffffff",
        line: "#dde3ec",
        // Neutral status semantics (kept identical meaning to V1).
        status: {
          normal: "#16a34a",
          warning: "#d97706",
          danger: "#dc2626",
          unknown: "#64748b",
        },
        // Category accents — one distinct hue per sensor category so KPI
        // cards and gauges are visually distinguishable at a glance.
        cat: {
          temp: "#f97316", // warm orange
          humidity: "#0ea5e9", // sky blue
          co: "#8b5cf6", // violet
          light: "#eab308", // gold
          pressure: "#14b8a6", // teal
          wind: "#06b6d4", // cyan
          rain: "#3b82f6", // blue
          lightning: "#f59e0b", // amber
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.18)",
        glow: "0 0 24px -4px currentColor",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        scan: "scan 3s linear infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
