import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import SmoothScrolling from "@/components/ui/SmoothScrolling";
import dynamic from "next/dynamic";
import Script from "next/script";
import PlerdyScript from "@/components/PlerdyScript";
import UpsellModal from "@/components/modals/UpsellModal";

const MaintenanceGuard = dynamic(() => import("@/components/MaintenanceGuard"), {
  ssr: false,
});

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



export const metadata: Metadata = {
  title: "Croco Sushi Львів — Доставка Суші та Ролів",
  description: "Найсмачніші суші та роли у Львові з безкоштовною доставкою від 1000 грн. Тільки свіжа риба, великі порції та швидка доставка додому та в офіс.",
  metadataBase: new URL("https://crocosushi.com"),
  alternates: {
    canonical: "/",
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://a.plerdy.com" crossOrigin="anonymous" />
        {/* Font preloading is handled automatically by next/font. Manual preloading of hashed files is fragile. */}
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${playfair.variable} font-body bg-surface-dark text-white min-h-screen pb-16 md:pb-0`}>
        <Providers>
          <MaintenanceGuard />
          <div className="fixed-background" />
          <SmoothScrolling />
          <div className="relative z-10 w-full">
            {children}
          </div>
          <BottomNav />
          <UpsellModal />
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              "name": "Croco Sushi",
              "image": "https://crocosushi.com/logo.webp",
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
              "priceRange": "$$",
              "subjectOf": {
                "@type": "VideoObject",
                "name": "Croco Sushi Hero Video",
                "description": "Premium sushi delivery in Lviv. Fresh fish, large portions, free delivery from 1000 UAH.",
                "thumbnailUrl": "https://crocosushi.com/images/hero-poster.webp",
                "uploadDate": "2024-01-01T00:00:00+02:00",
                "contentUrl": "https://crocosushi.com/hero-bg.mp4",
                "embedUrl": "https://crocosushi.com/",
                "interactionStatistic": {
                  "@type": "InteractionCounter",
                  "interactionType": { "@type": "WatchAction" },
                  "userInteractionCount": 1000
                }
              }
            })
          }}
        />
        <PlerdyScript />
      </body>
    </html>
  );
}
