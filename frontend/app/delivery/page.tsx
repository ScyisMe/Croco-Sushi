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
  addressUrl: "https://maps.app.goo.gl/zX2FmCwhEj8vN2JF9",
  workingHours: "10:00 - 21:45",
  // Координати Croco Sushi для карт
  coordinates: {
    lat: 49.8089,
    lng: 24.0155,
  },
};

// FAQ питання
const FAQ_ITEMS = [
  {
    question: "Як довго чекати доставку?",
    answer:
      "Час доставки залежить від вашої зони: Центр — 40-60 хв, Околиці — 55-75 хв, Віддалені райони — 70-105 хв. Ці часи включають приготування та буферний запас на випадок заторів. У пікові години час може збільшитися.",
  },
  {
    question: "Яка мінімальна сума замовлення?",
    answer:
      "Мінімальна сума замовлення для доставки становить 200 грн. При замовленні від 1000 грн доставка безкоштовна!",
  },
  {
    question: "Чи можна замовити на певний час?",
    answer:
      "Так, ви можете зробити попереднє замовлення на зручний для вас час. Вкажіть бажаний час доставки в коментарі до замовлення або зателефонуйте нам.",
  },
  {
    question: "Що робити, якщо замовлення не прийшло вчасно?",
    answer:
      "Зв'яжіться з нами за телефоном, і ми з'ясуємо причину затримки та вирішимо питання. Ми цінуємо ваш час!",
  },
  {
    question: "Чи можна забрати замовлення самовивозом?",
    answer: `Так, ви можете забрати замовлення самостійно за адресою: ${CONTACT_INFO.address}. Вкажіть це при оформленні замовлення.`,
  },
  {
    question: "Які способи оплати ви приймаєте?",
    answer:
      "Ми приймаємо оплату готівкою кур'єру та карткою (термінал у кур'єра). Онлайн оплата скоро буде доступна!",
  },
  {
    question: "Чи є у вас акції та знижки?",
    answer:
      "Так! Слідкуйте за нашими акціями на сайті та в соціальних мережах. Ми регулярно проводимо акції та пропонуємо вигідні сети.",
  },
];

// Переваги доставки
const DELIVERY_FEATURES = [
  {
    icon: "🚀",
    title: "Швидка доставка",
    description: "Від 40 хвилин по центру",
  },
  {
    icon: "🎁",
    title: "Безкоштовна доставка",
    description: "Від 1000 ₴ по всіх зонах",
  },
  {
    icon: "🍣",
    title: "Свіжі страви",
    description: "Готуємо після замовлення",
  },
  {
    icon: "💳",
    title: "Зручна оплата",
    description: "Готівка або картка",
  },
];

export default function DeliveryPage() {
  const { t } = useTranslation();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Локалізовані переваги
  const LOCALIZED_FEATURES = [
    {
      icon: "🚀",
      title: t("delivery.fastDelivery"),
      description: t("delivery.fastDeliveryDesc"),
    },
    {
      icon: "🎁",
      title: t("delivery.freeDelivery"),
      description: t("delivery.freeDeliveryFromShort", { amount: "1000" }),
    },
    {
      icon: "🍣",
      title: t("delivery.freshDishes"),
      description: t("delivery.freshDishesDesc"),
    },
    {
      icon: "💳",
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
        <div className="bg-theme-surface border-b border-theme">
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
                  className="bg-theme-surface rounded-xl shadow-card p-6 text-center"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Умови доставки */}
            <div className="bg-theme-surface rounded-xl shadow-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TruckIcon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-secondary">{t("delivery.deliveryConditions")}</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-secondary" dangerouslySetInnerHTML={{ __html: t("delivery.deliveryToLviv") }} />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-secondary">
                      {t("delivery.minOrder")}: <strong className="text-primary">{t("delivery.minOrderValue")}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-secondary">
                      {t("delivery.freeDelivery")}: <strong className="text-primary">1000 ₴</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">4</span>
                  </div>
                  <div>
                    <p className="text-secondary">
                      {t("delivery.deliveryCost")}: <strong>90-300 ₴</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">5</span>
                  </div>
                  <div>
                    <p className="text-secondary">
                      {t("delivery.deliveryTime")}: <strong>40-105 {t("delivery.minutes")}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Графік роботи та оплата */}
            <div className="space-y-8">
              {/* Графік роботи */}
              <div className="bg-theme-surface rounded-xl shadow-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-secondary">{t("delivery.workingHours")}</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-secondary">{t("delivery.everyDay")}</span>
                    <span className="font-bold text-primary">{CONTACT_INFO.workingHours}</span>
                  </div>
                  <p className="text-sm text-secondary-light">
                    {t("delivery.lastOrder")}
                  </p>
                </div>
              </div>

              {/* Способи оплати */}
              <div className="bg-theme-surface rounded-xl shadow-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-secondary">{t("delivery.paymentMethods")}</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-theme-tertiary rounded-lg">
                    <span className="text-2xl">💵</span>
                    <span className="text-theme-secondary">{t("delivery.cashPayment")}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-theme-tertiary rounded-lg">
                    <span className="text-2xl">💳</span>
                    <span className="text-theme-secondary">{t("delivery.cardPaymentCourier")}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-theme-tertiary rounded-lg opacity-50">
                    <span className="text-2xl">🌐</span>
                    <span className="text-theme-secondary">{t("delivery.onlinePayment")}</span>
                    <span className="ml-auto text-xs text-theme-muted bg-theme-surface px-2 py-1 rounded border border-theme">
                      {t("delivery.comingSoon")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Зони доставки */}
          <div className="mt-8 bg-theme-surface rounded-xl shadow-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-secondary">{t("delivery.zones")}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Карта зон - центрована на Croco Sushi */}
              <div className="h-[450px] md:h-[500px] lg:h-[580px] bg-theme-tertiary rounded-xl overflow-hidden relative shadow-md">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d20646.884089392867!2d24.000500000000003!3d49.8089!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473ae7eb564c2c3f%3A0x9c4bc6e67f0bb7d0!2z0LLRg9C70LjRhtGPINCS0L7Qu9C-0LTQuNC80LjRgNCwINCv0L3QtdCy0LAsIDMxLCDQm9GM0LLRltCyLCDQm9GM0LLRltCy0YHRjNC60LAg0L7QsdC70LDRgdGC0YwsIDc5MDAw!5e0!3m2!1suk!2sua!4v1700000000000!5m2!1suk!2sua"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
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
                  className="absolute top-4 right-4 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm font-medium text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2 border border-gray-200 dark:border-gray-700"
                >
                  <MapPinIcon className="w-4 h-4" />
                  {t("delivery.viewLargerMap")}
                </a>

                {/* Легенда - внизу зліва, вище кнопок Google Maps */}
                <div className="absolute bottom-16 left-2 bg-white dark:bg-gray-900 rounded-lg p-2.5 shadow-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-1.5">{t("delivery.zones")}:</p>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      <span className="text-[11px] text-gray-700 dark:text-gray-200">{t("delivery.zone1")} - {t("delivery.zone1Time")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                      <span className="text-[11px] text-gray-700 dark:text-gray-200">{t("delivery.zone2")} - {t("delivery.zone2Time")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <span className="text-[11px] text-gray-700 dark:text-gray-200">{t("delivery.zone3")} - {t("delivery.zone3Time")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Список зон */}
              <div className="space-y-4">
                {/* Зона 1 - Центр */}
                <div className="p-4 border-2 border-green-500/30 bg-green-500/10 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="font-semibold text-foreground">{t("delivery.zone1")}</span>
                      <span className="text-xs text-foreground-muted">(5-8 км)</span>
                    </div>
                    <span className="font-bold text-green-500">{t("delivery.zone1Price")}</span>
                  </div>
                  <p className="text-sm text-foreground-secondary mb-1">
                    {t("delivery.zone1Desc")}
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {t("delivery.deliveryTime")}: {t("delivery.zone1Time")}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    🚗 {t("delivery.fastZone")} • ~15-25 {t("delivery.timeInRoad")}
                  </p>
                  <p className="text-xs text-green-500 font-medium mt-2">
                    ✓ {t("delivery.freeFrom")} 1000 ₴
                  </p>
                </div>

                {/* Зона 2 - Околиці */}
                <div className="p-4 border-2 border-yellow-500/30 bg-yellow-500/10 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="font-semibold text-foreground">{t("delivery.zone2")}</span>
                      <span className="text-xs text-foreground-muted">(10-15 км)</span>
                    </div>
                    <span className="font-bold text-yellow-500">{t("delivery.zone2Price")}</span>
                  </div>
                  <p className="text-sm text-foreground-secondary mb-1">
                    {t("delivery.zone2Desc")}
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {t("delivery.deliveryTime")}: {t("delivery.zone2Time")}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    🚗 {t("delivery.middleZone")} • ~25-40 {t("delivery.timeInRoad")}
                  </p>
                  <p className="text-xs text-yellow-500 font-medium mt-2">
                    ✓ {t("delivery.freeFrom")} 1000 ₴
                  </p>
                </div>

                {/* Зона 3 - Віддалені */}
                <div className="p-4 border-2 border-red-500/30 bg-red-500/10 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="font-semibold text-foreground">{t("delivery.zone3")}</span>
                      <span className="text-xs text-foreground-muted">(15-25+ км)</span>
                    </div>
                    <span className="font-bold text-red-500">{t("delivery.zone3Price")}</span>
                  </div>
                  <p className="text-sm text-foreground-secondary mb-1">
                    {t("delivery.zone3Desc")}
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {t("delivery.deliveryTime")}: {t("delivery.zone3Time")}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    🚗 {t("delivery.extendedZone")} • &gt;40 {t("delivery.timeInRoad")}
                  </p>
                  <p className="text-xs text-red-500 font-medium mt-2">
                    ✓ {t("delivery.freeFrom")} 1000 ₴
                  </p>
                </div>

                {/* Примітка про буфер */}
                <div className="p-3 bg-accent-blue/10 border-2 border-accent-blue/30 rounded-lg">
                  <p className="text-xs text-foreground-secondary">
                    💡 <strong className="text-foreground">{t("delivery.bufferNote")}</strong>
                  </p>
                </div>

                {/* Фактори ціноутворення */}
                <div className="p-3 bg-surface border border-border rounded-lg">
                  <p className="text-xs text-foreground-secondary">
                    📊 <strong className="text-foreground">{t("delivery.priceCalcNote")}</strong>
                  </p>
                </div>

                <p className="text-xs text-secondary-light text-center pt-2">
                  * {t("delivery.notInList")}
                </p>
              </div>
            </div>
          </div>

          {/* Адреса самовивозу */}
          <div className="mt-8 bg-theme-surface rounded-xl shadow-card p-6 md:p-8">
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
                
                {/* Переваги самовивозу */}
                <div className="mt-6 p-4 bg-primary/10 border-2 border-primary/30 rounded-xl">
                  <p className="text-sm font-semibold text-primary mb-2">
                    🎁 {t("delivery.pickupBonus")}
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    {t("delivery.pickupBonusDesc")}
                  </p>
                </div>
              </div>

              {/* Карта самовивозу - точне місце Croco Sushi */}
              <div className="h-[300px] md:h-[350px] bg-theme-tertiary rounded-xl overflow-hidden relative shadow-md">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1291.0!2d24.0155!3d49.8089!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473ae7eb564c2c3f%3A0x9c4bc6e67f0bb7d0!2z0LLRg9C70LjRhtGPINCS0L7Qu9C-0LTQuNC80LjRgNCwINCv0L3QtdCy0LAsIDMxLCDQm9GM0LLRltCyLCDQm9GM0LLRltCy0YHRjNC60LAg0L7QsdC70LDRgdGC0YwsIDc5MDAw!5e0!3m2!1suk!2sua!4v1700000000001!5m2!1suk!2sua"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t("delivery.pickupAddress")}
                />
                {/* Кнопка збільшення */}
                <a
                  href={CONTACT_INFO.addressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg shadow text-sm font-medium text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition border border-gray-200 dark:border-gray-700"
                >
                  {t("delivery.enlargeMap")}
                </a>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-8 bg-theme-surface rounded-xl shadow-card p-6 md:p-8">
            <h2 className="text-xl font-bold text-theme mb-6">
              {t("delivery.faq")}
            </h2>

            <div className="space-y-3">
              {LOCALIZED_FAQ.map((item, index) => (
                <div key={index} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-theme-secondary transition"
                  >
                    <span className="font-medium text-secondary">{item.question}</span>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-secondary-light transition-transform ${
                        openFaqIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-4 pb-4">
                      <p className="text-secondary-light">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 bg-primary rounded-xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">{t("delivery.readyToOrder")}</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              {t("delivery.readyToOrderDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 bg-theme-surface text-primary font-bold px-8 py-3 rounded-lg hover:bg-theme-secondary transition"
              >
                {t("delivery.goToMenu")}
              </Link>
              <a
                href={`tel:${CONTACT_INFO.phone}`}
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition"
              >
                <PhoneIcon className="w-5 h-5" />
                {t("delivery.callUs")}
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
