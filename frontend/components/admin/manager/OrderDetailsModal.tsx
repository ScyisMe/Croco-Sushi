"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, PhoneIcon, MapPinIcon, UserIcon, ClockIcon } from "@heroicons/react/24/outline";
import { ManagerOrder } from "./OrderCard";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Очікує' },
    { value: 'preparing', label: 'Готується' },
    { value: 'delivering', label: 'Доставка' },
    { value: 'completed', label: 'Виконано' },
    { value: 'cancelled', label: 'Скасовано' },
];

interface OrderDetailsModalProps {
    order: ManagerOrder | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: (order: ManagerOrder, newStatus: string) => void;
}

export default function OrderDetailsModal({
    order,
    isOpen,
    onClose,
    onStatusChange
}: OrderDetailsModalProps) {
    if (!order) return null;

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
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-surface-card border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                                    <div>
                                        <Dialog.Title
                                            as="h3"
                                            className="text-2xl font-bold leading-6 text-white"
                                        >
                                            Замовлення #{order.order_number}
                                        </Dialog.Title>
                                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                                            <ClockIcon className="w-4 h-4" />
                                            {format(new Date(order.created_at), "d MMMM yyyy, HH:mm", { locale: uk })}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => window.open(`/admin/orders/${order.id}/receipt`, '_blank')}
                                            className="rounded-full p-2 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                                            title="Друк"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-full p-1 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                                            onClick={onClose}
                                        >
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Col: Order Items */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-white border-b border-white/5 pb-2">Склад замовлення</h4>
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex gap-3 items-center bg-white/5 p-2 rounded-lg">
                                                    {/* Image Placeholder if needed */}
                                                    <div className="w-12 h-12 bg-gray-800 rounded-md flex-shrink-0 overflow-hidden">
                                                        {item.product_image ? (
                                                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">IMG</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-white truncate">{item.product_name}</div>
                                                        {item.size_name && <div className="text-xs text-gray-400">{item.size_name}</div>}
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-bold text-white">{item.quantity} шт</span>
                                                        <span className="text-xs text-primary">{parseFloat(item.price).toFixed(0)} ₴</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Totals */}
                                        <div className="pt-2 border-t border-white/5 space-y-1">
                                            {order.delivery_cost && parseFloat(order.delivery_cost) > 0 && (
                                                <div className="flex justify-between text-sm text-gray-400">
                                                    <span>Доставка</span>
                                                    <span>{parseFloat(order.delivery_cost).toFixed(0)} ₴</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-xl font-bold text-primary pt-2">
                                                <span>Разом</span>
                                                <span>{parseFloat(order.total_amount).toFixed(0)} ₴</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Col: Customer & Status */}
                                    <div className="space-y-6">
                                        {/* Contact Info */}
                                        <div className="bg-white/5 p-4 rounded-xl space-y-3">
                                            <h4 className="font-semibold text-white text-sm uppercase tracking-wider text-gray-400">Клієнт</h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 text-white">
                                                    <UserIcon className="w-5 h-5 text-primary" />
                                                    <span className="font-medium">{order.customer_name}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-white">
                                                    <PhoneIcon className="w-5 h-5 text-primary" />
                                                    <a href={`tel:${order.customer_phone}`} className="hover:text-primary transition-colors">{order.customer_phone}</a>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div className="bg-white/5 p-4 rounded-xl space-y-3">
                                            <h4 className="font-semibold text-white text-sm uppercase tracking-wider text-gray-400">Доставка</h4>
                                            <div className="flex items-start gap-3 text-white">
                                                <MapPinIcon className="w-5 h-5 text-primary mt-0.5" />
                                                <div>
                                                    <div className="font-medium">
                                                        {order.delivery_type === 'pickup' ? 'Самовивіз' : 'Доставка'}
                                                    </div>
                                                    {order.delivery_type === 'delivery' && order.delivery_address && (
                                                        <div className="text-sm text-gray-400 mt-1">
                                                            {order.delivery_address}
                                                        </div>
                                                    )}
                                                    {order.comment && (
                                                        <div className="mt-2 text-sm text-yellow-500/80 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                                                            &quot;{order.comment}&quot;
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Control */}
                                        <div className="bg-white/5 p-4 rounded-xl">
                                            <h4 className="font-semibold text-white text-sm uppercase tracking-wider text-gray-400 mb-2">Статус</h4>

                                            {onStatusChange ? (
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => onStatusChange(order, e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                                                >
                                                    {STATUS_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value} className="bg-gray-800">
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="px-3 py-1.5 inline-block rounded-lg bg-primary/20 text-primary font-bold uppercase tracking-wide text-sm">
                                                    {order.status}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>


                                {/* Order History Section */}
                                {order.history && order.history.length > 0 && (
                                    <div className="mt-8 border-t border-white/5 pt-6">
                                        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Історія замовлення
                                        </h4>
                                        <div className="space-y-4">
                                            {order.history.map((entry, index) => (
                                                <div key={index} className="flex gap-4 items-start bg-white/5 p-3 rounded-lg text-sm">
                                                    <div className="min-w-[140px] text-gray-400">
                                                        {format(new Date(entry.changed_at), "d MMM, HH:mm", { locale: uk })}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-white">{entry.manager_name}</span>
                                                            <span className="text-gray-500">→</span>
                                                            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold uppercase">
                                                                {entry.new_status}
                                                            </span>
                                                        </div>
                                                        {entry.comment && (
                                                            <div className="text-gray-400 italic mt-1">&quot;{entry.comment}&quot;</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition >
    );
}
