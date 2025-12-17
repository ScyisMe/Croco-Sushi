"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/store/localeStore";

// SVG Icons for social media
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
  </svg>
);

const socialLinks = [
  { name: "telegram", url: "https://t.me/CrocoSushi", Icon: TelegramIcon },
  { name: "instagram", url: "https://www.instagram.com/crocosushi/", Icon: InstagramIcon }
];

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-surface-dark pt-20 pb-6 overflow-hidden mt-auto">
      {/* Wave Separator */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0]">
        <svg
          className="relative block w-[calc(100%+1.3px)] h-[50px] z-20"
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-surface-card"
          />
        </svg>
      </div>

      {/* Seigaiha Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20c10 0 20-10 20-20H0c0 10 10 20 20 20zm0 0c-20 0-40 20-40 40h80c0-20-20-40-40-40z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#343434] ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                <Image
                  src="/logo.png"
                  alt="Croco Sushi"
                  fill
                  className="object-cover brightness-110"
                />
              </div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                Croco Sushi
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed">
              {t("footer.description")}
            </p>

            {/* Social Icons with proper SVG icons */}
            <div className="flex gap-3 mt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary-500 hover:scale-110 transition-all duration-300"
                  aria-label={social.name}
                >
                  <social.Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Menu Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-5 uppercase tracking-wider">
              {t("footer.menu")}
            </h3>
            <ul className="space-y-3">
              {["rolls", "sets", "sushi", "drinks"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/menu?category=${item}`}
                    className="text-gray-400 hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-200"
                  >
                    {t(`categories.${item}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - with proper links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-5 uppercase tracking-wider">
              {t("footer.contacts")}
            </h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a
                  href="https://maps.app.goo.gl/FVwFa238ugXyDEDj7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 hover:text-primary-400 transition-colors group"
                >
                  <span className="text-primary-400">📍</span>
                  <span className="group-hover:underline">{t("footer.addressValue")}</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+380980970003"
                  className="flex items-center gap-3 hover:text-primary-400 transition-colors"
                >
                  <span className="text-primary-400">📞</span>
                  <span>(098) 097-00-03</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:crocosushi0003@gmail.com"
                  className="flex items-center gap-3 hover:text-primary-400 transition-colors"
                >
                  <span className="text-primary-400">✉️</span>
                  <span>crocosushi0003@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Information - replaced FAQ accordion with simple links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-5 uppercase tracking-wider">
              Інформація
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/delivery"
                  className="text-gray-400 hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Доставка та оплата
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Про нас
                </Link>
              </li>
              <li>
                <Link
                  href="/reviews"
                  className="text-gray-400 hover:text-primary-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Відгуки
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright with privacy policy */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p suppressHydrationWarning>
              © {currentYear} Croco Sushi. Всі права захищено.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="hover:text-primary-400 transition-colors"
              >
                Політика конфіденційності
              </Link>
              <Link
                href="/delivery"
                className="hover:text-primary-400 transition-colors"
              >
                Умови доставки
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
