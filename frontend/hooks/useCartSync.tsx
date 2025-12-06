"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useCartStore, CartItem } from "@/store/cartStore";
import apiClient from "@/lib/api/client";
import toast from "react-hot-toast";

// Інтервал синхронізації (30 секунд)
const SYNC_INTERVAL = 30 * 1000;

interface ServerCartItem {
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  size_id: number | null;
  size_name: string | null;
  price: number;
  quantity: number;
}

interface ServerCart {
  id: number;
  items: ServerCartItem[];
  total_amount: number;
  total_items: number;
}

/**
 * Хук для синхронізації кошика з сервером для авторизованих користувачів
 */
export function useCartSync() {
  const { items, totalAmount, clearCart } = useCartStore();
  const lastSyncRef = useRef<number>(0);
  const syncInProgressRef = useRef<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Перевірка авторизації при монтуванні та при змінах localStorage
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      setIsAuthenticated(!!token);
    };

    // Перевіряємо при монтуванні
    checkAuth();

    // Слухаємо зміни в localStorage (для інших вкладок)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token") {
        checkAuth();
      }
    };

    // Слухаємо custom event для поточної вкладки
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleAuthChange);

    // Періодична перевірка (backup)
    const interval = setInterval(checkAuth, 5000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleAuthChange);
      clearInterval(interval);
    };
  }, []);

  // Конвертація серверного кошика в локальний формат
  const convertServerCartToLocal = useCallback((serverCart: ServerCart): CartItem[] => {
    return serverCart.items.map((item) => ({
      id: item.product_id,
      name: item.product_name,
      slug: item.product_slug,
      price: item.price,
      image_url: item.product_image || undefined,
      size: item.size_name || undefined,
      sizeId: item.size_id || undefined,
      quantity: item.quantity,
    }));
  }, []);

  // Конвертація локального кошика в серверний формат
  const convertLocalCartToServer = useCallback((localItems: CartItem[]) => {
    return localItems.map((item) => ({
      product_id: item.id,
      size_id: item.sizeId || null,
      quantity: item.quantity,
    }));
  }, []);

  // Завантаження кошика з сервера
  const loadCartFromServer = useCallback(async () => {
    if (!isAuthenticated || syncInProgressRef.current) return null;

    try {
      syncInProgressRef.current = true;
      const response = await apiClient.get("/users/me/cart");
      return response.data as ServerCart;
    } catch (error: any) {
      // Кошик може не існувати - це нормально
      console.debug("Кошик на сервері не знайдено:", error);
      // Якщо помилка 401 (Unauthorized), токен недійсний
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("access_token");
        setIsAuthenticated(false);
        window.dispatchEvent(new Event("auth-change"));
      }
      return null;
    } finally {
      syncInProgressRef.current = false;
    }
  }, [isAuthenticated]);

  // Збереження кошика на сервер
  const saveCartToServer = useCallback(async () => {
    if (!isAuthenticated || syncInProgressRef.current || items.length === 0) return;

    try {
      syncInProgressRef.current = true;
      const cartData = {
        items: convertLocalCartToServer(items),
      };

      await apiClient.post("/users/me/cart", cartData);
      lastSyncRef.current = Date.now();
    } catch (error: any) {
      console.error("Помилка збереження кошика:", error);
      // Якщо помилка 401 (Unauthorized), токен недійсний
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("access_token");
        setIsAuthenticated(false);
        window.dispatchEvent(new Event("auth-change")); // Сповіщаємо інші компоненти
      }
    } finally {
      syncInProgressRef.current = false;
    }
  }, [isAuthenticated, items, convertLocalCartToServer]);

  // Об'єднання локального та серверного кошиків
  const mergeCart = useCallback(
    (serverCart: ServerCart | null) => {
      if (!serverCart || serverCart.items.length === 0) {
        // Якщо серверний кошик порожній, зберігаємо локальний
        if (items.length > 0) {
          saveCartToServer();
        }
        return;
      }

      const localItems = items;
      const serverItems = convertServerCartToLocal(serverCart);

      // Якщо локальний кошик порожній, використовуємо серверний
      if (localItems.length === 0) {
        // Додаємо товари з сервера до локального store
        serverItems.forEach((item) => {
          useCartStore.getState().addItem(item);
        });
        return;
      }

      // Якщо обидва непорожні - питаємо користувача
      const localTotal = localItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (Math.abs(localTotal - serverCart.total_amount) > 1) {
        // Є різниця між кошиками
        toast((t) => (
          <div className="flex flex-col gap-2">
            <p className="font-medium">У вас є збережений кошик</p>
            <p className="text-sm text-gray-600">
              Хочете відновити попередній кошик чи залишити поточний?
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  // Використовуємо серверний кошик
                  clearCart();
                  serverItems.forEach((item) => {
                    useCartStore.getState().addItem(item);
                  });
                  toast.dismiss(t.id);
                  toast.success("Кошик відновлено");
                }}
                className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg"
              >
                Відновити ({serverCart.total_amount.toFixed(0)} ₴)
              </button>
              <button
                onClick={() => {
                  // Зберігаємо локальний кошик на сервер
                  saveCartToServer();
                  toast.dismiss(t.id);
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg"
              >
                Залишити поточний
              </button>
            </div>
          </div>
        ), { duration: 10000 });
      }
    },
    [items, clearCart, convertServerCartToLocal, saveCartToServer]
  );

  // Синхронізація при логіні
  const syncOnLogin = useCallback(async () => {
    if (!isAuthenticated) return;

    const serverCart = await loadCartFromServer();
    mergeCart(serverCart);
  }, [isAuthenticated, loadCartFromServer, mergeCart]);

  // Синхронізація при зміні статусу авторизації
  useEffect(() => {
    if (isAuthenticated) {
      syncOnLogin();
    }
  }, [isAuthenticated, syncOnLogin]);

  // Автоматична синхронізація
  useEffect(() => {
    if (!isAuthenticated) return;

    // Періодична синхронізація
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSyncRef.current >= SYNC_INTERVAL && items.length > 0) {
        saveCartToServer();
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, saveCartToServer, items.length]);

  // Синхронізація при зміні кошика (з debounce)
  useEffect(() => {
    if (!isAuthenticated || items.length === 0) return;

    const timeout = setTimeout(() => {
      saveCartToServer();
    }, 2000); // Debounce 2 секунди

    return () => clearTimeout(timeout);
  }, [isAuthenticated, items, totalAmount, saveCartToServer]);

  return {
    syncOnLogin,
    saveCartToServer,
    loadCartFromServer,
    isAuthenticated,
  };
}

export default useCartSync;



