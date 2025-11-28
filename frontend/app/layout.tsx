import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";
import { JsonLd, getOrganizationSchema, getWebsiteSchema } from "@/lib/schema";

// Оптимізація шрифтів - LCP optimization
const inter = Inter({ 
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

// Viewport оптимізація для мобільних з Safe Area
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00A859" },
    { media: "(prefers-color-scheme: dark)", color: "#22C55E" },
  ],
  viewportFit: "cover",
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  title: "Croco Sushi - Доставка суші у Львові",
  description: "Croco Sushi - сервіс швидкої кухні. Смачні суші з доставкою додому. Свіжі інгредієнти та найкращі ціни у Львові.",
  keywords: "суші, доставка суші, Львів, роли, японська кухня, Croco Sushi",
  authors: [{ name: "Croco Sushi" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Croco Sushi",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  openGraph: {
    title: "Croco Sushi - Доставка суші у Львові",
    description: "Смачні суші з доставкою додому. Свіжі інгредієнти та найкращі ціни у Львові.",
    type: "website",
    locale: "uk_UA",
    siteName: "Croco Sushi",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Скрипт для запобігання flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('croco-theme');
                  if (theme) {
                    var parsed = JSON.parse(theme);
                    var savedTheme = parsed.state?.theme || 'system';
                    var resolvedTheme = savedTheme;
                    
                    if (savedTheme === 'system') {
                      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    
                    document.documentElement.setAttribute('data-theme', resolvedTheme);
                    if (resolvedTheme === 'dark') {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Preload критичних ресурсів - LCP optimization */}
        <link
          rel="preload"
          href="/images/hero/hero-1.jpg"
          as="image"
          fetchPriority="high"
        />
        {/* DNS prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="//fonts.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Schema.org markup для SEO */}
        <JsonLd schema={getOrganizationSchema()} />
        <JsonLd schema={getWebsiteSchema()} />
        
        <Providers>
          {children}
          <Toaster
            position="top-center"
            containerStyle={{
              top: 'max(1rem, env(safe-area-inset-top))',
            }}
            toastOptions={{
              duration: 3000,
              style: {
                background: "#333",
                color: "#fff",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
                maxWidth: "90vw",
              },
              success: {
                style: {
                  background: "#00A859",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#00A859",
                },
              },
              error: {
                style: {
                  background: "#EF4444",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#EF4444",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
