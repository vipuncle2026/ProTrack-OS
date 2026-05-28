/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        accent: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        surface: {
          card: "rgba(255,255,255,0.8)",
          hover: "rgba(255,255,255,0.6)",
          raised: "rgba(255,255,255,0.95)",
        },
        semantic: {
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#3b82f6",
          income: "#34d399",
          expense: "#f87171",
          pending: "#fcd34d",
          pendingExpense: "#fda4af",
        },
      },
      fontSize: {
        stat: ["1.75rem", { lineHeight: "2rem", fontWeight: "700" }],
      },
      borderRadius: {
        card: "1rem",
        button: "0.75rem",
        input: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        "card-hover": "0 10px 25px rgba(0,0,0,0.08)",
        "card-lg": "0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
