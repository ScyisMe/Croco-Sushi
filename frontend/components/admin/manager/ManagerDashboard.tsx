"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KanbanBoard from "./KanbanBoard";
import { format } from "date-fns";
import { PhoneIcon, CheckCircleIcon, XCircleIcon, HomeIcon, ArrowRightOnRectangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import apiClient from "@/lib/api/apiClient";

interface CallbackRequest {
    id: number;
    phone: string;
    name: string | null;
    status: 'new' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    comment: string | null;
}

export default function ManagerDashboard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [callbacks, setCallbacks] = useState<CallbackRequest[]>([]);
    const [isLoadingCallbacks, setIsLoadingCallbacks] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchCallbacks = async () => {
        try {
            setIsLoadingCallbacks(true);
            const response = await apiClient.get<CallbackRequest[]>("/callback", {
                params: { status: "new" } // Only fetch active requests
            });
            setCallbacks(response.data);
        } catch (error) {
            console.error("Failed to fetch callbacks:", error);
        } finally {
            setIsLoadingCallbacks(false);
        }
    };

    useEffect(() => {
        fetchCallbacks();
        // Poll for new callbacks every 30 seconds
        const pollTimer = setInterval(fetchCallbacks, 30000);
        return () => clearInterval(pollTimer);
    }, []);

    const handleCompleteCallback = async (id: number) => {
        try {
            await apiClient.patch(`/callback/${id}`, {
                status: "completed"
            });
            // Remove from list immediately for better UX
            setCallbacks(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Failed to complete callback:", error);
        }
    };

    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <header className="bg-surface-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                        title="На головну"
                    >
                        <HomeIcon className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Manager Terminal</h1>
                    <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full font-medium animate-pulse">
                        Live
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-xl font-mono text-gray-400">
                        {currentTime.toLocaleTimeString()}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Вийти</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex">
                {/* Callbacks Sidebar */}
                <div className="w-80 bg-surface-card border-r border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white flex items-center">
                            <PhoneIcon className="w-5 h-5 mr-2 text-primary" />
                            Callbacks
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full">
                                {callbacks.length}
                            </span>
                            <button
                                onClick={fetchCallbacks}
                                disabled={isLoadingCallbacks}
                                className={`p-1.5 text-gray-400 hover:text-white rounded-lg transition ${isLoadingCallbacks ? 'animate-spin' : 'hover:bg-white/10'}`}
                                title="Оновити"
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoadingCallbacks && callbacks.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">Loading...</div>
                        ) : callbacks.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No new callback requests</p>
                            </div>
                        ) : (
                            callbacks.map(callback => (
                                <div key={callback.id} className="bg-[#1a1a1a] border border-white/5 rounded-lg p-3 shadow-sm hover:border-primary/30 transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white text-lg">{callback.phone}</h3>
                                        <button
                                            onClick={() => handleCompleteCallback(callback.id)}
                                            className="text-gray-400 hover:text-emerald-500 transition"
                                            title="Mark as Done"
                                        >
                                            <CheckCircleIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-400 mb-1">
                                        {callback.name || "Гість"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {format(new Date(callback.created_at), "HH:mm, dd MMM")}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 overflow-hidden p-6 bg-[#0a0a0a]">
                    <KanbanBoard />
                </div>
            </div>
        </div>
    );
}
