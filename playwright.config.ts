import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.test manually to avoid dependency on dotenv package
let testDbUrl = 'postgresql://kataloga:kataloga_dev_password@localhost:5432/kataloga_test'
try {
  const envPath = path.resolve(import.meta.dirname || '.', '.env.test')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const match = envContent.match(/TEST_DATABASE_URL\s*=\s*(.+)/)
    if (match && match[1]) {
      testDbUrl = match[1].trim().replace(/['"]/g, '')
    }
  }
} catch (e) {
  console.warn('Could not read .env.test file, using default DB URL:', e)
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    // 1. Backend Server on Port 3101 running against kataloga_test DB
    {
      command: `npx cross-env PORT=3101 DATABASE_URL=${testDbUrl} node dist/main.js`,
      cwd: '../backend',
      url: 'http://localhost:3101/health',
      reuseExistingServer: false,
      timeout: 60000,
    },
    // 2. Tenant Admin on Port 3102 (Production Preview)
    {
      command: 'npx cross-env PORT=3102 NUXT_PUBLIC_API_BASE_URL=http://localhost:3101/api NUXT_PUBLIC_STOREFRONT_BASE_URL=http://localhost:3100 node ../tenant-admin/.output/server/index.mjs',
      url: 'http://localhost:3102',
      reuseExistingServer: false,
      timeout: 60000,
    },
    // 3. Customer Frontend on Port 3100 (Production Preview - Multi-tenant mode)
    {
      command: 'npx cross-env PORT=3100 NUXT_PUBLIC_API_BASE_URL=http://localhost:3101/api NUXT_PUBLIC_MULTI_TENANT_MODE=true node .output/server/index.mjs',
      url: 'http://localhost:3100',
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
})
