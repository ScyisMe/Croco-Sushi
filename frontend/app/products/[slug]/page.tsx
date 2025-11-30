"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  PlusIcon,
  MinusIcon,
  HeartIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  TruckIcon,
  ClockIcon,
  FireIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import apiClient from "@/lib/api/client";
import { Product, ProductSize } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { useTranslation } from "@/store/localeStore";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toast from "react-hot-toast";

export default function ProductPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const addItem = useCartStore((state) => state.addItem);

  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch product data
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${slug}`);
      return response.data;
    },
  });

  // Set initial size when product loads
  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product]);

  // Check favorite status
  useEffect(() => {
    const checkFavorite = async () => {
      if (product) {
        try {
          const response = await apiClient.get("/users/me/favorites");
          const favorites = response.data;
          setIsFavorite(favorites.some((f: any) => f.product_id === product.id));
        } catch (e) {
          // Ignore error if not logged in
        }
      }
    };
    checkFavorite();
  }, [product]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const price = selectedSize ? Number(selectedSize.price) : Number(product.price);

    addItem({
      id: product.id,
      name: product.name,
      price: price,
      image_url: product.image_url,
      size: selectedSize?.name,
      sizeId: selectedSize?.id,
      quantity: quantity,
    });

    toast.success(`${product.name} додано в кошик`);
  };

  const toggleFavorite = async () => {
    if (!product) return;

    try {
      if (isFavorite) {
        await apiClient.delete(`/users/me/favorites/${product.id}`);
        setIsFavorite(false);
        toast.success("Видалено з обраного");
      } else {
        await apiClient.post(`/users/me/favorites/${product.id}`);
        setIsFavorite(true);
        toast.success("Додано в обране");
      }
    } catch (e) {
      toast.error("Потрібно увійти в акаунт");
      router.push("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-theme-secondary flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Товар не знайдено</h1>
        <Link href="/menu">
          <Button>Повернутись до меню</Button>
        </Link>
      </div>
    );
  }

  const currentPrice = selectedSize ? Number(selectedSize.price) : Number(product.price);
  const currentWeight = selectedSize ? selectedSize.weight : product.weight;

  return (
    <div className="min-h-screen bg-theme-secondary flex flex-col">
      <Header />

      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-primary transition-colors">Головна</Link>
            <span>/</span>
            <Link href="/menu" className="hover:text-primary transition-colors">Меню</Link>
            <span>/</span>
            <span className="text-white">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Image Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative aspect-square rounded-3xl overflow-hidden glass-card p-2"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-surface-card flex items-center justify-center">
                    <span className="text-8xl">🍣</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.is_new && (
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-sm font-bold shadow-lg">
                      Новинка
                    </span>
                  )}
                  {product.is_popular && (
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-white text-sm font-bold shadow-lg">
                      Хіт
                    </span>
                  )}
                  {product.is_promotion && (
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-400 to-rose-600 text-white text-sm font-bold shadow-lg">
                      Акція
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Info Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
                  {product.name}
                </h1>
                <p className="text-lg text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-3">Розмір порції:</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-xl border transition-all ${selectedSize?.id === size.id
                            ? "bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/25"
                            : "bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                          }`}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Actions */}
              <GlassCard className="p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-400 block mb-1">Ціна за порцію</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-bold text-white">
                        {currentPrice} <span className="text-2xl font-normal">₴</span>
                      </span>
                      {currentWeight && (
                        <span className="text-gray-500">/ {currentWeight} г</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-4 bg-surface-dark/50 rounded-xl p-2 border border-white/5">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors"
                      disabled={quantity <= 1}
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <span className="text-white font-medium w-4 text-center">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white transition-colors"
                      disabled={quantity >= 10}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 h-14 text-lg gap-2"
                  >
                    <ShoppingBagIcon className="w-6 h-6" />
                    Додати в кошик
                  </Button>
                  <button
                    onClick={toggleFavorite}
                    className={`w-14 h-14 flex items-center justify-center rounded-xl border transition-all ${isFavorite
                        ? "bg-accent-red text-white border-accent-red shadow-lg shadow-accent-red/25"
                        : "bg-transparent text-white border-white/10 hover:bg-white/5"
                      }`}
                  >
                    {isFavorite ? (
                      <HeartSolidIcon className="w-6 h-6" />
                    ) : (
                      <HeartIcon className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </GlassCard>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-card/30 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <TruckIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">Безкоштовна доставка</h4>
                    <p className="text-xs text-gray-500">від 1000 ₴</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-card/30 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <ClockIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">Час доставки</h4>
                    <p className="text-xs text-gray-500">40-60 хв</p>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              {product.ingredients && (
                <div>
                  <h3 className="text-white font-medium mb-3">Склад:</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {product.ingredients}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
