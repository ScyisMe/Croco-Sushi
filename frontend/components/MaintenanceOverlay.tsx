"use client";

import { motion } from "framer-motion";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

export default function MaintenanceOverlay() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 border-2 border-red-500/50">
            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />

            <div className="relative max-w-lg mx-4 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-surface-card border border-white/10 rounded-2xl p-12 shadow-2xl backdrop-blur-xl"
                >
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <WrenchScrewdriverIcon className="w-10 h-10 text-red-500" />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-4">
                        Сайт на обслуговуванні
                    </h1>

                    <p className="text-gray-400 mb-8 text-lg">
                        Ми проводимо планові технічні роботи, щоб зробити наш сервіс ще кращим.
                        Вибачте за тимчасові незручності.
                    </p>

                    <div className="flex justify-center space-x-4">
                        <div className="h-1 w-2 bg-red-500/50 rounded-full animate-pulse" />
                        <div className="h-1 w-2 bg-red-500/50 rounded-full animate-pulse delay-100" />
                        <div className="h-1 w-2 bg-red-500/50 rounded-full animate-pulse delay-200" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
