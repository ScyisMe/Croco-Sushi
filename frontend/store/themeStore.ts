"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

// Функція для визначення системної теми
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

// Функція для застосування теми до DOM
const applyTheme = (resolvedTheme: ResolvedTheme) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (resolvedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
    root.classList.add("dark");
  } else {
    root.setAttribute("data-theme", "light");
    root.classList.remove("dark");
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: "light",

      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
        applyTheme(resolvedTheme);
        set({ theme, resolvedTheme });
      },

      initTheme: () => {
        const { theme } = get();
        const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
        applyTheme(resolvedTheme);
        set({ resolvedTheme });

        // Слухаємо зміни системної теми
        if (typeof window !== "undefined") {
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

          const handleChange = (e: MediaQueryListEvent) => {
            const { theme } = get();
            if (theme === "system") {
              const newResolvedTheme = e.matches ? "dark" : "light";
              applyTheme(newResolvedTheme);
              set({ resolvedTheme: newResolvedTheme });
            }
          };

          mediaQuery.addEventListener("change", handleChange);
        }
      },
    }),
    {
      name: "croco-theme",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Хук для використання теми




