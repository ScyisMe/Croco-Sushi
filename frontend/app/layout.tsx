import type { Metadata } from "next";
import { Inter, Playfair_Display, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import BottomNav from "@/components/layout/BottomNav";
import SmoothScrolling from "@/components/ui/SmoothScrolling";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

// Noto Sans JP generally doesn't have cyrillic subset in Google Fonts, checks needed. 
// Usually for Japanese, but if used for accents/global, 'latin' is safe.
const notoSans = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Croco Sushi Львів — Доставка Суші та Ролів",
  description: "🍣 Замовляйте суші Croco Sushi у Львові! 🇺🇦 Безкоштовна доставка 🛵 від 1000 грн. Тільки свіжа риба 🐟 та авторські рецепти ✨.",
  metadataBase: new URL("https://crocosushi.com"),
  alternates: {
    canonical: "/",
  },
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
      <body suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${notoSans.variable} font-body bg-surface-dark text-white min-h-screen pb-16 md:pb-0`}>
        <Providers>
          <div className="fixed-background" />
          <SmoothScrolling />
          <div className="relative z-10 w-full">
            {children}
          </div>
          <BottomNav />
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              "name": "Croco Sushi",
              "image": "https://crocosushi.com/logo.png",
              "@id": "https://crocosushi.com",
              "url": "https://crocosushi.com",
              "telephone": "+380980970003",
              "email": "crocosushi0003@gmail.com",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "вул. Володимира Янева, 31",
                "addressLocality": "Lviv",
                "addressCountry": "UA"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 49.811986,
                "longitude": 24.004456
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday"
                ],
                "opens": "11:00",
                "closes": "23:00"
              },
              "sameAs": [
                "https://www.instagram.com/crocosushi/",
                "https://t.me/CrocoSushi",
                "https://maps.app.goo.gl/FVwFa238ugXyDEDj7"
              ],
              "servesCuisine": "Sushi, Japanese",
              "priceRange": "$$"
            })
          }}
        />
      </body>
    </html>
  );
}
