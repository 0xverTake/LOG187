/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'background': 'var(--color-bg)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'accent-industrial': 'var(--color-accent-industrial)',
        'accent-medical': 'var(--color-accent-medical)',
        'border': 'var(--color-border)',
        'surface': 'var(--color-surface)',
      }
    },
  },
  plugins: [],
}
