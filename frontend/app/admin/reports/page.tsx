"use client";

import { useState } from "react";
import apiClient from "@/lib/api/apiClient";
import {
  ArrowDownTrayIcon,
  DocumentChartBarIcon,
  TableCellsIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: string, format: string) => {
    setIsExporting(true);
    try {
      // Trigger file download
      const response = await apiClient.get(`/admin/${type}/export`, {
        params: { format },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Звіт успішно завантажено");
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Помилка при експорті звіту");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Звіти та аналітика</h1>
          <p className="text-gray-500">Експорт даних та детальна статистика</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Замовлення */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <DocumentChartBarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Замовлення</h3>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Повний звіт по замовленнях з деталізацією по статусах, сумах та клієнтах.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleExport('orders', 'csv')}
              disabled={isExporting}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2 text-gray-500" />
              Експорт CSV
            </button>
            <button
              onClick={() => handleExport('orders', 'excel')}
              disabled={isExporting}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <TableCellsIcon className="w-5 h-5 mr-2 text-green-600" />
              Експорт Excel
            </button>
          </div>
        </div>

        {/* Товари */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <DocumentChartBarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Товари</h3>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            Звіт по товарах: залишки, ціни, популярність та категорії.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleExport('products', 'csv')}
              disabled={isExporting}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2 text-gray-500" />
              Експорт CSV
            </button>
            <button
              onClick={() => handleExport('products', 'excel')}
              disabled={isExporting}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <TableCellsIcon className="w-5 h-5 mr-2 text-green-600" />
              Експорт Excel
            </button>
          </div>
        </div>

        {/* Клієнти */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
              <DocumentChartBarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Клієнти</h3>
          </div>
          <p className="text-gray-600 text-sm mb-6">
            База клієнтів з контактами, історією замовлень та бонусами.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleExport('users', 'csv')}
              disabled={isExporting}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2 text-gray-500" />
              Експорт CSV
            </button>
            <button
              onClick={() => handleExport('users', 'excel')}
              disabled={isExporting}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <TableCellsIcon className="w-5 h-5 mr-2 text-green-600" />
              Експорт Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

