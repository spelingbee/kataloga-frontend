import { vi, beforeEach } from 'vitest'
import { config } from '@vue/test-utils'
import * as vue from 'vue'

// Types
interface StorageMock {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
  length: number
  key: (index: number) => string | null
}

// 1. Better localStorage Mock
const createStorageMock = (): StorageMock => {
  let storage: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => { storage[key] = value.toString() }),
    removeItem: vi.fn((key: string) => { delete storage[key] }),
    clear: vi.fn(() => { storage = {} }),
    get length() { return Object.keys(storage).length },
    key: vi.fn((index: number) => Object.keys(storage)[index] || null)
  }
}

const mockLocalStorage = createStorageMock()
const mockSessionStorage = createStorageMock()

// 2. Setup globals
if (typeof global !== 'undefined') {
  // Use Object.defineProperty to avoid overwriting the entire window object if it exists
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true })
    Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage, writable: true })

    // Fix for "SupportedEventInterface is not a constructor"
    if (!window.Event) window.Event = global.Event
    if (!window.MouseEvent) window.MouseEvent = global.MouseEvent
    if (!window.KeyboardEvent) window.KeyboardEvent = global.KeyboardEvent
  } else {
    (global as any).localStorage = mockLocalStorage;
    (global as any).sessionStorage = mockSessionStorage;
  }

  // Auto-imports mock (make them available globally like Nuxt does)
  const vueFuncs = ['ref', 'computed', 'reactive', 'onMounted', 'onUnmounted', 'watch', 'watchEffect', 'nextTick', 'defineProps', 'defineEmits', 'defineModel', 'defineExpose', 'defineSlots', 'toRef', 'toRefs', 'unref', 'shallowRef', 'markRaw', 'provide', 'inject']
  vueFuncs.forEach(fn => {
    if ((vue as any)[fn]) {
      (global as any)[fn] = (vue as any)[fn]
    }
  })
}

// 3. Mock Nuxt and other modules
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
    params: { id: 'test-id', tenant: 'test-tenant' },
    query: {},
    path: '/test-tenant',
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
  })),
  useHead: vi.fn(),
  definePageMeta: vi.fn(),
}))

vi.mock('nuxt/app', () => (vi.importActual('#app')))

vi.mock('@nuxtjs/i18n', () => ({
  useI18n: vi.fn(() => ({
    locale: { value: 'en' },
    t: vi.fn((key) => key),
    d: vi.fn((date) => date.toLocaleDateString()),
    n: vi.fn((number) => number.toString()),
  })),
}))

// 4. Global Test Configuration
beforeEach(() => {
  mockLocalStorage.clear()
  mockSessionStorage.clear()
  vi.clearAllMocks()

  // Mock fetch
  const mockFetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: {} }),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
    })
  )
  vi.stubGlobal('fetch', mockFetch)

  // Mock Telegram
  vi.stubGlobal('Telegram', {
    WebApp: {
      initData: 'test',
      ready: vi.fn(),
      expand: vi.fn(),
      close: vi.fn(),
      MainButton: {
        show: vi.fn(),
        hide: vi.fn(),
        setText: vi.fn(),
        onClick: vi.fn(),
        offClick: vi.fn(),
      },
      HapticFeedback: {
        impactOccurred: vi.fn(),
        notificationOccurred: vi.fn(),
      }
    }
  })

  // Re-stub Nuxt globals in case they were cleared
  vi.stubGlobal('useNuxtApp', vi.fn(() => ({
    $config: { public: { tenantSlug: 'test-tenant', apiUrl: 'http://localhost:3001' } }
  })))
  vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({
    public: { tenantSlug: 'test-tenant', apiUrl: 'http://localhost:3001' }
  })))
  vi.stubGlobal('useRoute', vi.fn(() => ({ params: { id: 'test-id' } })))
  vi.stubGlobal('useRouter', vi.fn(() => ({ push: vi.fn() })))
})

// 5. Configure Vue Test Utils
config.global.stubs = {
  'NuxtLink': true,
  'ClientOnly': true,
  'Teleport': true
}

config.global.mocks = {
  $t: (key: string) => key,
  $d: (date: Date) => date.toLocaleDateString(),
  $n: (num: number) => num.toString(),
}