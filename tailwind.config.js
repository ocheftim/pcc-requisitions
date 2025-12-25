/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pcc: {
          50: '#fef3f2',
          100: '#fee5e2',
          200: '#fecfca',
          300: '#fdaea5',
          400: '#fa7f71',
          500: '#c1272d', // PCC Red - Main Brand Color
          600: '#ad2329',
          700: '#911e23',
          800: '#781c20',
          900: '#641b1f',
        }
      }
    },
  },
  plugins: [],
}
