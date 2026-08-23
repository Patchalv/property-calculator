/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base: works from `npm run dev`, from a local build, and from any
  // GitHub Pages sub-path without needing to know the repo name up front.
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    // The engine is pure and needs no DOM. UI tests opt in with a
    // `@vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test-setup.ts'],
  },
})
