/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0f14',
        surface: '#151820',
        primary: '#6366f1',
        primaryHover: '#4f46e5',
        success: '#22c55e',
        danger: '#ef4444',
        textMain: '#f8fafc',
        textMuted: '#94a3b8',
        border: '#1e293b'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
