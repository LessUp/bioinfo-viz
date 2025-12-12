import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
