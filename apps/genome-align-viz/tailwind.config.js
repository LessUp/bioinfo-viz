/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        match: "#60a5fa",
        mismatch: "#ef4444",
        insertion: "#22c55e",
        deletion: "#f59e0b"
      }
    }
  },
  plugins: []
}
