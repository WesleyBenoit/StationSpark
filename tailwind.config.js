/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "charge-bg": "#050505",
        "charge-card": "#121212",
        "charge-accent": "#2F80FF",
        "charge-success": "#30D158",
        "charge-warning": "#FFD60A",
        "charge-danger": "#FF453A",
        "charge-muted": "#A1A1AA"
      }
    }
  },
  plugins: []
};
