"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { Product, ProductSize } from "@/lib/types";
import Image from "next/image";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCartStore();

  const productQuery = useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${slug}`);
      return response.data;
    },
  });

  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Встановлюємо перший розмір за замовчуванням при завантаженні товару
  useEffect(() => {
    const product = productQuery.data;
    if (product && product.sizes && product.sizes.length > 0 && !selectedSize) {
      setSelectedSize(product.sizes[0]);
    }
  }, [productQuery.data]);

  const handleAddToCart = () => {
    if (!productQuery.data) return;
    if (!selectedSize) {
      toast.error("Виберіть розмір порції");
      return;
    }
    addItem(productQuery.data, selectedSize, quantity);
    toast.success(`${productQuery.data.name} додано в кошик`);
  };

  const product = productQuery.data;

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-gray-300 h-64 rounded mb-4"></div>
            <div className="bg-gray-300 h-8 rounded w-1/2 mb-4"></div>
            <div className="bg-gray-300 h-4 rounded w-full"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Товар не знайдено</h1>
        </main>
        <Footer />
      </div>
    );
  }

  // Встановлюємо перший розмір за замовчуванням
  if (!selectedSize && product.sizes && product.sizes.length > 0) {
    setSelectedSize(product.sizes[0]);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Зображення */}
          <div>
            {product.image_url && (
              <div className="relative h-96 w-full rounded-lg overflow-hidden">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
          </div>

          {/* Інформація */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            {product.description && (
              <p className="text-gray-700 mb-6">{product.description}</p>
            )}

            {/* Розміри */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Розмір порції:</h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border-2 transition ${
                        selectedSize?.id === size.id
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-300 hover:border-green-400"
                      }`}
                    >
                      <div className="font-semibold">{size.name}</div>
                      <div className="text-sm">{parseFloat(size.price).toFixed(2)} грн</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Кількість */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">Кількість:</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  -
                </button>
                <span className="text-xl font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Ціна та кнопка */}
            <div className="mb-6">
              {selectedSize && (
                <div className="text-3xl font-bold text-green-600 mb-4">
                  {(parseFloat(selectedSize.price) * quantity).toFixed(2)} грн
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ShoppingCartIcon className="w-6 h-6 mr-3" /> Додати в кошик
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

