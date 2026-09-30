import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#020510',
        glass: 'rgba(8,14,40,.45)',
        'glass-border': 'rgba(76,96,241,.12)',
        'glass-border-h': 'rgba(76,96,241,.28)',
        accent: '#4c60f1',
        purple: '#7b5cf0',
        t1: '#e2e5ef',
        t2: '#7b84a2',
        t3: '#434c68',
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
