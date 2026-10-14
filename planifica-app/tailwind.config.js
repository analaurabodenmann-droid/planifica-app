/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        sage: {
          50: '#f4f7f5',
          100: '#e3ece6',
          200: '#c6d8cd',
          300: '#a1bdac',
          400: '#799e87',
          500: '#5a826b',
          600: '#466854',
          700: '#395344',
          800: '#304338',
          900: '#2a3830',
        },
        cream: {
          50: '#fdfbf7',
          100: '#f7f3ea',
          200: '#eee5d3',
        }
      }
    },
  },
  plugins: [],
}
