import tailwindScrollbar from 'tailwind-scrollbar';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stratum: {
          dark: '#0a0a0b',
          glass: 'rgba(20, 20, 22, 0.7)',
          accent: '#00f2ff',
          risk: {
            low: '#00ff88',
            medium: '#ffcc00',
            high: '#ff3d00',
            critical: '#8800ff',
          }
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    tailwindScrollbar({ nocompatible: true }),
  ],
}
