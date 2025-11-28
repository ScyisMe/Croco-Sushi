# 📋 Технічне Завдання: Редизайн та Система Тем для Croco Sushi

## 📌 Загальна інформація

| Параметр | Значення |
|----------|----------|
| **Проект** | Croco Sushi - Доставка суші у Львові |
| **Технології** | Next.js 14, React 18, Tailwind CSS, TypeScript |
| **Поточна версія** | 0.1.0 |
| **Дата** | Листопад 2025 |

---

## 🎯 Цілі проекту

1. **Покращення візуального дизайну** - оновити UI/UX для кращого користувацького досвіду
2. **Система тем** - додати перемикач між світлою та темною темою
3. **Брендова ідентичність** - посилити впізнаваність бренду Croco Sushi
4. **Мобільна оптимізація** - покращити адаптивність для мобільних пристроїв

---

## 📊 Аналіз поточного стану

### Поточна кольорова палітра:

| Колір | Hex | Використання |
|-------|-----|--------------|
| Primary (зелений) | `#00A859` | Основний колір бренду |
| Secondary (темно-сірий) | `#333333` | Текст |
| Secondary Light | `#666666` | Вторинний текст |
| Accent Red | `#EF4444` | Хіти, акції |
| Accent Orange | `#F97316` | Акції |
| Accent Blue | `#3B82F6` | Новинки |
| Border | `#E5E5E5` | Рамки |
| Background | `#FFFFFF` | Фон |

### Поточні компоненти:
- Header (з мобільним меню)
- Footer
- Hero (слайдер)
- ProductCard
- Cart (бічна панель)
- Categories
- Promotions
- QuickViewModal
- CallbackModal
- ReviewForm

---

## 🎨 Частина 1: Покращення Дизайну

### 1.1 Оновлена Кольорова Палітра

#### Світла тема (Light Mode):

```css
:root {
  /* Основні кольори */
  --color-primary: #00A859;
  --color-primary-hover: #009150;
  --color-primary-light: #E8F5E9;
  
  /* Фони */
  --color-background: #FFFFFF;
  --color-background-secondary: #F8FAFC;
  --color-background-tertiary: #F1F5F9;
  
  /* Текст */
  --color-text-primary: #1E293B;
  --color-text-secondary: #64748B;
  --color-text-muted: #94A3B8;
  
  /* Рамки та розділювачі */
  --color-border: #E2E8F0;
  --color-border-hover: #CBD5E1;
  
  /* Акценти */
  --color-accent-red: #EF4444;
  --color-accent-orange: #F97316;
  --color-accent-blue: #3B82F6;
  --color-accent-yellow: #EAB308;
  
  /* Тіні */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.08);
}
```

#### Темна тема (Dark Mode):

```css
[data-theme="dark"] {
  /* Основні кольори */
  --color-primary: #22C55E;
  --color-primary-hover: #16A34A;
  --color-primary-light: #166534;
  
  /* Фони */
  --color-background: #0F172A;
  --color-background-secondary: #1E293B;
  --color-background-tertiary: #334155;
  
  /* Текст */
  --color-text-primary: #F8FAFC;
  --color-text-secondary: #CBD5E1;
  --color-text-muted: #94A3B8;
  
  /* Рамки та розділювачі */
  --color-border: #334155;
  --color-border-hover: #475569;
  
  /* Акценти */
  --color-accent-red: #F87171;
  --color-accent-orange: #FB923C;
  --color-accent-blue: #60A5FA;
  --color-accent-yellow: #FACC15;
  
  /* Тіні */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.4);
}
```

### 1.2 Типографіка

#### Шрифти:
- **Основний шрифт**: `"Nunito Sans"` або `"Montserrat"` - більш сучасний та читабельний
- **Акцентний шрифт**: `"Playfair Display"` - для заголовків (опціонально)

#### Розміри тексту:
```css
--font-size-xs: clamp(0.75rem, 1.5vw, 0.875rem);
--font-size-sm: clamp(0.875rem, 2vw, 1rem);
--font-size-base: clamp(1rem, 2.5vw, 1.125rem);
--font-size-lg: clamp(1.125rem, 3vw, 1.25rem);
--font-size-xl: clamp(1.25rem, 3.5vw, 1.5rem);
--font-size-2xl: clamp(1.5rem, 4vw, 2rem);
--font-size-3xl: clamp(2rem, 5vw, 3rem);
--font-size-4xl: clamp(2.5rem, 6vw, 4rem);
```

### 1.3 Оновлення Компонентів

#### Header:
- [ ] Додати прозорий header на головній сторінці (стає білим при скролі)
- [ ] Покращити анімацію sticky header
- [ ] Додати індикатор активного пункту меню
- [ ] Перемикач теми в header
- [ ] Мікро-анімації для іконок при hover

#### Hero:
- [ ] Більш динамічні переходи між слайдами
- [ ] Parallax ефект для фонових зображень
- [ ] Покращений overlay з градієнтом
- [ ] Анімація тексту при появі слайду
- [ ] Swipe-жести для мобільних

#### ProductCard:
- [ ] Більш елегантний hover ефект з підняттям картки
- [ ] Skeleton loading з shimmer анімацією
- [ ] Quick add кнопка з анімацією
- [ ] Покращений вигляд бейджів (Новинка, Хіт, Акція)
- [ ] Анімація додавання в кошик

#### Cart:
- [ ] Glassmorphism ефект для бічної панелі
- [ ] Покращена анімація входу/виходу
- [ ] Мікро-взаємодії при зміні кількості
- [ ] Progress bar до безкоштовної доставки
- [ ] Анімація видалення товару

#### Footer:
- [ ] Сучасний мінімалістичний дизайн
- [ ] Хвильовий розділювач між контентом та футером
- [ ] Соціальні іконки з hover-ефектами
- [ ] Кнопка "Наверх" з анімацією

### 1.4 Нові UI Елементи

#### Кнопки:
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: 0 4px 14px rgba(0, 168, 89, 0.4);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 168, 89, 0.5);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  border: 2px solid var(--color-border);
  backdrop-filter: blur(10px);
}
```

#### Картки:
```css
.card {
  background: var(--color-background);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}
```

#### Інпути:
```css
.input {
  background: var(--color-background-secondary);
  border: 2px solid transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.input:focus {
  background: var(--color-background);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(0, 168, 89, 0.1);
}
```

---

## 🌓 Частина 2: Система Тем (Dark/Light Mode)

### 2.1 Архітектура

#### Структура файлів:
```
frontend/
├── store/
│   └── themeStore.ts          # Zustand store для теми
├── components/
│   └── ThemeToggle.tsx        # Компонент перемикача теми
├── hooks/
│   └── useTheme.ts            # Хук для роботи з темою
├── app/
│   ├── globals.css            # CSS змінні для тем
│   └── providers.tsx          # ThemeProvider
└── tailwind.config.ts         # Налаштування темної теми
```

### 2.2 Zustand Store для Теми

```typescript
// store/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: (theme) => {
        set({ theme });
        // Логіка визначення реальної теми
      },
    }),
    {
      name: 'croco-theme',
    }
  )
);
```

### 2.3 Компонент Перемикача Теми

```tsx
// components/ThemeToggle.tsx
"use client";

import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-background-secondary rounded-full">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-full transition ${
          theme === 'light' ? 'bg-primary text-white' : 'hover:bg-background-tertiary'
        }`}
        aria-label="Світла тема"
      >
        <SunIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-full transition ${
          theme === 'dark' ? 'bg-primary text-white' : 'hover:bg-background-tertiary'
        }`}
        aria-label="Темна тема"
      >
        <MoonIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-full transition ${
          theme === 'system' ? 'bg-primary text-white' : 'hover:bg-background-tertiary'
        }`}
        aria-label="Системна тема"
      >
        <ComputerDesktopIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
```

### 2.4 Оновлення Tailwind Config

```typescript
// tailwind.config.ts
const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--color-background)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
        },
        foreground: {
          DEFAULT: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        // ... інші кольори через CSS змінні
      },
    },
  },
};
```

### 2.5 Правила Застосування Тем

1. **Всі кольори через CSS змінні** - жодних hardcoded значень
2. **Семантичні імена** - `background`, `foreground`, `border` замість конкретних кольорів
3. **Контраст** - забезпечити WCAG AA рівень контрасту (мін. 4.5:1)
4. **Зображення** - адаптувати яскравість/контраст для темної теми
5. **Іконки** - використовувати `currentColor` для автоматичної адаптації

---

## 📱 Частина 3: Мобільна Оптимізація

### 3.1 Responsive Breakpoints

```css
/* Mobile First підхід */
--breakpoint-xs: 375px;   /* iPhone SE */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### 3.2 Touch-Friendly UI

- Мінімальний touch target: 44x44px
- Збільшені відступи між інтерактивними елементами
- Swipe-жести для каруселей та модальних вікон
- Pull-to-refresh на мобільних

### 3.3 Mobile-Specific Components

- Bottom Navigation Bar (для мобільних)
- Full-screen модальні вікна
- Sticky "Додати в кошик" кнопка на сторінці товару

---

## 🎬 Частина 4: Анімації та Мікро-взаємодії

### 4.1 Бібліотека Анімацій

Використовувати **Framer Motion** (вже встановлено):

```tsx
// Приклади анімацій
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};
```

### 4.2 Ключові Анімації

| Елемент | Анімація | Тривалість |
|---------|----------|------------|
| Page transitions | Fade + Slide | 300ms |
| Modal open/close | Scale + Fade | 200ms |
| Button hover | Scale up | 150ms |
| Card hover | Lift + Shadow | 300ms |
| Add to cart | Bounce + Pulse | 400ms |
| Toast notifications | Slide in | 300ms |
| Skeleton loading | Shimmer | 1.5s loop |
| Theme toggle | Rotate + Fade | 400ms |

### 4.3 Performance Guidelines

- Використовувати `transform` та `opacity` для анімацій (GPU-accelerated)
- `will-change` тільки для активних анімацій
- `prefers-reduced-motion` для accessibility
- Lazy load анімацій поза viewport

---

## 📋 Частина 5: План Імплементації

### Фаза 1: Підготовка (1-2 дні)
- [ ] Налаштування CSS змінних для тем
- [ ] Створення themeStore
- [ ] Оновлення Tailwind config
- [ ] Базові утиліти для тем

### Фаза 2: Система Тем (2-3 дні)
- [ ] ThemeToggle компонент
- [ ] ThemeProvider
- [ ] Інтеграція в Header
- [ ] Тестування переключення
- [ ] Збереження в localStorage

### Фаза 3: Оновлення Компонентів (5-7 днів)
- [ ] Header (з прозорим режимом)
- [ ] Hero (нові анімації)
- [ ] ProductCard (hover ефекти)
- [ ] Cart (glassmorphism)
- [ ] Footer (редизайн)
- [ ] Модальні вікна
- [ ] Форми та інпути

### Фаза 4: Сторінки (3-4 дні)
- [ ] Головна сторінка
- [ ] Меню
- [ ] Сторінка товару
- [ ] Checkout
- [ ] Профіль
- [ ] Доставка

### Фаза 5: Мобільна Оптимізація (2-3 дні)
- [ ] Bottom Navigation
- [ ] Touch-оптимізація
- [ ] Мобільні анімації
- [ ] Тестування на пристроях

### Фаза 6: Тестування та Фікси (2-3 дні)
- [ ] Cross-browser тестування
- [ ] Accessibility audit
- [ ] Performance testing
- [ ] Bug fixes

---

## 🎯 Критерії Успіху

1. **Lighthouse Score**: 
   - Performance: > 90
   - Accessibility: > 95
   - Best Practices: > 90
   - SEO: > 90

2. **Core Web Vitals**:
   - LCP < 2.5s
   - FID/INP < 100ms
   - CLS < 0.1

3. **UX Метрики**:
   - Час завантаження < 3s
   - Плавні анімації (60 FPS)
   - Коректна робота на всіх пристроях

---

## 📚 Ресурси та Референси

### Дизайн-референси:
- [Glovo](https://glovoapp.com) - мобільний UX
- [Uber Eats](https://ubereats.com) - картки товарів
- [Bolt Food](https://food.bolt.eu) - темна тема
- [Wolt](https://wolt.com) - анімації

### Технічні ресурси:
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Framer Motion](https://www.framer.com/motion/)
- [Heroicons](https://heroicons.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## ✅ Чекліст перед Деплоєм

- [ ] Всі сторінки адаптивні
- [ ] Темна тема працює коректно
- [ ] Анімації не блокують інтерфейс
- [ ] Контраст тексту відповідає WCAG AA
- [ ] Робота без JavaScript (базова)
- [ ] Тестування на реальних пристроях
- [ ] Кеш очищено
- [ ] Production build без помилок

---

*Документ підготовлено: Листопад 2025*
*Версія ТЗ: 1.0*



