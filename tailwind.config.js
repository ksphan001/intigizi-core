/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // intigizi Brand Colors
        "intigizi-green": "#8CC344", // User specified
        "intigizi-green-dark": "#269636", // User specified
        "intigizi-green-light": "#C5E4B6", // User specified
        "intigizi-green-soft": "#F1F8E9", // Keeping a very light tint for subtle backgrounds if needed, or mapping to C5E4B6 if preferred. Let's stick to C5E4B6 for consistency with user request as "light", or allow a fallback. I'll remove the extra soft one or map it to the light one provided if it's too dark.
        // Actually, C5E4B6 is quite colorful for a full background. I will keep a separate very light tint reference or just use the user ones.
        // User gave 3 greens. C5E4B6 is probably the "light" one.

        "intigizi-orange": "#F28D35", // User specified
        "intigizi-orange-dark": "#F2762E", // User specified
        "intigizi-orange-light": "#FFF3E0", // Keeping legacy tint for now

        // Semantic Aliases
        "solusimbg-blue": "#269636", // Dark Green for text
        "solusimbg-gold": "#F28D35", // Orange for accents
        "hipmi-blue": "#269636",
        "hipmi-gold": "#F28D35",
      },
      boxShadow: {
        // Updated RGB for #8CC344 -> 140, 195, 68
        "intigizi-glow": "0 4px 14px 0 rgba(140, 195, 68, 0.39)",
        "intigizi-glow-hover": "0 6px 20px rgba(140, 195, 68, 0.23)",
      },
    },
  },
  plugins: [],
};
