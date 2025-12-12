"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/store/localeStore";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { EnvelopeIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface Subscriber {
    id: number;
    email: string;
    is_active: boolean;
    created_at: string;
}

export default function AdminNewsletterPage() {
    const { t } = useTranslation();
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        try {
            const response = await apiClient.get("/admin/newsletter/subscribers");
            setSubscribers(response.data);
        } catch (error) {
            toast.error("Failed to load subscribers");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !body) return;

        // Confirm dialog
        if (!confirm(`Are you sure you want to send this email to all subscribers?`)) {
            return;
        }

        try {
            setIsSending(true);
            await apiClient.post("/admin/newsletter/send", {
                subject,
                body
            });
            toast.success("Newsletter queued for sending!");
            setSubject("");
            setBody("");
        } catch (error) {
            toast.error("Failed to send newsletter");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-display font-bold text-white">
                    Newsletter Management
                </h1>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                    <UserGroupIcon className="w-5 h-5 text-primary" />
                    <span className="text-gray-400">Total Subscribers:</span>
                    <span className="text-xl font-bold text-white">{subscribers.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Send Form */}
                <div className="space-y-6">
                    <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <EnvelopeIcon className="w-5 h-5 text-primary" />
                            Compose Newsletter
                        </h2>

                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none transition-colors"
                                    placeholder="Enter email subject"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Message Body (HTML supported)
                                </label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none transition-colors min-h-[300px]"
                                    placeholder="Enter email content..."
                                    required
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSending}
                                >
                                    {isSending ? "Queueing..." : "Send Newsletter"}
                                </Button>
                                <p className="text-xs text-gray-500 text-center mt-2">
                                    This will send an email to all active subscribers.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Recent Subscribers List */}
                <div className="space-y-6">
                    <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">
                            Recent Subscribers
                        </h2>

                        {isLoading ? (
                            <div className="space-y-4 animate-pulse">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-12 bg-white/5 rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="text-xs uppercase text-gray-500 font-medium">
                                        <tr>
                                            <th className="pb-3 pl-2">Email</th>
                                            <th className="pb-3">Status</th>
                                            <th className="pb-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {subscribers.slice(0, 10).map((sub) => (
                                            <tr key={sub.id} className="text-sm">
                                                <td className="py-3 pl-2 text-white">{sub.email}</td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {sub.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-gray-400">
                                                    {new Date(sub.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {subscribers.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-8 text-center text-gray-500">
                                                    No subscribers yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
