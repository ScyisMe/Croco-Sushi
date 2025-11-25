"use client";

import Link from "next/link";
import { PhoneIcon, EnvelopeIcon, MapPinIcon, ClockIcon } from "@heroicons/react/24/outline";

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

const NAV_LINKS = [
  { href: "/menu", label: "Меню" },
  { href: "/promotions", label: "Акції" },
  { href: "/reviews", label: "Відгуки" },
  { href: "/delivery", label: "Доставка та оплата" },
];

const INFO_LINKS = [
  { href: "/about", label: "Про нас" },
  { href: "/privacy", label: "Політика конфіденційності" },
  { href: "/terms", label: "Публічна оферта" },
];

export default function Footer() {
  return (
    <footer className="bg-secondary text-white">
      {/* Основний контент */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Логотип та опис */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="text-4xl">🐊</span>
              <span className="text-2xl font-bold text-primary">Croco Sushi</span>
            </Link>
            <p className="text-gray-400 mb-6">
              Сервіс швидкої кухні. Смачні суші з доставкою додому. 
              Свіжі інгредієнти та найкращі ціни в місті.
            </p>
            {/* Соціальні мережі */}
            <div className="flex space-x-4">
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
            <h4 className="font-semibold text-lg mb-4">Навігація</h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Інформація */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Інформація</h4>
            <ul className="space-y-3">
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Контакти */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Контакти</h4>
            <ul className="space-y-4">
              {/* Телефони */}
              <li>
                <div className="flex items-start space-x-3">
                  <PhoneIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {CONTACT_INFO.phones.map((phone, index) => (
                      <a
                        key={index}
                        href={`tel:${phone.number}`}
                        className="block text-gray-400 hover:text-white transition"
                      >
                        {phone.display}
                      </a>
                    ))}
                  </div>
                </div>
              </li>

              {/* Email */}
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-center space-x-3 text-gray-400 hover:text-white transition"
                >
                  <EnvelopeIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{CONTACT_INFO.email}</span>
                </a>
              </li>

              {/* Адреса */}
              <li className="flex items-start space-x-3">
                <MapPinIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">{CONTACT_INFO.address}</span>
              </li>

              {/* Графік роботи */}
              <li className="flex items-start space-x-3">
                <ClockIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-gray-400">
                  <p>Щодня: {CONTACT_INFO.workingHours.weekdays}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Нижня частина */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Копірайт */}
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Croco Sushi - сервіс швидкої кухні. Всі права захищені.
            </p>

            {/* Способи оплати */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-500 text-sm">Приймаємо:</span>
              <div className="flex items-center space-x-2">
                {/* Visa */}
                <div className="bg-white rounded px-2 py-1">
                  <svg className="h-4" viewBox="0 0 50 16" fill="none">
                    <path d="M19.5 1L16.5 15H13L16 1H19.5Z" fill="#00579F"/>
                    <path d="M32 1L28.5 15H25L27.5 5L25 15H21.5L25 1H28.5L29 3L32 1Z" fill="#00579F"/>
                    <path d="M35 1C33.5 1 32.5 1.5 32 2L30 15H33.5L34 12H37L37.5 15H41L38 1H35ZM34.5 9L35.5 4L36.5 9H34.5Z" fill="#00579F"/>
                    <path d="M11 1L7 10L6.5 8L5 2C5 1.5 4.5 1 4 1H0V1.5C1.5 2 3 2.5 4 3.5L7 15H10.5L15 1H11Z" fill="#00579F"/>
                  </svg>
                </div>
                {/* Mastercard */}
                <div className="bg-white rounded px-2 py-1">
                  <svg className="h-4" viewBox="0 0 40 24" fill="none">
                    <circle cx="14" cy="12" r="10" fill="#EB001B"/>
                    <circle cx="26" cy="12" r="10" fill="#F79E1B"/>
                    <path d="M20 4.5C22.5 6.5 24 9 24 12C24 15 22.5 17.5 20 19.5C17.5 17.5 16 15 16 12C16 9 17.5 6.5 20 4.5Z" fill="#FF5F00"/>
                  </svg>
                </div>
                {/* Готівка */}
                <span className="text-gray-400 text-sm">Готівка</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
