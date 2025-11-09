/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aura: "#dff0ff",
        pulse: "#ffd1dc",
        faith: "var(--color-faith-green)",
        yeshua: "var(--color-yeshua-gold)",
        oversoul: "var(--color-oversoul-blue)",
      },
      fontFamily: {
        glyph: ["YourGlyphFont", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
