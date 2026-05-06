import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
        pixel: ["Press Start 2P", "cursive"],
      },
      colors: {
        background: "#1a1a2e",
        foreground: "#eaeaea",
        primary: "#ff6b6b",
        secondary: "#4ecdc4",
        accent: "#ffe66d",
        dark: "#0f0f1e",
        light: "#f5f5f5",
      },
      fontSize: {
        xs: ["10px", { lineHeight: "12px" }],
        sm: ["12px", { lineHeight: "16px" }],
        base: ["14px", { lineHeight: "20px" }],
        lg: ["16px", { lineHeight: "24px" }],
        xl: ["18px", { lineHeight: "28px" }],
        "2xl": ["20px", { lineHeight: "28px" }],
      },
      boxShadow: {
        pixel: "2px 2px 0px rgba(0,0,0,0.5), 4px 4px 0px rgba(0,0,0,0.25)",
        "pixel-inset": "inset 2px 2px 0px rgba(0,0,0,0.5)",
      },
      borderWidth: {
        px: "1px",
        2: "2px",
        3: "3px",
        4: "4px",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce: "bounce 1s infinite",
        "pixel-bounce": "pixelBounce 0.6s ease-in-out infinite",
      },
      keyframes: {
        pixelBounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
