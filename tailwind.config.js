/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: { DEFAULT: '#1a4731', dark: '#0f2b1e', light: '#246040' },
        gold:  { DEFAULT: '#c9a84c', dark: '#a07830', light: '#e6c870' },
        chalk: { DEFAULT: '#e8e0d0', muted: '#b0a890' },
        cue:   { DEFAULT: '#8b5e3c', light: '#c49a6c' },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
