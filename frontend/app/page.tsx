import dynamic from "next/dynamic";
import Header from "@/components/AppHeader";
import Hero from "@/components/Hero";
import Footer from "@/components/AppFooter";
import CategoryFeed from "@/components/CategoryFeed";

import Stories from "@/components/Stories";
import PromoBanner from "@/components/PromoBanner";

const ReviewsCarousel = dynamic(() => import("@/components/ReviewsCarousel"), {
  loading: () => <div className="h-96 bg-surface-dark/50 animate-pulse" />,
});
const Promotions = dynamic(() => import("@/components/Promotions"), {
  loading: () => <div className="h-96 bg-surface-dark/50 animate-pulse" />,
});

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
        <PromoBanner />
        <Promotions />
        <CategoryFeed />
        <ReviewsCarousel />
      </main>
      <Footer />
    </div >
  );
}


