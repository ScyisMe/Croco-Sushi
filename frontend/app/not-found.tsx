import { Metadata } from "next";
import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/outline";

export const metadata: Metadata = {
    title: "Сторінку не знайдено (404) | Croco Sushi",
    description: "Вибачте, цю сторінку з'їли. Повертайтеся на головну за смачними ролами.",
    robots: {
        index: false,
        follow: true,
    }
};

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl mix-blend-screen animate-blob"></div>
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-green-900/20 rounded-full blur-3xl mix-blend-screen animate-blob animation-delay-2000"></div>
            </div>

            <div className="max-w-md w-full text-center relative z-10">
                <div className="mb-8">
                    <h1 className="text-[12rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-primary/20 to-transparent select-none">
                        404
                    </h1>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full">
                        <span className="text-6xl animate-bounce inline-block">🍣</span>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4 font-display">
                    Упс! Цю сторінку з&apos;їли
                </h2>

                <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                    Схоже, цей рол скрутили не туди. Сторінка, яку ви шукаєте, розчинилася як васабі в соєвому соусі.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-black bg-primary rounded-full hover:bg-primary-hover shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                        <HomeIcon className="w-5 h-5 mr-2" />
                        На головну
                    </Link>

                    <Link
                        href="/menu"
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                    >
                        Переглянути меню
                    </Link>
                </div>
            </div>
        </div>
    );
}
