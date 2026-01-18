"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/api/apiClient";
import toast from "react-hot-toast";
import CategoryForm from "@/components/admin/CategoryForm";

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      // Use admin endpoint to get category by ID
      const response = await apiClient.get(`/admin/categories`);
      const categories = response.data;
      const category = categories.find((c: any) => c.id === parseInt(categoryId));

      if (!category) {
        toast.error("Категорію не знайдено");
        router.push("/admin/categories");
        return;
      }

      setInitialData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        image_url: category.image_url || "",
        position: category.position || category.sort_order || 0,
        is_active: category.is_active ?? true,
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      toast.error("Помилка завантаження категорії");
      router.push("/admin/categories");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);

    try {
      await apiClient.put(`/admin/categories/${categoryId}`, formData);
      toast.success("Категорію оновлено!");
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Помилка оновлення категорії");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <CategoryForm
      title="Редагування категорії"
      subtitle={`Зміна даних категорії "${initialData?.name}"`}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      initialData={initialData}
    />
  );
}

