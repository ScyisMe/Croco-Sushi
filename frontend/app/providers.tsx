"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useCartSync } from "@/hooks/useCartSync";
import { useThemeStore } from "@/store/themeStore";

// Компонент для ініціалізації теми
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initTheme = useThemeStore((state) => state.initTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initTheme();
    setMounted(true);
  }, [initTheme]);

  // Показуємо контент тільки після ініціалізації теми
  // щоб уникнути flash of wrong theme (FOUC)
  // Використовуємо opacity замість visibility для кращого UX
  return (
    <div 
      style={{ 
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.1s ease-in-out'
      }}
    >
      {children}
    </div>
  );
}

// Компонент для синхронізації кошика
function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CartSyncProvider>
          {children}
        </CartSyncProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
