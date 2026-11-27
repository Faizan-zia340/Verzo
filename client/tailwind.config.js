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
        brand: '#4F46E5',
      },
    },
  },
  plugins: [],
};
