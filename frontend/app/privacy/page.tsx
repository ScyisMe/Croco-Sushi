"use client";

import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import { ChevronRightIcon, ShieldCheckIcon, LockClosedIcon, EyeIcon, TrashIcon, DocumentTextIcon, BellIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// Контактна інформація для політики конфіденційності
const COMPANY_INFO = {
  name: "Croco Sushi",
  legalName: "ФОП «Croco Sushi»",
  address: "м. Львів, вул. Володимира Янева, 31",
  email: "crocosushi0003@gmail.com",
  phone: "+380980970003",
  website: "https://crocosushi.com",
};

// Секції політики конфіденційності
const PRIVACY_SECTIONS = [
  {
    id: "general",
    icon: DocumentTextIcon,
    title: "1. Загальні положення",
    content: [
      `Ця Політика конфіденційності (далі – «Політика») визначає порядок збору, обробки, використання, зберігання та захисту персональних даних користувачів веб-сайту ${COMPANY_INFO.website} (далі – «Сайт»), що належить ${COMPANY_INFO.legalName}.`,
      "Використовуючи Сайт та/або залишаючи свої персональні дані, Ви надаєте згоду на обробку Ваших персональних даних відповідно до цієї Політики та чинного законодавства України.",
      "Якщо Ви не погоджуєтесь з умовами цієї Політики, просимо утриматись від використання Сайту.",
    ],
  },
  {
    id: "data-collected",
    icon: EyeIcon,
    title: "2. Які дані ми збираємо",
    content: [
      "**Персональні дані, які Ви надаєте добровільно:**",
      "• Ім'я та прізвище",
      "• Номер телефону",
      "• Електронна пошта (за бажанням)",
      "• Адреса доставки (вулиця, будинок, квартира, під'їзд, поверх)",
      "• Коментарі до замовлення",
      "",
      "**Дані, що збираються автоматично:**",
      "• IP-адреса",
      "• Тип браузера та операційної системи",
      "• Дата та час відвідування",
      "• Сторінки, які Ви переглядали",
      "• Дані cookies (за Вашої згоди)",
      "• Джерело переходу на Сайт",
    ],
  },
  {
    id: "purpose",
    icon: ShieldCheckIcon,
    title: "3. Мета обробки персональних даних",
    content: [
      "Ваші персональні дані обробляються виключно з наступними цілями:",
      "",
      "✓ **Виконання замовлення** — обробка, приготування та доставка Вашого замовлення",
      "✓ **Зв'язок з Вами** — підтвердження замовлення, уточнення деталей, інформування про статус",
      "✓ **Покращення сервісу** — аналіз уподобань для покращення якості обслуговування",
      "✓ **Програма лояльності** — нарахування бонусів та персональних пропозицій",
      "✓ **Маркетингові комунікації** — відправка акцій та спеціальних пропозицій (за Вашої окремої згоди)",
      "✓ **Виконання законодавчих вимог** — дотримання податкового та іншого законодавства",
    ],
  },
  {
    id: "legal-basis",
    icon: DocumentTextIcon,
    title: "4. Правова основа обробки даних",
    content: [
      "Обробка Ваших персональних даних здійснюється на підставі:",
      "",
      "• **Вашої згоди** — яку Ви надаєте при оформленні замовлення або реєстрації",
      "• **Виконання договору** — для надання послуг з доставки їжі",
      "• **Законних інтересів** — для забезпечення безпеки та покращення сервісу",
      "• **Виконання юридичних зобов'язань** — відповідно до законодавства України",
      "",
      "Правове регулювання: Закон України «Про захист персональних даних» від 01.06.2010 № 2297-VI.",
    ],
  },
  {
    id: "storage",
    icon: LockClosedIcon,
    title: "5. Зберігання та захист даних",
    content: [
      "**Термін зберігання:**",
      "• Дані замовлень — 3 роки з моменту останнього замовлення",
      "• Дані облікового запису — до видалення акаунту + 30 днів",
      "• Cookies — до 1 року або до видалення Вами",
      "",
      "**Заходи безпеки:**",
      "• SSL-шифрування всіх даних при передачі",
      "• Захищені сервери з обмеженим доступом",
      "• Регулярне резервне копіювання",
      "• Двофакторна автентифікація для адміністраторів",
      "• Політика обмеженого доступу (тільки уповноважені співробітники)",
    ],
  },
  {
    id: "sharing",
    icon: EyeIcon,
    title: "6. Передача даних третім особам",
    content: [
      "Ми можемо передавати Ваші дані наступним категоріям отримувачів:",
      "",
      "**Служби доставки** — тільки ім'я, адреса та телефон для доставки замовлення",
      "**Платіжні системи** — для обробки онлайн-платежів (ми НЕ зберігаємо дані карток)",
      "**Аналітичні сервіси** — анонімізовані дані для аналізу відвідуваності",
      "",
      "**Ми НЕ продаємо та НЕ передаємо Ваші персональні дані третім особам для маркетингових цілей.**",
      "",
      "Передача даних державним органам можлива лише на підставі офіційного запиту відповідно до законодавства України.",
    ],
  },
  {
    id: "cookies",
    icon: DocumentTextIcon,
    title: "7. Використання Cookies",
    content: [
      "Сайт використовує файли cookies для:",
      "",
      "• **Необхідні cookies** — для роботи кошика та авторизації",
      "• **Функціональні cookies** — збереження Ваших налаштувань (мова, адреса)",
      "• **Аналітичні cookies** — для аналізу відвідуваності сайту",
      "",
      "Ви можете відмовитись від cookies у налаштуваннях браузера, але це може обмежити функціональність Сайту.",
    ],
  },
  {
    id: "rights",
    icon: ShieldCheckIcon,
    title: "8. Ваші права",
    content: [
      "Відповідно до законодавства України, Ви маєте право:",
      "",
      "✓ **Право на доступ** — отримати інформацію про Ваші персональні дані",
      "✓ **Право на виправлення** — виправити неточні або застарілі дані",
      "✓ **Право на видалення** — вимагати видалення Ваших даних",
      "✓ **Право на обмеження обробки** — обмежити використання Ваших даних",
      "✓ **Право на заперечення** — відмовитись від маркетингових комунікацій",
      "✓ **Право на перенесення даних** — отримати Ваші дані у структурованому форматі",
      "",
      `Для реалізації своїх прав зверніться на email: ${COMPANY_INFO.email}`,
    ],
  },
  {
    id: "deletion",
    icon: TrashIcon,
    title: "9. Видалення даних",
    content: [
      "Ви можете видалити свої персональні дані наступними способами:",
      "",
      "1. **Через особистий кабінет** — видалити акаунт у розділі «Профіль»",
      `2. **Через email** — надіслати запит на ${COMPANY_INFO.email} з темою «Видалення даних»`,
      `3. **За телефоном** — зателефонувати на ${COMPANY_INFO.phone}`,
      "",
      "Ми обробимо Ваш запит протягом 30 днів. Деякі дані можуть зберігатись довше для виконання юридичних зобов'язань (наприклад, дані про фінансові транзакції).",
    ],
  },
  {
    id: "children",
    icon: ShieldCheckIcon,
    title: "10. Захист даних дітей",
    content: [
      "Сайт не призначений для осіб молодше 16 років. Ми свідомо не збираємо персональні дані дітей.",
      "",
      "Якщо Ви вважаєте, що ми випадково зібрали дані неповнолітньої особи, негайно повідомте нас, і ми видалимо ці дані.",
    ],
  },
  {
    id: "changes",
    icon: BellIcon,
    title: "11. Зміни до Політики",
    content: [
      "Ми можемо оновлювати цю Політику конфіденційності. Про суттєві зміни Ви будете повідомлені через:",
      "",
      "• Сповіщення на Сайті",
      "• Email-повідомлення (якщо Ви зареєстровані)",
      "",
      "Рекомендуємо періодично переглядати цю сторінку для ознайомлення з актуальною версією.",
      "",
      "**Дата останнього оновлення:** " + new Date().toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" }),
    ],
  },
  {
    id: "contact",
    icon: DocumentTextIcon,
    title: "12. Контактна інформація",
    content: [
      "Якщо у Вас є запитання щодо цієї Політики або обробки Ваших персональних даних, зв'яжіться з нами:",
      "",
      `**${COMPANY_INFO.legalName}**`,
      `📍 Адреса: ${COMPANY_INFO.address}`,
      `📧 Email: ${COMPANY_INFO.email}`,
      `📞 Телефон: ${COMPANY_INFO.phone}`,
      "",
      "Ми відповімо на Ваш запит протягом 5 робочих днів.",
    ],
  },
];

export default function PrivacyPage() {
  // Функція для рендерингу контенту з підтримкою markdown-подібного форматування
  const renderContent = (text: string) => {
    if (text === "") return <br />;

    // Заміна **text** на жирний текст
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors">
      <Header />
      <main className="flex-grow">
        {/* Hero секція */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm text-foreground-muted mb-6">
              <Link href="/" className="hover:text-primary transition">
                Головна
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2" />
              <span className="text-foreground">Політика конфіденційності</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <ShieldCheckIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Політика конфіденційності
                </h1>
                <p className="text-foreground-secondary mt-1">
                  Захист Ваших персональних даних — наш пріоритет
                </p>
              </div>
            </div>

            {/* Швидка навігація */}
            <div className="mt-8 p-4 bg-surface rounded-xl border border-border">
              <p className="text-sm font-medium text-foreground mb-3">📋 Швидка навігація:</p>
              <div className="flex flex-wrap gap-2">
                {PRIVACY_SECTIONS.slice(0, 6).map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-xs px-3 py-1.5 bg-background hover:bg-primary/10 text-foreground-secondary hover:text-primary rounded-full transition"
                  >
                    {section.title.replace(/^\d+\.\s*/, "")}
                  </a>
                ))}
                <span className="text-xs px-3 py-1.5 text-foreground-muted">
                  +{PRIVACY_SECTIONS.length - 6} розділів
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Основний контент */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              {PRIVACY_SECTIONS.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="bg-surface rounded-2xl border border-border p-6 md:p-8 scroll-mt-24"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  <div className="pl-0 md:pl-14 space-y-3">
                    {section.content.map((paragraph, index) => (
                      <p key={index} className="text-foreground-secondary leading-relaxed">
                        {renderContent(paragraph)}
                      </p>
                    ))}
                  </div>
                </article>
              ))}

              {/* Блок з важливою інформацією */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <LockClosedIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      🔒 Наші зобов&apos;язання щодо безпеки
                    </h3>
                    <p className="text-foreground-secondary mb-4">
                      Ми серйозно ставимось до захисту Ваших персональних даних і гарантуємо:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-foreground-secondary">
                        <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary">✓</span>
                        Ваші дані ніколи не будуть продані третім особам
                      </li>
                      <li className="flex items-center gap-2 text-foreground-secondary">
                        <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary">✓</span>
                        SSL-шифрування на всіх сторінках сайту
                      </li>
                      <li className="flex items-center gap-2 text-foreground-secondary">
                        <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary">✓</span>
                        Ми НЕ зберігаємо дані банківських карток
                      </li>
                      <li className="flex items-center gap-2 text-foreground-secondary">
                        <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary">✓</span>
                        Ви можете видалити свої дані в будь-який момент
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CTA блок */}
              <div className="text-center py-8">
                <p className="text-foreground-muted mb-4">
                  Залишились питання? Ми завжди готові допомогти!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={`mailto:${COMPANY_INFO.email}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-600 text-white font-semibold rounded-xl transition"
                  >
                    📧 Написати на email
                  </a>
                  <a
                    href={`tel:${COMPANY_INFO.phone}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface hover:bg-surface-hover text-foreground font-semibold rounded-xl border border-border transition"
                  >
                    📞 Зателефонувати
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}



