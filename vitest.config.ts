import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  define: {
    'import.meta.client': 'true',
    'import.meta.server': 'false',
    'import.meta.dev': 'true',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: [
      'node_modules/',
      'dist/',
      '.nuxt/',
      '.output/',
      'coverage/',
      'app/**',
    ],
    // Mock @vue/devtools-kit to prevent it from calling localStorage at module init time
    server: {
      deps: {
        inline: ['@vue/devtools-kit'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.nuxt/',
        '.output/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
      '@': resolve(__dirname, './app'),
      '#app': resolve(__dirname, './app'),
      '@vue/devtools-kit': resolve(__dirname, './tests/__mocks__/devtools-kit.ts'),
    },
  },
})