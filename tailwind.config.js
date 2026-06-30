/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{njk,html,md,js}"],
  theme: {
    extend: {
      colors: {
        black:        "#121212",
        green:        "#5A6857",
        "green-dark": "#30382e",
        orange:       "#E45A0C",
        grey:         "#F7F7F7",
        warm:         "#EEEDEA",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "sans-serif"],
        body:    ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
