"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { Promotion } from "@/lib/types";
import Image from "next/image";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DOMPurify from "dompurify";

export default function PromotionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const promotionQuery = useQuery<Promotion>({
    queryKey: ["promotion", slug],
    queryFn: async () => {
      const response = await apiClient.get(`/promotions/${slug}`);
      return response.data;
    },
    enabled: !!slug,
  });

  const promotion = promotionQuery.data;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {promotionQuery.isLoading ? (
          <div className="text-center">Завантаження акції...</div>
        ) : promotionQuery.isError || !promotion ? (
          <div className="text-center text-red-600">Акцію не знайдено або сталася помилка.</div>
        ) : (
          <>
            <nav className="text-sm text-gray-600 mb-6">
              <Link href="/" className="hover:text-green-600">Головна</Link>
              <span className="mx-2">/</span>
              <Link href="/promotions" className="hover:text-green-600">Акції</Link>
              <span className="mx-2">/</span>
              <span>{promotion.name}</span>
            </nav>

            <h1 className="text-4xl font-bold mb-8 text-center">{promotion.name}</h1>

            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
              {promotion.image_url && (
                <div className="relative h-96 w-full">
                  <Image
                    src={promotion.image_url}
                    alt={promotion.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="100vw"
                  />
                </div>
              )}
              <div className="p-8">
                <p className="text-gray-700 text-lg mb-6">{promotion.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-800">Тип знижки:</h3>
                    <p className="text-gray-600">
                      {promotion.discount_type === "percent"
                        ? `${promotion.discount_value}%`
                        : `${promotion.discount_value} грн`}
                    </p>
                  </div>
                  {promotion.start_date && (
                    <div>
                      <h3 className="font-semibold text-gray-800">Початок дії:</h3>
                      <p className="text-gray-600">
                        {format(new Date(promotion.start_date), "dd MMMM yyyy", { locale: uk })}
                      </p>
                    </div>
                  )}
                  {promotion.end_date && (
                    <div>
                      <h3 className="font-semibold text-gray-800">Закінчення дії:</h3>
                      <p className="text-gray-600">
                        {format(new Date(promotion.end_date), "dd MMMM yyyy", { locale: uk })}
                      </p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">Статус:</h3>
                    <p
                      className={`font-medium ${promotion.is_available ? "text-green-600" : "text-red-600"}`}
                    >
                      {promotion.is_available ? "Активна" : "Закінчилась"}
                    </p>
                  </div>
                </div>

                {promotion.conditions && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Умови акції:</h3>
                    {/* БЕЗПЕКА: Санітизуємо HTML щоб запобігти XSS атакам */}
                    <div 
                      className="prose max-w-none" 
                      dangerouslySetInnerHTML={{ 
                        __html: typeof window !== 'undefined' 
                          ? DOMPurify.sanitize(promotion.conditions, {
                              ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h3', 'h4'],
                              ALLOWED_ATTR: []
                            })
                          : promotion.conditions 
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

