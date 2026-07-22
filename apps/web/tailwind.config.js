/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#12181F',
          light: '#1E2630',
        },
        paper: {
          DEFAULT: '#F6F5F2',
          card: '#FFFFFF',
          dark: '#EAE8E3',
        },
        slate: {
          DEFAULT: '#626B78',
          light: '#9EA5B0',
          border: '#D8DBE0',
        },
        ledger: {
          DEFAULT: '#0E5C56',
          hover: '#0A4641',
          light: '#E6F2F0',
        },
        amber: {
          DEFAULT: '#C97D2E',
          hover: '#A96622',
          light: '#FBF2E7',
        },
        signal: {
          red: '#B3261E',
          redLight: '#FCEBEB',
          green: '#1B7A4A',
          greenLight: '#E8F5EE',
        },
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        sans: ['Public Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        hairline: '0 0 0 1px rgba(18, 24, 31, 0.08)',
        manifest: '0 2px 4px rgba(18, 24, 31, 0.04), 0 0 0 1px rgba(18, 24, 31, 0.08)',
      },
    },
  },
  plugins: [],
};
