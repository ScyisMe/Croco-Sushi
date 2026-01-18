"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import CategoryForm from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);

    try {
      await apiClient.post("/admin/categories", formData);
      toast.success("Категорію створено!");
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка створення категорії");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CategoryForm
      title="Нова категорія"
      subtitle="Створення нової категорії товарів"
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}

