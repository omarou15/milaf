import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#3B5BDB", dark: "#1A1B2E", light: "#EEF2FF" },
        accent: "#4F46E5",
      },
    },
  },
  plugins: [],
};
export default config;
