/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cabuyal: {
          verde: '#1c5e20',
          claro: '#4caf50',
          fondo: '#f0f4f0',
          oscuro: '#0d3b10',
        }
      }
    }
  },
  plugins: [],
}