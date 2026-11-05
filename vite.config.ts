import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// base './' lets the build run from any static folder (hash router, quickstart E-05)
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
})
