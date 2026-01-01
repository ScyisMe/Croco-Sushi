import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Типи для локалізації
export type Locale = "ua";

// Імпортуємо переклади
import ua from "@/locales/ua.json";
export const translations: Record<Locale, typeof ua> = {
  ua,
};

// Типи для вкладених ключів перекладу
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
  ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
  : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof ua>;

// Інтерфейс стору
interface LocaleStore {
  locale: Locale;
  _hasHydrated: boolean;
  setLocale: (locale: Locale) => void;
  setHasHydrated: (state: boolean) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// Функція для отримання значення за ключем з крапкою
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Повертаємо ключ, якщо переклад не знайдено
    }
  }

  return typeof result === "string" ? result : path;
}

// Функція для заміни параметрів у рядку
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;

  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

// Створення стору з persist для збереження в localStorage
export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set, get) => ({
      locale: "ua",
      _hasHydrated: false,

      setLocale: (locale: Locale) => {
        set({ locale });
        // Оновлюємо атрибут lang на html елементі
        if (typeof document !== "undefined") {
          document.documentElement.lang = locale;
        }
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      t: (key: string, params?: Record<string, string | number>) => {
        // Always use ua
        const translation = translations["ua"];
        const value = getNestedValue(translation as Record<string, unknown>, key);
        return interpolate(value, params);
      },
    }),
    {
      name: "croco-sushi-locale",
      partialize: (state) => ({ locale: state.locale }),
      storage: createJSONStorage(() => {
        // Повертаємо localStorage тільки на клієнті
        if (typeof window !== "undefined") {
          return localStorage;
        }
        // На сервері повертаємо заглушку
        return {
          getItem: () => null,
          setItem: () => { },
          removeItem: () => { },
        };
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Хук для зручного використання
export function useTranslation() {
  const { locale, setLocale, t, _hasHydrated } = useLocaleStore();
  return { locale, setLocale, t, hasHydrated: _hasHydrated };
}

// Експортуємо переклади для серверних компонентів (якщо потрібно)



