"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/store/localeStore";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

// FAQ data
const FAQ_ITEMS = [
  {
    question: "Скільки коштує доставка?",
    answer: "Доставка безкоштовна при замовленні від 500 грн. При замовленні до 500 грн вартість доставки складає 50 грн. Доставляємо по всьому Львову!"
  },
  {
    question: "Чи кладете ви соєвий соус безкоштовно?",
    answer: "Так! До кожного замовлення ми безкоштовно додаємо соєвий соус, імбир, васабі та одноразові палички. Кількість залежить від розміру замовлення."
  },
  {
    question: "Які зони доставки?",
    answer: "Ми доставляємо по всьому Львову та передмістю. Час доставки залежить від вашої локації: центр — 30-45 хв, віддалені райони — до 60 хв."
  },
  {
    question: "Чи можна оплатити карткою кур'єру?",
    answer: "Так, наші кур'єри мають термінали для оплати карткою. Також доступна онлайн оплата через LiqPay та оплата готівкою."
  }
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, index) => (
        <div key={index} className="border border-white/10 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleItem(index)}
            className="w-full flex items-center justify-between p-4 text-left bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-sm font-medium text-white">{item.question}</span>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-40' : 'max-h-0'}`}
          >
            <p className="p-4 text-sm text-gray-400 bg-white/[0.02]">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

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
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative w-14 h-14">
                <Image
                  src="/logo.png"
                  alt="Croco Sushi"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                Croco Sushi
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="flex gap-4">
              {/* Social Icons */}
              {[
                { name: "telegram", url: "https://t.me/Croco_Sushi", icon: "T" },
                { name: "instagram", url: "https://www.instagram.com/crocosushi/", icon: "I" }
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary-500 hover:scale-110 transition-all duration-300"
                  aria-label={social.name}
                >
                  <span className="capitalize">{social.icon}</span>
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
                <a href="tel:+380980970003" className="hover:text-white transition-colors">
                  (098) 097-00-03
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

          {/* FAQ */}
          <div>
            <h3 className="font-display text-xl font-bold text-white mb-6">
              Часті запитання
            </h3>
            <FaqAccordion />
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
