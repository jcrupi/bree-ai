/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        th: {
          bg: '#0a0a0f',
          card: '#13131f',
          elevated: '#1a1a2e',
          accent: '#6c63ff',
          secondary: '#00d4aa',
          warn: '#ff6b6b',
          gold: '#ffd700',
          border: 'rgba(255,255,255,0.06)',
          'border-accent': 'rgba(255,255,255,0.1)',
          'text-primary': '#f0f0ff',
          'text-secondary': '#8888aa',
          'text-muted': '#4a4a6a',
        },
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
