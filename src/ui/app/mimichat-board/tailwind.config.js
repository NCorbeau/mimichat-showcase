/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      width: {
        "112": "448px"
      },
      height: {
        "19": "72px",
      }
    },
  },
  plugins: [],
}