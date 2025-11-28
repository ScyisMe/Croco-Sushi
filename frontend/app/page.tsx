import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import PopularProducts from "@/components/PopularProducts";
import Promotions from "@/components/Promotions";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Categories />
        <PopularProducts />
        <Promotions />
      </main>
      <Footer />
    </div>
  );
}
