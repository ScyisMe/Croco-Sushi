import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h1 className="text-9xl font-extrabold text-green-600">404</h1>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Сторінку не знайдено
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Вибачте, ми не можемо знайти сторінку, яку ви шукаєте.
                        Можливо, вона була переміщена або видалена.
                    </p>
                </div>
                <div className="mt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                    >
                        <HomeIcon className="w-5 h-5 mr-2" />
                        На головну
                    </Link>
                </div>
            </div>
        </div>
    );
}
