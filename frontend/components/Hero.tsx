"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Смачні суші з доставкою додому
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Свіжі інгредієнти, швидка доставка та найкращі ціни в місті
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/menu"
            className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center space-x-2"
          >
            <span>Переглянути меню</span>
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
          <Link
            href="/promotions"
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition"
          >
            Акції
          </Link>
        </div>
      </div>
    </section>
  );
}

