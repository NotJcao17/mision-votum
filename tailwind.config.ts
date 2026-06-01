import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory:     '#FAF5EC',
        cream:     '#F2E7D4',
        ink:       '#2B1D14',
        inksoft:   '#6F5E4C',
        inkfaint:  '#A2917C',
        terra:     '#C2552F',
        terradeep: '#A23F1F',
        olive:     '#3E5A4A',
        saffron:   '#DE9A33',
        danger:    '#B23A2E',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body:    ['var(--font-hanken)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        terra: '0 8px 20px rgba(194,85,47,0.28)',
      },
    },
  },
  plugins: [],
}

export default config
