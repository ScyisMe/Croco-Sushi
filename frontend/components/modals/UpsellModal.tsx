"use client";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import { XMarkIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useUiStore } from "@/store/uiStore";
import { useCartStore } from "@/store/cartStore";
import apiClient from "@/lib/api/apiClient";
import { Product } from "@/lib/types";
import toast from "react-hot-toast";

export default function UpsellModal() {
    const { isUpsellModalOpen, closeUpsellModal } = useUiStore();
    const addItem = useCartStore((state) => state.addItem);
    const cartItems = useCartStore((state) => state.items);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [addedIds, setAddedIds] = useState<number[]>([]);

    useEffect(() => {
        if (isUpsellModalOpen && products.length === 0) {
            const fetchProducts = async () => {
                try {
                    setLoading(true);
                    const response = await apiClient.get<Product[]>("/products/", {
                        params: { category_slug: "dodatku", limit: 10 }
                    });
                    setProducts(response.data || []);
                } catch (error) {
                    console.error("Failed to fetch upsell products:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProducts();
        }
    }, [isUpsellModalOpen, products.length]);

    const handleAdd = (product: Product) => {
        addItem({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image_url: product.image_url,
            quantity: 1,
        });
        setAddedIds((prev) => [...prev, product.id]);
        toast.success(`${product.name} додано`);
    };

    const isAdded = (id: number) => {
        return addedIds.includes(id) || cartItems.some(item => item.id === id);
    };

    return (
        <Transition show={isUpsellModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={closeUpsellModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1a1a1a] border border-white/10 p-6 text-left align-middle shadow-xl transition-all relative">
                                <div className="absolute top-0 right-0 pt-4 pr-4">
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                        onClick={closeUpsellModal}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="mt-2 text-center">
                                    <h3 className="text-xl font-bold leading-6 text-white font-display mb-2">
                                        Бажаєте додати соус? 🥢
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-6">
                                        Додайте смаку до вашого замовлення
                                    </p>

                                    {loading ? (
                                        <div className="flex gap-4 overflow-x-auto pb-4 justify-center">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="w-40 h-56 rounded-xl bg-white/5 animate-pulse shrink-0" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                                            {products.map((product) => (
                                                <div
                                                    key={product.id}
                                                    className="group relative flex flex-col items-center bg-white/5 rounded-xl p-3 border border-white/5 hover:border-primary-500/50 transition-all active:scale-[0.98]"
                                                >
                                                    <div className="relative w-24 h-24 mb-3">
                                                        {product.image_url ? (
                                                            <Image
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                fill
                                                                className="object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-white/5 rounded-full flex items-center justify-center text-xs text-gray-500">
                                                                No image
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h4 className="text-sm font-medium text-white mb-1 line-clamp-1" title={product.name}>
                                                        {product.name}
                                                    </h4>

                                                    <div className="mt-auto w-full pt-2 flex items-center justify-between">
                                                        <span className="font-bold text-primary-400">
                                                            {parseInt(product.price || "0")} ₴
                                                        </span>

                                                        <button
                                                            onClick={() => handleAdd(product)}
                                                            disabled={isAdded(product.id)}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAdded(product.id)
                                                                    ? "bg-green-500 text-white"
                                                                    : "bg-white/10 text-white hover:bg-primary-500"
                                                                }`}
                                                        >
                                                            {isAdded(product.id) ? (
                                                                <CheckIcon className="w-4 h-4" />
                                                            ) : (
                                                                <PlusIcon className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-center w-full">
                                    <button
                                        type="button"
                                        className="w-full sm:w-auto px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition font-medium"
                                        onClick={closeUpsellModal}
                                    >
                                        Перейти до кошика
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
