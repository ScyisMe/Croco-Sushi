"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ShoppingBagIcon,
  TagIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { useCartStore, MAX_CART_ITEMS } from "@/store/cartStore";
import { useTranslation } from "@/store/localeStore";
import apiClient from "@/lib/api/apiClient";
import { Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import NumberTicker from "@/components/ui/NumberTicker";

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
    // Promo actions
    promoCode,
    discountType,
    discountValue,
    applyPromoCode,
    removePromoCode,
    getDiscountAmount,
  } = useCartStore();

  const [isValidating, setIsValidating] = useState(false);
  const [isVerifyingPromo, setIsVerifyingPromo] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  // Sync input with store on mount/update
  useEffect(() => {
    if (promoCode) {
      setPromoInput(promoCode);
      setIsPromoOpen(true);
    }
  }, [promoCode]);

  // Фіксовані умови доставки (без вибору зон)
  const DELIVERY_COST = 200;
  const FREE_DELIVERY_FROM = 1000;
  const MIN_ORDER_AMOUNT = 200;

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;

    setIsVerifyingPromo(true);
    try {
      const response = await apiClient.post("/promo-codes/verify", {
        code: promoInput,
        order_amount: totalAmount
      });

      const { valid, code, discount_type, discount_value, message } = response.data;

      if (valid) {
        applyPromoCode(code, discount_type, discount_value);
        toast.success(message || "Промокод застосовано!");
      } else {
        toast.error(message || "Не вдалося застосувати промокод");
        removePromoCode();
      }
    } catch (error: any) {
      console.error("Promo code error:", error);
      const msg = error.response?.data?.detail || "Невірна помилка при перевірці промокоду";
      toast.error(msg);
      // Якщо помилка, скидаємо збережений промокод
      removePromoCode();
    } finally {
      setIsVerifyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    removePromoCode();
    setPromoInput("");
    toast.success("Промокод видалено");
  };

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
      // Отримуємо актуальну інформацію про товари (bulk request)
      const productIds = [...new Set(items.map((item) => item.id))];

      const response = await apiClient.post<Product[]>("/products/validate", {
        product_ids: productIds
      });

      const availableProducts = response.data;
      const availableIds = new Set(availableProducts.map(p => p.id));

      // Знаходимо товари, яких немає в списку доступних
      const unavailableIds = productIds.filter(id => !availableIds.has(id));

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

  // Розрахунок доставки - фіксована логіка
  const deliveryCost = totalAmount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_COST;
  const discountAmount = getDiscountAmount();
  const finalAmount = totalAmount - discountAmount + deliveryCost;
  const isMinOrderReached = totalAmount >= MIN_ORDER_AMOUNT;
  const amountToMinOrder = MIN_ORDER_AMOUNT - totalAmount;
  const amountToFreeDelivery = FREE_DELIVERY_FROM - totalAmount;
  const isMaxItemsReached = items.length >= MAX_CART_ITEMS;
  const isFreeDelivery = totalAmount >= FREE_DELIVERY_FROM;
  const deliveryProgress = Math.min((totalAmount / FREE_DELIVERY_FROM) * 100, 100);

  // UI Render helper
  const renderPromoSection = () => (
    <div className="border border-white/10 rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setIsPromoOpen(!isPromoOpen)}
        className="w-full flex items-center justify-between p-3 bg-surface/5 hover:bg-surface/10 transition"
      >
        <div className="flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">
            {promoCode ? "Промокод застосовано" : "У мене є промокод"}
          </span>
        </div>
        {isPromoOpen ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isPromoOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-surface/5 border-t border-white/10 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Введіть промокод"
                  className={`w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 placeholder-gray-600 ${promoCode ? "border-green-500 text-green-500" : ""}`}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  disabled={!!promoCode}
                />
                {promoCode && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-green-500 text-xs">OK</span>
                  </div>
                )}
              </div>

              {promoCode ? (
                <button
                  onClick={handleRemovePromo}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition"
                >
                  Видалити
                </button>
              ) : (
                <button
                  onClick={handleApplyPromo}
                  disabled={isVerifyingPromo || !promoInput}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition ${isVerifyingPromo
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-surface-card border border-white/10 text-white hover:bg-white/5 hover:border-primary/50"
                    }`}
                >
                  {isVerifyingPromo ? "..." : "ОК"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={setIsOpen}>
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
          <div className="fixed inset-0 bg-black/90 transition-opacity backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-[#121212] shadow-xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121212]">
                      <Dialog.Title className="text-xl font-bold text-white">
                        {t("cart.title")}
                        {totalItems > 0 && (
                          <span className="ml-2 text-sm font-normal text-gray-400">
                            ({totalItems})
                          </span>
                        )}
                        {(isValidating || isVerifyingPromo) && (
                          <span className="ml-2 inline-block w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </Dialog.Title>
                      <div className="flex items-center gap-2">
                        {/* Кнопка очистити кошик */}
                        {items.length > 0 && (
                          <button
                            onClick={clearCart}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition rounded-full"
                            title="Очистити кошик"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="p-2 text-secondary-light hover:text-secondary transition rounded-full hover:bg-theme-secondary"
                          onClick={() => setIsOpen(false)}
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-[#121212]">
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
                            {t("cart.emptyDescription")}
                          </p>
                          <Link
                            href="/menu"
                            onClick={() => setIsOpen(false)}
                            className="btn-primary group flex items-center justify-center gap-2"
                          >
                            <span>{t("cart.goToMenu")}</span>
                            <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      ) : (
                        <div className="px-4 py-4 space-y-4">
                          {/* Попередження про максимум товарів */}
                          {isMaxItemsReached && (
                            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <p className="text-sm text-yellow-500">
                                ⚠️ Досягнуто максимум {MAX_CART_ITEMS} різних товарів у кошику
                              </p>
                            </div>
                          )}

                          {/* Прогрес до безкоштовної доставки */}
                          {!isFreeDelivery ? (
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-300">До безкоштовної доставки</span>
                                <span className="text-sm font-bold text-primary">
                                  {amountToFreeDelivery.toFixed(0)} ₴
                                </span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-500"
                                  style={{ width: `${deliveryProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                              <span className="text-xl">🎉</span>
                              <div>
                                <p className="text-sm font-bold text-green-400">Доставка безкоштовна!</p>
                                <p className="text-xs text-green-500/70">Ви зекономили 200 ₴</p>
                              </div>
                            </div>
                          )}

                          {/* Список товарів - Новий Дизайн */}
                          <ul className="space-y-3">
                            <AnimatePresence initial={false} mode="popLayout">
                              {items.map((item) => (
                                <motion.li
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                  transition={{ duration: 0.2 }}
                                  key={`${item.id}-${item.sizeId || "default"}`}
                                  className="flex gap-4 p-3 bg-white/5 border border-white/5 rounded-xl overflow-hidden"
                                >
                                  {/* Зображення - зліва, більше */}
                                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                                    {item.image_url ? (
                                      <Image
                                        src={item.image_url}
                                        alt={item.name}
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Image
                                          src="/logo.png"
                                          alt={item.name}
                                          width={40}
                                          height={40}
                                          className="object-contain opacity-30 grayscale"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Центр і Права частина */}
                                  <div className="flex flex-1 justify-between">
                                    {/* Інформація */}
                                    <div className="flex flex-col justify-between py-1 pr-2">
                                      <div>
                                        <h4 className="font-semibold text-white text-sm line-clamp-2 leading-snug">
                                          {item.name}
                                        </h4>
                                        {item.size && (
                                          <p className="text-xs text-gray-400 mt-1">
                                            {item.size}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Ціна і Контроли - Справа */}
                                    <div className="flex flex-col justify-between items-end py-1">
                                      <div className=" font-bold text-white text-base">
                                        {item.price * item.quantity} <span className="text-xs font-normal text-gray-500">₴</span>
                                      </div>

                                      {/* Компактний перемикач кількості */}
                                      <div className="flex items-center bg-black/40 rounded-lg border border-white/10">
                                        <button
                                          onClick={() =>
                                            updateQuantity(item.id, item.quantity - 1, item.sizeId)
                                          }
                                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition active:scale-95"
                                        >
                                          <MinusIcon className="w-3 h-3" />
                                        </button>
                                        <span className="w-6 text-center text-sm font-medium text-white">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() =>
                                            updateQuantity(item.id, item.quantity + 1, item.sizeId)
                                          }
                                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition active:scale-95"
                                        >
                                          <PlusIcon className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.li>
                              ))}
                            </AnimatePresence>
                          </ul>

                          {/* Промокод */}
                          {renderPromoSection()}

                        </div>
                      )}
                    </div>

                    {/* Footer - Sticky Bottom */}
                    {items.length > 0 && (
                      <div className="border-t border-white/10 bg-[#121212] px-4 py-4 pb-safe space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                        {/* Підсумок (спрощений в футері) */}
                        <div className="space-y-2 text-sm">
                          {discountAmount > 0 && (
                            <div className="flex justify-between text-green-500">
                              <span>Знижка ({promoCode})</span>
                              <span>- {discountAmount.toFixed(0)} ₴</span>
                            </div>
                          )}

                          <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
                            <span className="text-white">Разом</span>
                            <div className="text-right">
                              {deliveryCost > 0 && <div className="text-xs font-normal text-gray-400 mb-0.5">+ доставка {deliveryCost} ₴</div>}
                              <span className="text-primary-500 font-display text-xl">
                                <NumberTicker value={finalAmount} /> ₴
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Попередження про мінімальну суму */}
                        {!isMinOrderReached && (
                          <div className="text-xs text-red-400 text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                            Мінімальна сума: {MIN_ORDER_AMOUNT} ₴.
                            Ще {amountToMinOrder.toFixed(0)} ₴
                          </div>
                        )}

                        {/* Кнопка оформлення */}
                        <Link
                          href="/checkout"
                          onClick={() => setIsOpen(false)}
                          className={`btn-checkout block w-full text-center py-3.5 rounded-xl font-bold text-base transition transform active:scale-[0.98] ${isMinOrderReached
                            ? "bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/20"
                            : "bg-surface-card text-gray-500 cursor-not-allowed pointer-events-none"
                            }`}
                        >
                          Оформити замовлення
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
    </Transition.Root >
  );
}

