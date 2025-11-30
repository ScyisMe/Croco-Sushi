"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import {
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  HeartIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useCartStore, MAX_CART_ITEMS } from "@/store/cartStore";
import { Product, ProductSize } from "@/lib/types";
import toast from "react-hot-toast";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onFavoriteToggle?: (productId: number) => void;
  isFavorite?: boolean;
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  onFavoriteToggle,
  isFavorite = false,
}: QuickViewModalProps) {
  const addItem = useCartStore((state) => state.addItem);
  const itemsCount = useCartStore((state) => state.items.length);

  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Скидаємо стан при зміні товару
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedImageIndex(0);
      if (product.sizes && product.sizes.length > 0) {
        const defaultSize = product.sizes.find((s) => s.is_default) || product.sizes[0];
        setSelectedSize(defaultSize);
      } else {
        setSelectedSize(null);
      }
    }
  }, [product]);

  if (!product) return null;

  // Розрахунок ціни
  const currentPrice = Number(selectedSize?.price || product.price || 0);
  const originalPrice = selectedSize?.original_price || product.original_price;
  const hasDiscount = originalPrice && Number(originalPrice) > currentPrice;
  const totalPrice = currentPrice * quantity;

  // Зображення товару
  const images = product.images?.length ? product.images : product.image_url ? [product.image_url] : [];

  const handleAddToCart = () => {
    // Перевірка на максимум товарів
    if (itemsCount >= MAX_CART_ITEMS) {
      toast.error(`Максимум ${MAX_CART_ITEMS} різних товарів у кошику`);
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: currentPrice,
      image_url: product.image_url,
      size: selectedSize?.name,
      sizeId: selectedSize?.id,
      quantity,
    });

    toast.success(`${product.name} додано в кошик`);
    onClose();
  };

  const handleFavoriteClick = () => {
    if (onFavoriteToggle) {
      onFavoriteToggle(product.id);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Кнопка закриття */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white hover:text-gray-900 transition"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Зображення */}
                  <div className="relative bg-gray-100 p-4 md:p-6">
                    {/* Головне зображення */}
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-white">
                      {images.length > 0 ? (
                        <Image
                          src={images[selectedImageIndex]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-8xl">
                          🍣
                        </div>
                      )}

                      {/* Бейджі */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {product.is_new && (
                          <span className="badge badge-new">Новинка</span>
                        )}
                        {product.is_hit && (
                          <span className="badge badge-hit">Хіт</span>
                        )}
                        {hasDiscount && (
                          <span className="badge badge-sale">
                            -{Math.round(((Number(originalPrice) - currentPrice) / Number(originalPrice)) * 100)}%
                          </span>
                        )}
                      </div>

                      {/* Кнопка обране */}
                      {onFavoriteToggle && (
                        <button
                          onClick={handleFavoriteClick}
                          className={`absolute top-3 right-3 p-2 rounded-full transition ${isFavorite
                            ? "bg-accent-red text-white"
                            : "bg-white/80 text-gray-600 hover:bg-white hover:text-accent-red"
                            }`}
                        >
                          {isFavorite ? (
                            <HeartSolidIcon className="w-5 h-5" />
                          ) : (
                            <HeartIcon className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Мініатюри */}
                    {images.length > 1 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto">
                        {images.map((img, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${selectedImageIndex === index
                              ? "border-primary"
                              : "border-transparent hover:border-gray-300"
                              }`}
                          >
                            <Image
                              src={img}
                              alt={`${product.name} ${index + 1}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Інформація */}
                  <div className="p-6 flex flex-col">
                    <Dialog.Title className="text-xl md:text-2xl font-bold text-secondary mb-2">
                      {product.name}
                    </Dialog.Title>

                    {product.description && (
                      <p className="text-secondary-light mb-4 line-clamp-3">
                        {product.description}
                      </p>
                    )}

                    {/* Вага/калорії */}
                    {(selectedSize?.weight || product.weight || product.calories) && (
                      <div className="flex gap-4 mb-4 text-sm text-secondary-light">
                        {(selectedSize?.weight || product.weight) && (
                          <span>Вага: {selectedSize?.weight || product.weight} г</span>
                        )}
                        {product.calories && <span>Калорії: {product.calories} ккал</span>}
                      </div>
                    )}

                    {/* Вибір розміру */}
                    {product.sizes && product.sizes.length > 1 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-secondary mb-2">Розмір:</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.map((size) => (
                            <button
                              key={size.id}
                              onClick={() => setSelectedSize(size)}
                              className={`px-4 py-2 rounded-lg border-2 transition ${selectedSize?.id === size.id
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border hover:border-primary"
                                }`}
                            >
                              <span className="font-medium">{size.name}</span>
                              <span className="text-sm text-secondary-light ml-2">
                                {size.price} ₴
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Кількість */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-secondary mb-2">Кількість:</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-border rounded-lg">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="p-2 text-secondary-light hover:text-secondary transition"
                            disabled={quantity <= 1}
                          >
                            <MinusIcon className="w-5 h-5" />
                          </button>
                          <span className="w-12 text-center font-semibold">
                            {quantity}
                          </span>
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="p-2 text-secondary-light hover:text-secondary transition"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Ціна */}
                    <div className="mb-6 mt-auto">
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl md:text-3xl font-bold text-primary">
                          {totalPrice} ₴
                        </span>
                        {hasDiscount && (
                          <span className="text-lg text-secondary-light line-through">
                            {Number(originalPrice) * quantity} ₴
                          </span>
                        )}
                      </div>
                      {quantity > 1 && (
                        <p className="text-sm text-secondary-light mt-1">
                          {currentPrice} ₴ × {quantity} шт.
                        </p>
                      )}
                    </div>

                    {/* Кнопки */}
                    <div className="space-y-3">
                      <button
                        onClick={handleAddToCart}
                        disabled={!product.is_available}
                        className="w-full bg-primary hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <ShoppingCartIcon className="w-5 h-5" />
                        {product.is_available ? "Додати в кошик" : "Немає в наявності"}
                      </button>

                      <Link
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="w-full border border-border hover:border-primary text-secondary hover:text-primary font-medium py-3 px-6 rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        Детальніше про товар
                      </Link>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}



