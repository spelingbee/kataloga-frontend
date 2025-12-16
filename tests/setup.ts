import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock Vue composables
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    ref: vi.fn((value) => ({ value })),
    computed: vi.fn((fn) => ({ value: fn() })),
    reactive: vi.fn((obj) => obj),
    watch: vi.fn(),
    watchEffect: vi.fn(),
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    nextTick: vi.fn(() => Promise.resolve()),
  }
})

// Mock Pinia composables
vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia')
  return {
    ...actual,
    storeToRefs: vi.fn((store) => {
      const refs = {}
      for (const key in store) {
        if (typeof store[key] !== 'function') {
          refs[key] = { value: store[key] }
        }
      }
      return refs
    }),
  }
})

// Mock Nuxt composables
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
  })
  
  // Mock fetch
  vi.stubGlobal('fetch', vi.fn())
})

// Configure Vue Test Utils
config.global.plugins = []