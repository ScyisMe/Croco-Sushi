import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основна кольорова палітра (як на king-roll.com.ua)
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#00A859", // Основний зелений
          600: "#009150",
          700: "#007a44",
          800: "#166534",
          900: "#14532d",
          DEFAULT: "#00A859",
        },
        secondary: {
          DEFAULT: "#333333", // Темно-сірий для тексту
          light: "#666666", // Вторинний текст
        },
        accent: {
          red: "#EF4444", // Для акцій та хітів
          orange: "#F97316", // Для акцій
          blue: "#3B82F6", // Для новинок
        },
        border: {
          DEFAULT: "#E5E5E5", // Світло-сірий для рамок
        },
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "header": "0 2px 10px rgba(0, 0, 0, 0.1)",
        "card": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "modal": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      },
      animation: {
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-up": "slideInUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
