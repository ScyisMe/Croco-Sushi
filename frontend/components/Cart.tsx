"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";

interface CartProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Cart({ isOpen, setIsOpen }: CartProps) {
  const { items, totalAmount, totalItems, removeItem, updateQuantity } = useCartStore();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          Кошик
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={() => setIsOpen(false)}
                          >
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8">
                        {items.length === 0 ? (
                          <p className="text-center text-gray-500">Кошик порожній</p>
                        ) : (
                          <ul role="list" className="-my-6 divide-y divide-gray-200">
                            {items.map((item) => (
                              <li key={`${item.productId}-${item.sizeId}`} className="flex py-6">
                                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                  {item.imageUrl && (
                                    <Image
                                      src={item.imageUrl}
                                      alt={item.productName}
                                      width={96}
                                      height={96}
                                      className="h-full w-full object-cover object-center"
                                    />
                                  )}
                                </div>

                                <div className="ml-4 flex flex-1 flex-col">
                                  <div>
                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                      <h3>
                                        <Link
                                          href={`/products/${item.productSlug}`}
                                          onClick={() => setIsOpen(false)}
                                        >
                                          {item.productName}
                                        </Link>
                                      </h3>
                                      <p className="ml-4">{parseFloat(item.price).toFixed(2)} грн</p>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">{item.sizeName}</p>
                                  </div>
                                  <div className="flex flex-1 items-end justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() =>
                                          updateQuantity(
                                            item.productId,
                                            item.sizeId,
                                            item.quantity - 1
                                          )
                                        }
                                        className="text-gray-400 hover:text-gray-500"
                                      >
                                        <MinusIcon className="h-5 w-5" />
                                      </button>
                                      <span className="font-medium">{item.quantity}</span>
                                      <button
                                        onClick={() =>
                                          updateQuantity(
                                            item.productId,
                                            item.sizeId,
                                            item.quantity + 1
                                          )
                                        }
                                        className="text-gray-400 hover:text-gray-500"
                                      >
                                        <PlusIcon className="h-5 w-5" />
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => removeItem(item.productId, item.sizeId)}
                                      className="font-medium text-red-600 hover:text-red-500"
                                    >
                                      Видалити
                                    </button>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {items.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                          <p>Всього</p>
                          <p>{parseFloat(totalAmount).toFixed(2)} грн</p>
                        </div>
                        <Link
                          href="/checkout"
                          className="flex items-center justify-center rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700"
                          onClick={() => setIsOpen(false)}
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

