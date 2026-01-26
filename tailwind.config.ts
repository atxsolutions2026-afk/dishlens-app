import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Brand colors pulled from DishLens logo (dominant red)
      colors: {
        brand: {
          DEFAULT: "#A01020",
          dark: "#111827",
          soft: "#FDF2F4"
        }
      },
      boxShadow: {
        soft: "0 10px 35px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
