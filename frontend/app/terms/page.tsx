"use client";

import { useTranslation } from "@/store/localeStore";
import Image from "next/image";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import { ChevronRightIcon, DocumentTextIcon, ShoppingCartIcon, TruckIcon, CreditCardIcon, ExclamationTriangleIcon, ScaleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// Контактна інформація
const COMPANY_INFO = {
  name: "Croco Sushi",
  legalName: "ФОП «Croco Sushi»",
  address: "м. Львів, вул. Володимира Янева, 31",
  email: "crocosushi0003@gmail.com",
  phone: "+380980970003",
  workingHours: "10:00 - 21:45",
};

// Секції публічної оферти
const TERMS_SECTIONS = [
  {
    id: "general",
    icon: DocumentTextIcon,
    title: "1. Загальні положення оферти",
    content: [
      `1.1. Ця публічна оферта (далі – «Договір») є офіційною пропозицією ${COMPANY_INFO.legalName} (далі – «Виконавець») укласти договір про надання послуг громадського харчування та доставки їжі.`,
      "1.2. Відповідно до ст. 633, 641 Цивільного кодексу України, ця оферта є публічною пропозицією (публічним договором).",
      "1.3. Акцептом (прийняттям) цієї оферти є оформлення замовлення на сайті, по телефону або через месенджери.",
      "1.4. Договір вважається укладеним з моменту отримання Виконавцем підтвердження замовлення від Замовника.",
    ],
  },
  {
    id: "definitions",
    icon: DocumentTextIcon,
    title: "2. Терміни та визначення",
    content: [
      "**Виконавець** — " + COMPANY_INFO.legalName + ", що надає послуги з приготування та доставки їжі.",
      "**Замовник** — фізична особа, яка здійснює замовлення на сайті або іншим чином.",
      "**Замовлення** — належним чином оформлений запит Замовника на придбання товарів та/або послуг.",
      "**Товар** — страви та напої, представлені в меню на сайті.",
      "**Сайт** — веб-сайт за адресою crocosushi.com",
    ],
  },
  {
    id: "order",
    icon: ShoppingCartIcon,
    title: "3. Оформлення замовлення",
    content: [
      "3.1. Замовлення можна оформити:",
      "• На сайті crocosushi.com",
      `• За телефоном ${COMPANY_INFO.phone}`,
      "• Через Telegram або Instagram",
      "",
      "3.2. При оформленні замовлення Замовник зобов'язаний надати:",
      "• Контактний номер телефону",
      "• Адресу доставки (для доставки)",
      "• Перелік обраних товарів",
      "",
      "3.3. Замовлення вважається прийнятим після підтвердження оператором.",
      "3.4. Мінімальна сума замовлення для доставки — 200 грн.",
      "3.5. Замовлення приймаються щодня з 10:00 до 21:45.",
    ],
  },
  {
    id: "delivery",
    icon: TruckIcon,
    title: "4. Доставка",
    content: [
      "4.1. Доставка здійснюється по м. Львів та околицях.",
      "",
      "4.2. **Час доставки:**",
      "• Центр міста: 40-60 хвилин",
      "• Околиці: 55-75 хвилин",
      "• Віддалені райони: 70-105 хвилин",
      "",
      "4.3. **Вартість доставки:**",
      "• Безкоштовна при замовленні від 1000 грн",
      "• Центр: 90-130 грн",
      "• Околиці: 140-200 грн",
      "• Віддалені райони: 220-300 грн",
      "",
      "4.4. Час доставки може змінюватися залежно від:",
      "• Завантаженості закладу",
      "• Погодних умов",
      "• Дорожньої ситуації",
      "",
      "4.5. Замовник зобов'язаний забезпечити можливість прийняття замовлення за вказаною адресою.",
    ],
  },
  {
    id: "payment",
    icon: CreditCardIcon,
    title: "5. Оплата",
    content: [
      "5.1. Способи оплати:",
      "• Готівкою при отриманні",
      "• Банківською карткою при отриманні",
      "• Онлайн-оплата на сайті (Visa, MasterCard)",
      "",
      "5.2. Ціни на сайті вказані в гривнях (UAH) та є остаточними.",
      "5.3. Виконавець залишає за собою право змінювати ціни без попереднього повідомлення.",
      "5.4. Ціна замовлення фіксується на момент його підтвердження.",
    ],
  },
  {
    id: "quality",
    icon: DocumentTextIcon,
    title: "6. Якість товару",
    content: [
      "6.1. Виконавець гарантує:",
      "• Відповідність страв санітарним нормам",
      "• Свіжість інгредієнтів",
      "• Дотримання технології приготування",
      "",
      "6.2. Термін придатності готових страв — 3 години з моменту приготування.",
      "6.3. Рекомендується споживати страви одразу після отримання.",
      "6.4. При отриманні Замовник має право перевірити комплектність та зовнішній вигляд замовлення.",
    ],
  },
  {
    id: "returns",
    icon: ExclamationTriangleIcon,
    title: "7. Повернення та обмін",
    content: [
      "7.1. Повернення коштів або заміна товару можливі у випадках:",
      "• Невідповідність замовленню",
      "• Неналежна якість товару",
      "• Порушення цілісності упаковки",
      "",
      "7.2. Для повернення необхідно:",
      "• Зателефонувати протягом 30 хвилин після отримання",
      "• Описати проблему та надати фото (за необхідності)",
      "",
      "7.3. **Повернення НЕ здійснюється:**",
      "• Якщо страва була частково або повністю спожита",
      "• Якщо пройшло більше 30 хвилин після отримання",
      "• При відмові без поважної причини",
      "",
      "7.4. Рішення про повернення/заміну приймається протягом 24 годин.",
    ],
  },
  {
    id: "cancellation",
    icon: ExclamationTriangleIcon,
    title: "8. Скасування замовлення",
    content: [
      "8.1. Замовник може скасувати замовлення:",
      "• До початку приготування — без штрафних санкцій",
      "• Під час приготування — оплата 50% вартості",
      "• Після приготування — оплата 100% вартості",
      "",
      "8.2. Виконавець може скасувати замовлення у випадках:",
      "• Недоступність інгредієнтів",
      "• Неможливість зв'язатися з Замовником",
      "• Форс-мажорні обставини",
      "",
      "8.3. При скасуванні з боку Виконавця кошти повертаються в повному обсязі.",
    ],
  },
  {
    id: "responsibility",
    icon: ScaleIcon,
    title: "9. Відповідальність сторін",
    content: [
      "9.1. **Виконавець відповідає за:**",
      "• Якість приготованих страв",
      "• Відповідність замовлення",
      "• Дотримання санітарних норм",
      "",
      "9.2. **Виконавець НЕ несе відповідальності за:**",
      "• Затримку доставки через форс-мажор",
      "• Неправильно вказану адресу/телефон",
      "• Відсутність Замовника за вказаною адресою",
      "• Алергічні реакції (інформація про алергени надається за запитом)",
      "",
      "9.3. **Замовник відповідає за:**",
      "• Достовірність наданих даних",
      "• Своєчасне прийняття замовлення",
    ],
  },
  {
    id: "force-majeure",
    icon: ExclamationTriangleIcon,
    title: "10. Форс-мажор",
    content: [
      "10.1. Сторони звільняються від відповідальності за невиконання зобов'язань у випадку:",
      "• Стихійних лих",
      "• Війни або воєнних дій",
      "• Надзвичайних ситуацій",
      "• Відключення електроенергії",
      "• Інших обставин непереборної сили",
      "",
      "10.2. При настанні форс-мажору Виконавець повідомляє Замовника та пропонує альтернативні варіанти.",
    ],
  },
  {
    id: "disputes",
    icon: ScaleIcon,
    title: "11. Вирішення спорів",
    content: [
      "11.1. Всі спори вирішуються шляхом переговорів.",
      "11.2. При неможливості досягти згоди — у судовому порядку відповідно до законодавства України.",
      `11.3. Для вирішення спірних питань звертайтесь: ${COMPANY_INFO.email}`,
    ],
  },
  {
    id: "final",
    icon: DocumentTextIcon,
    title: "12. Прикінцеві положення",
    content: [
      "12.1. Ця оферта набирає чинності з моменту публікації на сайті.",
      "12.2. Виконавець залишає за собою право змінювати умови оферти.",
      "12.3. Актуальна версія завжди доступна на сайті.",
      "12.4. Використання сайту означає повну згоду з умовами цієї оферти.",
      "",
      "**Дата публікації:** " + new Date().toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" }),
    ],
  },
];

export default function TermsPage() {
  const { t } = useTranslation();
  const renderContent = (text: string) => {
    if (text === "") return <br />;

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
        <section className="bg-gradient-to-br from-accent-orange/10 via-background to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm text-foreground-muted mb-6">
              <Link href="/" className="hover:text-primary transition">
                Головна
              </Link>
              <ChevronRightIcon className="w-4 h-4 mx-2" />
              <span className="text-foreground">Публічна оферта</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-accent-orange/10 rounded-2xl flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-accent-orange" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Публічна оферта
                </h1>
                <p className="text-foreground-secondary mt-1">
                  Договір про надання послуг доставки їжі
                </p>
              </div>
            </div>

            {/* Інформаційний блок */}
            <div className="mt-8 p-4 bg-surface rounded-xl border border-border">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-foreground-secondary">
                    📋 Оформлюючи замовлення, Ви погоджуєтесь з умовами цього договору
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/privacy"
                    className="text-xs px-3 py-1.5 bg-background hover:bg-primary/10 text-foreground-secondary hover:text-primary rounded-full transition"
                  >
                    Політика конфіденційності
                  </Link>
                  <Link
                    href="/delivery"
                    className="text-xs px-3 py-1.5 bg-background hover:bg-primary/10 text-foreground-secondary hover:text-primary rounded-full transition"
                  >
                    Умови доставки
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Основний контент */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              {TERMS_SECTIONS.map((section) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="bg-surface rounded-2xl border border-border p-6 md:p-8 scroll-mt-24"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 bg-accent-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <section.icon className="w-5 h-5 text-accent-orange" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">
                      {section.title}
                    </h3>
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

              {/* Контактний блок */}
              <div className="bg-accent-orange/5 border border-accent-orange/20 rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  📞 Контактна інформація
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-foreground-secondary">
                  <div>
                    <p className="font-medium text-foreground">{COMPANY_INFO.legalName}</p>
                    <p>📍 {COMPANY_INFO.address}</p>
                  </div>
                  <div>
                    <p>📧 {COMPANY_INFO.email}</p>
                    <p>📞 {COMPANY_INFO.phone}</p>
                    <p>🕐 Щодня: {COMPANY_INFO.workingHours}</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-12 text-center">
                <Link href="/menu" className="btn-primary inline-flex items-center gap-2">
                  <div className="relative w-5 h-5">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      fill
                      className="object-contain brightness-0 invert"
                    />
                  </div>
                  {t("common.backToMenu")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}



