"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import apiClient from "@/lib/api/apiClient";
import {
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UsersIcon,
  StarIcon,
  GiftIcon,
  TicketIcon,
  TruckIcon,
  Cog6ToothIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// Типи
interface User {
  id: number;
  phone: string;
  email?: string;
  name?: string;
  role: "user" | "admin" | "manager";
}

const NAV_ITEMS = [
  { href: "/admin", label: "Дашборд", icon: HomeIcon },
  { href: "/admin/orders", label: "Замовлення", icon: ClipboardDocumentListIcon },
  { href: "/admin/history", label: "Історія замовлень", icon: ClockIcon },
  { href: "/admin/products", label: "Товари", icon: ShoppingBagIcon },
  { href: "/admin/categories", label: "Категорії", icon: TagIcon },
  { href: "/admin/users", label: "Користувачі", icon: UsersIcon },
  { href: "/admin/reviews", label: "Відгуки", icon: StarIcon },
  { href: "/admin/promotions", label: "Акції", icon: GiftIcon },
  { href: "/admin/promo-codes", label: "Промокоди", icon: TicketIcon },
  // { href: "/admin/delivery-zones", label: "Доставка", icon: TruckIcon }, // Removed
  { href: "/admin/settings", label: "Налаштування", icon: Cog6ToothIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ref для відстеження mounted стану (запобігає memory leak)
  const isMountedRef = useRef(true);

  // Очищення токенів
  const clearAuth = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }, []);

  useEffect(() => {
    // Встановлюємо mounted стан
    isMountedRef.current = true;

    // Сторінка логіну не потребує перевірки авторизації
    if (pathname === "/admin/login") {
      setIsLoading(false);
      setIsAuthenticated(true);
      return;
    }

    // Перевірка авторизації адміністратора через бекенд
    const verifyAdmin = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/admin/login");
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        return;
      }

      try {
        // Перевіряємо роль користувача через API
        const response = await apiClient.get<User>("/users/me");
        const user = response.data;

        // Перевірка чи компонент ще mounted
        if (!isMountedRef.current) return;

        if (user.role !== "admin" && user.role !== "manager") {
          // Якщо не адмін і не менеджер - видаляємо токен і перенаправляємо
          clearAuth();
          router.push("/admin/login");
        } else {
          // Якщо менеджер намагається зайти на сторінки адміна (крім /admin/manager та чеків)
          const isReceiptPage = window.location.pathname.includes("/receipt");
          if (user.role === "manager" && !window.location.pathname.startsWith("/admin/manager") && !isReceiptPage) {
            router.push("/admin/manager");
            return;
          }
          // Якщо адмін (не менеджер) намагається зайти на сторінку менеджера - дозволяємо (або можна редіректити, але хай буде доступ)

          setIsAuthenticated(true);
        }
      } catch {
        // Якщо помилка (невалідний токен) - перенаправляємо на логін
        if (!isMountedRef.current) return;

        clearAuth();
        router.push("/admin/login");
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    verifyAdmin();

    // Cleanup функція для запобігання memory leak
    return () => {
      isMountedRef.current = false;
    };
  }, [router, pathname, clearAuth]);

  const handleLogout = useCallback(() => {
    clearAuth();
    router.push("/admin/login");
  }, [clearAuth, router]);

  // Показуємо завантаження
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Сторінка логіну без бокової панелі
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Якщо не авторизований - не показуємо нічого
  if (!isAuthenticated) {
    return null;
  }

  // Manger Layout Override - якщо ми на сторінці менеджера або чеку, рендеримо без сайдбару адміна
  if (pathname.startsWith("/admin/manager") || pathname.includes("/receipt")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-surface text-gray-100">
      {/* Мобільна кнопка меню */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-surface-card rounded-lg shadow-md text-gray-200 hover:text-primary-500"
        >
          {sidebarOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Overlay для мобільного меню */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Бокова панель */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-card shadow-xl transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Логотип видалено за запитом */}
          <div className="p-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center space-x-2">
              <div>
                <span className="text-xl font-bold text-primary-500">Croco Admin</span>
              </div>
            </Link>
          </div>

          {/* Навігація */}
          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${isActive
                    ? "bg-white/10 text-primary-500 font-medium"
                    : "text-gray-400 hover:bg-white/5 hover:text-primary-500"
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Кнопка виходу */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full text-gray-400 hover:bg-white/5 hover:text-red-400 rounded-lg transition"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Вийти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Основний контент */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}





