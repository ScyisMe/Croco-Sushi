"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
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
    } catch {
      setError("Не вдалося надіслати відгук. Спробуйте ще раз.");
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <Dialog.Title className="text-xl font-bold text-secondary">
                    Залишити відгук
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-gray-600 transition rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                  {/* Про що відгук */}
                  {(productName || orderNumber) && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                      {productName && (
                        <p className="text-secondary">
                          Товар: <span className="font-semibold">{productName}</span>
                        </p>
                      )}
                      {orderNumber && (
                        <p className="text-secondary">
                          Замовлення: <span className="font-semibold">#{orderNumber}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Оцінка */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-secondary mb-3">
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
                            <StarIcon className="w-8 h-8 text-gray-300" />
                          )}
                        </button>
                      ))}
                      <span className="ml-3 text-secondary-light">
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
                      className="block text-sm font-medium text-secondary mb-2"
                    >
                      Ваш відгук *
                    </label>
                    <textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      className="input resize-none"
                      placeholder="Розкажіть про ваші враження..."
                    />
                    <p className="mt-1 text-xs text-secondary-light text-right">
                      {comment.length}/1000
                    </p>
                  </div>

                  {/* Фото */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-secondary mb-2">
                      Додати фото (необов&apos;язково)
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {/* Превью зображень */}
                      {images.map((file, index) => (
                        <div
                          key={index}
                          className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
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
                        <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                          <CameraIcon className="w-6 h-6 text-gray-400" />
                          <span className="text-xs text-gray-400 mt-1">Додати</span>
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
                    <p className="mt-2 text-xs text-secondary-light">
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
                      className="px-6 py-2.5 border border-border rounded-lg text-secondary hover:bg-gray-50 transition"
                    >
                      Скасувати
                    </button>
                  </div>

                  <p className="mt-4 text-xs text-center text-secondary-light">
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



