/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode surfaces
        'd-bg':      '#080c14',
        'd-surface': '#0e1420',
        'd-card':    '#121926',
        'd-border':  '#1e2a3a',
        'd-hover':   '#1a2436',
        'd-muted':   '#2a3a50',
        'd-text':    '#e2e8f0',
        'd-subtle':  '#64748b',
        // Light mode surfaces
        'l-bg':      '#f0f4ff',
        'l-surface': '#ffffff',
        'l-card':    '#ffffff',
        'l-border':  '#e2e8f0',
        'l-hover':   '#f1f5fe',
        'l-muted':   '#cbd5e1',
        'l-text':    '#0f172a',
        'l-subtle':  '#64748b',
        // Brand
        'brand':        '#f59e0b',
        'brand-light':  '#fbbf24',
        'brand-dark':   '#d97706',
        'brand-dim':    '#78350f',
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'slide-up':     'slideUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-down':   'slideDown 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':      'fadeIn 0.3s ease forwards',
        'scale-in':     'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'spin-slow':    'spin 10s linear infinite',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'shimmer':      'shimmer 2.5s linear infinite',
        'bounce-soft':  'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(245,158,11,0.3)' },
          to:   { boxShadow: '0 0 30px rgba(245,158,11,0.6), 0 0 60px rgba(245,158,11,0.2)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSoft: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'premium':    '0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)',
        'premium-lg': '0 8px 48px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)',
        'glow-brand': '0 0 0 1px rgba(245,158,11,0.3), 0 4px 20px rgba(245,158,11,0.2)',
        'glow-blue':  '0 0 0 1px rgba(59,130,246,0.3), 0 4px 20px rgba(59,130,246,0.15)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-light': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #f59e0b, #f97316)',
        'gradient-surface': 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        'noise':            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
};
