"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { User } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const userQuery = useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me");
      return response.data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Особистий кабінет</h1>
        {userQuery.isLoading ? (
          <div>Завантаження...</div>
        ) : userQuery.data ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-lg mb-2">Телефон: {userQuery.data.phone}</p>
            {userQuery.data.email && <p className="text-lg mb-2">Email: {userQuery.data.email}</p>}
            {userQuery.data.name && <p className="text-lg mb-2">Ім&apos;я: {userQuery.data.name}</p>}
            <p className="text-lg mb-2">Бонусні бали: {userQuery.data.bonus_balance}</p>
            <p className="text-lg mb-2">Статус лояльності: {userQuery.data.loyalty_status}</p>
          </div>
        ) : (
          <div>Помилка завантаження профілю</div>
        )}
      </main>
      <Footer />
    </div>
  );
}


