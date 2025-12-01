import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategorySlider from "@/components/CategorySlider";
import PopularProducts from "@/components/PopularProducts";
import Footer from "@/components/Footer";

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
        <CategorySlider />
        <PopularProducts />
        <Promotions />
        <ReviewsCarousel />
      </main>
      <Footer />
    </div >
  );
}

