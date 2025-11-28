"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { SunIcon as SunIconSolid, MoonIcon as MoonIconSolid } from "@heroicons/react/24/solid";
import { useThemeStore, Theme } from "@/store/themeStore";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeToggleProps {
  variant?: "default" | "compact" | "icon-only";
  className?: string;
}

export default function ThemeToggle({ variant = "default", className = "" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, initTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initTheme();
  }, [initTheme]);

  // Уникаємо hydration mismatch
  if (!mounted) {
    return (
      <div className={`h-10 w-28 rounded-full bg-theme-secondary animate-pulse ${className}`} />
    );
  }

  const themes: { value: Theme; icon: typeof SunIcon; label: string }[] = [
    { value: "light", icon: SunIcon, label: "Світла" },
    { value: "dark", icon: MoonIcon, label: "Темна" },
    { value: "system", icon: ComputerDesktopIcon, label: "Системна" },
  ];

  // Compact variant - тільки switch
  if (variant === "compact") {
    return (
      <button
        onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
        className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-colors duration-300 ${
          resolvedTheme === "dark" 
            ? "bg-slate-700" 
            : "bg-amber-100"
        } ${className}`}
        aria-label={`Переключити на ${resolvedTheme === "light" ? "темну" : "світлу"} тему`}
      >
        <motion.div
          className={`absolute w-6 h-6 rounded-full shadow-md flex items-center justify-center ${
            resolvedTheme === "dark" 
              ? "bg-slate-900" 
              : "bg-white"
          }`}
          animate={{
            x: resolvedTheme === "dark" ? 12 : -12,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <AnimatePresence mode="wait">
            {resolvedTheme === "dark" ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MoonIconSolid className="w-4 h-4 text-amber-300" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SunIconSolid className="w-4 h-4 text-amber-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </button>
    );
  }

  // Icon only variant
  if (variant === "icon-only") {
    return (
      <button
        onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:bg-theme-secondary active:scale-95 ${className}`}
        aria-label={`Переключити на ${resolvedTheme === "light" ? "темну" : "світлу"} тему`}
      >
        <AnimatePresence mode="wait">
          {resolvedTheme === "dark" ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <MoonIconSolid className="w-5 h-5 text-amber-300" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              <SunIconSolid className="w-5 h-5 text-amber-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  // Default variant - повний вибір
  return (
    <div 
      className={`flex items-center gap-1 p-1 rounded-full border transition-colors ${className}`}
      style={{ 
        backgroundColor: 'var(--color-background-secondary)',
        borderColor: 'var(--color-border)'
      }}
    >
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
              isActive 
                ? "" 
                : "hover:bg-[var(--color-background-tertiary)]"
            }`}
            aria-label={label}
            title={label}
          >
            {isActive && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: 'var(--color-primary)' }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <Icon 
              className={`w-5 h-5 relative z-10 transition-colors ${
                isActive 
                  ? "text-white" 
                  : "text-[var(--color-text-secondary)]"
              }`} 
            />
          </button>
        );
      })}
    </div>
  );
}

// Експортуємо також простий компонент для мобільного меню
export function ThemeToggleMobile({ className = "" }: { className?: string }) {
  const { theme, setTheme, initTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initTheme();
  }, [initTheme]);

  if (!mounted) return null;

  const themes: { value: Theme; icon: typeof SunIcon; label: string }[] = [
    { value: "light", icon: SunIcon, label: "Світла" },
    { value: "dark", icon: MoonIcon, label: "Темна" },
    { value: "system", icon: ComputerDesktopIcon, label: "Системна" },
  ];

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive 
                ? "bg-[var(--color-primary)] text-white" 
                : "bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)]"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}


