/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'soundWave': 'soundWave 0.6s ease-in-out infinite',
        'doubleTapHeart': 'doubleTapHeart 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'sparkle': 'sparkle 0.8s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        shimmer: {
          'from': { transform: 'translateX(-100%)' },
          'to': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        soundWave: {
          '0%, 100%': { height: '30%' },
          '50%': { height: '70%' },
        },
        doubleTapHeart: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0)',
          },
          '15%': { 
            opacity: '0.9',
            transform: 'scale(1.2)',
          },
          '30%': { 
            opacity: '1',
            transform: 'scale(0.95)',
          },
          '50%': { 
            opacity: '1',
            transform: 'scale(1.1)',
          },
          '70%': { 
            opacity: '1',
            transform: 'scale(1)',
          },
          '100%': { 
            opacity: '0',
            transform: 'scale(1.3)',
          },
        },
        sparkle: {
          '0%': {
            opacity: '0',
            transform: 'scale(0) translateY(0)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1) translateY(-10px)',
          },
          '100%': {
            opacity: '0',
            transform: 'scale(0.5) translateY(-30px)',
          },
        }
      }
    },
  },
  plugins: [],
}
