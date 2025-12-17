import type { Metadata } from "next";
import { Inter, Playfair_Display, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import BottomNav from "@/components/layout/BottomNav";
import ParallaxBackground from "@/components/ParallaxBackground";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
});

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
      <body suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${notoSansJP.variable} font-body bg-surface-dark text-white min-h-screen pb-16 md:pb-0`}>
        <Providers>

          <ParallaxBackground />
          <div className="relative z-10 w-full">
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
