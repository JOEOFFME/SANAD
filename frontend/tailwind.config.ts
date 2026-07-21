import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f4f6f8",
        panel: "#ffffff",
        ink: "#18212f",
        muted: "#667085",
        line: "#dfe4ea",
        brand: "#174b6b",
        "brand-dark": "#103b52",
        warning: "#b26a00",
        danger: "#b42318",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 24, 40, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
