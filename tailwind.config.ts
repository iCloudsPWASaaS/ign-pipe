import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9ff",
          100: "#d8f1ff",
          200: "#b9e7ff",
          300: "#88d8ff",
          400: "#50c1ff",
          500: "#28a5f5",
          600: "#228fc5",
          700: "#1f75a1",
          800: "#206485",
          900: "#205470",
          950: "#153549",
        },
        pipe: {
          orange: "#f59e0b",
          ink: "#102534",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 37, 52, 0.06), 0 8px 24px rgba(16, 37, 52, 0.06)",
      },
      fontFamily: {
        sans: ["Trebuchet MS", "Segoe UI", "Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
