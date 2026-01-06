import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface StatusChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    status: string;
    isLoading?: boolean;
}

const QUICK_REASONS = [
    "Клієнт відмовився",
    "Немає інгредієнтів",
    "Не додзвонилися",
    "Дубль замовлення",
    "Тестове замовлення"
];

export const StatusChangeModal = ({ isOpen, onClose, onConfirm, status, isLoading }: StatusChangeModalProps) => {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError("Вкажіть причину зміни статусу");
            return;
        }
        setError("");
        await onConfirm(reason);
        setReason(""); // Reset on success/close handled by parent usually, but safety
    };

    const handleReasonClick = (r: string) => {
        setReason(r);
        setError("");
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-card rounded-xl w-full max-w-md border border-white/10 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                        {status === 'cancelled' ? 'Скасування замовлення' : 'Зміна статусу'}
                    </h3>
                    <p className="text-gray-400 mb-6 text-sm">
                        Будь ласка, вкажіть причину {status === 'cancelled' ? 'скасування' : 'зміни статусу'}.
                        Ця інформація буде збережена в історії.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Швидкі причини
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_REASONS.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => handleReasonClick(r)}
                                        className={`px-3 py-1.5 text-xs rounded-full border transition
                                            ${reason === r
                                                ? 'bg-primary-500/20 border-primary-500 text-primary-500'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">
                                Причина / Коментар
                            </label>
                            <textarea
                                id="reason"
                                rows={3}
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-600 resize-none"
                                placeholder="Введіть причину вручну..."
                                value={reason}
                                onChange={(e) => {
                                    setReason(e.target.value);
                                    if (e.target.value.trim()) setError("");
                                }}
                            />
                            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-400 hover:bg-white/5 rounded-lg transition font-medium"
                                disabled={isLoading}
                            >
                                Скасувати
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium flex items-center"
                            >
                                {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                                Підтвердити
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
