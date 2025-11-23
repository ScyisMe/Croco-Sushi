"use client";

import Link from "next/link";
import { PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">🐊 Croco Sushi</h3>
            <p className="text-gray-400">
              Смачні суші з доставкою додому. Свіжі інгредієнти та найкращі ціни.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Навігація</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Головна
                </Link>
              </li>
              <li>
                <Link href="/menu" className="hover:text-white transition">
                  Меню
                </Link>
              </li>
              <li>
                <Link href="/promotions" className="hover:text-white transition">
                  Акції
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-white transition">
                  Відгуки
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Інформація</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/delivery" className="hover:text-white transition">
                  Доставка та оплата
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-white transition">
                  Відгуки
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Контакти</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center space-x-2">
                <PhoneIcon className="w-5 h-5" />
                <a href="tel:+380501234567" className="hover:text-white transition">
                  +380 50 123 45 67
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <EnvelopeIcon className="w-5 h-5" />
                <a href="mailto:info@crocosushi.com" className="hover:text-white transition">
                  info@crocosushi.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Croco Sushi. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  );
}

