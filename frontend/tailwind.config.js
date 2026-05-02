/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C89B3C',
          light: '#E4B84E',
          dark: '#A67C2E',
        },
        surface: '#111C32',
        border: '#1E2D4A',
        muted: '#8899BB',
        background: '#0A1128',
        positive: '#22c55e',
        negative: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
