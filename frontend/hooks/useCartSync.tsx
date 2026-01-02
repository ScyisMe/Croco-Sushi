"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useCartStore, CartItem } from "@/store/cartStore";
import apiClient from "@/lib/api/apiClient";
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
  // Додаємо реф для відстеження чи відбулась перша синхронізація
  const hasSyncedOnceRef = useRef<boolean>(false);

  // Перевірка авторизації при монтуванні та при змінах localStorage
  useEffect(() => {
    const checkAuth = () => {
      // Don't sync cart on admin pages
      if (window.location.pathname.startsWith('/admin')) {
        setIsAuthenticated(false);
        return;
      }
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

  // Реф для відстеження необхідності синхронізації
  const needsSyncRef = useRef<boolean>(false);
  const itemsRef = useRef(items);

  // Оновлюємо реф items при зміні
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Функція для виконання синхронізації
  const performSync = useCallback(async () => {
    // Якщо вже йде синхронізація, просто виходимо - черга обробить пізніше
    if (syncInProgressRef.current) {
      if (itemsRef.current.length === 0 && hasSyncedOnceRef.current) {
        needsSyncRef.current = true; // Force sync for empty cart
      }
      return;
    }

    try {
      syncInProgressRef.current = true;
      needsSyncRef.current = false;

      const currentItems = itemsRef.current;

      // Перевірка чи варто зберігати
      if (!isAuthenticated) return;
      if (currentItems.length === 0 && !hasSyncedOnceRef.current) return;

      const cartData = {
        items: convertLocalCartToServer(currentItems),
      };

      console.debug("Syncing cart to server:", currentItems.length, "items");
      await apiClient.post("/users/me/cart", cartData);
      lastSyncRef.current = Date.now();
    } catch (error: any) {
      console.error("Помилка збереження кошика:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("access_token");
        setIsAuthenticated(false);
        window.dispatchEvent(new Event("auth-change"));
      }
    } finally {
      syncInProgressRef.current = false;

      // Якщо під час синхронізації з'явились нові зміни - запускаємо знову
      if (needsSyncRef.current) {
        performSync();
      }
    }
  }, [isAuthenticated, convertLocalCartToServer]);

  // Збереження кошика на сервер (публічний метод)
  const saveCartToServer = useCallback(() => {
    needsSyncRef.current = true;
    performSync();
  }, [performSync]);

  // Об'єднання локального та серверного кошиків
  const mergeCart = useCallback(
    (serverCart: ServerCart | null) => {
      // Позначаємо, що ми пройшли процес синхронізації/злиття
      // Тепер безпечно зберігати навіть порожній кошик
      hasSyncedOnceRef.current = true;

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
      } else {
        // Якщо суми однакові, вважаємо що кошики синхронізовані, 
        // або локальні зміни неважливі, тому просто оновлюємо таймштамп
        lastSyncRef.current = Date.now();
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

  // Синхронізація при зміні кошика
  useEffect(() => {
    if (!isAuthenticated) return;

    // Якщо кошик порожній та вже була синхронізація - зберігаємо одразу
    if (items.length === 0 && hasSyncedOnceRef.current) {
      saveCartToServer();
      return;
    }

    // Для не порожнього кошика - debounce
    const timeout = setTimeout(() => {
      saveCartToServer();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, items, saveCartToServer]);

  return {
    syncOnLogin,
    saveCartToServer,
    loadCartFromServer,
    isAuthenticated,
  };
}

export default useCartSync;




