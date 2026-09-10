/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f2',
          100: '#e5ecdf',
          200: '#cbd9c1',
          300: '#a7bf98',
          400: '#7fa06d',
          500: '#5f844e',
          600: '#4a6a3c',
          700: '#3b5431',
          800: '#31442a',
          900: '#293924',
        },
        cream: { 50: '#fdfcf9', 100: '#f8f5ee', 200: '#f0eadb', 300: '#e4dbc5' },
        clay: { 300: '#f1c9a8', 400: '#e0a070', 500: '#d4874f', 600: '#b96b36' },
        ink: { 900: '#1f2a1c', 600: '#4b5747', 400: '#7d877a', 200: '#c9cfc6' },
        danger: { 500: '#c2493d', 100: '#f9e3e0' },
      },
      borderRadius: { xl2: '20px' },
    },
  },
  plugins: [],
};
