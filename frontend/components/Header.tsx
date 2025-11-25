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
import Cart from "./Cart";
import CallbackModal from "./CallbackModal";

// Контактна інформація Croco Sushi
const CONTACT_INFO = {
  phones: [
    { number: "+380980970003", display: "(098) 097-00-03" },
  ],
  workingHours: "10:00 - 21:45",
  email: "crocosushi0003@gmail.com",
  address: "м. Львів, вул. Володимира Янева, 31",
  social: {
    telegram: "https://t.me/Croco_Sushi",
    instagram: "https://www.instagram.com/crocosushi/",
  },
};

const NAV_LINKS = [
  { href: "/menu", label: "Меню" },
  { href: "/delivery", label: "Доставка" },
  { href: "/promotions", label: "Акції" },
  { href: "/reviews", label: "Відгуки" },
];

export default function Header() {
  const [isSticky, setIsSticky] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentLang, setCurrentLang] = useState<"UA" | "RU">("UA");
  const getItemCount = useCartStore((state) => state.totalItems);

  // Sticky header при прокрутці
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
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

  // Перевірка чи зараз робочий час (10:00 - 21:45)
  const isWorkingHours = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Відкрито з 10:00 до 21:45
    if (hours < 10) return false;
    if (hours > 21) return false;
    if (hours === 21 && minutes > 45) return false;
    return true;
  };

  return (
    <>
      <header className={`bg-white ${isSticky ? "sticky top-0 z-40 shadow-header" : ""}`}>
        {/* Top Bar */}
        <div className="bg-gray-50 border-b border-border hidden md:block">
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
                {/* Індикатор робочого часу */}
                <div className="flex items-center text-secondary-light">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>
                    {isWorkingHours() ? (
                      <span className="text-primary font-medium">Відкрито</span>
                    ) : (
                      <span className="text-accent-red font-medium">Зачинено</span>
                    )}
                    {" "}з {CONTACT_INFO.workingHours}
                  </span>
                </div>

                {/* Вибір мови */}
                <div className="flex items-center border-l border-border pl-4">
                  <button
                    onClick={() => setCurrentLang("UA")}
                    className={`px-2 py-1 rounded transition ${
                      currentLang === "UA"
                        ? "bg-primary text-white"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    UA
                  </button>
                  <span className="text-border mx-1">/</span>
                  <button
                    onClick={() => setCurrentLang("RU")}
                    className={`px-2 py-1 rounded transition ${
                      currentLang === "RU"
                        ? "bg-primary text-white"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    RU
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Логотип */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-4xl">🐊</span>
              <span className="text-2xl font-bold text-primary">
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
                  {link.label}
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
                <span className="text-sm">Передзвонити</span>
              </button>

              {/* Кнопка "Оформити замовлення" (Desktop) */}
              <Link
                href="/checkout"
                className="hidden lg:block bg-primary hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-lg transition"
              >
                Оформити замовлення
              </Link>

              {/* Профіль / Вхід */}
              {isAuthenticated ? (
                <Link
                  href="/profile"
                  className="flex items-center space-x-1 text-secondary hover:text-primary transition"
                >
                  <UserIcon className="w-6 h-6" />
                  <span className="hidden md:inline text-sm">Профіль</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center space-x-1 text-secondary hover:text-primary transition"
                >
                  <UserIcon className="w-6 h-6" />
                  <span className="hidden md:inline text-sm">Вхід</span>
                </Link>
              )}

              {/* Кошик */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center text-secondary hover:text-primary transition"
              >
                <ShoppingCartIcon className="w-6 h-6" />
                {getItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount > 99 ? "99+" : getItemCount}
                  </span>
                )}
              </button>

              {/* Hamburger меню (Mobile) */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-secondary hover:text-primary transition"
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
              <Dialog.Panel className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <span className="text-3xl">🐊</span>
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
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  {/* Bottom section */}
                  <div className="p-4 border-t border-border space-y-4">
                    {/* Робочий час */}
                    <div className="flex items-center text-secondary-light">
                      <ClockIcon className="w-5 h-5 mr-2" />
                      <span>
                        {isWorkingHours() ? (
                          <span className="text-primary font-medium">Відкрито</span>
                        ) : (
                          <span className="text-accent-red font-medium">Зачинено</span>
                        )}{" "}
                        з {CONTACT_INFO.workingHours}
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
                      Передзвонити мені
                    </button>

                    {/* Вибір мови */}
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setCurrentLang("UA")}
                        className={`px-4 py-2 rounded-lg transition ${
                          currentLang === "UA"
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-secondary hover:bg-gray-200"
                        }`}
                      >
                        UA
                      </button>
                      <button
                        onClick={() => setCurrentLang("RU")}
                        className={`px-4 py-2 rounded-lg transition ${
                          currentLang === "RU"
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-secondary hover:bg-gray-200"
                        }`}
                      >
                        RU
                      </button>
                    </div>
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
