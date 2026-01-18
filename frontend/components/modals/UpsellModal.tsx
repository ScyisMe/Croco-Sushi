"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import { XMarkIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useUiStore } from "@/store/uiStore";
import { useCartStore } from "@/store/cartStore";
import apiClient from "@/lib/api/apiClient";
import { Product } from "@/lib/types";
import toast from "react-hot-toast";

export default function UpsellModal() {
    const { isUpsellModalOpen, closeUpsellModal, upsellRedirectPath } = useUiStore();
    const addItem = useCartStore((state) => state.addItem);
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        if (isUpsellModalOpen) {
            setSelectedIds([]); // Reset selection
            if (products.length === 0) {
                const fetchProducts = async () => {
                    try {
                        setLoading(true);
                        const response = await apiClient.get<Product[]>("/products/", {
                            params: { category_slug: "dodatku", limit: 8 }
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
        }
    }, [isUpsellModalOpen, products.length]);

    const toggleSelection = (product: Product) => {
        setSelectedIds(prev =>
            prev.includes(product.id)
                ? prev.filter(id => id !== product.id)
                : [...prev, product.id]
        );
    };

    const handleBatchAdd = () => {
        const selectedProducts = products.filter(p => selectedIds.includes(p.id));

        selectedProducts.forEach(product => {
            addItem({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                image_url: product.image_url,
                quantity: 1,
            });
        });

        if (selectedProducts.length > 0) {
            toast.success(`Додано ${selectedProducts.length} товарів`);
        }

        closeUpsellModal();
        if (upsellRedirectPath) {
            router.push(upsellRedirectPath);
        }
    };

    const handleDecline = () => {
        closeUpsellModal();
        if (upsellRedirectPath) {
            router.push(upsellRedirectPath);
        }
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
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-6">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-[#141414] border border-white/10 p-5 sm:p-8 text-left align-middle shadow-2xl transition-all relative">
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        type="button"
                                        className="rounded-full p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                        onClick={closeUpsellModal}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>

                                <div className="mt-2 text-center">
                                    <h3 className="text-2xl font-bold leading-tight text-white font-display mb-2">
                                        Бажаєте додатковий соус? 🥢
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto text-balance">
                                        До замовлення вже входять соус, імбир та васабі. Оберіть це, якщо бажаєте додаткову порцію.
                                    </p>

                                    {loading ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-h-[60vh] overflow-y-auto p-1 mb-8 custom-scrollbar">
                                            {products.map((product) => {
                                                const isSelected = selectedIds.includes(product.id);
                                                return (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => toggleSelection(product)}
                                                        className={`cursor-pointer group relative flex flex-col items-center bg-[#1E1E1E] rounded-2xl p-3 transition-all duration-200 border-2 ${isSelected
                                                            ? "border-primary-500 bg-primary-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                                            : "border-transparent hover:border-white/10 hover:bg-white/5"
                                                            }`}
                                                    >
                                                        {/* Selection Checkmark Badge */}
                                                        <div className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${isSelected
                                                            ? "bg-primary-500 scale-100 shadow-lg"
                                                            : "bg-black/40 text-transparent scale-90 group-hover:scale-100 group-hover:bg-white/20 group-hover:text-white"
                                                            }`}>
                                                            <CheckIcon className="w-3.5 h-3.5 text-white strokw-2" />
                                                        </div>

                                                        {/* Image Container - White background to frame sauces nicely */}
                                                        <div className="relative w-full aspect-square bg-white rounded-xl mb-3 overflow-hidden p-2 shadow-inner">
                                                            {product.image_url ? (
                                                                <Image
                                                                    src={product.image_url}
                                                                    alt={product.name}
                                                                    fill
                                                                    className="object-contain hover:scale-105 transition-transform duration-300"
                                                                    sizes="(max-width: 640px) 50vw, 25vw"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                                                    No image
                                                                </div>
                                                            )}
                                                        </div>

                                                        <h4 className="text-sm font-semibold text-white text-center mb-1 leading-tight line-clamp-2">
                                                            {product.name}
                                                        </h4>

                                                        <div className="mt-auto pt-1">
                                                            <span className="text-primary-400 font-bold">
                                                                {parseInt(product.price || "0")} ₴
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 sm:px-8">
                                    <button
                                        type="button"
                                        onClick={handleBatchAdd}
                                        className={`w-full py-4 text-base font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-[0.98] ${selectedIds.length > 0
                                            ? "bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25"
                                            : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"
                                            }`}
                                    >
                                        {selectedIds.length > 0 ? (
                                            <>
                                                <PlusIcon className="w-5 h-5" />
                                                Додати до кошика ({selectedIds.length})
                                            </>
                                        ) : (
                                            "Додати до кошика"
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="w-full py-2 text-gray-500 hover:text-white transition-colors text-sm font-medium"
                                        onClick={handleDecline}
                                    >
                                        Ні, дякую, перейти до оформлення
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
