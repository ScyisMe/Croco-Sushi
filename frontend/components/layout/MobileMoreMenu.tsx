"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "@/store/localeStore";
import Image from "next/image";

interface MobileMoreMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileMoreMenu({ isOpen, onClose }: MobileMoreMenuProps) {
    const { t, locale, setLocale } = useTranslation();

    const LINKS = [
        { href: "/delivery", labelKey: "header.delivery" },
        { href: "/promotions", labelKey: "header.promotions" },
        { href: "/reviews", labelKey: "header.reviews" },
        { href: "/about", labelKey: "header.about" }, // Assuming about exists or just text
    ];

    const CONTACT_INFO = {
        phones: [{ number: "+380980970003", display: "(098) 097-00-03" }],
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

                <div className="fixed inset-0 overflow-hidden">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="translate-y-full"
                        enterTo="translate-y-0"
                        leave="ease-in duration-200"
                        leaveFrom="translate-y-0"
                        leaveTo="translate-y-full"
                    >
                        <Dialog.Panel className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-xl pb-safe max-h-[80vh] overflow-y-auto">
                            <div className="flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-border">
                                    <span className="text-lg font-bold text-white">Меню</span>
                                    <button onClick={onClose} className="text-secondary hover:text-primary p-2">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Links */}
                                <nav className="p-4 space-y-2">
                                    {LINKS.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={onClose}
                                            className="block p-3 text-lg text-secondary hover:text-primary hover:bg-white/5 rounded-xl transition"
                                        >
                                            {t(link.labelKey) || link.labelKey.replace('header.', '')}
                                        </Link>
                                    ))}
                                </nav>

                                {/* Footer Info */}
                                <div className="p-4 border-t border-border space-y-4">
                                    <div className="space-y-2">
                                        {CONTACT_INFO.phones.map((phone, index) => (
                                            <a
                                                key={index}
                                                href={`tel:${phone.number}`}
                                                className="flex items-center justify-center p-3 bg-white/5 rounded-xl text-secondary hover:text-primary transition"
                                            >
                                                <PhoneIcon className="w-5 h-5 mr-2" />
                                                {phone.display}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
