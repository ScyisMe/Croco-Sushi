"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useCartSync } from "@/hooks/useCartSync";

// Компонент для синхронізації кошика
function CartSyncProvider({ children }: { children: React.ReactNode }) {
  // Використовуємо хук для синхронізації
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
      <CartSyncProvider>
        {children}
      </CartSyncProvider>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

