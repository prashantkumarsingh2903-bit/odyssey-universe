/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: '#111111',
        primary: '#ffffff',
        muted: '#888888',
        accent: {
          idea: '#F5A623',
          knowledge: '#4A90E2',
          activity: '#7ED321',
          learning: '#9013FE',
          reflection: '#F8E71C'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
