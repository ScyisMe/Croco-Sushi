"use client";

import Link from "next/link";
import { PhoneIcon, EnvelopeIcon, MapPinIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "@/store/localeStore";

// Іконки соціальних мереж (SVG)
const InstagramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// Контактна інформація Croco Sushi
const CONTACT_INFO = {
  phones: [
    { number: "+380980970003", display: "(098) 097-00-03" },
  ],
  email: "crocosushi0003@gmail.com",
  address: "м. Львів, вул. Володимира Янева, 31",
  workingHours: {
    weekdays: "10:00 - 21:45",
    weekend: "10:00 - 21:45",
  },
};

// Реальні соціальні мережі Croco Sushi
const SOCIAL_LINKS = [
  { name: "Instagram", href: "https://www.instagram.com/crocosushi/", icon: InstagramIcon },
  { name: "Telegram", href: "https://t.me/Croco_Sushi", icon: TelegramIcon },
];

// Навігаційні посилання з ключами локалізації
const NAV_LINKS = [
  { href: "/menu", labelKey: "header.menu" },
  { href: "/promotions", labelKey: "header.promotions" },
  { href: "/reviews", labelKey: "header.reviews" },
  { href: "/delivery", labelKey: "footer.deliveryAndPayment" },
];

// Інформаційні посилання з ключами локалізації
const INFO_LINKS = [
  { href: "/about", labelKey: "footer.aboutUs" },
  { href: "/privacy", labelKey: "footer.privacy" },
  { href: "/terms", labelKey: "footer.publicOffer" },
];

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Логотип та опис */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="text-3xl">🐊</span>
              <span className="text-xl font-bold text-primary">Croco Sushi</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              {t("footer.description")}
            </p>
            {/* Соціальні мережі */}
            <div className="flex space-x-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition"
                  aria-label={social.name}
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Навігація */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("footer.navigation")}</h3>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary transition"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Інформація */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("footer.info")}</h3>
            <ul className="space-y-2">
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary transition"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Контакти */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t("footer.contacts")}</h3>
            <ul className="space-y-3">
              {CONTACT_INFO.phones.map((phone, index) => (
                <li key={index}>
                  <a
                    href={`tel:${phone.number}`}
                    className="flex items-center text-gray-400 hover:text-primary transition"
                  >
                    <PhoneIcon className="w-5 h-5 mr-2" />
                    {phone.display}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-center text-gray-400 hover:text-primary transition"
                >
                  <EnvelopeIcon className="w-5 h-5 mr-2" />
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li className="flex items-start text-gray-400">
                <MapPinIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{CONTACT_INFO.address}</span>
              </li>
              <li className="flex items-center text-gray-400">
                <ClockIcon className="w-5 h-5 mr-2" />
                <span>{t("footer.daily")}: {CONTACT_INFO.workingHours.weekdays}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <p>{t("footer.copyright", { year: currentYear.toString() })}</p>
            <div className="flex items-center space-x-4 mt-2 md:mt-0">
              <span>{t("footer.accept")}:</span>
              <div className="flex space-x-2">
                {/* VISA */}
                <div className="bg-white rounded px-2 py-1">
                  <span className="text-blue-600 font-bold text-xs">VISA</span>
                </div>
                {/* MasterCard */}
                <div className="bg-white rounded px-2 py-1">
                  <div className="flex">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full -ml-1"></div>
                  </div>
                </div>
                {/* Готівка */}
                <span>{t("footer.cash")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
