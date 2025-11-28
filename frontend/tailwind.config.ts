import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Активуємо dark mode через data-theme атрибут
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      // Breakpoints для мобільних
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'touch': { 'raw': '(hover: none)' },
        'pointer-coarse': { 'raw': '(pointer: coarse)' },
      },
      // Кольори через CSS змінні (для підтримки тем)
      colors: {
        // Брендові кольори
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "var(--color-primary)",
          600: "var(--color-primary-hover)",
          700: "var(--color-primary-dark)",
          800: "#166534",
          900: "#14532d",
          DEFAULT: "var(--color-primary)",
          light: "var(--color-primary-light)",
        },
        // Семантичні кольори для тем
        background: {
          DEFAULT: "var(--color-background)",
          secondary: "var(--color-background-secondary)",
          tertiary: "var(--color-background-tertiary)",
          elevated: "var(--color-background-elevated)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          hover: "var(--color-surface-hover)",
        },
        foreground: {
          DEFAULT: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          inverted: "var(--color-text-inverted)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          hover: "var(--color-border-hover)",
        },
        divider: "var(--color-divider)",
        // Акценти
        accent: {
          red: "var(--color-accent-red)",
          "red-light": "var(--color-accent-red-light)",
          orange: "var(--color-accent-orange)",
          "orange-light": "var(--color-accent-orange-light)",
          blue: "var(--color-accent-blue)",
          "blue-light": "var(--color-accent-blue-light)",
          yellow: "var(--color-accent-yellow)",
          "yellow-light": "var(--color-accent-yellow-light)",
          green: "var(--color-accent-green)",
          "green-light": "var(--color-accent-green-light)",
        },
        // Overlay
        overlay: {
          DEFAULT: "var(--color-overlay)",
          light: "var(--color-overlay-light)",
        },
        // Legacy support
        secondary: {
          DEFAULT: "var(--color-text-primary)",
          light: "var(--color-text-secondary)",
        },
      },
      // Шрифти
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Montserrat", "Inter", "system-ui", "sans-serif"],
      },
      // Розміри тексту
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.5' }],
        'xl': ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.25' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.15' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      },
      // Spacing
      spacing: {
        'safe-top': 'var(--safe-area-inset-top)',
        'safe-bottom': 'var(--safe-area-inset-bottom)',
        'safe-left': 'var(--safe-area-inset-left)',
        'safe-right': 'var(--safe-area-inset-right)',
        'touch': '44px',
        '4.5': '1.125rem',
        '13': '3.25rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // Border radius
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        'full': 'var(--radius-full)',
      },
      // Тіні
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'card': 'var(--shadow-card)',
        'header': 'var(--shadow-header)',
        'modal': 'var(--shadow-modal)',
      },
      // Анімації
      animation: {
        'fade-in': 'fadeIn var(--transition-normal)',
        'fade-in-up': 'fadeInUp var(--transition-slow)',
        'slide-in-right': 'slideInRight var(--transition-slow)',
        'slide-in-left': 'slideInLeft var(--transition-slow)',
        'slide-in-up': 'slideInUp var(--transition-slow)',
        'scale-in': 'scaleIn var(--transition-normal)',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-light': 'pulse 2s infinite',
        'bounce-light': 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      // Transition
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      // Backdrop blur
      backdropBlur: {
        'xs': '2px',
        'sm': 'var(--blur-sm)',
        'md': 'var(--blur-md)',
        'lg': 'var(--blur-lg)',
      },
      // Min height/width для touch targets
      minHeight: {
        'touch': '44px',
        '11': '2.75rem',
        '12': '3rem',
      },
      minWidth: {
        'touch': '44px',
        '11': '2.75rem',
        '12': '3rem',
      },
    },
  },
  plugins: [],
};

export default config;
