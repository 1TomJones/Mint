import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#06080d',
        surface: '#0b111a',
        panel: '#121a24',
        mint: '#7ce8c8',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,232,200,0.36), 0 8px 36px rgba(124,232,200,0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      backgroundImage: {
        radial: 'radial-gradient(circle at top, rgba(124,232,200,0.14), transparent 58%)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
} satisfies Config;
