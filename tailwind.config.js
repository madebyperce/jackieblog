/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'work-sans': ['var(--font-work-sans)'],
        'inter': ['var(--font-inter)'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}; 