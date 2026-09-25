import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Neutral scale modeled on Vercel's Geist design system: true black
        // background, near-white foreground, and a tight set of grays for
        // borders and muted text in between.
        canopy: {
          950: "#000000",
          900: "#0A0A0A",
          800: "#111111",
          700: "#171717",
          600: "#262626",
          500: "#404040",
          400: "#737373",
          300: "#A1A1A1",
          200: "#D4D4D4",
          100: "#FAFAFA",
        },
        // Semantic accents, matching Vercel's restrained use of color:
        // a single blue accent for interactive/brand elements, plus
        // green/amber/red reserved strictly for status.
        signal: {
          gold: "#0070F3",
          amber: "#F5A623",
          red: "#EE0000",
          green: "#46A758",
          blue: "#3291FF",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255, 255, 255, 0.04) inset, 0 8px 24px -8px rgba(0,0,0,0.6)",
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "70%": { transform: "scale(1.9)", opacity: "0" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
