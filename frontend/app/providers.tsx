"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useCartSync } from "@/hooks/useCartSync";
import { useThemeStore } from "@/store/themeStore";

// Компонент для ініціалізації теми
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initTheme = useThemeStore((state) => state.initTheme);
  // Показуємо контент одразу
  // Фону (bg-surface-dark) достатньо для уникнення сильного FOUC
  return (
    <>
      {children}
    </>
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
