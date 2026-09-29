/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        brand: {
          50: '#F3F0FF',
          100: '#E9E3FF',
          200: '#D4C7FF',
          300: '#B7A3FF',
          400: '#9A7BFF',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
        },
        gold: '#F59E0B',
        ink: '#17142B',
        mist: '#F4F4F8',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(23,20,43,.05), 0 8px 24px -12px rgba(109,40,217,.18)',
        card: '0 1px 3px rgba(23,20,43,.07), 0 12px 32px -16px rgba(23,20,43,.18)',
        fab: '0 12px 28px -8px rgba(109,40,217,.55)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
