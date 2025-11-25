"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";

interface CartProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Мінімальна сума замовлення
const MIN_ORDER_AMOUNT = 200;
// Безкоштовна доставка від
const FREE_DELIVERY_FROM = 500;
// Вартість доставки
const DELIVERY_COST = 50;

export default function Cart({ isOpen, setIsOpen }: CartProps) {
  const { items, totalAmount, totalItems, removeItem, updateQuantity, clearCart } = useCartStore();

  // Розрахунок доставки
  const deliveryCost = totalAmount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_COST;
  const finalAmount = totalAmount + deliveryCost;
  const isMinOrderReached = totalAmount >= MIN_ORDER_AMOUNT;
  const amountToMinOrder = MIN_ORDER_AMOUNT - totalAmount;
  const amountToFreeDelivery = FREE_DELIVERY_FROM - totalAmount;

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
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                      <Dialog.Title className="text-xl font-bold text-secondary">
                        Ваш кошик
                        {totalItems > 0 && (
                          <span className="ml-2 text-sm font-normal text-secondary-light">
                            ({totalItems} {totalItems === 1 ? "товар" : totalItems < 5 ? "товари" : "товарів"})
                          </span>
                        )}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="p-2 text-secondary-light hover:text-secondary transition rounded-full hover:bg-gray-100"
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
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <ShoppingBagIcon className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-secondary mb-2">
                            Кошик порожній
                          </h3>
                          <p className="text-secondary-light text-center mb-6">
                            Додайте смачні страви з нашого меню
                          </p>
                          <button
                            onClick={() => setIsOpen(false)}
                            className="btn-primary"
                          >
                            Перейти до меню
                          </button>
                        </div>
                      ) : (
                        <div className="px-6 py-4">
                          {/* Прогрес до безкоштовної доставки */}
                          {totalAmount < FREE_DELIVERY_FROM && (
                            <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                              <p className="text-sm text-secondary mb-2">
                                До безкоштовної доставки залишилось{" "}
                                <span className="font-semibold text-primary">
                                  {amountToFreeDelivery.toFixed(0)} ₴
                                </span>
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min((totalAmount / FREE_DELIVERY_FROM) * 100, 100)}%`,
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
                                className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                              >
                                {/* Зображення */}
                                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white">
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

                                  {/* Кількість та видалення */}
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center border border-border rounded-lg">
                                      <button
                                        onClick={() =>
                                          updateQuantity(item.id, item.quantity - 1, item.sizeId)
                                        }
                                        className="p-1.5 text-secondary-light hover:text-secondary transition"
                                      >
                                        <MinusIcon className="w-4 h-4" />
                                      </button>
                                      <span className="px-3 font-medium text-sm">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateQuantity(item.id, item.quantity + 1, item.sizeId)
                                        }
                                        className="p-1.5 text-secondary-light hover:text-secondary transition"
                                      >
                                        <PlusIcon className="w-4 h-4" />
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => removeItem(item.id, item.sizeId)}
                                      className="p-1.5 text-secondary-light hover:text-accent-red transition"
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

                    {/* Footer */}
                    {items.length > 0 && (
                      <div className="border-t border-border px-6 py-4 space-y-4">
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
                          <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                            <span>Разом</span>
                            <span className="text-primary">{finalAmount.toFixed(0)} ₴</span>
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
                          className={`block w-full text-center py-4 rounded-lg font-bold text-lg transition ${
                            isMinOrderReached
                              ? "bg-primary hover:bg-primary-600 text-white"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none"
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
    </Transition.Root>
  );
}
