"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PhoneIcon,
  RocketLaunchIcon,
  GiftIcon,
  SparklesIcon,
  BanknotesIcon,
  CreditCardIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { JsonLd, getLocalBusinessSchema, getFAQSchema, getBreadcrumbSchema, BUSINESS_INFO } from "@/lib/schema";
import { useTranslation } from "@/store/localeStore";

// Контактна інформація
const CONTACT_INFO = {
  phone: "+380980970003",
  phoneDisplay: "(098) 097-00-03",
  address: "м. Львів, вул. Володимира Янева, 31",
  addressUrl: "https://maps.app.goo.gl/FVwFa238ugXyDEDj7",
  workingHours: "10:00 - 21:45",
  coordinates: {
    lat: 49.8089,
    lng: 24.0155,
  },
};

export default function DeliveryPage() {
  const { t } = useTranslation();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Локалізовані переваги
  const LOCALIZED_FEATURES = [
    {
      icon: <RocketLaunchIcon className="w-10 h-10 text-primary" />,
      title: t("delivery.fastDelivery"),
      description: t("delivery.fastDeliveryDesc"),
    },
    {
      icon: <GiftIcon className="w-10 h-10 text-primary" />,
      title: t("delivery.freeDelivery"),
      description: t("delivery.freeDeliveryFromShort", { amount: "1000" }),
    },
    {
      icon: <SparklesIcon className="w-10 h-10 text-primary" />,
      title: t("delivery.freshDishes"),
      description: t("delivery.freshDishesDesc"),
    },
    {
      icon: <CreditCardIcon className="w-10 h-10 text-primary" />,
      title: t("delivery.convenientPayment"),
      description: t("delivery.convenientPaymentDesc"),
    },
  ];

  // Локалізовані FAQ
  const LOCALIZED_FAQ = [
    { question: t("delivery.faq1q"), answer: t("delivery.faq1a") },
    { question: t("delivery.faq2q"), answer: t("delivery.faq2a") },
    { question: t("delivery.faq3q"), answer: t("delivery.faq3a") },
    { question: t("delivery.faq4q"), answer: t("delivery.faq4a") },
    { question: t("delivery.faq5q"), answer: t("delivery.faq5a") },
    { question: t("delivery.faq6q"), answer: t("delivery.faq6a") },
    { question: t("delivery.faq7q"), answer: t("delivery.faq7a") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-theme-secondary transition-colors">
      {/* Schema.org markup для SEO */}
      <JsonLd schema={getLocalBusinessSchema()} />
      <JsonLd
        schema={getFAQSchema(
          LOCALIZED_FAQ.map((item) => ({
            question: item.question,
            answer: item.answer,
          }))
        )}
      />
      <JsonLd
        schema={getBreadcrumbSchema([
          { name: t("common.home"), url: BUSINESS_INFO.url },
          { name: t("delivery.title"), url: `${BUSINESS_INFO.url}/delivery` },
        ])}
      />

      <Header />

      <main className="flex-grow">
        {/* Хлібні крихти */}
        <div className="bg-theme-surface">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center text-sm">
              <Link href="/" className="text-secondary-light hover:text-primary transition">
                {t("common.home")}
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-secondary-light" />
              <span className="text-secondary font-medium">{t("delivery.title")}</span>
            </nav>
          </div>
        </div>

        {/* Hero секція */}
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("delivery.title")}</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {t("delivery.subtitle")}
            </p>
          </div>
        </section>

        {/* Переваги */}
        <section className="py-12 -mt-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {LOCALIZED_FEATURES.map((feature, index) => (
                <div
                  key={index}
                  className="bg-theme-surface rounded-xl shadow-card p-6 text-center border border-white/10"
                >
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold text-secondary mb-1">{feature.title}</h3>
                  <p className="text-sm text-secondary-light">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Об'єднаний блок: Карта + Умови доставки */}
          <div className="bg-surface border border-white/10 rounded-xl shadow-card p-6 md:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-secondary">{t("delivery.zones")}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Карта зон - інтерактивна */}
              <div className="h-[400px] md:h-[450px] bg-gray-900 rounded-xl overflow-hidden relative shadow-md">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5161.721022348217!2d24.012!3d49.8089!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473ae7eb564c2c3f%3A0x9c4bc6e67f0bb7d0!2sCroco%20Sushi!5e0!3m2!1suk!2sua!4v1700000000000!5m2!1suk!2sua&maptype=roadmap"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.95) contrast(0.9)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t("delivery.zones")}
                />
                {/* Кнопка відкриття в Google Maps */}
                <a
                  href={CONTACT_INFO.addressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-sm font-medium text-primary hover:bg-gray-700 transition flex items-center gap-2 border border-gray-600"
                >
                  <MapPinIcon className="w-4 h-4" />
                  {t("delivery.viewLargerMap")}
                </a>

                {/* Легенда */}
                <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-sm text-gray-200 font-medium">Радіус 6 км від закладу</span>
                  </div>
                </div>
              </div>

              {/* Зведений блок умов (замість дублювання) */}
              <div className="space-y-4">
                {/* Умови доставки з іконками */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-theme-tertiary rounded-lg">
                    <TruckIcon className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <span className="text-foreground font-medium">Радіус доставки</span>
                      <p className="text-sm text-foreground-secondary">до 6 км від вул. Янева, 31</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-theme-tertiary rounded-lg">
                    <BanknotesIcon className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <span className="text-foreground font-medium">Мін. замовлення</span>
                      <p className="text-sm text-foreground-secondary">200 ₴</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-theme-tertiary rounded-lg">
                    <ClockIcon className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <span className="text-foreground font-medium">Час доставки</span>
                      <p className="text-sm text-foreground-secondary">40-60 хв (включає приготування)</p>
                    </div>
                  </div>
                </div>

                {/* Безкоштовна доставка - яскравий акцент */}
                <div className="bg-gradient-to-r from-primary to-primary-600 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <GiftIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Безкоштовна доставка</p>
                      <p className="text-white/80">при замовленні від 1000 ₴</p>
                    </div>
                  </div>
                </div>

                {/* Вартість доставки */}
                <div className="p-4 bg-theme-tertiary border border-border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Вартість доставки:</span>
                    <span className="font-bold text-xl text-foreground">200 ₴</span>
                  </div>
                  <p className="text-sm text-foreground-secondary mt-1">
                    (безкоштовно від 1000 ₴)
                  </p>
                </div>

                {/* CTA кнопка - яскрава */}
                <Link
                  href="/menu"
                  className="block w-full bg-primary hover:bg-primary-600 text-white font-bold py-4 px-6 rounded-xl text-center transition-all shadow-lg hover:shadow-primary/25 hover:scale-[1.02] text-lg"
                >
                  🍣 Перейти до меню
                </Link>

                {/* Примітка */}
                <p className="text-sm text-foreground-secondary text-center">
                  * Якщо ваша адреса за межами зони, зателефонуйте — уточнимо можливість доставки
                </p>
              </div>
            </div>
          </div>

          {/* Графік роботи та способи оплати */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Графік роботи */}
            <div className="bg-surface border border-white/10 rounded-xl shadow-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-secondary">{t("delivery.workingHours")}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-secondary">{t("delivery.everyDay")}</span>
                  <span className="font-bold text-primary text-lg">{CONTACT_INFO.workingHours}</span>
                </div>
                <p className="text-sm text-secondary-light">
                  Останнє замовлення приймається за <strong className="text-primary">45 хвилин</strong> до закриття
                </p>
              </div>
            </div>

            {/* Способи оплати */}
            <div className="bg-surface border border-white/10 rounded-xl shadow-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-secondary">{t("delivery.paymentMethods")}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-theme-tertiary rounded-lg">
                  <BanknotesIcon className="w-6 h-6 text-primary" />
                  <span className="text-theme-secondary">{t("delivery.cashPayment")}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-theme-tertiary rounded-lg">
                  <CreditCardIcon className="w-6 h-6 text-primary" />
                  <span className="text-theme-secondary">{t("delivery.cardPaymentCourier")}</span>
                </div>
                {/* Онлайн оплата - неактивний стиль */}
                <div className="flex items-center gap-3 p-3 bg-theme-tertiary/50 rounded-lg opacity-60">
                  <GlobeAltIcon className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-400">{t("delivery.onlinePayment")}</span>
                  <span className="ml-auto text-xs font-bold text-yellow-500 bg-yellow-500/20 px-2 py-1 rounded">
                    Скоро
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Адреса самовивозу */}
          <div className="bg-theme-surface rounded-xl shadow-card p-6 md:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <MapPinIcon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-secondary">{t("delivery.pickup")}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-secondary mb-4">
                  {t("delivery.pickupInfo")}
                </p>
                <a
                  href={CONTACT_INFO.addressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-primary hover:underline mb-2 inline-block"
                >
                  📍 {CONTACT_INFO.address}
                </a>
                <p className="text-secondary-light mb-4">
                  {t("delivery.workingHours")}: {CONTACT_INFO.workingHours}
                </p>
                <a
                  href={`tel:${CONTACT_INFO.phone}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <PhoneIcon className="w-5 h-5" />
                  {CONTACT_INFO.phoneDisplay}
                </a>

                {/* Бонус за самовивіз - яскравий блок */}
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/25 to-orange-500/25 border-2 border-amber-400/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/40 rounded-full flex items-center justify-center flex-shrink-0">
                      <GiftIcon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-amber-400">+5% бонусних балів</p>
                      <p className="text-sm text-foreground-secondary">
                        за кожне замовлення самовивозом!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Карта самовивозу - з темним фільтром */}
              <div className="h-[300px] md:h-[350px] bg-gray-900 rounded-xl overflow-hidden relative shadow-md">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1291.0!2d24.0155!3d49.8089!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473ae7eb564c2c3f%3A0x9c4bc6e67f0bb7d0!2z0LLRg9C70LjRhtGPINCS0L7Qu9C-0LTQuNC80LjRgNCwINCv0L3QtdCy0LAsIDMxLCDQm9GM0LLRltCyLCDQm9GM0LLRltCy0YHRjNC60LAg0L7QsdC70LDRgdGC0YwsIDc5MDAw!5e0!3m2!1suk!2sua!4v1700000000001!5m2!1suk!2sua"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.95) contrast(0.9)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t("delivery.pickupAddress")}
                />
                <a
                  href={CONTACT_INFO.addressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 bg-gray-800/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow text-sm font-medium text-primary hover:bg-gray-700 transition border border-gray-600"
                >
                  {t("delivery.enlargeMap")}
                </a>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-theme-surface rounded-xl shadow-card p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold text-theme mb-6">
              {t("delivery.faq")}
            </h2>

            <div className="space-y-3">
              {LOCALIZED_FAQ.map((item, index) => (
                <div key={index} className="border border-border rounded-xl overflow-hidden transition-colors hover:border-primary/50">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-primary/5 transition group"
                  >
                    <span className="font-medium text-secondary group-hover:text-primary transition">{item.question}</span>
                    <ChevronDownIcon
                      className={`w-6 h-6 text-primary transition-transform ${openFaqIndex === index ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-4 pb-4 bg-theme-tertiary/50">
                      <p className="text-secondary-light leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-theme-surface border border-primary/30 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3 text-white">Готові замовити?</h2>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto leading-relaxed">
              Оберіть смачні суші з нашого меню та насолоджуйтесь швидкою доставкою!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-white font-bold px-8 py-4 rounded-lg transition shadow-lg text-lg"
              >
                🍣 Перейти до меню
              </Link>
              <a
                href={`tel:${CONTACT_INFO.phone}`}
                className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary font-bold px-8 py-4 rounded-lg hover:bg-primary/10 transition"
              >
                <PhoneIcon className="w-5 h-5" />
                Зателефонувати
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
