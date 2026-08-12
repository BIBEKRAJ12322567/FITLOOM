/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        floor: '#14161A', // rubber flooring base — app background
        panel: '#1C1F23', // card surfaces
        raised: '#24282D', // hover / active surfaces
        steel: '#2C3036', // hairline borders/dividers
        chalk: '#F2F1ED', // primary text
        muted: '#8C9198', // secondary text
        tape: {
          DEFAULT: '#FF6B1F', // safety-tape orange — the one accent color
          dim: '#C94E12',
          50: '#FFF1E8',
        },
        iron: '#4FA8E0', // cold steel-blue, used sparingly for a 2nd data series
        success: '#58C97B',
        warning: '#F5B942',
        danger: '#E5484D',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        rubber:
          'repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 2px, transparent 2px, transparent 10px)',
      },
    },
  },
  plugins: [],
};
