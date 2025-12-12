import { format } from "date-fns";
import { uk } from "date-fns/locale";

interface HistoryEntry {
    manager_name: string;
    previous_status: string;
    new_status: string;
    changed_at: string;
    comment?: string;
    reason?: string;
}

interface OrderHistoryTimelineProps {
    history: HistoryEntry[];
}

const STATUS_LABELS: Record<string, string> = {
    pending: "Очікує",
    confirmed: "Підтверджено",
    preparing: "Готується",
    ready: "Готово",
    delivering: "Доставляється",
    completed: "Виконано",
    cancelled: "Скасовано",
};

export const OrderHistoryTimeline = ({ history }: OrderHistoryTimelineProps) => {
    if (!history || history.length === 0) return null;

    return (
        <div className="relative pl-4 border-l border-white/10 space-y-8 ml-2">
            {history.map((entry, index) => (
                <div key={index} className="relative">
                    {/* Dot on timeline */}
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-primary-500 border-2 border-surface-card shadow-[0_0_0_4px_rgba(25,25,35,1)]"></div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                        {/* Time */}
                        <div className="min-w-[120px] pt-1">
                            <p className="text-sm font-medium text-white">
                                {format(new Date(entry.changed_at), "HH:mm", { locale: uk })}
                            </p>
                            <p className="text-xs text-gray-500">
                                {format(new Date(entry.changed_at), "d MMM yyyy", { locale: uk })}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-white/5 rounded-lg p-3 border border-white/5">
                            <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-300">
                                <span className="font-semibold text-white">{entry.manager_name}</span>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
