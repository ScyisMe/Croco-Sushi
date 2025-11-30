import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategorySlider from "@/components/CategorySlider";
import PopularProducts from "@/components/PopularProducts";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import Promotions from "@/components/Promotions";
import Footer from "@/components/Footer";

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

