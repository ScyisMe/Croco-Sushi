"use client";

import Link from "next/link";
import { useTranslation } from "@/store/localeStore";
import { Button } from "./ui/Button";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-surface-dark pt-20 pb-10 overflow-hidden mt-auto">
      {/* Wave Separator */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0]">
        <svg
          className="relative block w-[calc(100%+1.3px)] h-[50px]"
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

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="block">
              <span className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                Croco Sushi
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="flex gap-4">
              {/* Social Icons */}
              {["instagram", "facebook", "tiktok"].map((social) => (
                <a
                  key={social}
                  href={`#${social}`}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary-500 hover:scale-110 transition-all duration-300"
                  aria-label={social}
                >
                  <span className="capitalize">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display text-xl font-bold text-white mb-6">
              {t("footer.menu")}
            </h3>
            <ul className="space-y-4">
              {["rolls", "sets", "sushi", "drinks"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/menu?category=${item}`}
                    className="text-gray-400 hover:text-primary-400 transition-colors"
                  >
                    {t(`categories.${item}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-xl font-bold text-white mb-6">
              {t("footer.contacts")}
            </h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start gap-3">
                <span>📍</span>
                <span>{t("footer.addressValue")}</span>
              </li>
              <li className="flex items-center gap-3">
                <span>📞</span>
                <a href="tel:+380123456789" className="hover:text-white transition-colors">
                  +380 12 345 67 89
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span>✉️</span>
                <a href="mailto:crocosushi0003@gmail.com" className="hover:text-white transition-colors">
                  crocosushi0003@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-display text-xl font-bold text-white mb-6">
              {t("footer.newsletter")}
            </h3>
            <p className="text-gray-400 mb-4">
              {t("footer.newsletterDesc")}
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
              <Button className="w-full">
                {t("footer.subscribe")}
              </Button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/5 text-center text-gray-500 text-sm">
          <p suppressHydrationWarning>© {currentYear} Croco Sushi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
