/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6fe',
          500: '#3b6cf6',
          600: '#2a54e0',
          700: '#2242b8',
          900: '#1c3585',
        },
      },
    },
  },
  plugins: [],
}
