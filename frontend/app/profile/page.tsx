"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/apiClient";
import { User, Address, Order, Favorite, LoyaltyInfo, OrderStatus } from "@/lib/types";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
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
  ArrowRightStartOnRectangleIcon,
  StarIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import LoyaltyCard from "@/components/profile/LoyaltyCard";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper";
import "swiper/css";

// Utils
import { formatPhoneNumber } from "@/lib/utils";

// Types
interface Tab {
  id: string;
  name: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: "profile", name: "Профіль", icon: UserIcon },
  { id: "addresses", name: "Адреси", icon: MapPinIcon },
  { id: "orders", name: "Замовлення", icon: ShoppingBagIcon },
  { id: "favorites", name: "Обране", icon: HeartIcon },
  { id: "loyalty", name: "Бонуси", icon: GiftIcon },
];

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: "Очікує", color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" },
  confirmed: { label: "Підтверджено", color: "bg-blue-500/20 text-blue-400 border border-blue-500/30" },
  preparing: { label: "Готується", color: "bg-purple-500/20 text-purple-400 border border-purple-500/30" },
  ready: { label: "Готове", color: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" },
  delivering: { label: "Доставляється", color: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" },
  delivered: { label: "Доставлено", color: "bg-green-500/20 text-green-400 border border-green-500/30" },
  completed: { label: "Виконано", color: "bg-green-500/20 text-green-400 border border-green-500/30" },
  cancelled: { label: "Скасовано", color: "bg-red-500/20 text-red-400 border border-red-500/30" },
};

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  // Scroll logic for tabs
  const tabsContainerRef = useRef<HTMLUListElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    newsletter_subscription: false,
  });

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

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Sync Swiper with Active Tab
  useEffect(() => {
    if (swiperInstance) {
      const index = TABS.findIndex((t) => t.id === activeTab);
      if (index !== -1 && swiperInstance.activeIndex !== index) {
        swiperInstance.slideTo(index);
      }
    }
  }, [activeTab, swiperInstance]);

  // Scroll active tab into view
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeNode = tabsContainerRef.current.querySelector(`[data-tab-id="${activeTab}"]`);
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  // QUERIES
  const userQuery = useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => (await apiClient.get("/users/me")).data,
    enabled: isAuthenticated,
  });

  const addressesQuery = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: async () => (await apiClient.get("/users/me/addresses")).data,
    enabled: isAuthenticated,
  });

  const ordersQuery = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => (await apiClient.get("/users/me/orders")).data,
    enabled: isAuthenticated,
  });

  const favoritesQuery = useQuery<Favorite[]>({
    queryKey: ["favorites"],
    queryFn: async () => (await apiClient.get("/users/me/favorites")).data,
    enabled: isAuthenticated,
  });

  const loyaltyQuery = useQuery<LoyaltyInfo>({
    queryKey: ["loyalty"],
    queryFn: async () => (await apiClient.get("/users/me/loyalty")).data,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (userQuery.data) {
      setProfileForm({
        name: userQuery.data.name || "",
        email: userQuery.data.email || "",
        newsletter_subscription: userQuery.data.newsletter_subscription,
      });
    }
  }, [userQuery.data]);

  // MUTATIONS
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => (await apiClient.put("/users/me", data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Профіль оновлено");
      setIsEditingProfile(false);
    },
    onError: () => toast.error("Помилка оновлення профілю"),
  });

  const createAddressMutation = useMutation({
    mutationFn: async (data: typeof addressForm) => (await apiClient.post("/users/me/addresses", data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Адресу додано");
      closeAddressModal();
    },
    onError: () => toast.error("Помилка додавання адреси"),
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof addressForm }) => (await apiClient.put(`/users/me/addresses/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Адресу оновлено");
      closeAddressModal();
    },
    onError: () => toast.error("Помилка оновлення адреси"),
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => { await apiClient.delete(`/users/me/addresses/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Адресу видалено");
    },
    onError: () => toast.error("Помилка видалення адреси"),
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: number) => (await apiClient.put(`/users/me/addresses/${id}/default`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Адресу встановлено за замовчуванням");
    },
    onError: () => toast.error("Помилка оновлення адреси"),
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (productId: number) => { await apiClient.delete(`/users/me/favorites/${productId}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Видалено з обраного");
    },
    onError: () => toast.error("Помилка видалення"),
  });

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
    toast.success("Ви вийшли з акаунту");
  };

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

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow pt-24 pb-12">

        {/* Top Header Section */}
        <div className="container mx-auto px-4 mb-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              {userQuery.data && (
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Вітаємо, {userQuery.data.name || 'Гостю'}! 👋
                </h1>
              )}
              <p className="text-gray-400 text-sm mt-1">
                Керуйте своїм профілем та замовленнями
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all duration-200 border border-white/5"
              title="Вийти"
            >
              <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4">

          {/* Mobile Loyalty Card (Top) */}
          <div className="lg:hidden mb-8">
            {userQuery.data && <LoyaltyCard user={userQuery.data} />}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Sidebar Navigation (Desktop) & Sticky Header (Mobile) */}
            <div className="lg:col-span-1 z-30">
              {/* Sticky Wrapper */}
              <div className="sticky top-20 lg:top-[120px] transition-all duration-300">
                <nav className="glass-card bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl p-1.5 md:p-3 shadow-2xl">
                  <ul ref={tabsContainerRef} className="flex lg:flex-col overflow-x-auto scrollbar-hide gap-1 snap-x">
                    {TABS.map((tab) => (
                      <li key={tab.id} className="flex-shrink-0 flex-1 lg:flex-none snap-start" data-tab-id={tab.id}>
                        <button
                          onClick={() => {
                            setActiveTab(tab.id);
                            // Swiper slideTo handled in useEffect
                          }}
                          className={`w-full flex items-center justify-center lg:justify-start gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium whitespace-nowrap relative group ${activeTab === tab.id
                            ? "text-white bg-white/10"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                          <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-primary-400" : "text-gray-500 group-hover:text-white"}`} />
                          <span>{tab.name}</span>

                          {/* Desktop Chevron */}
                          {activeTab === tab.id && (
                            <ChevronRightIcon className="w-4 h-4 ml-auto hidden lg:block text-primary-400" />
                          )}

                          {/* Mobile Bottom Border/Indicator */}
                          {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-500 rounded-full lg:hidden block" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Desktop Loyalty Card (Sidebar) */}
                <div className="hidden lg:block mt-6">
                  {userQuery.data && <LoyaltyCard user={userQuery.data} />}
                </div>
              </div>
            </div>

            {/* Main Content using Swiper for Swipe Gestures */}
            <div className="lg:col-span-3 min-w-0"> {/* min-w-0 required for Swiper in flex/grid container */}
              <Swiper
                spaceBetween={20}
                slidesPerView={1}
                onSwiper={setSwiperInstance}
                onSlideChange={(swiper) => setActiveTab(TABS[swiper.activeIndex].id)}
                autoHeight={true} // Important for dynamic height content
                className="w-full"
              >
                {TABS.map((tab) => (
                  <SwiperSlide key={tab.id} className="h-auto">
                    <div className="glass-card rounded-2xl p-4 md:p-8 min-h-[500px]">

                      {/* PROFILE TAB */}
                      {tab.id === "profile" && (
                        <div className="animate-fade-in">
                          <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold font-display">Особисті дані</h2>
                            {!isEditingProfile && (
                              <button
                                onClick={() => setIsEditingProfile(true)}
                                className="p-2 rounded-lg text-primary-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Редагувати профіль"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>

                          {userQuery.isLoading ? (
                            <div className="space-y-4">
                              <div className="h-14 bg-white/5 rounded-xl animate-pulse" />
                              <div className="h-14 bg-white/5 rounded-xl animate-pulse" />
                            </div>
                          ) : isEditingProfile ? (
                            <div className="space-y-6 max-w-xl animate-fade-in">

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name Input */}
                                <div className="space-y-2 md:col-span-2">
                                  <label htmlFor="name" className="text-sm font-medium text-gray-400 ml-1">
                                    Ім&apos;я
                                  </label>
                                  <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                      <UserIcon className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                      type="text"
                                      id="name"
                                      value={profileForm.name}
                                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                      className="input pl-11 bg-white/5 focus:bg-white/10"
                                      placeholder="Ваше ім'я"
                                    />
                                  </div>
                                </div>

                                {/* Email Input */}
                                <div className="space-y-2 md:col-span-2">
                                  <label htmlFor="email" className="text-sm font-medium text-gray-400 ml-1">
                                    Email
                                  </label>
                                  <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                      <EnvelopeIcon className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                      type="email"
                                      id="email"
                                      value={profileForm.email}
                                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                      className="input pl-11 bg-white/5 focus:bg-white/10"
                                      placeholder="example@email.com"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Newsletter Switch */}
                              <div
                                onClick={() => setProfileForm({ ...profileForm, newsletter_subscription: !profileForm.newsletter_subscription })}
                                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 group ${profileForm.newsletter_subscription
                                    ? "bg-primary-500/10 border-primary-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full transition-colors ${profileForm.newsletter_subscription ? "bg-primary-500/20 text-primary-500" : "bg-white/10 text-gray-400 group-hover:text-white"}`}>
                                    <GiftIcon className="w-5 h-5" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={`font-medium transition-colors ${profileForm.newsletter_subscription ? "text-primary-100" : "text-gray-300 group-hover:text-white"}`}>
                                      Новини та акції
                                    </span>
                                    <span className="text-xs text-gray-500">Отримуйте персональні пропозиції</span>
                                  </div>
                                </div>

                                <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 border border-transparent ${profileForm.newsletter_subscription ? "bg-primary-500" : "bg-white/10 border-white/10"
                                  }`}>
                                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${profileForm.newsletter_subscription ? "translate-x-5" : "translate-x-0"
                                    }`} />
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-4 pt-4">
                                <button
                                  onClick={() => updateProfileMutation.mutate(profileForm)}
                                  disabled={updateProfileMutation.isPending}
                                  className="btn-primary flex-1 flex justify-center items-center gap-2"
                                >
                                  {updateProfileMutation.isPending ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : <CheckIcon className="w-5 h-5" />}
                                  {updateProfileMutation.isPending ? "Збереження..." : "Зберегти зміни"}
                                </button>
                                <button
                                  onClick={() => setIsEditingProfile(false)}
                                  className="px-6 py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all flex-1"
                                >
                                  Скасувати
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <div className="relative group overflow-hidden rounded-xl">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-xl blur opacity-50" />
                                <div className="relative bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
                                  <div className="flex flex-col gap-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      {/* Phone (Display formatted) */}
                                      <div className="flex flex-col gap-1.5 group/field cursor-pointer" onClick={() => setIsEditingProfile(true)}>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                          Телефон <PencilIcon className="w-3 h-3 text-gray-600 opacity-0 group-hover/field:opacity-100 transition-opacity" />
                                        </span>
                                        <span className="text-xl font-medium text-white font-mono tracking-wide">
                                          {formatPhoneNumber(userQuery.data?.phone || '')}
                                        </span>
                                      </div>

                                      {/* Name */}
                                      <div className="flex flex-col gap-1.5 group/field cursor-pointer" onClick={() => setIsEditingProfile(true)}>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                          Ім&apos;я <PencilIcon className="w-3 h-3 text-gray-600 opacity-0 group-hover/field:opacity-100 transition-opacity" />
                                        </span>
                                        <span className="text-xl font-medium text-white">{userQuery.data?.name || "—"}</span>
                                      </div>
                                    </div>

                                    {/* Email */}
                                    <div className="flex flex-col gap-1.5 group/field cursor-pointer" onClick={() => setIsEditingProfile(true)}>
                                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        Email <PencilIcon className="w-3 h-3 text-gray-600 opacity-0 group-hover/field:opacity-100 transition-opacity" />
                                      </span>
                                      <span className="text-xl font-medium text-white break-all">{userQuery.data?.email || "—"}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ADDRESSES TAB */}
                      {tab.id === "addresses" && (
                        <div className="animate-fade-in">
                          <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold font-display">Мої адреси</h2>
                            <button
                              onClick={() => openAddressModal()}
                              className="flex items-center gap-2 btn-primary py-2 px-4 text-sm shadow-lg shadow-primary-500/20"
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
                            <div className="text-center py-12 flex flex-col items-center">
                              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <MapPinIcon className="w-10 h-10 text-gray-500" />
                              </div>
                              <p className="text-gray-400">У вас ще немає збережених адрес</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {addressesQuery.data?.map((address) => (
                                <div
                                  key={address.id}
                                  className={`p-5 border rounded-xl transition-all duration-300 group hover:shadow-lg ${address.is_default
                                    ? "border-primary-500 bg-primary-500/10 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                                    : "border-white/10 bg-white/5 hover:border-primary-500/50 hover:bg-white/10"
                                    }`}
                                >
                                  {/* Address Card Content ... Same logic as before but cleaner */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-2 rounded-lg ${address.is_default ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                        <MapPinIcon className="w-5 h-5" />
                                      </div>
                                      {address.is_default && (
                                        <span className="text-xs font-bold text-primary-400 uppercase tracking-wide bg-primary-500/10 px-2 py-1 rounded">
                                          Основна
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                      {!address.is_default && (
                                        <button onClick={() => setDefaultAddressMutation.mutate(address.id)} className="p-2 text-gray-400 hover:text-primary-400 hover:bg-white/10 rounded-lg transition" title="Встановити за замовчуванням"><CheckIcon className="w-4 h-4" /></button>
                                      )}
                                      <button onClick={() => openAddressModal(address)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition" title="Редагувати"><PencilIcon className="w-4 h-4" /></button>
                                      <button onClick={() => { if (confirm("Видалити адресу?")) deleteAddressMutation.mutate(address.id); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition" title="Видалити"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                  </div>
                                  <p className="font-medium text-white mb-1">{address.city}, {address.street}, {address.building}</p>
                                  <p className="text-sm text-gray-400">
                                    {address.apartment && `кв. ${address.apartment}`}{address.entrance && `, під'їзд ${address.entrance}`}{address.floor && `, поверх ${address.floor}`}
                                  </p>
                                  {address.comment && <p className="text-sm text-gray-500 mt-2 italic">&quot;{address.comment}&quot;</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ORDERS TAB */}
                      {tab.id === "orders" && (
                        <div className="animate-fade-in">
                          <h2 className="text-2xl font-bold font-display mb-8">Мої замовлення</h2>
                          {ordersQuery.isLoading ? (
                            <div className="space-y-4">
                              {[1, 2].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
                            </div>
                          ) : ordersQuery.data?.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingBagIcon className="w-10 h-10 text-gray-500" /></div>
                              <p className="text-gray-400 mb-6">У вас ще немає замовлень</p>
                              <Link href="/menu" className="btn-primary inline-flex">Перейти до меню</Link>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {ordersQuery.data?.map((order) => (
                                <div key={order.id} className="p-5 border border-white/10 bg-white/5 rounded-xl hover:border-primary-500/30 transition-all duration-200 hover:bg-white/[0.07]">
                                  {/* Simplified Order Card for brevity, mostly same structure */}
                                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                    <div>
                                      <div className="flex items-center gap-3 mb-1">
                                        <p className="font-bold text-lg text-white">#{order.order_number}</p>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${ORDER_STATUS_MAP[order.status]?.color}`}>{ORDER_STATUS_MAP[order.status]?.label}</span>
                                      </div>
                                      <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString("uk-UA")}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-primary-400 text-xl">{order.total_amount} ₴</p>
                                    </div>
                                  </div>
                                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                                    <Link href={`/orders/${order.order_number}/track`} className="flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition">
                                      Деталі замовлення <ChevronRightIcon className="w-4 h-4" />
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* FAVORITES TAB */}
                      {tab.id === "favorites" && (
                        <div className="animate-fade-in">
                          <h2 className="text-2xl font-bold font-display mb-8">Обрані товари</h2>
                          {favoritesQuery.isLoading ? <div className="h-40 bg-white/5 rounded-xl animate-pulse" /> :
                            favoritesQuery.data?.length === 0 ? (
                              <div className="text-center py-12">
                                <p className="text-gray-400 mb-6">У вас ще немає обраних товарів</p>
                                <Link href="/menu" className="btn-primary inline-flex">Перейти до меню</Link>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {favoritesQuery.data?.map(fav => fav.product && (
                                  <div key={fav.id} className="flex gap-4 p-4 border border-white/10 bg-white/5 rounded-xl hover:border-primary-500/50 transition-all group">
                                    <Link href={`/products/${fav.product.slug}`} className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-white/5 relative">
                                      {fav.product.image_url && <Image src={fav.product.image_url} alt={fav.product.name} fill className="object-cover group-hover:scale-110 transition-transform" />}
                                    </Link>
                                    <div className="flex-1 flex flex-col justify-between">
                                      <Link href={`/products/${fav.product.slug}`} className="font-medium text-white line-clamp-2">{fav.product.name}</Link>
                                      <button onClick={() => removeFavoriteMutation.mutate(fav.product_id)} className="self-start text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-2"><HeartSolid className="w-4 h-4" />Видалити</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      )}

                      {/* LOYALTY TAB */}
                      {tab.id === "loyalty" && (
                        <div className="animate-fade-in">
                          <h2 className="text-2xl font-bold font-display mb-8">Програма лояльності</h2>
                          {loyaltyQuery.data && <LoyaltyCard user={{ ...userQuery.data!, ...loyaltyQuery.data }} />}
                        </div>
                      )}

                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </main>

      {/* Address Modal code remains mostly same but compacted for brevity here, functionality preserved */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card bg-[#1a1a1a] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-bold text-white">{editingAddress ? "Редагувати адресу" : "Нова адреса"}</h3>
              <button onClick={closeAddressModal} className="text-gray-400 hover:text-white transition"><ChevronRightIcon className="w-6 h-6 rotate-45" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Simplified form fields using grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Місто</label>
                  <input type="text" value={addressForm.city} disabled className="input opacity-50 cursor-not-allowed" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Вулиця <span className="text-red-500">*</span></label>
                  <input type="text" value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} className="input" placeholder="Назва вулиці" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Будинок <span className="text-red-500">*</span></label>
                  <input type="text" value={addressForm.building} onChange={e => setAddressForm({ ...addressForm, building: e.target.value })} className="input" placeholder="№" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Квартира</label>
                  <input type="text" value={addressForm.apartment} onChange={e => setAddressForm({ ...addressForm, apartment: e.target.value })} className="input" placeholder="№" />
                </div>
                {/* Other fields... */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Під&apos;їзд</label>
                  <input type="text" value={addressForm.entrance} onChange={e => setAddressForm({ ...addressForm, entrance: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Поверх</label>
                  <input type="text" value={addressForm.floor} onChange={e => setAddressForm({ ...addressForm, floor: e.target.value })} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Коментар кур&apos;єру</label>
                  <textarea value={addressForm.comment} onChange={e => setAddressForm({ ...addressForm, comment: e.target.value })} className="input min-h-[80px]" placeholder="Код домофону, тощо..." />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="is_default" checked={addressForm.is_default} onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })} className="w-5 h-5 rounded bg-white/5 border-white/20 text-primary-500 focus:ring-primary-500" />
                  <label htmlFor="is_default" className="text-sm text-gray-300">Встановити як основну адресу</label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button onClick={closeAddressModal} className="px-4 py-2 rounded-xl text-gray-300 hover:bg-white/10 transition">Скасувати</button>
              <button onClick={handleAddressSubmit} className="btn-primary">{editingAddress ? "Зберегти" : "Додати"}</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
