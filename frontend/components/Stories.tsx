"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const stories = [
    {
        id: 1,
        title: "Хіт тижня",
        image: "/images/story-hit.png",
        color: "from-orange-500 to-red-500",
        link: "/menu?filter=is_popular",
    },
    {
        id: 2,
        title: "Новинки",
        image: "/images/story-new.png",
        color: "from-green-400 to-emerald-600",
        link: "/menu?filter=is_new",
    },
    {
        id: 3,
        title: "-20%",
        image: "/images/story-promo.png",
        color: "from-purple-500 to-indigo-600",
        link: "/promotions",
    },
    {
        id: 4,
        title: "Гостре",
        image: "/images/story-spicy.png",
        color: "from-red-600 to-rose-700",
        link: "/menu?filter=is_spicy",
    },
    {
        id: 5,
        title: "Веган",
        image: "/images/story-vegan.png",
        color: "from-green-600 to-lime-500",
        link: "/menu?filter=is_vegan",
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
                                <div className="w-16 h-16 relative rounded-full overflow-hidden bg-surface-lighter ring-2 ring-black">
                                    <Image
                                        src={story.image}
                                        alt={story.title}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                        priority={index < 4}
                                    />
                                </div>
                            </div>
                        </motion.div>
                        <span className="text-[10px] font-bold text-gray-300 group-hover:text-white transition-colors uppercase tracking-wider">
                            {story.title}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
