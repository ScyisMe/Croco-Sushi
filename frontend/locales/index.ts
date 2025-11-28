// Індексний файл для експорту локалізацій
export { useLocaleStore, useTranslation, translations } from "@/store/localeStore";
export type { Locale, TranslationKey } from "@/store/localeStore";

// Експортуємо JSON файли безпосередньо
export { default as ua } from "./ua.json";
export { default as ru } from "./ru.json";


