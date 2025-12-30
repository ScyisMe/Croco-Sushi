"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Image from "next/image";
import { XMarkIcon, StarIcon, CameraIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  productName?: string;
  orderNumber?: string;
}

export interface ReviewFormData {
  rating: number;
  comment: string;
  images?: File[];
}

export default function ReviewForm({
  isOpen,
  onClose,
  onSubmit,
  productName,
  orderNumber,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Обмеження на 3 файли
    if (images.length + files.length > 3) {
      toast.error("Максимум 3 фото");
      return;
    }

    // Перевірка розміру (макс 5MB на файл)
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Файл ${file.name} завеликий (макс 5MB)`);
        return false;
      }
      return true;
    });

    setImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Оберіть оцінку");
      return;
    }

    if (comment.trim().length < 10) {
      setError("Напишіть коментар (мінімум 10 символів)");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({ rating, comment: comment.trim(), images });
      toast.success("Дякуємо за відгук! Він з'явиться після модерації.");
      handleClose();
    } catch (err: any) {
      // Show actual error from backend if available
      const errorMessage = err.response?.data?.detail || "Не вдалося надіслати відгук. Спробуйте ще раз.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setHoverRating(0);
    setComment("");
    setImages([]);
    setError("");
    onClose();
  };

  const displayRating = hoverRating || rating;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl glass-card border border-white/10 shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <Dialog.Title className="text-xl font-bold text-white">
                    Залишити відгук
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-white/10"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                  {/* Про що відгук */}
                  {(productName || orderNumber) && (
                    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                      {productName && (
                        <p className="text-gray-300">
                          Товар: <span className="font-semibold text-white">{productName}</span>
                        </p>
                      )}
                      {orderNumber && (
                        <p className="text-gray-300">
                          Замовлення: <span className="font-semibold text-white">#{orderNumber}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Оцінка */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Ваша оцінка *
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          {star <= displayRating ? (
                            <StarSolidIcon className="w-8 h-8 text-yellow-400" />
                          ) : (
                            <StarIcon className="w-8 h-8 text-gray-600" />
                          )}
                        </button>
                      ))}
                      <span className="ml-3 text-gray-400">
                        {displayRating === 1 && "Жахливо"}
                        {displayRating === 2 && "Погано"}
                        {displayRating === 3 && "Нормально"}
                        {displayRating === 4 && "Добре"}
                        {displayRating === 5 && "Чудово!"}
                      </span>
                    </div>
                  </div>

                  {/* Коментар */}
                  <div className="mb-6">
                    <label
                      htmlFor="comment"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Ваш відгук *
                    </label>
                    <textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-none"
                      placeholder="Розкажіть про ваші враження..."
                    />
                    <p className="mt-1 text-xs text-gray-500 text-right">
                      {comment.length}/1000
                    </p>
                  </div>

                  {/* Фото */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Додати фото (необов&apos;язково)
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {/* Превью зображень */}
                      {images.map((file, index) => (
                        <div
                          key={index}
                          className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10"
                        >
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {/* Кнопка додати */}
                      {images.length < 3 && (
                        <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-primary hover:bg-white/5 transition group">
                          <CameraIcon className="w-6 h-6 text-gray-500 group-hover:text-primary transition" />
                          <span className="text-xs text-gray-500 mt-1 group-hover:text-primary transition">Додати</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            multiple
                          />
                        </label>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Максимум 3 фото, до 5MB кожне
                    </p>
                  </div>

                  {/* Помилка */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Кнопки */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Надсилання...
                        </span>
                      ) : (
                        "Надіслати відгук"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-2.5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition"
                    >
                      Скасувати
                    </button>
                  </div>

                  <p className="mt-4 text-xs text-center text-gray-500">
                    Відгук буде опублікований після модерації
                  </p>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}



