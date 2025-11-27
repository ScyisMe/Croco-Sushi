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

// Контактна інформація
const CONTACT_INFO = {
  phone: "+380980970003",
  phoneDisplay: "(098) 097-00-03",
  address: "м. Львів, вул. Володимира Янева, 31",
  workingHours: "10:00 - 21:45",
};

// FAQ питання
const FAQ_ITEMS = [
  {
    question: "Як довго чекати доставку?",
    answer:
      "Середній час доставки становить 45-60 хвилин. У пікові години (вечірні, вихідні) час може збільшитися до 90 хвилин. Ми завжди намагаємося доставити ваше замовлення якнайшвидше!",
  },
  {
    question: "Яка мінімальна сума замовлення?",
    answer:
      "Мінімальна сума замовлення для доставки становить 200 грн. При замовленні від 500 грн доставка безкоштовна!",
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
    description: "Доставляємо від 30 хвилин",
  },
  {
    icon: "🎁",
    title: "Безкоштовно від 500 ₴",
    description: "Економте на доставці",
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
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Schema.org markup для SEO */}
      <JsonLd schema={getLocalBusinessSchema()} />
      <JsonLd
        schema={getFAQSchema(
          FAQ_ITEMS.map((item) => ({
            question: item.question,
            answer: item.answer,
          }))
        )}
      />
      <JsonLd
        schema={getBreadcrumbSchema([
          { name: "Головна", url: BUSINESS_INFO.url },
          { name: "Доставка та оплата", url: `${BUSINESS_INFO.url}/delivery` },
        ])}
      />
      
      <Header />

      <main className="flex-grow">
        {/* Хлібні крихти */}
        <div className="bg-white border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center text-sm">
              <Link href="/" className="text-secondary-light hover:text-primary transition">
                Головна
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2 text-secondary-light" />
              <span className="text-secondary font-medium">Доставка та оплата</span>
            </nav>
          </div>
        </div>

        {/* Hero секція */}
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Доставка та оплата</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Швидка доставка смачних суші прямо до ваших дверей. Працюємо щодня!
            </p>
          </div>
        </section>

        {/* Переваги */}
        <section className="py-12 -mt-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DELIVERY_FEATURES.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-card p-6 text-center"
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
            <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TruckIcon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-secondary">Умови доставки</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-secondary">
                      Доставка здійснюється по <strong>Львову та околицях</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-secondary">
                      Мінімальна сума замовлення: <strong className="text-primary">200 ₴</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-secondary">
                      Безкоштовна доставка від <strong className="text-primary">500 ₴</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">4</span>
                  </div>
                  <div>
                    <p className="text-secondary">
                      Вартість платної доставки: <strong>50 ₴</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm font-bold">5</span>
                  </div>
                  <div>
                    <p className="text-secondary">
                      Середній час доставки: <strong>45-60 хвилин</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Графік роботи та оплата */}
            <div className="space-y-8">
              {/* Графік роботи */}
              <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-secondary">Графік роботи</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-secondary">Понеділок - Неділя</span>
                    <span className="font-bold text-primary">{CONTACT_INFO.workingHours}</span>
                  </div>
                  <p className="text-sm text-secondary-light">
                    Приймаємо замовлення щодня. Останнє замовлення приймається за 45 хвилин до закриття.
                  </p>
                </div>
              </div>

              {/* Способи оплати */}
              <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-secondary">Способи оплати</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">💵</span>
                    <span className="text-secondary">Готівкою кур'єру</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">💳</span>
                    <span className="text-secondary">Карткою кур'єру (термінал)</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-50">
                    <span className="text-2xl">🌐</span>
                    <span className="text-secondary">Онлайн оплата</span>
                    <span className="ml-auto text-xs text-secondary-light bg-gray-200 px-2 py-1 rounded">
                      Скоро
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Зони доставки */}
          <div className="mt-8 bg-white rounded-xl shadow-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-secondary">Зони доставки</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Карта зон */}
              <div className="h-80 bg-gray-100 rounded-xl overflow-hidden relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d41177.76236547741!2d23.9770856!3d49.8427392!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473add7c09109a57%3A0x4223c517012378e2!2z0JvRjNCy0ZbQsiwg0JvRjNCy0ZbQstGB0YzQutCwINC-0LHQu9Cw0YHRgtGMLCA3OTAwMA!5e0!3m2!1suk!2sua!4v1700000000000!5m2!1suk!2sua"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Карта зон доставки"
                />
                {/* Легенда */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <p className="text-xs font-semibold text-secondary mb-2">Зони доставки:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-secondary">Центр - 30-45 хв</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-xs text-secondary">Околиці - 45-60 хв</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-xs text-secondary">Віддалені - 60-90 хв</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Список зон */}
              <div className="space-y-4">
                {/* Зона 1 */}
                <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="font-semibold text-secondary">Центр Львова</span>
                    </div>
                    <span className="font-bold text-green-600">50 ₴</span>
                  </div>
                  <p className="text-sm text-secondary-light">
                    Площа Ринок, Личаківська, Франка, Городоцька та прилеглі вулиці. Час доставки: 30-45 хв.
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Безкоштовно від 500 ₴
                  </p>
                </div>

                {/* Зона 2 */}
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="font-semibold text-secondary">Околиці</span>
                    </div>
                    <span className="font-bold text-yellow-600">70 ₴</span>
                  </div>
                  <p className="text-sm text-secondary-light">
                    Сихів, Рясне, Левандівка, Новий Львів. Час доставки: 45-60 хв.
                  </p>
                  <p className="text-xs text-yellow-600 mt-2">
                    ✓ Безкоштовно від 700 ₴
                  </p>
                </div>

                {/* Зона 3 */}
                <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="font-semibold text-secondary">Віддалені райони</span>
                    </div>
                    <span className="font-bold text-orange-600">100 ₴</span>
                  </div>
                  <p className="text-sm text-secondary-light">
                    Брюховичі, Винники, Рудно, Малехів. Час доставки: 60-90 хв.
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    ✓ Безкоштовно від 1000 ₴
                  </p>
                </div>

                <p className="text-xs text-secondary-light text-center pt-2">
                  * Якщо ваш район не вказано, зателефонуйте нам — ми уточнимо умови доставки
                </p>
              </div>
            </div>
          </div>

          {/* Адреса самовивозу */}
          <div className="mt-8 bg-white rounded-xl shadow-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <MapPinIcon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-secondary">Самовивіз</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-secondary mb-4">
                  Ви можете забрати замовлення самостійно за адресою:
                </p>
                <p className="text-lg font-semibold text-secondary mb-2">
                  📍 {CONTACT_INFO.address}
                </p>
                <p className="text-secondary-light mb-4">
                  Графік роботи: {CONTACT_INFO.workingHours}
                </p>
                <a
                  href={`tel:${CONTACT_INFO.phone}`}
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <PhoneIcon className="w-5 h-5" />
                  {CONTACT_INFO.phoneDisplay}
                </a>
                
                {/* Переваги самовивозу */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-semibold text-green-800 mb-2">
                    🎁 Бонус за самовивіз
                  </p>
                  <p className="text-sm text-green-700">
                    При самовивозі отримуйте додатково +5% бонусних балів на ваш рахунок!
                  </p>
                </div>
              </div>

              {/* Карта */}
              <div className="h-64 bg-gray-100 rounded-xl overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2573.5!2d24.0!3d49.85!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDnCsDUxJzAwLjAiTiAyNMKwMDAnMDAuMCJF!5e0!3m2!1suk!2sua!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Карта"
                />
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-8 bg-white rounded-xl shadow-card p-6 md:p-8">
            <h2 className="text-xl font-bold text-secondary mb-6">
              Часті питання
            </h2>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, index) => (
                <div key={index} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
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
            <h2 className="text-2xl font-bold mb-4">Готові замовити?</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Оберіть смачні суші з нашого меню та насолоджуйтесь швидкою доставкою!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition"
              >
                Перейти до меню
              </Link>
              <a
                href={`tel:${CONTACT_INFO.phone}`}
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition"
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
