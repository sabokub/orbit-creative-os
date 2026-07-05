import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        accentBlue: "#2E4374",
        accentGreen: "#3A5A45",
      },
    },
  },
  plugins: [],
};

export default config;
