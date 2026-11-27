/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './public/index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          page: '#020617',
          card: '#0F172A',
          raised: '#1E293B',
          link: '#818CF8',
          gold: '#FBBF24',
        },
        /* Teak — the primary brand colour (warm brown wood tone).
           Indigo stays as the secondary accent (links, badges); gold is
           the highlight accent (credits, Pro plan). */
        teak: {
          50: '#FAF6EF',
          100: '#F0E7DA',
          200: '#E2D2B8',
          300: '#D3BD97',
          400: '#C9A876',
          500: '#A67C52',
          600: '#8B6F47',
          700: '#6F5636',
          800: '#57432B',
          900: '#423322',
          950: '#2A2015',
        },
        brand: '#8B6F47',
      },
    },
  },
  plugins: [],
};
