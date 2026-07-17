import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        soil: { DEFAULT: "#2C3A26", deep: "#1F2A1A" },
        sage: { DEFAULT: "#6B8E4E", dark: "#4A5A38" },
        leaf: "#9DB082",
        parchment: { DEFAULT: "#F0EDE2", 2: "#E8E6D8", 3: "#E2E5D2" },
        clay: "#B08A4A",
        ink: { DEFAULT: "#2C3A26", soft: "#5A6450", faint: "#7A8568" },
      },
    },
  },
  plugins: [],
};

export default config;
