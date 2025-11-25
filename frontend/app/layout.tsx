import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ 
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#00A859",
};

export const metadata: Metadata = {
  title: "Croco Sushi - Доставка суші у Львові",
  description: "Croco Sushi - сервіс швидкої кухні. Смачні суші з доставкою додому. Свіжі інгредієнти та найкращі ціни у Львові.",
  keywords: "суші, доставка суші, Львів, роли, японська кухня, Croco Sushi",
  authors: [{ name: "Croco Sushi" }],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#333",
                color: "#fff",
                borderRadius: "8px",
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
