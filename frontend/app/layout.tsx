import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import BottomNav from "@/components/layout/BottomNav";
import SmoothScrolling from "@/components/ui/SmoothScrolling";



export const metadata: Metadata = {
  title: "Croco Sushi - Premium Sushi Delivery",
  description: "🍣 Замовляйте суші Croco Sushi у Львові! 🇺🇦 Безкоштовна доставка 🛵 від 1000 грн. Тільки свіжа риба 🐟 та авторські рецепти ✨.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body suppressHydrationWarning className={`font-body bg-surface-dark text-white min-h-[100dvh] pb-16 md:pb-0`}>
        <Providers>
          <div className="fixed-background" />
          <SmoothScrolling />
          <div className="relative z-10 w-full">
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
