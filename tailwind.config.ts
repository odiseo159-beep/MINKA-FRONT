import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Minka brand colors
        minka: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#C0392B", // Primary
          600: "#A93226",
          700: "#8B2920",
          800: "#6D201A",
          900: "#4F1714",
        },
        // Status colors
        status: {
          nuevo: "#3B82F6",
          tramite: "#F59E0B",
          audiencia: "#8B5CF6",
          pendiente: "#EAB308",
          revision: "#06B6D4",
          apelacion: "#EC4899",
          resuelto: "#22C55E",
          archivado: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
