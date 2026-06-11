/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        base:     '#0a0a0f',
        surface:  '#111118',
        elevated: '#1a1a24',
        accent:   '#6366f1',
      },
    },
  },
  plugins: [],
};
