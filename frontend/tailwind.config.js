/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          teal: "#075E54",
          green: "#25D366",
          darkGreen: "#128C7E",
          lightGreen: "#DCF8C6",
          chatBg: "#EFEAE2",
          gray: "#ECE5DD",
        }
      }
    },
  },
  plugins: [],
}
