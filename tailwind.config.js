/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#ccff00',
        'primary-hover': '#b3e600',
        'neon-lime': '#ccff00',
        'background-dark': '#0B0C15',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'glass-bg': 'rgba(255, 255, 255, 0.03)',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      animation: {
        blob: 'float 20s infinite alternate',
        scan: 'scan 3s ease-in-out infinite',
        marquee: 'marquee 25s linear infinite',
      },
      backgroundSize: {
        'size-200': '200% 200%',
      },
      backgroundPosition: {
        'pos-0': '0% 0%',
        'pos-100': '100% 100%',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
