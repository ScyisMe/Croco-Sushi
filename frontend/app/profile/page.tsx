"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { User, Address, Order, Favorite, LoyaltyInfo, OrderStatus } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toast from "react-hot-toast";
import {
  UserIcon,
  MapPinIcon,
  ShoppingBagIcon,
  HeartIcon,
  StarIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  GiftIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

// Вкладки профілю
const TABS = [
  { id: "profile", name: "Профіль", icon: UserIcon },
  { id: "addresses", name: "Адреси", icon: MapPinIcon },
  { id: "orders", name: "Замовлення", icon: ShoppingBagIcon },
  { id: "favorites", name: "Обране", icon: HeartIcon },
  { id: "loyalty", name: "Бонуси", icon: GiftIcon },
];

// Статуси замовлень
const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Очікує", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Підтверджено", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Готується", color: "bg-purple-100 text-purple-800" },
  ready: { label: "Готове", color: "bg-indigo-100 text-indigo-800" },
  delivering: { label: "Доставляється", color: "bg-cyan-100 text-cyan-800" },
  delivered: { label: "Доставлено", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Скасовано", color: "bg-red-100 text-red-800" },
};

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Форма профілю
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    newsletter_subscription: false,
  });

  // Форма адреси
  const [addressForm, setAddressForm] = useState({
    city: "Львів",
    street: "",
    building: "",
    apartment: "",
    entrance: "",
    floor: "",
    comment: "",
    is_default: false,
  });

  // Перевірка авторизації
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Запит профілю
  const userQuery = useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me");
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Запит адрес
  const addressesQuery = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/addresses");
      return response.data;
    },
    enabled: isAuthenticated && activeTab === "addresses",
  });

  // Запит замовлень
  const ordersQuery = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/orders");
      return response.data;
    },
    enabled: isAuthenticated && activeTab === "orders",
  });

  // Запит обраного
  const favoritesQuery = useQuery<Favorite[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/favorites");
      return response.data;
    },
    enabled: isAuthenticated && activeTab === "favorites",
  });

  // Запит лояльності
  const loyaltyQuery = useQuery<LoyaltyInfo>({
    queryKey: ["loyalty"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/loyalty");
      return response.data;
    },
    enabled: isAuthenticated && activeTab === "loyalty",
  });

  // Оновлення профілю при завантаженні даних
  useEffect(() => {
    if (userQuery.data) {
      setProfileForm({
        name: userQuery.data.name || "",
        email: userQuery.data.email || "",
        newsletter_subscription: userQuery.data.newsletter_subscription,
      });
    }
  }, [userQuery.data]);

  // Мутація оновлення профілю
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const response = await apiClient.put("/users/me", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Профіль оновлено");
      setIsEditingProfile(false);
    },
    onError: () => {
      toast.error("Помилка оновлення профілю");
    },
  });

  // Мутації адрес
  const createAddressMutation = useMutation({
    mutationFn: async (data: typeof addressForm) => {
      const response = await apiClient.post("/users/me/addresses", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Адресу додано");
      closeAddressModal();
    },
    onError: () => {
      toast.error("Помилка додавання адреси");
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof addressForm }) => {
      const response = await apiClient.put(`/users/me/addresses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Адресу оновлено");
      closeAddressModal();
    },
    onError: () => {
      toast.error("Помилка оновлення адреси");
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/users/me/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Адресу видалено");
    },
    onError: () => {
      toast.error("Помилка видалення адреси");
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/users/me/addresses/${id}/default`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Адресу встановлено за замовчуванням");
    },
    onError: () => {
      toast.error("Помилка оновлення адреси");
    },
  });

  // Мутація видалення з обраного
  const removeFavoriteMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiClient.delete(`/users/me/favorites/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Видалено з обраного");
    },
    onError: () => {
      toast.error("Помилка видалення");
    },
  });

  // Вихід з акаунту
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
    toast.success("Ви вийшли з акаунту");
  };

  // Модальне вікно адреси
  const openAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        city: address.city,
        street: address.street,
        building: address.building,
        apartment: address.apartment || "",
        entrance: address.entrance || "",
        floor: address.floor || "",
        comment: address.comment || "",
        is_default: address.is_default,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        city: "Львів",
        street: "",
        building: "",
        apartment: "",
        entrance: "",
        floor: "",
        comment: "",
        is_default: false,
      });
    }
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  const handleAddressSubmit = () => {
    if (!addressForm.street || !addressForm.building) {
      toast.error("Заповніть обов'язкові поля");
      return;
    }
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm });
    } else {
      createAddressMutation.mutate(addressForm);
    }
  };

  // Копіювання реферального коду
  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Код скопійовано");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow">
        {/* Заголовок */}
        <div className="bg-white border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-secondary">
                  Особистий кабінет
                </h1>
                {userQuery.data && (
                  <p className="text-secondary-light mt-1">
                    {userQuery.data.phone}
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-secondary-light hover:text-accent-red transition"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Вийти</span>
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Бокова панель з вкладками */}
            <div className="lg:col-span-1">
              <nav className="bg-white rounded-xl shadow-card p-2">
                <ul className="space-y-1">
                  {TABS.map((tab) => (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                          activeTab === tab.id
                            ? "bg-primary text-white"
                            : "text-secondary hover:bg-gray-100"
                        }`}
                      >
                        <tab.icon className="w-5 h-5" />
                        <span className="font-medium">{tab.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Основний контент */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
                {/* Вкладка: Профіль */}
                {activeTab === "profile" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-secondary">Особисті дані</h2>
                      {!isEditingProfile && (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 text-primary hover:text-primary-600 transition"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Редагувати
                        </button>
                      )}
                    </div>

                    {userQuery.isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : isEditingProfile ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">
                            Ім&apos;я
                          </label>
                          <input
                            type="text"
                            value={profileForm.name}
                            onChange={(e) =>
                              setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="input"
                            placeholder="Ваше ім'я"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) =>
                              setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                            }
                            className="input"
                            placeholder="email@example.com"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profileForm.newsletter_subscription}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  newsletter_subscription: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-secondary">Отримувати новини та акції</span>
                          </label>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => updateProfileMutation.mutate(profileForm)}
                            disabled={updateProfileMutation.isPending}
                            className="btn-primary"
                          >
                            {updateProfileMutation.isPending ? "Збереження..." : "Зберегти"}
                          </button>
                          <button
                            onClick={() => setIsEditingProfile(false)}
                            className="px-6 py-2.5 border border-border rounded-lg text-secondary hover:bg-gray-50 transition"
                          >
                            Скасувати
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-border">
                          <span className="text-secondary-light">Телефон</span>
                          <span className="font-medium text-secondary">
                            {userQuery.data?.phone}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border">
                          <span className="text-secondary-light">Ім&apos;я</span>
                          <span className="font-medium text-secondary">
                            {userQuery.data?.name || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border">
                          <span className="text-secondary-light">Email</span>
                          <span className="font-medium text-secondary">
                            {userQuery.data?.email || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-border">
                          <span className="text-secondary-light">Бонусні бали</span>
                          <span className="font-bold text-primary">
                            {userQuery.data?.bonus_balance || 0} балів
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <span className="text-secondary-light">Статус</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            userQuery.data?.loyalty_status === "gold"
                              ? "bg-yellow-100 text-yellow-800"
                              : userQuery.data?.loyalty_status === "silver"
                              ? "bg-gray-200 text-gray-700"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {userQuery.data?.loyalty_status === "gold"
                              ? "Золотий"
                              : userQuery.data?.loyalty_status === "silver"
                              ? "Срібний"
                              : "Новий"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Вкладка: Адреси */}
                {activeTab === "addresses" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-secondary">Мої адреси</h2>
                      <button
                        onClick={() => openAddressModal()}
                        className="flex items-center gap-2 btn-primary"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Додати
                      </button>
                    </div>

                    {addressesQuery.isLoading ? (
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : addressesQuery.data?.length === 0 ? (
                      <div className="text-center py-12">
                        <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-secondary-light">У вас ще немає збережених адрес</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {addressesQuery.data?.map((address) => (
                          <div
                            key={address.id}
                            className={`p-4 border rounded-xl transition ${
                              address.is_default
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium text-secondary">
                                    {address.city}, вул. {address.street}, {address.building}
                                    {address.apartment && `, кв. ${address.apartment}`}
                                  </p>
                                  {address.is_default && (
                                    <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                                      За замовчуванням
                                    </span>
                                  )}
                                </div>
                                {address.comment && (
                                  <p className="text-sm text-secondary-light">{address.comment}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {!address.is_default && (
                                  <button
                                    onClick={() => setDefaultAddressMutation.mutate(address.id)}
                                    className="p-2 text-secondary-light hover:text-primary transition"
                                    title="Встановити за замовчуванням"
                                  >
                                    <CheckIcon className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => openAddressModal(address)}
                                  className="p-2 text-secondary-light hover:text-primary transition"
                                  title="Редагувати"
                                >
                                  <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Видалити адресу?")) {
                                      deleteAddressMutation.mutate(address.id);
                                    }
                                  }}
                                  className="p-2 text-secondary-light hover:text-accent-red transition"
                                  title="Видалити"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Вкладка: Замовлення */}
                {activeTab === "orders" && (
                  <div>
                    <h2 className="text-xl font-bold text-secondary mb-6">Мої замовлення</h2>

                    {ordersQuery.isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : ordersQuery.data?.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-secondary-light mb-4">У вас ще немає замовлень</p>
                        <Link href="/menu" className="btn-primary">
                          Перейти до меню
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {ordersQuery.data?.map((order) => (
                          <div
                            key={order.id}
                            className="p-4 border border-border rounded-xl hover:border-primary/50 transition"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-bold text-secondary">
                                  Замовлення #{order.order_number}
                                </p>
                                <p className="text-sm text-secondary-light">
                                  {new Date(order.created_at).toLocaleDateString("uk-UA", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  ORDER_STATUS_MAP[order.status]?.color
                                }`}
                              >
                                {ORDER_STATUS_MAP[order.status]?.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
                              {order.items.slice(0, 4).map((item, index) => (
                                <div
                                  key={index}
                                  className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
                                >
                                  {item.product_image ? (
                                    <Image
                                      src={item.product_image}
                                      alt={item.product_name}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl">
                                      🍣
                                    </div>
                                  )}
                                </div>
                              ))}
                              {order.items.length > 4 && (
                                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-secondary-light">
                                  +{order.items.length - 4}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-primary text-lg">
                                {order.total_amount} ₴
                              </p>
                              <Link
                                href={`/orders/${order.order_number}/track`}
                                className="flex items-center gap-1 text-primary hover:text-primary-600 transition"
                              >
                                Деталі
                                <ChevronRightIcon className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Вкладка: Обране */}
                {activeTab === "favorites" && (
                  <div>
                    <h2 className="text-xl font-bold text-secondary mb-6">Обрані товари</h2>

                    {favoritesQuery.isLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : favoritesQuery.data?.length === 0 ? (
                      <div className="text-center py-12">
                        <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-secondary-light mb-4">
                          У вас ще немає обраних товарів
                        </p>
                        <Link href="/menu" className="btn-primary">
                          Перейти до меню
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {favoritesQuery.data?.map((favorite) => {
                          // Перевіряємо чи product існує
                          if (!favorite.product) {
                            return (
                              <div
                                key={favorite.id}
                                className="flex gap-4 p-4 border border-border rounded-xl bg-gray-50"
                              >
                                <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-200 flex items-center justify-center text-3xl">
                                  🍣
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <p className="text-secondary-light">Товар недоступний</p>
                                </div>
                                <button
                                  onClick={() => removeFavoriteMutation.mutate(favorite.product_id)}
                                  className="p-2 text-accent-red hover:bg-red-50 rounded-lg transition self-start"
                                  title="Видалити з обраного"
                                >
                                  <HeartSolid className="w-6 h-6" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={favorite.id}
                              className="flex gap-4 p-4 border border-border rounded-xl hover:border-primary/50 transition"
                            >
                              <Link
                                href={`/products/${favorite.product.slug}`}
                                className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
                              >
                                {favorite.product.image_url ? (
                                  <Image
                                    src={favorite.product.image_url}
                                    alt={favorite.product.name}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-3xl">
                                    🍣
                                  </div>
                                )}
                              </Link>
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/products/${favorite.product.slug}`}
                                  className="font-medium text-secondary hover:text-primary transition line-clamp-2"
                                >
                                  {favorite.product.name}
                                </Link>
                                <p className="text-lg font-bold text-primary mt-2">
                                  {favorite.product.price} ₴
                                </p>
                              </div>
                              <button
                                onClick={() => removeFavoriteMutation.mutate(favorite.product_id)}
                                className="p-2 text-accent-red hover:bg-red-50 rounded-lg transition self-start"
                                title="Видалити з обраного"
                              >
                                <HeartSolid className="w-6 h-6" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Вкладка: Бонуси */}
                {activeTab === "loyalty" && (
                  <div>
                    <h2 className="text-xl font-bold text-secondary mb-6">Програма лояльності</h2>

                    {loyaltyQuery.isLoading ? (
                      <div className="space-y-4">
                        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Баланс балів */}
                        <div className="bg-gradient-to-r from-primary to-primary-600 text-white rounded-2xl p-6">
                          <p className="text-sm opacity-90 mb-2">Ваш баланс</p>
                          <p className="text-4xl font-bold mb-4">
                            {loyaltyQuery.data?.bonus_balance || 0} балів
                          </p>
                          <p className="text-sm opacity-90">
                            1 бал = 1 ₴ при оплаті замовлення
                          </p>
                        </div>

                        {/* Статус */}
                        <div className="p-4 border border-border rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-secondary-light">Ваш статус</span>
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                              loyaltyQuery.data?.loyalty_status === "gold"
                                ? "bg-yellow-100 text-yellow-800"
                                : loyaltyQuery.data?.loyalty_status === "silver"
                                ? "bg-gray-200 text-gray-700"
                                : "bg-green-100 text-green-800"
                            }`}>
                              {loyaltyQuery.data?.loyalty_status === "gold"
                                ? "⭐ Золотий"
                                : loyaltyQuery.data?.loyalty_status === "silver"
                                ? "🥈 Срібний"
                                : "🌱 Новий"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-2xl font-bold text-secondary">
                                {loyaltyQuery.data?.total_orders || 0}
                              </p>
                              <p className="text-sm text-secondary-light">Замовлень</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-2xl font-bold text-secondary">
                                {loyaltyQuery.data?.total_spent || 0} ₴
                              </p>
                              <p className="text-sm text-secondary-light">Витрачено</p>
                            </div>
                          </div>
                        </div>

                        {/* Реферальний код */}
                        {loyaltyQuery.data?.referral_code && (
                          <div className="p-4 border border-border rounded-xl">
                            <p className="text-secondary mb-3">
                              Запрошуйте друзів та отримуйте бонуси!
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono font-bold text-secondary">
                                {loyaltyQuery.data.referral_code}
                              </div>
                              <button
                                onClick={() => copyReferralCode(loyaltyQuery.data?.referral_code || "")}
                                className="p-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
                                title="Копіювати"
                              >
                                <ClipboardDocumentIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Правила */}
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <h3 className="font-semibold text-secondary mb-3">Як отримати бали?</h3>
                          <ul className="space-y-2 text-sm text-secondary-light">
                            <li className="flex items-start gap-2">
                              <CheckIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>5% від суми кожного замовлення</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>100 балів за реєстрацію друга за вашим кодом</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>Бонусні акції та промокоди</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Модальне вікно адреси */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-modal p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-secondary">
                {editingAddress ? "Редагувати адресу" : "Нова адреса"}
              </h3>
              <button
                onClick={closeAddressModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Місто *</label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="input"
                  placeholder="Львів"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Вулиця *</label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                  className="input"
                  placeholder="Назва вулиці"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Будинок *</label>
                  <input
                    type="text"
                    value={addressForm.building}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, building: e.target.value }))
                    }
                    className="input"
                    placeholder="№"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Квартира</label>
                  <input
                    type="text"
                    value={addressForm.apartment}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, apartment: e.target.value }))
                    }
                    className="input"
                    placeholder="№"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Під&apos;їзд</label>
                  <input
                    type="text"
                    value={addressForm.entrance}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, entrance: e.target.value }))
                    }
                    className="input"
                    placeholder="№"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Поверх</label>
                  <input
                    type="text"
                    value={addressForm.floor}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, floor: e.target.value }))}
                    className="input"
                    placeholder="№"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Коментар</label>
                <textarea
                  value={addressForm.comment}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, comment: e.target.value }))}
                  className="input resize-none"
                  rows={2}
                  placeholder="Додаткова інформація..."
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))
                  }
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-secondary">Зробити адресою за замовчуванням</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddressSubmit}
                disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                className="flex-1 btn-primary"
              >
                {createAddressMutation.isPending || updateAddressMutation.isPending
                  ? "Збереження..."
                  : "Зберегти"}
              </button>
              <button
                onClick={closeAddressModal}
                className="px-6 py-2.5 border border-border rounded-lg text-secondary hover:bg-gray-50 transition"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
