import dynamicLoader from "next/dynamic";
import Header from "@/components/AppHeader";
import Hero from "@/components/Hero";
import Footer from "@/components/AppFooter";
// import CategoryFeed from "@/components/CategoryFeed";

import Stories from "@/components/Stories";
import PromoBanner from "@/components/PromoBanner";
import Promotions from "@/components/Promotions";

import apiClient from "@/lib/api/apiClient";
import { Category } from "@/lib/types";

import CategoryFeed from "@/components/CategoryFeed";

const ReviewsCarousel = dynamicLoader(() => import("@/components/ReviewsCarousel"), {
  loading: () => <div className="h-96 bg-surface-dark/50 animate-pulse" />,
});

// Force static generation for the homepage
export const dynamic = "force-static";

// Helper to fetch categories on server
async function getCategories() {
  try {
    const response = await apiClient.get("/categories");
    return response.data.filter((cat: Category) => cat.is_active);
  } catch (error) {
    console.error("Failed to fetch categories for SSG:", error);
    return [];
  }
}

export default async function Home() {
  const categories = await getCategories();

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
        <div>
          <PromoBanner />
        </div>
        <div>
          <Promotions />
        </div>
        <div>
          <CategoryFeed initialCategories={categories} />
        </div>
        <div>
          <ReviewsCarousel />
        </div>

        {/* SEO / About Section */}
        <section className="py-16 bg-[#1A1A1A] border-t border-white/5">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-6">Доставка Суші Львів - Croco Sushi</h3>
            <div className="space-y-4 text-gray-400 leading-relaxed text-sm md:text-base">
              <p>
                Ласкаво просимо до <strong className="text-white">Croco Sushi</strong>! Ви потрапили за адресою! Ми пропонуємо найсмачніші суші та роли у Львові з безкоштовною доставкою. Croco Sushi – це преміум доставка японської кухні, яка поєднує в собі високу якість, свіжість та бездоганний сервіс.
              </p>
              <p>
                Ми пропонуємо широкий асортимент страв: від класичних ролів Філадельфія та Каліфорнія до авторських ролів від нашого шеф-кухаря.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 text-left">
                <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                  <h4 className="text-primary font-bold mb-2">Свіжі інгредієнти</h4>
                  <p className="text-sm">Ми не використовуємо заморожену рибу. Тільки охолоджений лосось, свіжий тунець та добірні морепродукти.</p>
                </div>
                <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                  <h4 className="text-primary font-bold mb-2">Великі порції</h4>
                  <p className="text-sm">Ми не економимо на начинці. У наших ролах завжди багато риби та сиру.</p>
                </div>
                <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                  <h4 className="text-primary font-bold mb-2">Швидка доставка</h4>
                  <p className="text-sm">Наші кур&apos;єри знають місто як свої п&apos;ять пальців і доставлять ваше замовлення максимально швидко.</p>
                </div>
                <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                  <h4 className="text-primary font-bold mb-2">Програма лояльності</h4>
                  <p className="text-sm">Накопичуйте бонуси з кожного замовлення та оплачуйте ними до 50% вартості наступних покупок.</p>
                </div>
              </div>

              <p>
                Ми працюємо для вас щодня. Замовляйте суші на обід в офіс, на романтичну вечерю або на гучну вечірку з друзями.
                Наші сети суші стануть окрасою будь-якого столу.
              </p>
              <p>
                Оформіть замовлення онлайн на нашому сайті або зателефонуйте нам. Ми з радістю допоможемо вам з вибором.
                <strong className="text-white block mt-2">Croco Sushi – це смак, якому довіряють. Спробуйте і переконайтесь самі!</strong>
              </p>
            </div>

            {/* Hidden Keywords for SEO backup if needed, though visible text is better */}
            <p className="mt-8 text-xs text-gray-700">
              Доставка суші Львів, роли Львів, замовити суші Львів, суші додому, найсмачніші суші.
            </p>
          </div>
        </section>
      </main>
      <div className="mt-auto">
        <Footer />
      </div>
    </div >
  );
}


