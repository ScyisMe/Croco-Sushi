import { StarIcon, GiftIcon } from "@heroicons/react/24/solid";
import { User } from "@/lib/types";

interface LoyaltyCardProps {
    user: User;
}

export default function LoyaltyCard({ user }: LoyaltyCardProps) {
    const currentStatus = user.loyalty_status || "new";
    const points = user.bonus_balance || 0;

    // Logic to determine level and progress
    const getLevelInfo = (current: string) => {
        switch (current) {
            case "new":
                return { name: "New", next: "Silver", threshold: 1000, currentBase: 0 };
            case "silver":
                return { name: "Silver", next: "Gold", threshold: 5000, currentBase: 1000 };
            case "gold":
                return { name: "Gold", next: "Platinum", threshold: 10000, currentBase: 5000 };
            default:
                return { name: "Platinum", next: null, threshold: 100000, currentBase: 10000 };
        }
    };

    const levelInfo = getLevelInfo(currentStatus);

    // Calculate progress percentage relative to the current level range
    // Example: Silver (1000) -> Gold (5000). Points 3000. 
    // Range = 5000 - 1000 = 4000. Progress = 3000 - 1000 = 2000. 2000/4000 = 50%
    const calculateProgress = () => {
        if (!levelInfo.next) return 100;
        const range = levelInfo.threshold - levelInfo.currentBase;
        const progress = points - levelInfo.currentBase;
        const percent = (progress / range) * 100;
        return Math.min(Math.max(percent, 0), 100);
    };

    const progressPercent = calculateProgress();
    const pointsToNext = levelInfo.next ? levelInfo.threshold - points : 0;

    return (
        <div className="relative overflow-hidden rounded-2xl p-6 mb-6 group w-full shadow-lg transform hover:scale-[1.01] transition-transform duration-300">
            {/* Background Texture/Gradient - "Croco Skin" effect stylized */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a472a] via-[#2d5a3f] to-[#0f2e1b]" />
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }}>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -right-12 -top-12 text-white/5 rotate-12 transform scale-150 pointer-events-none">
                <StarIcon className="w-48 h-48" />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-6">

                {/* Top Section: Balance & Status */}
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-white/70 text-sm font-medium mb-1 uppercase tracking-wider">Бонусний Рахунок</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white tracking-tight drop-shadow-md">{points}</span>
                            <span className="text-primary-300 font-medium text-lg">бал.</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            {currentStatus === 'gold' && <StarIcon className="w-4 h-4 text-yellow-400" />}
                            {currentStatus === 'silver' && <StarIcon className="w-4 h-4 text-gray-300" />}
                            <span className="text-white font-bold capitalize text-sm tracking-wide">{levelInfo.name}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Progress Bar & Next Level */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs text-white/60 font-medium">Прогрес рівня</span>
                        {levelInfo.next && (
                            <span className="text-xs text-white/80 font-medium">
                                Ще <span className="text-white font-bold">{pointsToNext}</span> до {levelInfo.next}
                            </span>
                        )}
                    </div>

                    <div className="relative h-4 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-primary-400 to-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)] relative"
                            style={{ width: `${progressPercent}%`, transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>

                        {/* Integrated Gift Icon at the end of progress if not max level */}
                        {levelInfo.next && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20">
                                <div className={`p-0.5 rounded-full ${progressPercent >= 98 ? 'bg-yellow-400 text-black animate-bounce' : 'bg-white/10 text-white/40'}`}>
                                    <GiftIcon className="w-3 h-3" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
