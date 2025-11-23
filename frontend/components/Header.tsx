"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCartIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cartStore";
import Cart from "./Cart";

export default function Header() {
  const router = useRouter();
  const [isSticky, setIsSticky] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const getItemCount = useCartStore((state) => state.totalItems);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      setIsAuthenticated(!!token);
    }
  }, []);

  return (
    <header className={`bg-white shadow-md ${isSticky ? "sticky top-0 z-40" : ""}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-green-600">
            🐊 Croco Sushi
          </Link>

          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-green-600 transition">
              Головна
            </Link>
            <Link href="/menu" className="text-gray-700 hover:text-green-600 transition">
              Меню
            </Link>
            <Link href="/promotions" className="text-gray-700 hover:text-green-600 transition">
              Акції
            </Link>
            <Link href="/reviews" className="text-gray-700 hover:text-green-600 transition">
              Відгуки
            </Link>
            <Link href="/delivery" className="text-gray-700 hover:text-green-600 transition">
              Доставка
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <a
              href="tel:+380501234567"
              className="hidden md:flex items-center space-x-2 text-gray-700 hover:text-green-600 transition"
            >
              <PhoneIcon className="w-5 h-5" />
              <span className="font-semibold">+380 50 123 45 67</span>
            </a>

            {isAuthenticated ? (
              <Link
                href="/profile"
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition"
              >
                <UserIcon className="w-6 h-6" />
                <span className="hidden md:inline">Профіль</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition"
              >
                <UserIcon className="w-6 h-6" />
                <span className="hidden md:inline">Вхід</span>
              </Link>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center space-x-2 text-gray-700 hover:text-green-600 transition"
            >
              <ShoppingCartIcon className="w-6 h-6" />
              {getItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      <Cart isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
    </header>
  );
}

