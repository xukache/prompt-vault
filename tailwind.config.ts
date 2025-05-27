import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          50: "#ffffff",
          100: "#eef0f7",
          200: "#d7dce9",
          300: "#b6bed8",
          400: "#7f90c2",
          500: "#576fb7",
          600: "#3c559f",
          700: "#304991",
          800: "#24397a",
          900: "#1a2a5b"
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
          50: "#ffffff",
          100: "#ffffff",
          200: "#f8f4f7",
          300: "#e4d5e0",
          400: "#caa2c0",
          500: "#bc7dac",
          600: "#b1559a",
          700: "#a8458f",
          800: "#94357c",
          900: "#762a62"
        },
        dark: {
          950: "#121926",
          900: "#1a2233",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          500: "#64748b",
          400: "#94a3b8",
          300: "#cbd5e1",
          200: "#e2e8f0",
          100: "#f1f5f9",
          50: "#f8fafc"
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [
    // @tailwindcss/line-clamp 在 Tailwind CSS v3.3+ 中已内置，无需单独添加
  ],
} satisfies Config;
