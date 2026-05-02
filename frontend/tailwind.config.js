/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        karma: {
          gold: '#C89B3C',
          blue: '#0BC4E3',
          dark: '#0A1128',
          surface: '#111C32',
          border: '#1E2D4A',
        },
      },
    },
  },
  plugins: [],
}
