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
  GiftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ChevronRightIcon,
  CheckIcon,
  ArrowLeftStartOnRectangleIcon,
  StarIcon,
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

// Статуси замовлень (Dark Mode)
const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Очікує", color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" },
  confirmed: { label: "Підтверджено", color: "bg-blue-500/20 text-blue-400 border border-blue-500/30" },
  preparing: { label: "Готується", color: "bg-purple-500/20 text-purple-400 border border-purple-500/30" },
  ready: { label: "Готове", color: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" },
  delivering: { label: "Доставляється", color: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" },
  delivered: { label: "Доставлено", color: "bg-green-500/20 text-green-400 border border-green-500/30" },
  cancelled: { label: "Скасовано", color: "bg-red-500/20 text-red-400 border border-red-500/30" },
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow pt-24 pb-12">
        {/* Заголовок */}
        <div className="container mx-auto px-4 mb-8">
          <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-display text-gradient-gold">
                Особистий кабінет
              </h1>
              {userQuery.data && (
                <p className="text-gray-300 mt-2 text-lg">
                  Вітаємо, <span className="text-white font-medium">{userQuery.data.name || 'Гостю'}</span>!
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-accent-red transition-all duration-200 text-sm opacity-70 hover:opacity-100"
            >
              <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
              <span>Вийти</span>
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Бокова панель з вкладками */}
            <div className="lg:col-span-1">
              <nav className="glass-card rounded-2xl p-3 sticky top-28">
                <ul className="space-y-1">
                  {TABS.map((tab) => (
                    <li key={tab.id}>
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id
                          ? "bg-primary-500 text-surface-dark font-semibold shadow-lg shadow-primary-500/30"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                      >
                        <tab.icon className="w-5 h-5" />
                        <span className="font-medium">{tab.name}</span>
                        {activeTab === tab.id && (
                          <ChevronRightIcon className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Основний контент */}
            <div className="lg:col-span-3">
              <div className="glass-card rounded-2xl p-6 md:p-8 min-h-[500px] animate-fade-in">
                {/* Вкладка: Профіль */}
                {activeTab === "profile" && (
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold font-display">Особисті дані</h2>
                      {!isEditingProfile && (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 text-primary-500 hover:text-primary-400 transition"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Редагувати
                        </button>
                      )}
                    </div>

                    {userQuery.isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : isEditingProfile ? (
                      <div className="space-y-6 max-w-xl">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
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
                          <label className="block text-sm font-medium text-gray-300 mb-2">
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
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={profileForm.newsletter_subscription}
                                onChange={(e) =>
                                  setProfileForm((prev) => ({
                                    ...prev,
                                    newsletter_subscription: e.target.checked,
                                  }))
                                }
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 checked:border-primary-500 checked:bg-primary-500 transition-all"
                              />
                              <CheckIcon className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-gray-300 group-hover:text-white transition-colors">
                              Отримувати новини та акції
                            </span>
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
                            className="px-6 py-3 border border-white/10 rounded-xl text-gray-300 hover:bg-white/5 transition"
                          >
                            Скасувати
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="grid grid-cols-[140px_1fr] items-center py-4 border-b border-white/10">
                          <span className="text-gray-400">Телефон</span>
                          <span className="font-medium text-white text-lg">
                            {userQuery.data?.phone}
                          </span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center py-4 border-b border-white/10">
                          <span className="text-gray-400">Ім&apos;я</span>
                          <span className="font-medium text-white text-lg">
                            {userQuery.data?.name || "—"}
                          </span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center py-4 border-b border-white/10">
                          <span className="text-gray-400">Email</span>
                          <span className="font-medium text-white text-lg">
                            {userQuery.data?.email || "—"}
                          </span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center py-4 border-b border-white/10">
                          <span className="text-gray-400">Бонусні бали</span>
                          <span className="font-bold text-accent-gold text-lg">
                            {userQuery.data?.bonus_balance || 0} балів
                          </span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr] items-center py-4">
                          <span className="text-gray-400">Статус</span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border w-fit ${userQuery.data?.loyalty_status === "gold"
                              ? "bg-gradient-to-r from-yellow-500/30 to-amber-500/20 text-yellow-300 border-yellow-400/40 shadow-lg shadow-yellow-500/10"
                              : userQuery.data?.loyalty_status === "silver"
                                ? "bg-gradient-to-r from-gray-400/20 to-slate-400/20 text-gray-200 border-gray-400/40"
                                : "bg-gradient-to-r from-emerald-500/30 to-green-500/20 text-emerald-300 border-emerald-400/50 shadow-lg shadow-emerald-500/10"
                              }`}
                          >
                            <StarIcon className="w-4 h-4" />
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
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold font-display">Мої адреси</h2>
                      <button
                        onClick={() => openAddressModal()}
                        className="flex items-center gap-2 btn-primary py-2 px-4 text-sm"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Додати
                      </button>
                    </div>

                    {addressesQuery.isLoading ? (
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : addressesQuery.data?.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MapPinIcon className="w-10 h-10 text-gray-500" />
                        </div>
                        <p className="text-gray-400">У вас ще немає збережених адрес</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addressesQuery.data?.map((address) => (
                          <div
                            key={address.id}
                            className={`p-5 border rounded-xl transition-all duration-200 group ${address.is_default
                              ? "border-primary-500 bg-primary-500/10"
                              : "border-white/10 bg-white/5 hover:border-primary-500/50"
                              }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${address.is_default ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                  <MapPinIcon className="w-5 h-5" />
                                </div>
                                {address.is_default && (
                                  <span className="text-xs font-medium text-primary-400">
                                    Основна
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!address.is_default && (
                                  <button
                                    onClick={() => setDefaultAddressMutation.mutate(address.id)}
                                    className="p-2 text-gray-400 hover:text-primary-400 hover:bg-white/10 rounded-lg transition"
                                    title="Встановити за замовчуванням"
                                  >
                                    <CheckIcon className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => openAddressModal(address)}
                                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                                  title="Редагувати"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Видалити адресу?")) {
                                      deleteAddressMutation.mutate(address.id);
                                    }
                                  }}
                                  className="p-2 text-gray-400 hover:text-accent-red hover:bg-white/10 rounded-lg transition"
                                  title="Видалити"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <p className="font-medium text-white mb-1">
                              {address.city}, {address.street}, {address.building}
                            </p>
                            <p className="text-sm text-gray-400">
                              {address.apartment && `кв. ${address.apartment}`}
                              {address.entrance && `, під'їзд ${address.entrance}`}
                              {address.floor && `, поверх ${address.floor}`}
                            </p>
                            {address.comment && (
                              <p className="text-sm text-gray-500 mt-2 italic">
                                &quot;{address.comment}&quot;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Вкладка: Замовлення */}
                {activeTab === "orders" && (
                  <div>
                    <h2 className="text-2xl font-bold font-display mb-8">Мої замовлення</h2>

                    {ordersQuery.isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : ordersQuery.data?.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ShoppingBagIcon className="w-10 h-10 text-gray-500" />
                        </div>
                        <p className="text-gray-400 mb-6">У вас ще немає замовлень</p>
                        <Link href="/menu" className="btn-primary inline-flex">
                          Перейти до меню
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {ordersQuery.data?.map((order) => (
                          <div
                            key={order.id}
                            className="p-5 border border-white/10 bg-white/5 rounded-xl hover:border-primary-500/30 transition-all duration-200"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <p className="font-bold text-lg text-white">
                                    #{order.order_number}
                                  </p>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${ORDER_STATUS_MAP[order.status]?.color
                                      }`}
                                  >
                                    {ORDER_STATUS_MAP[order.status]?.label}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400">
                                  {new Date(order.created_at).toLocaleDateString("uk-UA", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary-400 text-xl">
                                  {order.total_amount} ₴
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {order.items.slice(0, 5).map((item, index) => (
                                <div
                                  key={index}
                                  className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10"
                                >
                                  {item.product_image ? (
                                    <Image
                                      src={item.product_image}
                                      alt={item.product_name}
                                      width={56}
                                      height={56}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Image
                                        src="/logo.png"
                                        alt={item.product_name}
                                        width={30}
                                        height={30}
                                        className="object-contain opacity-50 grayscale"
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                              {order.items.length > 5 && (
                                <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-medium text-gray-400">
                                  +{order.items.length - 5}
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                              <Link
                                href={`/orders/${order.order_number}/track`}
                                className="flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition"
                              >
                                Деталі замовлення
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
                    <h2 className="text-2xl font-bold font-display mb-8">Обрані товари</h2>

                    {favoritesQuery.isLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : favoritesQuery.data?.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <HeartIcon className="w-10 h-10 text-gray-500" />
                        </div>
                        <p className="text-gray-400 mb-6">
                          У вас ще немає обраних товарів
                        </p>
                        <Link href="/menu" className="btn-primary inline-flex">
                          Перейти до меню
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {favoritesQuery.data?.map((favorite) => {
                          if (!favorite.product) {
                            return null;
                          }

                          return (
                            <div
                              key={favorite.id}
                              className="flex gap-4 p-4 border border-white/10 bg-white/5 rounded-xl hover:border-primary-500/50 transition-all duration-200 group"
                            >
                              <Link
                                href={`/products/${favorite.product.slug}`}
                                className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-white/5"
                              >
                                {favorite.product.image_url ? (
                                  <Image
                                    src={favorite.product.image_url}
                                    alt={favorite.product.name}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Image
                                      src="/logo.png"
                                      alt="No image"
                                      width={40}
                                      height={40}
                                      className="opacity-50 grayscale"
                                    />
                                  </div>
                                )}
                              </Link>
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <Link
                                    href={`/products/${favorite.product.slug}`}
                                    className="font-medium text-white hover:text-primary-400 transition line-clamp-2"
                                  >
                                    {favorite.product.name}
                                  </Link>
                                  <p className="text-lg font-bold text-primary-400 mt-1">
                                    {favorite.product.price} ₴
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeFavoriteMutation.mutate(favorite.product_id)}
                                  className="self-start flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition mt-2"
                                >
                                  <HeartSolid className="w-4 h-4" />
                                  Видалити
                                </button>
                              </div>
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
                    <h2 className="text-2xl font-bold font-display mb-8">Програма лояльності</h2>

                    {loyaltyQuery.isLoading ? (
                      <div className="space-y-4">
                        <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
                        <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Баланс балів */}
                        <div className="relative overflow-hidden rounded-2xl p-8 border border-white/10">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800 opacity-80" />
                          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />

                          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                              <p className="text-primary-100 mb-1">Ваш бонусний баланс</p>
                              <p className="text-5xl font-bold text-white mb-2">
                                {loyaltyQuery.data?.bonus_balance || 0}
                              </p>
                              <p className="text-sm text-primary-200">
                                1 бонус = 1 гривня
                              </p>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                              <GiftIcon className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                            <p className="text-gray-400 text-sm mb-1">Всього замовлень</p>
                            <p className="text-2xl font-bold text-white">
                              {loyaltyQuery.data?.total_orders || 0}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                            <p className="text-gray-400 text-sm mb-1">Витрачено коштів</p>
                            <p className="text-2xl font-bold text-white">
                              {loyaltyQuery.data?.total_spent || 0} ₴
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                            <p className="text-gray-400 text-sm mb-1">Ваш статус</p>
                            <p className={`text-2xl font-bold ${loyaltyQuery.data?.loyalty_status === 'gold' ? 'text-yellow-400' :
                              loyaltyQuery.data?.loyalty_status === 'silver' ? 'text-gray-300' :
                                'text-green-400'
                              }`}>
                              {loyaltyQuery.data?.loyalty_status === 'gold' ? 'Gold' :
                                loyaltyQuery.data?.loyalty_status === 'silver' ? 'Silver' : 'Start'}
                            </p>
                          </div>
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

      <Footer />

      {/* Модальне вікно адреси */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-card border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingAddress ? "Редагувати адресу" : "Нова адреса"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Місто
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    disabled
                    className="input opacity-50 cursor-not-allowed"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Вулиця <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, street: e.target.value }))
                    }
                    className="input"
                    placeholder="Назва вулиці"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Будинок <span className="text-red-500">*</span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Квартира
                  </label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Під&apos;їзд
                  </label>
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
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Поверх
                  </label>
                  <input
                    type="text"
                    value={addressForm.floor}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, floor: e.target.value }))
                    }
                    className="input"
                    placeholder="№"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Коментар для кур&apos;єра
                  </label>
                  <textarea
                    value={addressForm.comment}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, comment: e.target.value }))
                    }
                    className="input min-h-[80px]"
                    placeholder="Код домофону, тощо..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={addressForm.is_default}
                        onChange={(e) =>
                          setAddressForm((prev) => ({
                            ...prev,
                            is_default: e.target.checked,
                          }))
                        }
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/5 checked:border-primary-500 checked:bg-primary-500 transition-all"
                      />
                      <CheckIcon className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors">
                      Встановити як основну адресу
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddressSubmit}
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createAddressMutation.isPending || updateAddressMutation.isPending
                    ? "Збереження..."
                    : "Зберегти"}
                </button>
                <button
                  onClick={closeAddressModal}
                  className="px-6 py-3 border border-white/10 rounded-xl text-gray-300 hover:bg-white/5 transition flex-1"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
