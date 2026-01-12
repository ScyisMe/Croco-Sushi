import { StarIcon, GiftIcon } from "@heroicons/react/24/solid";
import { User } from "@/lib/types";

interface LoyaltyCardProps {
    user: User;
}

export default function LoyaltyCard({ user }: LoyaltyCardProps) {
    const currentStatus = user.loyalty_status || "new";
    const points = user.bonus_balance || 0;

    // Simple progress logic (example)
    const getNextStatus = (current: string) => {
        if (current === "new") return { name: "Silver", threshold: 1000 };
        if (current === "silver") return { name: "Gold", threshold: 5000 };
        return null;
    };

    const nextStatus = getNextStatus(currentStatus);
    const progressPercent = nextStatus
        ? Math.min((points / nextStatus.threshold) * 100, 100)
        : 100;

    return (
        <div className="relative overflow-hidden rounded-2xl p-6 mb-6 group">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 opacity-90 transition-opacity group-hover:opacity-100" />

            {/* Visual Pattern */}
            <div className="absolute -right-10 -top-10 text-white/10 rotate-12 transform scale-150">
                <StarIcon className="w-40 h-40" />
            </div>

            <div className="relative z-10 flex flex-col gap-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-primary-100 text-sm font-medium mb-1">Твій баланс</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white tracking-tight">{points}</span>
                            <span className="text-primary-200 font-medium">балів</span>
                        </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                        <GiftIcon className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
                    </div>
                </div>

                {/* Progress Section */}
                <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm mt-2">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-xs text-primary-200 mb-0.5">Поточний статус</p>
                            <p className="text-white font-bold capitalize flex items-center gap-1">
                                {currentStatus === 'gold' && <StarIcon className="w-4 h-4 text-yellow-400" />}
                                {currentStatus === 'silver' && <StarIcon className="w-4 h-4 text-gray-300" />}
                                {currentStatus}
                            </p>
                        </div>
                        {nextStatus && (
                            <div className="text-right">
                                <p className="text-xs text-primary-200">До статусу {nextStatus.name}</p>
                                <p className="text-xs font-semibold text-white">{nextStatus.threshold - points} балів</p>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-[0_0_10px_rgba(253,224,71,0.5)] transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
