import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)',    'system-ui', 'sans-serif'],
      },
      colors: {
        surface:  '#0F1419',
        elevated: '#161C24',
        accent:   '#6EE7B7',
      },
    },
  },
  plugins: [],
};

export default config;
