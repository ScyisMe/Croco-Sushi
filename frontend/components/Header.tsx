"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import {
  ShoppingCartIcon,
  PhoneIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cartStore";
import { useTranslation, Locale } from "@/store/localeStore";
import Cart from "./Cart";
import CallbackModal from "./CallbackModal";
import { throttle } from "@/lib/utils";
import Image from "next/image";

// Контактна інформація Croco Sushi
const CONTACT_INFO = {
  phones: [
    { number: "+380980970003", display: "(098) 097-00-03" },
  ],
  workingHours: "10:00 - 21:45",
  email: "crocosushi0003@gmail.com",
  address: "м. Львів, вул. Володимира Янева, 31",
  addressUrl: "https://maps.app.goo.gl/JksKK3KqdouctZ6UJ",
  social: {
    telegram: "https://t.me/Croco_Sushi",
    instagram: "https://www.instagram.com/crocosushi/",
  },
};

// Навігаційні посилання з ключами локалізації
const NAV_LINKS = [
  { href: "/menu", labelKey: "header.menu" },
  { href: "/delivery", labelKey: "header.delivery" },
  { href: "/promotions", labelKey: "header.promotions" },
  { href: "/reviews", labelKey: "header.reviews" },
];

export default function Header() {
  const [isSticky, setIsSticky] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // Для уникнення hydration mismatch
  const [isOpen, setIsOpen] = useState<boolean | null>(null); // Статус роботи
  const getItemCount = useCartStore((state) => state.totalItems);

  // Використовуємо локалізацію
  const { locale, setLocale, t } = useTranslation();

  // Позначаємо компонент як змонтований після першого рендеру на клієнті
  useEffect(() => {
    setIsMounted(true);
    // Перевіряємо робочий час тільки на клієнті
    const checkWorkingHours = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      // Відкрито з 10:00 до 21:45
      if (hours < 10) return false;
      if (hours > 21) return false;
      if (hours === 21 && minutes > 45) return false;
      return true;
    };
    setIsOpen(checkWorkingHours());

    // Оновлюємо статус кожну хвилину
    const interval = setInterval(() => {
      setIsOpen(checkWorkingHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Sticky header при прокрутці
  useEffect(() => {
    const handleScroll = throttle(() => {
      setIsSticky(window.scrollY > 50);
    }, 100);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Перевірка авторизації
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      setIsAuthenticated(!!token);
    }
  }, []);

  // Функція для зміни мови
  const handleLanguageChange = (lang: Locale) => {
    setLocale(lang);
  };

  return (
    <>
      <header className={`transition-colors ${isSticky ? "sticky top-0 z-40 navbar-glass shadow-lg" : "bg-surface"}`}>
        {/* Top Bar */}
        <div className="bg-background-secondary border-b border-border hidden md:block">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-10 text-sm">
              {/* Телефони */}
              <div className="flex items-center space-x-4">
                {CONTACT_INFO.phones.map((phone, index) => (
                  <a
                    key={index}
                    href={`tel:${phone.number}`}
                    className="text-secondary hover:text-primary transition flex items-center"
                  >
                    <PhoneIcon className="w-4 h-4 mr-1" />
                    {phone.display}
                  </a>
                ))}
              </div>

              {/* Час роботи та мова */}
              <div className="flex items-center space-x-4">
                {/* Індикатор робочого часу - показуємо тільки після монтування */}
                <div className="flex items-center text-secondary-light">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>
                    {isMounted ? (
                      isOpen ? (
                        <span className="text-primary font-medium">{t("header.open")}</span>
                      ) : (
                        <span className="text-accent-red font-medium">{t("header.closed")}</span>
                      )
                    ) : (
                      <span className="text-secondary-light">...</span>
                    )}
                    {" "}з 10:00 - 21:45
                  </span>
                </div>

                {/* Вибір мови - показуємо тільки після монтування */}
                {isMounted && (
                  <div className="flex items-center border-l border-border pl-4">
                    <button
                      onClick={() => handleLanguageChange("ua")}
                      className={`px-2 py-1 rounded transition ${locale === "ua"
                        ? "bg-primary text-white"
                        : "text-secondary hover:text-primary"
                        }`}
                    >
                      UA
                    </button>
                    <span className="text-border mx-1">/</span>
                    <button
                      onClick={() => handleLanguageChange("ru")}
                      className={`px-2 py-1 rounded transition ${locale === "ru"
                        ? "bg-primary text-white"
                        : "text-secondary hover:text-primary"
                        }`}
                    >
                      RU
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Header - адаптивна висота */}
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* Логотип - адаптивний розмір */}
            <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                <Image
                  src="/logo.png"
                  alt="Croco Sushi"
                  fill
                  sizes="48px"
                  className="object-contain rounded-full"
                />
              </div>
              <span className="text-lg sm:text-2xl font-bold text-primary">
                Croco Sushi
              </span>
            </Link>

            {/* Навігація (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-secondary font-medium hover:text-primary transition relative group"
                >
                  {t(link.labelKey)}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Права частина */}
            <div className="flex items-center space-x-4">
              {/* Кнопка передзвону (Desktop) */}
              <button
                onClick={() => setIsCallbackOpen(true)}
                className="hidden md:flex items-center space-x-2 text-secondary hover:text-primary transition"
              >
                <PhoneIcon className="w-5 h-5" />
                <span className="text-sm">{t("header.callback")}</span>
              </button>

              {/* Кнопка "Оформити замовлення" (Desktop) */}
              <Link
                href="/checkout"
                className="hidden lg:block bg-primary hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-lg transition"
              >
                {t("header.order")}
              </Link>

              {/* Профіль / Вхід / Реєстрація */}
              {isAuthenticated ? (
                <Link
                  href="/profile"
                  className="flex items-center space-x-1 text-secondary hover:text-primary transition"
                >
                  <UserIcon className="w-6 h-6" />
                  <span className="hidden md:inline text-sm">{t("header.profile")}</span>
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="flex items-center space-x-1 text-secondary hover:text-primary transition"
                  >
                    <UserIcon className="w-6 h-6" />
                    <span className="hidden md:inline text-sm">{t("header.login")}</span>
                  </Link>
                  <Link
                    href="/register"
                    className="hidden md:block text-sm text-primary hover:text-primary-600 font-medium transition"
                  >
                    {t("header.register")}
                  </Link>
                </div>
              )}

              {/* Кошик - touch target 44px */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] text-foreground hover:text-primary hover:bg-surface-hover rounded-full transition active:scale-95"
                aria-label="Відкрити кошик"
              >
                <ShoppingCartIcon className="w-6 h-6" />
                {isMounted && getItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount > 99 ? "99+" : getItemCount}
                  </span>
                )}
              </button>

              {/* Hamburger меню (Mobile) - touch target 44px */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] text-secondary hover:text-primary hover:bg-theme-secondary rounded-full transition active:scale-95"
                aria-label="Відкрити меню"
              >
                <Bars3Icon className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <Transition appear show={isMobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsMobileMenuOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="fixed inset-y-0 left-0 w-full max-w-xs bg-surface shadow-xl">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="relative w-10 h-10">
                        <Image
                          src="/logo.png"
                          alt="Croco Sushi"
                          fill
                          className="object-contain rounded-full"
                        />
                      </div>
                      <span className="text-xl font-bold text-primary">Croco Sushi</span>
                    </Link>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-secondary hover:text-primary transition"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                      {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-3 px-4 text-lg text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition"
                          >
                            {t(link.labelKey)}
                          </Link>
                        </li>
                      ))}

                      {/* Авторизація для мобільних */}
                      {!isAuthenticated && (
                        <>
                          <li className="border-t border-border pt-2 mt-2">
                            <Link
                              href="/login"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block py-3 px-4 text-lg text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition"
                            >
                              {t("header.login")}
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/register"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block py-3 px-4 text-lg text-primary font-medium hover:bg-primary/5 rounded-lg transition"
                            >
                              {t("header.register")}
                            </Link>
                          </li>
                        </>
                      )}

                      {isAuthenticated && (
                        <li className="border-t border-border pt-2 mt-2">
                          <Link
                            href="/profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-3 px-4 text-lg text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition"
                          >
                            {t("header.profile")}
                          </Link>
                        </li>
                      )}
                    </ul>
                  </nav>

                  {/* Bottom section */}
                  <div className="p-4 border-t border-border space-y-4">
                    {/* Робочий час - показуємо тільки після монтування */}
                    <div className="flex items-center text-secondary-light">
                      <ClockIcon className="w-5 h-5 mr-2" />
                      <span>
                        {isMounted ? (
                          isOpen ? (
                            <span className="text-primary font-medium">{t("header.open")}</span>
                          ) : (
                            <span className="text-accent-red font-medium">{t("header.closed")}</span>
                          )
                        ) : (
                          <span className="text-secondary-light">...</span>
                        )}{" "}
                        з 10:00 - 21:45
                      </span>
                    </div>

                    {/* Телефони */}
                    <div className="space-y-2">
                      {CONTACT_INFO.phones.map((phone, index) => (
                        <a
                          key={index}
                          href={`tel:${phone.number}`}
                          className="flex items-center text-secondary hover:text-primary transition"
                        >
                          <PhoneIcon className="w-5 h-5 mr-2" />
                          {phone.display}
                        </a>
                      ))}
                    </div>

                    {/* Кнопка передзвону */}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsCallbackOpen(true);
                      }}
                      className="w-full bg-primary hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition"
                    >
                      {t("callback.submit")}
                    </button>

                    {/* Вибір мови - показуємо тільки після монтування */}
                    {isMounted && (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleLanguageChange("ua")}
                          className={`px-4 py-2 rounded-lg transition ${locale === "ua"
                            ? "bg-primary text-white"
                            : "bg-surface text-foreground-secondary hover:bg-surface-hover"
                            }`}
                        >
                          UA
                        </button>
                        <button
                          onClick={() => handleLanguageChange("ru")}
                          className={`px-4 py-2 rounded-lg transition ${locale === "ru"
                            ? "bg-primary text-white"
                            : "bg-surface text-foreground-secondary hover:bg-surface-hover"
                            }`}
                        >
                          RU
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Cart Sidebar */}
      <Cart isOpen={isCartOpen} setIsOpen={setIsCartOpen} />

      {/* Callback Modal */}
      <CallbackModal isOpen={isCallbackOpen} onClose={() => setIsCallbackOpen(false)} />
    </>
  );
}
