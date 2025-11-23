"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { Promotion } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PromotionsPage() {
  const promotionsQuery = useQuery<Promotion[]>({
    queryKey: ["promotions"],
    queryFn: async () => {
      const response = await apiClient.get("/promotions");
      return response.data;
    },
  });

  const promotions = promotionsQuery.data;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Акції та спеціальні пропозиції</h1>

        {promotionsQuery.isLoading ? (
          <div className="text-center">Завантаження акцій...</div>
        ) : promotionsQuery.isError ? (
          <div className="text-center text-red-600">Не вдалося завантажити акції.</div>
        ) : promotions && promotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {promotions.map((promo) => (
              <Link
                href={`/promotions/${promo.slug}`}
                key={promo.id}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                {promo.image_url && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={promo.image_url}
                      alt={promo.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{promo.name}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{promo.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    {promo.end_date && (
                      <span>Діє до: {format(new Date(promo.end_date), "dd.MM.yyyy", { locale: uk })}</span>
                    )}
                    {promo.is_available ? (
                      <span className="text-green-600 font-medium">Активна</span>
                    ) : (
                      <span className="text-red-600 font-medium">Закінчилась</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">Наразі немає активних акцій.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}

