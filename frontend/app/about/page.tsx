"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronRightIcon, HeartIcon, SparklesIcon, TruckIcon, ClockIcon, MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

// Переваги
const ADVANTAGES = [
  {
    icon: SparklesIcon,
    title: "Свіжі інгредієнти",
    description: "Використовуємо тільки найсвіжіші продукти від перевірених постачальників",
  },
  {
    icon: HeartIcon,
    title: "З любов'ю",
    description: "Кожну страву готуємо з душею та увагою до деталей",
  },
  {
    icon: TruckIcon,
    title: "Швидка доставка",
    description: "Доставляємо по Львову за 40-60 хвилин, щоб страви були гарячими",
  },
  {
    icon: ClockIcon,
    title: "Зручний графік",
    description: "Працюємо щодня з 10:00 до 21:45 для вашої зручності",
  },
];

// Контакти
const CONTACTS = {
  address: "м. Львів, вул. Володимира Янева, 31",
  addressUrl: "https://maps.app.goo.gl/zX2FmCwhEj8vN2JF9",
  phone: "+380980970003",
  phoneDisplay: "(098) 097-00-03",
  email: "crocosushi0003@gmail.com",
  workingHours: "10:00 - 21:45",
  telegram: "https://t.me/Croco_Sushi",
  instagram: "https://www.instagram.com/crocosushi/",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors">
      <Header />
      <main className="flex-grow">
        {/* Hero секція */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24 overflow-hidden">
          <div className="container mx-auto px-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm text-foreground-muted mb-8">
              <Link href="/" className="hover:text-primary transition">
                Головна
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2" />
              <span className="text-foreground">Про нас</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  🐊 Croco Sushi
                </h1>
                <p className="text-xl text-foreground-secondary mb-6 leading-relaxed">
                  Ласкаво просимо до <strong className="text-primary">Croco Sushi</strong> — 
                  вашого улюбленого місця для смачних суші та ролів у Львові!
                </p>
                <p className="text-foreground-secondary mb-8 leading-relaxed">
                  Ми — команда ентузіастів японської кухні, які прагнуть дарувати вам 
                  найкращі смакові враження. Наша місія — робити якісну японську кухню 
                  доступною для кожного.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/menu"
                    className="inline-flex items-center justify-center px-8 py-4 bg-primary hover:bg-primary-600 text-white font-bold rounded-xl transition"
                  >
                    🍣 Переглянути меню
                  </Link>
                  <a
                    href={`tel:${CONTACTS.phone}`}
                    className="inline-flex items-center justify-center px-8 py-4 bg-surface hover:bg-surface-hover text-foreground font-semibold rounded-xl border border-border transition"
                  >
                    📞 Зателефонувати
                  </a>
                </div>
              </div>

              {/* Зображення/ілюстрація */}
              <div className="relative">
                <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/20 to-accent-orange/20 rounded-3xl flex items-center justify-center">
                  <span className="text-[150px] md:text-[200px]">🐊</span>
                </div>
                {/* Декоративні елементи */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent-orange/10 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Наші переваги */}
        <section className="py-16 md:py-24 bg-surface">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
              Чому обирають нас?
            </h2>
            <p className="text-foreground-secondary text-center mb-12 max-w-2xl mx-auto">
              Ми робимо все, щоб кожне ваше замовлення було ідеальним
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ADVANTAGES.map((advantage, index) => (
                <div
                  key={index}
                  className="bg-background rounded-2xl p-6 border border-border hover:border-primary/50 transition group"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                    <advantage.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {advantage.title}
                  </h3>
                  <p className="text-foreground-secondary text-sm">
                    {advantage.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Наша історія */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Наша історія
              </h2>
              <div className="space-y-6 text-foreground-secondary leading-relaxed">
                <p>
                  Croco Sushi народився з простої ідеї — створити місце, де кожен 
                  зможе насолодитись автентичною японською кухнею без зайвих витрат.
                </p>
                <p>
                  Ми почали свій шлях у Львові, і з кожним днем наша сім'я 
                  задоволених клієнтів зростає. Ми пишаємось тим, що можемо 
                  дарувати вам смачні моменти кожного дня.
                </p>
                <p>
                  Наші кухарі постійно вдосконалюють свою майстерність та 
                  експериментують з новими рецептами, щоб дивувати вас 
                  новими смаками.
                </p>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-3 gap-8 mt-12">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    1000+
                  </div>
                  <div className="text-foreground-secondary text-sm">
                    Задоволених клієнтів
                  </div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    50+
                  </div>
                  <div className="text-foreground-secondary text-sm">
                    Страв у меню
                  </div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    4.8
                  </div>
                  <div className="text-foreground-secondary text-sm">
                    Середня оцінка
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Контакти */}
        <section className="py-16 md:py-24 bg-surface">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
              Зв'яжіться з нами
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Контактна інформація */}
              <div className="bg-background rounded-2xl p-8 border border-border">
                <h3 className="text-xl font-bold text-foreground mb-6">
                  📍 Контактна інформація
                </h3>
                <ul className="space-y-4">
                  <li>
                    <a
                      href={CONTACTS.addressUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 text-foreground-secondary hover:text-primary transition"
                    >
                      <MapPinIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <span>{CONTACTS.address}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href={`tel:${CONTACTS.phone}`}
                      className="flex items-center gap-3 text-foreground-secondary hover:text-primary transition"
                    >
                      <PhoneIcon className="w-6 h-6 flex-shrink-0" />
                      <span>{CONTACTS.phoneDisplay}</span>
                    </a>
                  </li>
                  <li className="flex items-center gap-3 text-foreground-secondary">
                    <ClockIcon className="w-6 h-6 flex-shrink-0" />
                    <span>Щодня: {CONTACTS.workingHours}</span>
                  </li>
                </ul>

                {/* Соціальні мережі */}
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-foreground-muted text-sm mb-4">Ми в соціальних мережах:</p>
                  <div className="flex gap-3">
                    <a
                      href={CONTACTS.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-surface hover:bg-primary hover:text-white flex items-center justify-center rounded-xl transition"
                      aria-label="Instagram"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    <a
                      href={CONTACTS.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-surface hover:bg-primary hover:text-white flex items-center justify-center rounded-xl transition"
                      aria-label="Telegram"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Карта */}
              <div className="bg-background rounded-2xl overflow-hidden border border-border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2573.8!2d24.0155!3d49.8089!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473ae7eb564c2c3f%3A0x9c4bc6e67f0bb7d0!2z0LLRg9C70LjRhtGPINCS0L7Qu9C-0LTQuNC80LjRgNCwINCv0L3QtdCy0LAsIDMxLCDQm9GM0LLRltCyLCDQm9GM0LLRltCy0YHRjNC60LAg0L7QsdC70LDRgdGC0YwsIDc5MDAw!5e0!3m2!1suk!2sua!4v1700000000000!5m2!1suk!2sua"
                  width="100%"
                  height="100%"
                  className="min-h-[300px] lg:min-h-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Карта розташування Croco Sushi"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA секція */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-primary-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Готові спробувати?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Замовте смачні суші та роли з доставкою прямо до вашого дому!
              Безкоштовна доставка від 1000 грн.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-primary font-bold text-lg rounded-xl hover:bg-gray-100 transition"
            >
              🍣 Замовити зараз
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}


