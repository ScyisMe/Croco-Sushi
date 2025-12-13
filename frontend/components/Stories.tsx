"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const stories = [
    {
        id: 1,
        title: "Хіт тижня",
        image: "/images/story-hit.jpg", // Placeholder
        color: "from-orange-500 to-red-500",
        link: "/collection/hits",
    },
    {
        id: 2,
        title: "Новинки",
        image: "/images/story-new.jpg",
        color: "from-green-400 to-emerald-600",
        link: "/collection/new",
    },
    {
        id: 3,
        title: "-20%",
        image: "/images/story-promo.jpg",
        color: "from-purple-500 to-indigo-600",
        link: "/promotions",
    },
    {
        id: 4,
        title: "Гостре",
        image: "/images/story-spicy.jpg",
        color: "from-red-600 to-rose-700",
        link: "/collection/spicy",
    },
    {
        id: 5,
        title: "Веган",
        image: "/images/story-vegan.jpg",
        color: "from-green-600 to-lime-500",
        link: "/collection/vegan",
    },
];

export default function Stories() {
    return (
        <div className="w-full py-6 overflow-x-auto hide-scrollbar">
            <div className="flex gap-4 px-4 w-max">
                {stories.map((story, index) => (
                    <Link key={story.id} href={story.link} className="flex flex-col items-center gap-2 group">
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            className={`p-[3px] rounded-full bg-gradient-to-tr ${story.color}`}
                        >
                            <div className="p-[2px] bg-black rounded-full">
                                <div className="w-16 h-16 relative rounded-full overflow-hidden bg-surface-lighter">
                                    {/* Placeholder content if image fails */}
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/50">
                                        {story.title[0]}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        <span className="text-[10px] font-medium text-gray-300 group-hover:text-white transition-colors">
                            {story.title}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
