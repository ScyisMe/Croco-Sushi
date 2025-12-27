"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
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
import NonWorkingHoursPopup from "./NonWorkingHoursPopup";
import { throttle } from "@/lib/utils";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import Image from "next/image";
import { NavLink } from "./ui/NavLink";

// Контактна інформація Croco Sushi
const CONTACT_INFO = {
  phones: [
    { number: "+380980970003", display: "(038) 097-00-03" },
  ],
  workingHours: "10:00 - 21:45",
  email: "crocosushi0003@gmail.com",
  address: "м. Львів, вул. Володимира Янева, 31",
  addressUrl: "https://maps.app.goo.gl/FVwFa238ugXyDEDj7",
  social: {
    telegram: "https://t.me/CrocoSushi",
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
  const [isNonWorkingPopupOpen, setIsNonWorkingPopupOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { isOpen, isMounted } = useWorkingHours();
  const getItemCount = useCartStore((state) => state.totalItems);

  // Використовуємо локалізацію
  const { t } = useTranslation();

  // Позначаємо компонент як змонтований після першого рендеру на клієнті
  // Auto-open non-working popup if closed
  useEffect(() => {
    if (isMounted && isOpen === false) {
      const hasShown = sessionStorage.getItem("hasShownClosedPopup");
      if (!hasShown) {
        const timer = setTimeout(() => {
          setIsNonWorkingPopupOpen(true);
          sessionStorage.setItem("hasShownClosedPopup", "true");
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isMounted, isOpen]);

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

  const [isBumping, setIsBumping] = useState(false);

  useEffect(() => {
    if (getItemCount === 0) return;
    setIsBumping(true);
    const timer = setTimeout(() => setIsBumping(false), 300);
    return () => clearTimeout(timer);
  }, [getItemCount]);



  return (
    <>
      <header suppressHydrationWarning={true} className={`transition-colors ${isSticky ? "sticky top-0 z-40 navbar-glass shadow-lg" : "bg-surface"}`}>
        {/* Top Bar */}
        <div suppressHydrationWarning className="bg-background-secondary border-b border-border hidden md:block">
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


              </div>
            </div>
          </div>
        </div>

        {/* Main Header - адаптивна висота */}
        <div suppressHydrationWarning className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* Логотип - адаптивний розмір */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-[#343434]">
                <Image
                  src="/logo.png"
                  alt="Croco Sushi"
                  fill
                  sizes="64px"
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-lg sm:text-2xl font-bold text-primary">
                Croco Sushi
              </span>
            </Link>



            {/* Навігація (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-8">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} href={link.href}>
                  {t(link.labelKey)}
                </NavLink>
              ))}
            </nav>

            {/* Права частина */}
            <div className="flex items-center space-x-3">
              {/* Кнопка передзвону (Desktop) */}
              <button
                onClick={() => setIsCallbackOpen(true)}
                className="hidden md:flex items-center space-x-2 text-secondary hover:text-primary transition"
              >
                <PhoneIcon className="w-5 h-5" />
                <span className="text-sm">{t("header.callback")}</span>
              </button>

              {/* Профіль / Вхід - спрощено до однієї іконки */}
              <Link
                href={isAuthenticated ? "/profile" : "/login"}
                className="flex items-center justify-center w-10 h-10 text-secondary hover:text-primary hover:bg-surface-hover rounded-full transition"
                aria-label={isAuthenticated ? t("header.profile") : t("header.login")}
              >
                <span className="sr-only">{isAuthenticated ? t("header.profile") : t("header.login")}</span>
                <UserIcon className="w-6 h-6" />
              </Link>

              {/* Кошик - touch target 44px */}
              <motion.button
                onClick={() => setIsCartOpen(true)}
                animate={isBumping ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                className="relative flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] text-foreground hover:text-primary hover:bg-surface-hover rounded-full transition active:scale-95"
                aria-label="Відкрити кошик"
              >
                <ShoppingCartIcon className="w-6 h-6" />
                {isMounted && getItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-red text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-md">
                    {getItemCount > 99 ? "99+" : getItemCount}
                  </span>
                )}
              </motion.button>

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
              <Dialog.Panel className="fixed inset-y-0 left-0 w-full max-w-xs bg-[#111] border-r border-white/10 shadow-2xl">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <Link href="/" className="flex items-center space-x-3" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#343434] border border-white/10">
                        <Image
                          src="/logo.png"
                          alt="Croco Sushi"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-xl font-bold text-primary">Croco Sushi</span>
                    </Link>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-gray-400 hover:text-white transition"
                    >
                      <XMarkIcon className="w-8 h-8" />
                    </button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-2">
                      {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-3 px-4 text-lg font-medium text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition"
                          >
                            {t(link.labelKey)}
                          </Link>
                        </li>
                      ))}

                      {/* Авторизація для мобільних */}
                      {!isAuthenticated && (
                        <>
                          <li className="border-t border-white/10 pt-4 mt-4">
                            <Link
                              href="/login"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block py-3 px-4 text-lg font-medium text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition"
                            >
                              {t("header.login")}
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/register"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block py-3 px-4 text-lg font-medium text-primary hover:bg-white/5 rounded-xl transition"
                            >
                              {t("header.register")}
                            </Link>
                          </li>
                        </>
                      )}

                      {isAuthenticated && (
                        <li className="border-t border-white/10 pt-4 mt-4">
                          <Link
                            href="/profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-3 px-4 text-lg font-medium text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition"
                          >
                            {t("header.profile")}
                          </Link>
                        </li>
                      )}
                    </ul>
                  </nav>

                  {/* Bottom section */}
                  <div className="p-4 border-t border-white/10 space-y-4 bg-[#0a0a0a]">
                    {/* Робочий час - показуємо тільки після монтування */}
                    <div className="flex items-center text-gray-400">
                      <ClockIcon className="w-5 h-5 mr-2" />
                      <span>
                        {isMounted ? (
                          isOpen ? (
                            <span className="text-primary font-medium">{t("header.open")}</span>
                          ) : (
                            <span className="text-accent-red font-medium">{t("header.closed")}</span>
                          )
                        ) : (
                          <span className="text-gray-500">...</span>
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
                          className="flex items-center text-gray-300 hover:text-primary transition"
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
                      className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-primary/20"
                    >
                      {t("callback.submit")}
                    </button>


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
      <CallbackModal
        isOpen={isCallbackOpen}
        onClose={() => setIsCallbackOpen(false)}
        isClosed={isMounted && isOpen === false}
      />

      <NonWorkingHoursPopup
        isOpen={isNonWorkingPopupOpen}
        onClose={() => setIsNonWorkingPopupOpen(false)}
      />
    </>
  );
}
