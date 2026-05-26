import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createApiClient } from '~/utils/api'

// Ensure localStorage is available before any module (e.g. @vue/devtools-kit)
// tries to call it during import-time initialization.
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
  const _store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem: (key: string) => _store.get(key) ?? null,
      setItem: (key: string, value: string) => { _store.set(key, value) },
      removeItem: (key: string) => { _store.delete(key) },
      clear: () => { _store.clear() },
      get length() { return _store.size },
      key: (index: number) => Array.from(_store.keys())[index] ?? null,
    },
  })
}

// Mock Vue composables properly
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    ref: (value: any) => {
      const refObj = { value }
      return refObj
    },
    computed: (fn: () => any) => {
      const computedObj = { value: fn() }
      return computedObj
    },
    reactive: (obj: any) => obj,
    readonly: (obj: any) => obj,
    watch: vi.fn(),
    watchEffect: vi.fn(),
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    nextTick: vi.fn(() => Promise.resolve()),
    getCurrentInstance: vi.fn(() => ({ type: { name: 'TestComponent' } })),
  }
})

// Mock Pinia composables properly
vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia')
  return {
    ...actual,
    storeToRefs: (store: any) => {
      const refs: any = {}
      for (const key in store) {
        if (typeof store[key] !== 'function') {
          refs[key] = { value: store[key] }
        }
      }
      return refs
    },
  }
})

// Mock Nuxt composables globally
vi.mock('#app', () => ({
  useNuxtApp: vi.fn(() => ({
    $config: {
      public: {
        tenantSlug: 'test-tenant',
        apiUrl: 'http://localhost:3001',
        stripePublishableKey: 'pk_test_123',
      },
    },
    $reportError: vi.fn(),
  })),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      tenantSlug: 'test-tenant',
      apiUrl: 'http://localhost:3001',
      stripePublishableKey: 'pk_test_123',
    },
  })),
  navigateTo: vi.fn(),
  useRoute: vi.fn(() => ({
    params: { tenant: 'test-tenant' },
    query: {},
    path: '/test-tenant',
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
}))

// Also mock the direct imports
vi.mock('nuxt/app', () => ({
  useNuxtApp: vi.fn(() => ({
    $config: {
      public: {
        tenantSlug: 'test-tenant',
        apiUrl: 'http://localhost:3001',
        stripePublishableKey: 'pk_test_123',
      },
    },
    $reportError: vi.fn(),
  })),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      tenantSlug: 'test-tenant',
      apiUrl: 'http://localhost:3001',
      stripePublishableKey: 'pk_test_123',
    },
  })),
  navigateTo: vi.fn(),
  useRoute: vi.fn(() => ({
    params: { tenant: 'test-tenant' },
    query: {},
    path: '/test-tenant',
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
}))

// Mock i18n composables
vi.mock('@nuxtjs/i18n', () => ({
  useI18n: vi.fn(() => ({
    locale: { value: 'en' },
    t: vi.fn((key) => key),
    d: vi.fn((date) => date.toLocaleDateString()),
    n: vi.fn((number) => number.toString()),
  })),
}))

// Mock API error composable
vi.mock('~/composables/useApiError', () => ({
  useApiError: vi.fn(() => ({
    error: { value: null },
    isError: { value: false },
    clearError: vi.fn(),
    setError: vi.fn(),
    retry: vi.fn(),
  })),
}))

// Setup global test configuration
// Global storage for localStorage mock
const globalStorage = new Map<string, string>()

// Mock fetch globally with proper Response objects once at module level
const globalMockFetch = vi.fn().mockImplementation((url, options) => {
  const response = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'content-type': 'application/json',
    }),
    json: () => Promise.resolve({
      success: true,
      statusCode: 200,
      data: { message: 'Mock response' },
      error: null,
      meta: {
        requestId: 'test-request-id',
        timestamp: new Date().toISOString(),
        tenantId: 'test-tenant',
      },
    }),
    text: () => Promise.resolve(JSON.stringify({
      success: true,
      statusCode: 200,
      data: { message: 'Mock response' },
      error: null,
      meta: {
        requestId: 'test-request-id',
        timestamp: new Date().toISOString(),
        tenantId: 'test-tenant',
      },
    })),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    clone: () => response,
  }
  return Promise.resolve(response as Response)
})
vi.stubGlobal('fetch', globalMockFetch)

beforeEach(() => {
  // Create fresh Pinia instance for each test
  const pinia = createPinia()
  setActivePinia(pinia)
  
  // Clear storage between tests
  globalStorage.clear()
  
  // Mock localStorage with actual storage behavior
  const localStorageMock = {
    getItem: vi.fn((key: string) => globalStorage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      globalStorage.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      globalStorage.delete(key)
    }),
    clear: vi.fn(() => {
      globalStorage.clear()
    }),
  }
  vi.stubGlobal('localStorage', localStorageMock)
  
  // Initialize API client for tests
  createApiClient({
    baseURL: 'http://localhost:3001',
    tenantSlug: 'test-tenant',
  })
  
  globalMockFetch.mockClear()
  
  // Mock window.Telegram for Telegram Web App tests
  vi.stubGlobal('window', {
    Telegram: {
      WebApp: {
        initData: 'test-init-data',
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'en',
          },
        },
        themeParams: {
          bg_color: '#ffffff',
          text_color: '#000000',
          hint_color: '#999999',
          link_color: '#0088cc',
          button_color: '#0088cc',
          button_text_color: '#ffffff',
        },
        MainButton: {
          text: '',
          color: '#0088cc',
          textColor: '#ffffff',
          isVisible: false,
          isActive: true,
          isProgressVisible: false,
          setText: vi.fn(),
          onClick: vi.fn(),
          offClick: vi.fn(),
          show: vi.fn(),
          hide: vi.fn(),
          enable: vi.fn(),
          disable: vi.fn(),
          showProgress: vi.fn(),
          hideProgress: vi.fn(),
        },
        HapticFeedback: {
          impactOccurred: vi.fn(),
          notificationOccurred: vi.fn(),
          selectionChanged: vi.fn(),
        },
        requestContact: vi.fn(),
        ready: vi.fn(),
        expand: vi.fn(),
        close: vi.fn(),
      },
    },
    navigator: {
      onLine: true,
    },
    matchMedia: vi.fn(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
    getComputedStyle: vi.fn(() => ({
      getPropertyValue: vi.fn(() => 'none'),
      outline: 'none',
      outlineWidth: '0px',
      outlineStyle: 'none',
      outlineColor: 'transparent',
    })),
    localStorage: localStorageMock,
  })
  

})

// Configure Vue Test Utils
config.global.plugins = []

// Add global mocks for Vue composables
vi.stubGlobal('ref', (value: any) => ({ value }))
vi.stubGlobal('computed', (fn: () => any) => ({ value: fn() }))
vi.stubGlobal('reactive', (obj: any) => obj)
vi.stubGlobal('readonly', (obj: any) => obj)
vi.stubGlobal('watch', vi.fn())
vi.stubGlobal('watchEffect', vi.fn())
vi.stubGlobal('onMounted', vi.fn())
vi.stubGlobal('onUnmounted', vi.fn())
vi.stubGlobal('nextTick', vi.fn(() => Promise.resolve()))
vi.stubGlobal('getCurrentInstance', vi.fn(() => ({ type: { name: 'TestComponent' } })))
vi.stubGlobal('storeToRefs', (store: any) => {
  const refs: any = {}
  for (const key in store) {
    if (typeof store[key] !== 'function') {
      refs[key] = { value: store[key] }
    }
  }
  return refs
})

// Add global mocks for Nuxt composables
vi.stubGlobal('useNuxtApp', () => ({
  $config: {
    public: {
      tenantSlug: 'test-tenant',
      apiUrl: 'http://localhost:3001',
      stripePublishableKey: 'pk_test_123',
    },
  },
  $reportError: vi.fn(),
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    tenantSlug: 'test-tenant',
    apiUrl: 'http://localhost:3001',
    stripePublishableKey: 'pk_test_123',
  },
}))

vi.stubGlobal('useApiError', () => ({
  error: { value: null },
  isError: { value: false },
  clearError: vi.fn(),
  setError: vi.fn(),
  retry: vi.fn(),
}))

vi.stubGlobal('useI18n', () => ({
  locale: { value: 'en' },
  t: vi.fn((key) => key),
  d: vi.fn((date) => date.toLocaleDateString()),
  n: vi.fn((number) => number.toString()),
}))