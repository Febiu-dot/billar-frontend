/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        carbon:  { DEFAULT: '#0a0a0a', 50: '#1a1a1a', 100: '#111111' },
        orange:  { DEFAULT: '#e85d04', light: '#f48c06', dark: '#c44b00', glow: '#ff7c1f' },
        silver:  { DEFAULT: '#c0c0c0', light: '#e8e8e8', dark: '#888888', muted: '#555555' },
        snooker: { red: '#cc0000', green: '#1a6b3a', brown: '#6b3a1a', blue: '#0055aa', pink: '#e878a0', black: '#111111', yellow: '#e8c820' },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
