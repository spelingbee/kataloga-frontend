import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    // Don't use the problematic setup file
    setupFiles: [],
    include: ['tests/types/api-client-type-safety.test.ts'],
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
      '~': resolve(__dirname, './app'),
      '@': resolve(__dirname, './app'),
      '#app': resolve(__dirname, './app'),
    },
  },
})