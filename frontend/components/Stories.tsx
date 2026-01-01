"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    const router = useRouter();
    return (
        <LazyMotion features={domAnimation}>
            <div className="w-full py-6 overflow-x-auto hide-scrollbar">
                <div className="flex gap-4 px-4 w-max">
                    {stories.map((story, index) => {
                        const isFilter = story.link.includes('?filter=');

                        if (isFilter) {
                            return (
                                <div
                                    key={story.id}
                                    onClick={() => router.push(story.link)}
                                    className="flex flex-col items-center gap-2 group cursor-pointer"
                                >
                                    <m.div
                                        whileTap={{ scale: 0.95 }}
                                        className={`p-[3px] rounded-full bg-gradient-to-tr ${story.color}`}
                                    >
                                        <div className="p-[2px] bg-black rounded-full">
                                            <div className="w-16 h-16 relative rounded-full overflow-hidden bg-surface-lighter ring-2 ring-black">
                                                <Image
                                                    src={story.image}
                                                    alt={story.title}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                    sizes="64px"
                                                    priority={index < 4}
                                                    quality={60}
                                                />
                                            </div>
                                        </div>
                                    </m.div>
                                    <span className="text-[10px] font-bold text-gray-300 group-hover:text-white transition-colors uppercase tracking-wider">
                                        {story.title}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <Link key={story.id} href={story.link} className="flex flex-col items-center gap-2 group">
                                <m.div
                                    whileTap={{ scale: 0.95 }}
                                    className={`p-[3px] rounded-full bg-gradient-to-tr ${story.color}`}
                                >
                                    <div className="p-[2px] bg-black rounded-full">
                                        <div className="w-16 h-16 relative rounded-full overflow-hidden bg-surface-lighter ring-2 ring-black">
                                            <Image
                                                src={story.image}
                                                alt={story.title}
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-cover"
                                                sizes="64px"
                                                priority={index < 4}
                                                quality={60}
                                            />
                                        </div>
                                    </div>
                                </m.div>
                                <span className="text-[10px] font-bold text-gray-300 group-hover:text-white transition-colors uppercase tracking-wider">
                                    {story.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </LazyMotion>
    );
}
