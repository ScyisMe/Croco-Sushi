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
  ChevronRightIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { useCartStore, MAX_CART_ITEMS } from "@/store/cartStore";
import { useTranslation } from "@/store/localeStore";
import apiClient from "@/lib/api/client";
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

  // Sync input with store on mount/update
  useEffect(() => {
    if (promoCode) {
      setPromoInput(promoCode);
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
    <div>
      <div className="flex items-center gap-2 mb-2">
        <TagIcon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-white">Промокод</span>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Введіть промокод"
            className={`input w-full min-w-0 ${promoCode ? "border-green-500 text-green-500 focus:border-green-500 focus:ring-green-500" : ""}`}
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            disabled={!!promoCode}
          />
          {promoCode && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-green-500 text-sm">Застосовано</span>
            </div>
          )}
        </div>

        {promoCode ? (
          <button
            onClick={handleRemovePromo}
            className="px-4 py-2 font-medium rounded-xl transition text-sm whitespace-nowrap bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
          >
            Видалити
          </button>
        ) : (
          <button
            onClick={handleApplyPromo}
            disabled={isVerifyingPromo || !promoInput}
            className={`px-4 py-2 font-medium rounded-xl transition text-sm whitespace-nowrap ${isVerifyingPromo
              ? "opacity-50 cursor-not-allowed"
              : "bg-surface-card border border-white/10 text-white hover:bg-white/5 hover:border-primary/50"
              }`}
          >
            {isVerifyingPromo ? "..." : "Застосувати"}
          </button>
        )}
      </div>
    </div>
  );

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
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-theme-surface shadow-xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                      <Dialog.Title className="text-xl font-bold text-white">
                        {t("cart.title")}
                        {totalItems > 0 && (
                          <span className="ml-2 text-sm font-normal text-gray-400">
                            ({totalItems} {totalItems === 1 ? "товар" : totalItems < 5 ? "товари" : "товарів"})
                          </span>
                        )}
                        {(isValidating || isVerifyingPromo) && (
                          <span className="ml-2 inline-block w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </Dialog.Title>
                      <div className="flex items-center gap-2">
                        {/* Кнопка очистити кошик - в хедері */}
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
                        <div className="px-6 py-4">
                          {/* Попередження про максимум товарів */}
                          {isMaxItemsReached && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                ⚠️ Досягнуто максимум {MAX_CART_ITEMS} різних товарів у кошику
                              </p>
                            </div>
                          )}

                          {/* Прогрес до безкоштовної доставки - покращений */}
                          {!isFreeDelivery ? (
                            <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-300">До безкоштовної доставки</span>
                                <span className="text-sm font-bold text-primary">
                                  {amountToFreeDelivery.toFixed(0)} ₴
                                </span>
                              </div>
                              <div className="w-full bg-theme-tertiary rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary to-primary-600 rounded-full transition-all duration-500"
                                  style={{ width: `${deliveryProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                🎁 Додайте ще страв на {amountToFreeDelivery.toFixed(0)} ₴ і зекономте 200 ₴!
                              </p>
                            </div>
                          ) : (
                            <div className="mb-4 p-4 bg-primary/20 border border-primary/40 rounded-xl animate-bounce">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl animate-pulse">🎊</span>
                                <div>
                                  <p className="font-bold text-primary">Доставка безкоштовна!</p>
                                  <p className="text-xs text-gray-400">Ви зекономили 200 ₴</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Список товарів */}
                          <ul className="space-y-4">
                            <AnimatePresence initial={false} mode="popLayout">
                              {items.map((item) => (
                                <motion.li
                                  layout
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                  transition={{ duration: 0.3 }}
                                  key={`${item.id}-${item.sizeId || "default"}`}
                                  className="flex gap-4 p-3 bg-white/5 border border-white/5 rounded-xl overflow-hidden"
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
                                      <div className="w-full h-full flex items-center justify-center p-2 bg-gray-50">
                                        <div className="relative w-full h-full">
                                          <Image
                                            src="/logo.png"
                                            alt={item.name}
                                            fill
                                            className="object-contain opacity-50 grayscale"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Інформація */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-white text-sm line-clamp-2">
                                      {item.name}
                                    </h4>
                                    {item.size && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {item.size}
                                      </p>
                                    )}
                                    <p className="text-primary-500 font-bold mt-1">
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
                                        <motion.span
                                          key={item.quantity}
                                          initial={{ y: 10, opacity: 0 }}
                                          animate={{ y: 0, opacity: 1 }}
                                          exit={{ y: -10, opacity: 0 }}
                                          className="px-4 font-medium text-sm min-w-[40px] text-center inline-block"
                                        >
                                          {item.quantity}
                                        </motion.span>
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
                                </motion.li>
                              ))}
                            </AnimatePresence>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Footer - з safe area для мобільних */}
                    {items.length > 0 && (
                      <div className="border-t border-border px-4 sm:px-6 py-4 pb-safe space-y-4">
                        {renderPromoSection()}

                        {/* Підсумок */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Підсумок</span>
                            <span className="font-medium text-white">{totalAmount.toFixed(0)} ₴</span>
                          </div>

                          {discountAmount > 0 && (
                            <div className="flex justify-between text-green-500">
                              <span>Знижка ({promoCode})</span>
                              <span>- {discountAmount.toFixed(0)} ₴</span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-gray-400">Доставка</span>
                            <span className={`font-medium ${deliveryCost === 0 ? "text-primary" : "text-white"}`}>
                              {deliveryCost === 0 ? (
                                <span className="flex items-center gap-1">
                                  <span>✓</span> Безкоштовно
                                </span>
                              ) : (
                                `${deliveryCost} ₴`
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                            <span className="text-white">{t("cart.total")}</span>
                            <span className="text-primary-500 font-display">
                              <NumberTicker value={finalAmount} /> ₴
                            </span>
                          </div>
                        </div>

                        {/* Попередження про мінімальну суму */}
                        {!isMinOrderReached && (
                          <p className="text-sm text-accent-red text-center">
                            Мінімальна сума замовлення {MIN_ORDER_AMOUNT} ₴.
                            Додайте ще {amountToMinOrder.toFixed(0)} ₴
                          </p>
                        )}

                        {/* Кнопка оформлення */}
                        <Link
                          href="/checkout"
                          onClick={() => setIsOpen(false)}
                          className={`btn-checkout block w-full text-center py-4 rounded-lg font-bold text-lg transition ${isMinOrderReached
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
    </Transition.Root >
  );
}
