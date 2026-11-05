import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' lets the build run from any static folder (hash router, quickstart E-05)
export default defineConfig({
  base: './',
  plugins: [react()],
})
