"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SalesChartProps {
    data?: Array<{
        date: string;
        sales: number;
        orders: number;
    }>;
    isLoading?: boolean;
}

export default function SalesChart({ data = [], isLoading = false }: SalesChartProps) {
    if (isLoading) {
        return (
            <div className="bg-surface-card rounded-xl shadow-sm p-6 border border-white/10">
                <div className="h-4 bg-white/10 rounded w-32 mb-6 animate-pulse"></div>
                <div className="h-64 bg-white/5 rounded animate-pulse"></div>
            </div>
        );
    }

    const chartData = data;

    return (
        <div className="bg-surface-card rounded-xl shadow-sm p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-6">Динаміка продажів</h3>
            {chartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                    Ще немає даних про продажі
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            stroke="#4b5563"
                        />
                        <YAxis
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            stroke="#4b5563"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                color: '#f3f4f6'
                            }}
                            itemStyle={{ color: '#e5e7eb' }}
                            labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                        />
                        <Legend wrapperStyle={{ color: '#9ca3af' }} />
                        <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Продажі (₴)"
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="orders"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Замовлення"
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
