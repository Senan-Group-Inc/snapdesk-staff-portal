import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-urbanist)', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          50: 'color-mix(in srgb, var(--primary) 15%, white)',
          100: 'color-mix(in srgb, var(--primary) 30%, white)',
          200: 'color-mix(in srgb, var(--primary) 50%, white)',
          300: 'color-mix(in srgb, var(--primary) 70%, white)',
          400: 'color-mix(in srgb, var(--primary) 85%, white)',
          500: 'var(--primary)',
          600: 'var(--primary-hover)',
          700: 'color-mix(in srgb, var(--primary) 85%, black)',
          800: 'color-mix(in srgb, var(--primary) 70%, black)',
          900: 'color-mix(in srgb, var(--primary) 50%, black)',
        },
        admin: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
      },
    },
  },
  plugins: [],
}
export default config
