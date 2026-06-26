/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0a0a0f",
          surface: "#13131f",
          card: "rgba(255,255,255,0.04)",
        },
        primary: {
          DEFAULT: "#7c3aed",
          hover: "#6d28d9",
          glow: "rgba(124,58,237,0.4)",
        },
        accent: {
          DEFAULT: "#06b6d4",
          hover: "#0891b2",
          glow: "rgba(6,182,212,0.35)",
        },
        success: {
          DEFAULT: "#10b981",
          glow: "rgba(16,185,129,0.35)",
        },
        danger: {
          DEFAULT: "#ef4444",
          glow: "rgba(239,68,68,0.35)",
        },
        border: {
          subtle: "rgba(255,255,255,0.08)",
          focus: "rgba(124,58,237,0.6)",
        },
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
          muted: "#475569",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backdropBlur: {
        xs: "4px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(124,58,237,0.3)",
        "glow-cyan": "0 0 20px rgba(6,182,212,0.3)",
        "glow-green": "0 0 20px rgba(16,185,129,0.3)",
        card: "0 4px 32px rgba(0,0,0,0.5)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(124,58,237,0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(124,58,237,0.6)" },
        },
      },
    },
  },
  plugins: [],
};
