"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/apiClient";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/AppHeader";
import Footer from "@/components/AppFooter";
import {
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  HomeIcon,
  XCircleIcon,
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon as UserIconSolid,
  ChatBubbleBottomCenterTextIcon,
  ShoppingBagIcon
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

// Статуси замовлення з розширеними налаштуваннями для анімацій
const ORDER_STATUSES = {
  pending: {
    label: "Очікує підтвердження",
    icon: ClockIcon,
    color: "text-yellow-400",
    glow: "shadow-[0_0_20px_rgba(250,204,21,0.4)]",
    gradient: "from-yellow-400 to-yellow-600",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    step: 1,
  },
  confirmed: {
    label: "Підтверджено",
    icon: ClipboardDocumentCheckIcon,
    color: "text-blue-400",
    glow: "shadow-[0_0_20px_rgba(96,165,250,0.4)]",
    gradient: "from-blue-400 to-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    step: 2,
  },
  preparing: {
    label: "Готується",
    icon: HomeIcon,
    color: "text-orange-400",
    glow: "shadow-[0_0_20px_rgba(251,146,60,0.4)]",
    gradient: "from-orange-400 to-orange-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    step: 3,
  },
  delivering: {
    label: "Доставляється",
    icon: TruckIcon,
    color: "text-purple-400",
    glow: "shadow-[0_0_20px_rgba(192,132,252,0.4)]",
    gradient: "from-purple-400 to-purple-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    step: 4,
  },
  completed: {
    label: "Доставлено",
    icon: CheckCircleIcon,
    color: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.4)]",
    gradient: "from-emerald-400 to-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    step: 5,
  },
  cancelled: {
    label: "Скасовано",
    icon: XCircleIcon,
    color: "text-red-400",
    glow: "shadow-[0_0_20px_rgba(248,113,113,0.4)]",
    gradient: "from-red-400 to-red-600",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    step: 0,
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

export default function OrderTrackPage() {
  const params = useParams();
  const orderNumber = params.order_number as string;

  const orderQuery = useQuery<any>({
    queryKey: ["orderTrack", orderNumber],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${orderNumber}/track`);
      return response.data;
    },
    enabled: !!orderNumber,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  });

  const order = orderQuery.data;

  // Визначення поточного статусу
  const currentStatusKey = (order?.status || "pending") as keyof typeof ORDER_STATUSES;
  const currentStatus = ORDER_STATUSES[currentStatusKey] || ORDER_STATUSES.pending;
  const isCancelled = currentStatusKey === "cancelled";

  // Кроки для прогрес бару (без скасованого)
  const steps = [
    ORDER_STATUSES.pending,
    ORDER_STATUSES.confirmed,
    ORDER_STATUSES.preparing,
    ORDER_STATUSES.delivering,
    ORDER_STATUSES.completed,
  ];

  return (
    <div className="min-h-screen flex flex-col text-white relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent-gold/5 rounded-full blur-[100px]" />
      </div>

      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 sm:py-16 relative z-10">
        <AnimatePresence mode="wait">
          {orderQuery.isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-[60vh]"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-full blur-md" />
                </div>
              </div>
            </motion.div>
          ) : orderQuery.isError || !order ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 max-w-2xl mx-auto"
            >
              <div className="bg-red-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md ring-1 ring-red-500/20">
                <XCircleIcon className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Замовлення не знайдено
              </h1>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Ми не змогли знайти замовлення з таким номером. Перевірте правильність номера або зверніться до підтримки.
              </p>
              <Link href="/" className="btn-primary inline-flex">
                На головну
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-5xl mx-auto space-y-8"
            >
              {/* Header Info */}
              <motion.div variants={itemVariants} className="text-center mb-12">
                <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
                  <span className="text-sm font-medium text-gray-300">
                    Замовлення від {order.created_at ? format(new Date(order.created_at), "d MMMM", { locale: uk }) : "—"}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
                  #{order.order_number}
                </h1>
                <p className="text-gray-400 text-lg">
                  Дякуємо, що обрали Croco Sushi!
                </p>
              </motion.div>

              {/* Status Progress Bar */}
              {!isCancelled && (
                <motion.div
                  variants={itemVariants}
                  className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-3xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                  <div className="relative">
                    {/* Progress Line Wrapper */}
                    <div className="hidden sm:block absolute top-[30px] left-0 right-0 h-1.5 -translate-y-1/2 z-0 px-[30px]">
                      <div className="relative w-full h-full">
                        {/* Line Background */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gray-800 rounded-full overflow-hidden">
                          <div className="absolute inset-0 bg-white/5" />
                        </div>

                        {/* Active Line Progress */}
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${((currentStatus.step - 1) / (steps.length - 1)) * 100}%`,
                          }}
                          transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-8 sm:gap-0">
                      {steps.map((step, index) => {
                        const isCompleted = currentStatus.step > step.step;
                        const isCurrent = currentStatus.step === step.step;
                        const isActive = isCompleted || isCurrent;
                        const StepIcon = step.icon;

                        return (
                          <div
                            key={index}
                            className={`flex sm:flex-col items-center gap-4 sm:gap-4 relative group ${isActive ? "text-white" : "text-gray-500"}`}
                          >
                            <motion.div
                              initial={false}
                              animate={{
                                scale: isCurrent ? 1.2 : 1,
                                borderColor: isActive ? (isCurrent ? "rgba(16,185,129,0.5)" : "rgba(16,185,129,0.2)") : "rgba(255,255,255,0.05)",
                                backgroundColor: isActive ? (isCurrent ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.05)") : "rgba(20,20,25,0.5)",
                              }}
                              className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full border-2 transition-colors duration-500 ${isCurrent ? "shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/10" : ""
                                } ${isActive ? "bg-emerald-900/20 border-emerald-500/50" : "bg-gray-900/50 border-gray-800"}`}
                            >
                              <StepIcon className={`w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-300 ${isActive ? "text-emerald-400" : "text-gray-600"}`} />
                            </motion.div>

                            <div className="flex flex-col sm:items-center">
                              <span
                                className={`text-base font-semibold transition-colors duration-300 ${isActive ? "text-white" : "text-gray-600"}`}
                              >
                                {step.label}
                              </span>
                              {isCurrent && (
                                <motion.span
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-xs text-emerald-400 font-medium hidden sm:block mt-1"
                                >
                                  Поточний етап
                                </motion.span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Status Card (Mobile / Cancelled Focus) */}
              <motion.div
                variants={itemVariants}
                className={`p-1 rounded-3xl bg-gradient-to-br ${currentStatus.gradient} bg-opacity-20`}
              >
                <div className="bg-[#0f1115] p-8 rounded-[22px] h-full relative overflow-hidden">
                  {/* ... Status Card Content ... */}
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${currentStatus.gradient} opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2`} />

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${currentStatus.bg} ${currentStatus.border} border shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-sm`}>
                      <currentStatus.icon className={`w-10 h-10 ${currentStatus.color}`} />
                    </div>

                    <div className="flex-grow">
                      <h2 className="text-gray-400 font-medium mb-1 uppercase tracking-wider text-xs">Поточний статус</h2>
                      <h3 className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${currentStatus.gradient} mb-2`}>
                        {currentStatus.label}
                      </h3>
                      {order.estimated_delivery_time && !isCancelled && (
                        <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl mt-2 border border-white/5">
                          <ClockIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-300">Орієнтовно: <span className="text-white font-bold">{format(new Date(order.estimated_delivery_time), "HH:mm", { locale: uk })}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>



              {/* Order Items & Summary */}
              {order.items && order.items.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                    <ShoppingBagIcon className="w-6 h-6 text-primary-500" />
                    Ваше замовлення
                  </h3>

                  <div className="space-y-4 relative z-10">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex gap-4 items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        {/* Image */}
                        <div className="relative w-16 h-16 bg-white/5 rounded-lg overflow-hidden shrink-0">
                          {item.product_image ? (
                            <Image src={item.product_image} alt={item.product_name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Photo</div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-grow min-w-0">
                          <p className="font-medium text-white line-clamp-1">{item.product_name}</p>
                          {item.size_name && <p className="text-xs text-gray-400">{item.size_name}</p>}
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="text-white font-bold">{Number(item.price).toFixed(0)} ₴</p>
                          <p className="text-xs text-gray-500">x {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-8 pt-6 border-t border-white/10 relative z-10 space-y-3">
                    <div className="flex justify-between text-gray-400 text-sm">
                      <span>Сума товарів</span>
                      <span>{(Number(order.total_amount) - Number(order.delivery_cost) + Number(order.discount)).toFixed(0)} ₴</span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-sm">
                      <span>Доставка</span>
                      <span>{Number(order.delivery_cost) > 0 ? `${Number(order.delivery_cost).toFixed(0)} ₴` : 'Безкоштовно'}</span>
                    </div>
                    {Number(order.discount) > 0 && (
                      <div className="flex justify-between text-emerald-400 text-sm">
                        <span>Знижка</span>
                        <span>- {Number(order.discount).toFixed(0)} ₴</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xl font-bold text-white pt-4 mt-2 border-t border-white/5">
                      <span>Разом до сплати</span>
                      <span className="text-primary-500 font-display">{Number(order.total_amount).toFixed(0)} ₴</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Details & History Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Timeline History */}
                <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl h-full">
                  <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    <ClockIcon className="w-6 h-6 text-emerald-500" />
                    Історія подій
                  </h3>

                  <div className="relative border-l border-white/10 ml-3 space-y-8 pl-8 py-2">
                    {/* Render inferred history steps leading up to current */}
                    {(() => {
                      // Якщо історія з бекенду неповна, формуємо візуальну історію на основі поточного статусу
                      // Беремо всі кроки, які менші або рівні поточному (крім 0 - cancelled)
                      const historySteps = steps.filter(s => s.step > 0 && s.step <= currentStatus.step);
                      // Якщо є реальна історія, спробуємо знайти дати
                      const realHistory = order.status_history || [];

                      return historySteps.map((step, index) => {
                        // Find matching real history item to get date
                        // Assuming status keys match (pending, confirmed, etc.)
                        // Use reverse lookup if needed or just find by label/step?
                        // Let's assume the user wants checkmarks for past steps.

                        // Simple Approach: Show all steps up to current.
                        // Try to find a real history entry for timestamp.
                        // Note: keys in steps are just objects, not named keys. But we know them.
                        // Mapping step to history key:
                        const stepKey = Object.keys(ORDER_STATUSES).find(key => ORDER_STATUSES[key as keyof typeof ORDER_STATUSES].step === step.step);
                        const historyItem = realHistory.find((h: any) => h.status === stepKey);

                        const isLast = index === historySteps.length - 1;

                        return (
                          <motion.div
                            key={step.step}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative group"
                          >
                            <span className={`absolute -left-[41px] top-1 h-5 w-5 rounded-full ${step.bg.replace('/10', '')} ${step.color.replace('text-', 'bg-')} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}></span>
                            <div>
                              <p className={`font-bold text-lg ${step.color}`}>
                                {step.label}
                              </p>
                              <p className="text-sm text-gray-500 mb-2 font-mono">
                                {historyItem?.changed_at ? format(new Date(historyItem.changed_at), "d MMMM, HH:mm", { locale: uk }) : (isLast ? "Щойно" : "•")}
                              </p>
                            </div>
                          </motion.div>
                        )
                      });
                    })()}
                  </div>
                </motion.div>

                {/* Info Details */}
                <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl h-full flex flex-col">
                  <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    <ClipboardDocumentCheckIcon className="w-6 h-6 text-accent-gold" />
                    {order.delivery_type === "pickup" ? "Деталі самовивозу" : "Деталі доставки"}
                  </h3>

                  <div className="space-y-6 flex-grow">
                    {/* Customer */}
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <UserIconSolid className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                          {order.delivery_type === "pickup" ? "Замовник" : "Отримувач"}
                        </p>
                        <p className="text-white text-lg font-medium">{order.customer_name || "Гість"}</p>
                        <p className="text-emerald-400 font-mono mt-0.5">{order.customer_phone}</p>
                      </div>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    {/* Address / Method */}
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        {order.delivery_type === "pickup" ? (
                          <MapPinIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <HomeIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                          {order.delivery_type === "pickup" ? "Спосіб отримання" : "Адреса"}
                        </p>
                        {order.delivery_type === "pickup" ? (
                          <p className="text-xl font-bold text-emerald-400">Самовивіз</p>
                        ) : (
                          <>
                            <p className="text-white text-lg font-medium">
                              {order.city || "м. Бровари"}, {order.street} {order.building || order.house}
                            </p>
                            {(order.apartment || order.entrance || order.floor) && (
                              <p className="text-gray-400 text-sm mt-1">
                                {order.apartment && `Кв. ${order.apartment}`}
                                {order.entrance && ` • Під. ${order.entrance}`}
                                {order.floor && ` • Пов. ${order.floor}`}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {order.comment && (
                      <>
                        <div className="w-full h-px bg-white/5" />
                        <div className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                            <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Коментар</p>
                            <p className="text-gray-300 italic">&quot;{order.comment}&quot;</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-center text-sm text-gray-500 mb-4">Виникли питання?</p>
                    <a href="tel:+380000000000" className="btn-secondary w-full justify-center flex items-center gap-2 group">
                      <PhoneIcon className="w-5 h-5 group-hover:text-emerald-500 transition-colors" />
                      Зателефонувати менеджеру
                    </a>
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants} className="text-center pt-8">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white transition-all duration-200 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  Повернутися на головну
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}


