import { vi } from 'vitest'

export const useRoute = vi.fn(() => ({ params: {}, query: {} }))
export const useRouter = vi.fn(() => ({ push: vi.fn(), replace: vi.fn() }))
export const useRuntimeConfig = vi.fn(() => ({ 
  public: {
    apiBaseUrl: 'http://localhost:3001',
    multiTenantMode: true,
    tenantQueryParam: 'tenant'
  } 
}))
export const useNuxtApp = vi.fn(() => ({ 
  $reportError: vi.fn(),
  $apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}))
export const navigateTo = vi.fn()
export const defineNuxtPlugin = vi.fn((fn) => fn)
export const defineNuxtRouteMiddleware = vi.fn((fn) => fn)
