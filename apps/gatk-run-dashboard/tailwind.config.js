/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        status: {
          Queued: '#a3a3a3',
          Running: '#60a5fa',
          Succeeded: '#22c55e',
          Failed: '#ef4444',
          Aborted: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}
