"use client";

import Link from "next/link";
import { MapPinIcon, ClockIcon, CurrencyDollarIcon, TruckIcon } from "@heroicons/react/24/outline";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DeliveryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Доставка та оплата</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Умови доставки */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-green-600 mb-4 flex items-center">
              <MapPinIcon className="w-7 h-7 mr-3" /> Умови доставки
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Доставка здійснюється по Києву та передмістю.</li>
              <li>
                Мінімальна сума замовлення: <span className="font-semibold">200 грн</span>.
              </li>
              <li>
                Безкоштовна доставка при замовленні від <span className="font-semibold">500 грн</span>.
              </li>
              <li>
                Вартість платної доставки: <span className="font-semibold">50 грн</span>.
              </li>
              <li>
                Час доставки може варіюватися залежно від завантаженості кухні та дорожньої ситуації.
              </li>
              <li>Ми докладаємо максимум зусиль, щоб доставити ваше замовлення якнайшвидше!</li>
            </ul>
          </div>

          {/* Графік роботи та способи оплати */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-green-600 mb-4 flex items-center">
              <ClockIcon className="w-7 h-7 mr-3" /> Графік роботи
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              Приймаємо замовлення щодня: <span className="font-semibold">з 10:00 до 22:00</span>.
            </p>
            <h2 className="text-2xl font-semibold text-green-600 mb-4 flex items-center mt-6">
              <CurrencyDollarIcon className="w-7 h-7 mr-3" /> Способи оплати
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Готівкою кур'єру</li>
              <li>Карткою кур'єру (термінал)</li>
              <li>Онлайн оплата на сайті (LiqPay / Fondy)</li>
            </ul>
          </div>
        </div>

        {/* Зони доставки */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-2xl font-semibold text-green-600 mb-4 flex items-center">
            <TruckIcon className="w-7 h-7 mr-3" /> Зони доставки
          </h2>
          <p className="text-gray-700 mb-6">
            Наразі карта зон доставки знаходиться в розробці. Будь ласка, уточнюйте можливість доставки за вашою
            адресою у оператора.
          </p>
          {/* TODO: Інтегрувати карту зон доставки (Google Maps / OpenStreetMap) */}
          <div className="w-full h-80 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
            [Місце для інтеграції карти]
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">Часті питання про доставку</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Як довго чекати доставку?</h3>
              <p className="text-gray-700">
                Середній час доставки становить 45-60 хвилин. У пікові години (вечірні, вихідні) час може збільшитися
                до 90 хвилин.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Чи можна замовити на завтра?</h3>
              <p className="text-gray-700">
                Так, ви можете зробити попереднє замовлення. Зв'яжіться з нами за телефоном або через форму на сайті.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Що робити, якщо замовлення не прийшло вчасно?</h3>
              <p className="text-gray-700">
                Зв'яжіться з нами за телефоном, і ми з'ясуємо причину затримки та вирішимо питання.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Чи можна забрати замовлення самовивозом?</h3>
              <p className="text-gray-700">
                Так, ви можете забрати замовлення самостійно. Вкажіть це при оформленні замовлення.
              </p>
            </div>
          </div>
        </div>

        {/* Контакти */}
        <div className="text-center">
          <p className="text-lg text-gray-700 mb-4">Маєте питання? Зв'яжіться з нами:</p>
          <Link
            href="/contacts"
            className="text-green-600 hover:underline text-lg font-medium inline-block"
          >
            +38 (0XX) XXX-XX-XX
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}


