/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        faros: {
          navy: "#0c2d36",
          ink: "#17363e",
          teal: "#0f766e",
          "teal-dark": "#0a5a54",
          mint: "#dcefeb",
          canvas: "#eef3f0",
          sand: "#f7f3e9",
          line: "#d3ddd8",
          muted: "#65787c",
          amber: "#d49a3a",
          coral: "#c95b54",
        },
      },
      fontFamily: {
        sans: ["Avenir Next", "Gill Sans", "Trebuchet MS", "sans-serif"],
        display: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
      },
      boxShadow: {
        faros: "0 18px 48px rgba(12, 45, 54, 0.12)",
        "faros-sm": "0 8px 24px rgba(12, 45, 54, 0.09)",
      },
    },
  },
  plugins: [],
}
