/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E40AF", // Deep Navy
          hover: "#1D4ED8",
          foreground: "#FFFFFF",
          light: "#DBEAFE",
          dark: "#1E3A8A",
        },
        secondary: {
          DEFAULT: "#3B82F6", // Service Blue
          hover: "#2563EB",
          foreground: "#FFFFFF",
          light: "#EFF6FF",
        },
        accent: {
          DEFAULT: "#0D9488", // Teal
          hover: "#0F766E",
          foreground: "#FFFFFF",
          light: "#CCFBF1",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#DCFCE7",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
          foreground: "#FFFFFF",
        },
        background: "#F8FAFC",
        foreground: "#0F172A",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        border: "#E2E8F0",
        ring: "#1E40AF",
      },
      fontFamily: {
        sans: ["'Atkinson Hyperlegible'", "'Inter'", "system-ui", "sans-serif"],
        heading: ["'Atkinson Hyperlegible'", "'Inter'", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        elevated: "0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
      }
    },
  },
  plugins: [],
}
