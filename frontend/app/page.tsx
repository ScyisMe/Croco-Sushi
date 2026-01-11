import dynamicLoader from "next/dynamic";
import Header from "@/components/AppHeader";
import Hero from "@/components/Hero";
import Footer from "@/components/AppFooter";
// import CategoryFeed from "@/components/CategoryFeed";

// import Stories from "@/components/Stories";
// import PromoBanner from "@/components/PromoBanner";
const Stories = dynamicLoader(() => import("@/components/Stories"), {
  loading: () => <div className="h-24 bg-surface-dark/50 animate-pulse" />,
});
const PromoBanner = dynamicLoader(() => import("@/components/PromoBanner"), {
  loading: () => <div className="h-64 bg-surface-dark/50 animate-pulse" />,
});

const ReviewsCarousel = dynamicLoader(() => import("@/components/ReviewsCarousel"), {
  loading: () => <div className="h-96 bg-surface-dark/50 animate-pulse" />,
});
const Promotions = dynamicLoader(() => import("@/components/Promotions"), {
  loading: () => <div className="h-96 bg-surface-dark/50 animate-pulse" />,
});

const CategoryFeed = dynamicLoader(() => import("@/components/CategoryFeed"), {
  loading: () => (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-6">
          <div className="h-8 w-48 bg-surface-card rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-80 bg-surface-card rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
});

// Force static generation for the homepage
export const dynamic = "force-static";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        {/* Mobile Stories */}
        <div className="md:hidden">
          <Stories />
        </div>
        <h2 className="sr-only">Актуальні пропозиції</h2>
        <div className="content-auto">
          <PromoBanner />
        </div>
        <div className="content-auto">
          <Promotions />
        </div>
        <div className="content-auto">
          <CategoryFeed />
        </div>
        <div className="content-auto">
          <ReviewsCarousel />
        </div>

        <div className="sr-only">
          <h3>Доставка Суші Львів - Croco Sushi</h3>
          <p>
            Ласкаво просимо до Croco Sushi! Ми пропонуємо найсмачніші суші та роли у Львові з безкоштовною доставкою.рапили за адресою! Croco Sushi – це преміум доставка японської кухні, яка поєднує в собі високу якість, свіжість та бездоганний сервіс.
            Ми пропонуємо широкий асортимент страв: від класичних ролів Філадельфія та Каліфорнія до авторських ролів від нашого шеф-кухаря.

            Чому обирають Croco Sushi:
            - Свіжі інгредієнти: ми не використовуємо заморожену рибу. Тільки охолоджений лосось, свіжий тунець та добірні морепродукти.
            - Великі порції: ми не економимо на начинці. У наших ролах завжди багато риби та сиру.
            - Швидка доставка: наші кур&apos;єри знають місто як свої п&apos;ять пальців і доставлять ваше замовлення максимально швидко.
            - Безкоштовна доставка: при замовленні від 1000 грн доставка за наш рахунок.
            - Програма лояльності: накопичуйте бонуси з кожного замовлення та оплачуйте ними до 50% вартості наступних покупок.

            Ми працюємо для вас щодня. Замовляйте суші на обід в офіс, на романтичну вечерю або на гучну вечірку з друзями.
            Наші сети суші стануть окрасою будь-якого столу.
            Оформіть замовлення онлайн на нашому сайті або зателефонуйте нам. Ми з радістю допоможемо вам з вибором.
            Croco Sushi – це смак, якому довіряють. Спробуйте і переконайтесь самі!
            Доставка суші Львів, роли Львів, замовити суші Львів, суші додому, найсмачніші суші.
          </p>
        </div>
      </main>
      <div className="content-auto">
        <Footer />
      </div>
    </div >
  );
}


