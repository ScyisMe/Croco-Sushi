"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ShoppingBagIcon,
  MapPinIcon,
  TruckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useCartStore, MAX_CART_ITEMS } from "@/store/cartStore";
import { useTranslation } from "@/store/localeStore";
import apiClient from "@/lib/api/client";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

interface CartProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Інтервал валідації кошика (5 хвилин)
const VALIDATION_INTERVAL = 5 * 60 * 1000;

export default function Cart({ isOpen, setIsOpen }: CartProps) {
  const { t } = useTranslation();
  const { 
    items, 
    totalAmount, 
    totalItems, 
    delivery,
    lastValidated,
    removeItem, 
    updateQuantity, 
    clearCart,
    getDeliveryCost,
    getFinalAmount,
    removeUnavailableItems,
    setLastValidated,
  } = useCartStore();

  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Функція валідації товарів у кошику
  const validateCartItems = useCallback(async () => {
    if (items.length === 0) return;
    
    // Перевіряємо чи потрібно валідувати (раз на 5 хвилин)
    const now = Date.now();
    if (lastValidated && now - lastValidated < VALIDATION_INTERVAL) {
      return;
    }
    
    setIsValidating(true);
    
    try {
      // Отримуємо актуальну інформацію про товари
      const productIds = [...new Set(items.map((item) => item.id))];
      const unavailableIds: number[] = [];
      
      // Перевіряємо кожен товар (можна оптимізувати через batch endpoint)
      await Promise.all(
        productIds.map(async (id) => {
          try {
            const item = items.find((i) => i.id === id);
            if (!item?.slug) return;
            
            const response = await apiClient.get(`/products/${item.slug}`);
            const product = response.data;
            
            if (!product.is_available) {
              unavailableIds.push(id);
            }
          } catch {
            // Якщо товар не знайдено, вважаємо його недоступним
            unavailableIds.push(id);
          }
        })
      );
      
      // Видаляємо недоступні товари
      if (unavailableIds.length > 0) {
        const removedNames = removeUnavailableItems(unavailableIds);
        if (removedNames.length > 0) {
          toast.error(
            `Видалено з кошика (немає в наявності): ${removedNames.join(", ")}`,
            { duration: 5000 }
          );
        }
      }
      
      setLastValidated(now);
    } catch (error) {
      console.error("Помилка валідації кошика:", error);
    } finally {
      setIsValidating(false);
    }
  }, [items, lastValidated, removeUnavailableItems, setLastValidated]);

  // Валідуємо кошик при відкритті
  useEffect(() => {
    if (isOpen && items.length > 0) {
      validateCartItems();
    }
  }, [isOpen, validateCartItems, items.length]);

  // Використовуємо значення з delivery з store
  const deliveryCost = getDeliveryCost();
  const finalAmount = getFinalAmount();
  const isMinOrderReached = totalAmount >= delivery.min_order_amount;
  const amountToMinOrder = delivery.min_order_amount - totalAmount;
  const amountToFreeDelivery = delivery.free_delivery_from - totalAmount;
  const isMaxItemsReached = items.length >= MAX_CART_ITEMS;

  // Зони доставки для вибору - всі безкоштовно від 1000₴
  const deliveryZones = [
    { id: "center", name: "Центр Львова", cost: 50, freeFrom: 1000, minOrder: 200, time: "30-45 хв" },
    { id: "suburbs", name: "Околиці", cost: 70, freeFrom: 1000, minOrder: 200, time: "45-60 хв" },
    { id: "remote", name: "Віддалені райони", cost: 100, freeFrom: 1000, minOrder: 300, time: "60-90 хв" },
  ];

  // Оновлюємо доставку при виборі зони
  useEffect(() => {
    if (selectedZone) {
      const zone = deliveryZones.find(z => z.id === selectedZone);
      if (zone) {
        useCartStore.getState().setDelivery({
          zone_id: deliveryZones.indexOf(zone),
          zone_name: zone.name,
          delivery_cost: zone.cost,
          free_delivery_from: zone.freeFrom,
          min_order_amount: zone.minOrder,
          estimated_time: zone.time,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-theme-surface shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                      <Dialog.Title className="text-xl font-bold text-secondary">
                        {t("cart.title")}
                        {totalItems > 0 && (
                          <span className="ml-2 text-sm font-normal text-secondary-light">
                            ({totalItems} {totalItems === 1 ? "товар" : totalItems < 5 ? "товари" : "товарів"})
                          </span>
                        )}
                        {isValidating && (
                          <span className="ml-2 inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="p-2 text-secondary-light hover:text-secondary transition rounded-full hover:bg-theme-secondary"
                        onClick={() => setIsOpen(false)}
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                      {items.length === 0 ? (
                        // Порожній кошик
                        <div className="flex flex-col items-center justify-center h-full px-6 py-12">
                          <div className="w-24 h-24 bg-theme-secondary rounded-full flex items-center justify-center mb-4">
                            <ShoppingBagIcon className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-secondary mb-2">
                            {t("cart.empty")}
                          </h3>
                          <p className="text-secondary-light text-center mb-6">
                            Додайте смачні страви з нашого меню
                          </p>
                          <button
                            onClick={() => setIsOpen(false)}
                            className="btn-primary"
                          >
                            {t("cart.goToMenu")}
                          </button>
                        </div>
                      ) : (
                        <div className="px-6 py-4">
                          {/* Попередження про максимум товарів */}
                          {isMaxItemsReached && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                ⚠️ Досягнуто максимум {MAX_CART_ITEMS} різних товарів у кошику
                              </p>
                            </div>
                          )}

                          {/* Прогрес до безкоштовної доставки */}
                          {totalAmount < delivery.free_delivery_from && (
                            <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                              <p className="text-sm text-secondary mb-2">
                                До безкоштовної доставки залишилось{" "}
                                <span className="font-semibold text-primary">
                                  {amountToFreeDelivery.toFixed(0)} ₴
                                </span>
                              </p>
                              <div className="w-full bg-theme-tertiary rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min((totalAmount / delivery.free_delivery_from) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Список товарів */}
                          <ul className="space-y-4">
                            {items.map((item) => (
                              <li
                                key={`${item.id}-${item.sizeId || "default"}`}
                                className="flex gap-4 p-3 bg-theme-secondary rounded-lg"
                              >
                                {/* Зображення */}
                                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-theme-surface">
                                  {item.image_url ? (
                                    <Image
                                      src={item.image_url}
                                      alt={item.name}
                                      width={80}
                                      height={80}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl">
                                      🍣
                                    </div>
                                  )}
                                </div>

                                {/* Інформація */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-secondary text-sm line-clamp-2">
                                    {item.name}
                                  </h4>
                                  {item.size && (
                                    <p className="text-xs text-secondary-light mt-0.5">
                                      {item.size}
                                    </p>
                                  )}
                                  <p className="text-primary font-bold mt-1">
                                    {item.price} ₴
                                  </p>

                                  {/* Кількість та видалення - збільшені touch targets */}
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center border border-border rounded-lg">
                                      <button
                                        onClick={() =>
                                          updateQuantity(item.id, item.quantity - 1, item.sizeId)
                                        }
                                        className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-secondary-light hover:text-secondary hover:bg-theme-secondary transition rounded-l-lg active:scale-95"
                                        aria-label="Зменшити кількість"
                                      >
                                        <MinusIcon className="w-4 h-4" />
                                      </button>
                                      <span className="px-4 font-medium text-sm min-w-[40px] text-center">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateQuantity(item.id, item.quantity + 1, item.sizeId)
                                        }
                                        className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-secondary-light hover:text-secondary hover:bg-theme-secondary transition rounded-r-lg active:scale-95"
                                        aria-label="Збільшити кількість"
                                      >
                                        <PlusIcon className="w-4 h-4" />
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => removeItem(item.id, item.sizeId)}
                                      className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-secondary-light hover:text-accent-red hover:bg-accent-red/10 transition rounded-lg active:scale-95"
                                      aria-label="Видалити товар"
                                    >
                                      <TrashIcon className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>

                          {/* Кнопка очистити кошик */}
                          <button
                            onClick={clearCart}
                            className="w-full mt-4 py-2 text-sm text-secondary-light hover:text-accent-red transition"
                          >
                            Очистити кошик
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Footer - з safe area для мобільних */}
                    {items.length > 0 && (
                      <div className="border-t border-border px-4 sm:px-6 py-4 pb-safe space-y-4">
                        {/* Вибір зони доставки */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TruckIcon className="w-4 h-4 text-secondary-light" />
                            <span className="text-sm font-medium text-secondary">Зона доставки</span>
                          </div>
                          <select
                            value={selectedZone || ""}
                            onChange={(e) => setSelectedZone(e.target.value || null)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-primary"
                          >
                            <option value="">Оберіть зону доставки</option>
                            {deliveryZones.map((zone) => (
                              <option key={zone.id} value={zone.id}>
                                {zone.name} • {zone.time} • {totalAmount >= zone.freeFrom ? "Безкоштовно" : `${zone.cost} ₴`}
                              </option>
                            ))}
                          </select>
                          {delivery.zone_name && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-secondary-light">
                              <MapPinIcon className="w-3 h-3" />
                              <span>{delivery.zone_name}</span>
                              {delivery.estimated_time && (
                                <span className="text-primary"> • {delivery.estimated_time}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Підсумок */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-secondary-light">Підсумок</span>
                            <span className="font-medium">{totalAmount.toFixed(0)} ₴</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary-light">Доставка</span>
                            <span className={`font-medium ${deliveryCost === 0 ? "text-primary" : ""}`}>
                              {deliveryCost === 0 ? "Безкоштовно" : `${deliveryCost} ₴`}
                            </span>
                          </div>
                          {deliveryCost > 0 && totalAmount > 0 && (
                            <div className="text-xs text-secondary-light">
                              До безкоштовної доставки: {amountToFreeDelivery.toFixed(0)} ₴
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                            <span>{t("cart.total")}</span>
                            <span className="text-primary">{finalAmount.toFixed(0)} ₴</span>
                          </div>
                        </div>

                        {/* Попередження про мінімальну суму */}
                        {!isMinOrderReached && (
                          <p className="text-sm text-accent-red text-center">
                            Мінімальна сума замовлення {delivery.min_order_amount} ₴.
                            Додайте ще {amountToMinOrder.toFixed(0)} ₴
                          </p>
                        )}

                        {/* Кнопка оформлення */}
                        <Link
                          href="/checkout"
                          onClick={() => setIsOpen(false)}
                          className={`block w-full text-center py-4 rounded-lg font-bold text-lg transition ${
                            isMinOrderReached
                              ? "bg-primary hover:bg-primary-600 text-white"
                              : "bg-theme-tertiary text-theme-muted cursor-not-allowed pointer-events-none"
                          }`}
                        >
                          {t("cart.checkout")}
                        </Link>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
