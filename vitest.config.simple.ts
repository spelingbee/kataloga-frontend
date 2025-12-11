import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: [
      'node_modules/',
      'dist/',
      '.nuxt/',
      '.output/',
      'coverage/',
      'app/**',
    ],
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '#app': fileURLToPath(new URL('./.nuxt', import.meta.url)),
    },
  },
})
