// Website Theme Colors - Zaman Mall Brand Identity
export const THEME_COLORS = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Secondary Brand Colors (Purple/Pink)
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Accent Colors
  accent: {
    pink: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
    },
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    }
  },
  
  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  
  // Status Colors (for alerts, notifications, etc.)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Dark Theme Colors
  dark: {
    background: '#02040a',
    surface: '#0a0f1c',
    card: '#0f172a',
    border: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
  }
};

// Gradient Combinations
export const GRADIENTS = {
  // Primary Gradients
  primary: {
    main: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
    light: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 50%, #0ea5e9 100%)',
    dark: 'linear-gradient(135deg, #0369a1 0%, #075985 50%, #0c4a6e 100%)',
  },
  
  // Secondary Gradients (Purple/Pink)
  secondary: {
    main: 'linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7c3aed 100%)',
    light: 'linear-gradient(135deg, #d8b4fe 0%, #c084fc 50%, #a855f7 100%)',
    dark: 'linear-gradient(135deg, #7c3aed 0%, #6b21a8 50%, #581c87 100%)',
  },
  
  // Accent Gradients
  accent: {
    pink: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)',
    red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
    green: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
    blue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
  },
  
  // Status Gradients (for alerts and notifications)
  success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
  error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
  info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
  
  // Multi-color Gradients
  sunset: 'linear-gradient(135deg, #f97316 0%, #ef4444 25%, #ec4899 50%, #a855f7 75%, #6366f1 100%)',
  ocean: 'linear-gradient(135deg, #0891b2 0%, #0ea5e9 25%, #3b82f6 50%, #6366f1 75%, #8b5cf6 100%)',
  forest: 'linear-gradient(135deg, #059669 0%, #10b981 25%, #22c55e 50%, #84cc16 75%, #eab308 100%)',
  
  // Premium Gradients
  gold: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 25%, #d97706 50%, #b45309 75%, #92400e 100%)',
  silver: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 25%, #9ca3af 50%, #6b7280 75%, #4b5563 100%)',
  platinum: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 25%, #d1d5db 50%, #9ca3af 75%, #6b7280 100%)',
};

// Background Patterns
export const BACKGROUNDS = {
  // Solid Colors
  solid: {
    primary: THEME_COLORS.primary[50],
    secondary: THEME_COLORS.secondary[50],
    dark: THEME_COLORS.dark.background,
    light: '#ffffff',
  },
  
  // Gradient Backgrounds
  gradient: {
    primary: GRADIENTS.primary.light,
    secondary: GRADIENTS.secondary.light,
    sunset: GRADIENTS.sunset,
    ocean: GRADIENTS.ocean,
    forest: GRADIENTS.forest,
  },
  
  // Pattern Backgrounds
  pattern: {
    dots: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
    grid: 'linear-gradient(rgba(229, 231, 235, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(229, 231, 235, 0.5) 1px, transparent 1px)',
    waves: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(229, 231, 235, 0.1) 10px, rgba(229, 231, 235, 0.1) 20px)',
  }
};

// Shadow Effects
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Colored Shadows
  primary: '0 10px 15px -3px rgba(14, 165, 233, 0.3), 0 4px 6px -2px rgba(14, 165, 233, 0.2)',
  secondary: '0 10px 15px -3px rgba(168, 85, 247, 0.3), 0 4px 6px -2px rgba(168, 85, 247, 0.2)',
  accent: '0 10px 15px -3px rgba(236, 72, 153, 0.3), 0 4px 6px -2px rgba(236, 72, 153, 0.2)',
};

// Animation Durations
export const ANIMATIONS = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '1000ms',
};

// Border Radius
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  '4xl': '2rem',
  full: '9999px',
};
