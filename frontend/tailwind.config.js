/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#e2e8f0',
        'secondary': '#8899aa',
        'bg-primary': '#0c1117',
        'bg-secondary': '#131920',
        'bg-accent': 'rgba(255, 255, 255, 0.03)',
        'tier-critical': '#dc2626',
        'tier-high': '#d97706',
        'tier-watch': '#ca8a04',
        'tier-stable': '#16a34a',
        'tier-info': '#4f83cc',
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
