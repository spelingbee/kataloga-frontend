import { vi } from 'vitest'
import type { TenantInfo, TenantBranding, TenantSettings } from '~/types/tenant'

/**
 * Mock tenant data for testing
 */
export const mockTenantData = {
  restaurant1: {
    slug: 'restaurant-abc',
    id: 'tenant-1',
    name: 'Restaurant ABC',
    domain: 'abc.example.com',
    isActive: true,
    branding: {
      logo: '/logos/abc-logo.png',
      primaryColor: '#FF5733',
      secondaryColor: '#FFC300',
      favicon: '/favicons/abc-favicon.ico',
      appName: 'Restaurant ABC',
      description: 'Best pizza in town',
    },
    settings: {
      currency: 'USD',
      timezone: 'America/New_York',
      language: 'en',
      features: {
        deliveryEnabled: true,
        pickupEnabled: true,
        paymentMethods: ['cash', 'card', 'online'],
        loyaltyProgram: true,
        onlineOrdering: true,
        tableReservation: true,
        multiLanguage: false,
        pushNotifications: true,
      },
      businessHours: {
        monday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        tuesday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        wednesday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        thursday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
        friday: { isOpen: true, openTime: '10:00', closeTime: '23:00' },
        saturday: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
        sunday: { isOpen: false, openTime: '', closeTime: '' },
      },
      contactInfo: {
        phone: '+1-555-0101',
        email: 'contact@abc.com',
        address: '123 Main St, New York, NY 10001',
      },
      deliverySettings: {
        enabled: true,
        minOrderAmount: 15,
        deliveryFee: 5,
        freeDeliveryThreshold: 50,
        maxDeliveryDistance: 10,
        estimatedDeliveryTime: 30,
        zones: [
          { name: 'Zone 1', fee: 5, minOrder: 15 },
          { name: 'Zone 2', fee: 7, minOrder: 20 },
        ],
      },
    },
  } as TenantInfo,

  restaurant2: {
    slug: 'restaurant-xyz',
    id: 'tenant-2',
    name: 'Restaurant XYZ',
    domain: 'xyz.example.com',
    isActive: true,
    branding: {
      logo: '/logos/xyz-logo.png',
      primaryColor: '#3498DB',
      secondaryColor: '#2ECC71',
      favicon: '/favicons/xyz-favicon.ico',
      appName: 'Restaurant XYZ',
      description: 'Authentic Italian cuisine',
    },
    settings: {
      currency: 'EUR',
      timezone: 'Europe/Rome',
      language: 'it',
      features: {
        deliveryEnabled: true,
        pickupEnabled: false,
        paymentMethods: ['card', 'online'],
        loyaltyProgram: false,
        onlineOrdering: true,
        tableReservation: false,
        multiLanguage: true,
        pushNotifications: false,
      },
      businessHours: {
        monday: { isOpen: true, openTime: '12:00', closeTime: '23:00' },
        tuesday: { isOpen: true, openTime: '12:00', closeTime: '23:00' },
        wednesday: { isOpen: true, openTime: '12:00', closeTime: '23:00' },
        thursday: { isOpen: true, openTime: '12:00', closeTime: '23:00' },
        friday: { isOpen: true, openTime: '12:00', closeTime: '00:00' },
        saturday: { isOpen: true, openTime: '12:00', closeTime: '00:00' },
        sunday: { isOpen: true, openTime: '12:00', closeTime: '22:00' },
      },
      contactInfo: {
        phone: '+39-06-12345678',
        email: 'info@xyz.it',
        address: 'Via Roma 1, 00100 Roma, Italy',
      },
      deliverySettings: {
        enabled: true,
        minOrderAmount: 20,
        deliveryFee: 3,
        freeDeliveryThreshold: 40,
        maxDeliveryDistance: 5,
        estimatedDeliveryTime: 45,
        zones: [],
      },
    },
  } as TenantInfo,

  inactiveTenant: {
    slug: 'inactive-restaurant',
    id: 'tenant-inactive',
    name: 'Inactive Restaurant',
    domain: undefined,
    isActive: false,
    branding: {
      logo: '/icon-192x192.png',
      primaryColor: '#1a1a1a',
      secondaryColor: '#f5f5f5',
      favicon: '/favicon.ico',
      appName: 'Inactive Restaurant',
      description: 'Temporarily closed',
    },
    settings: {
      currency: 'USD',
      timezone: 'UTC',
      language: 'en',
      features: {
        deliveryEnabled: false,
        pickupEnabled: false,
        paymentMethods: [],
        loyaltyProgram: false,
        onlineOrdering: false,
        tableReservation: false,
        multiLanguage: false,
        pushNotifications: false,
      },
      businessHours: {
        monday: { isOpen: false, openTime: '', closeTime: '' },
        tuesday: { isOpen: false, openTime: '', closeTime: '' },
        wednesday: { isOpen: false, openTime: '', closeTime: '' },
        thursday: { isOpen: false, openTime: '', closeTime: '' },
        friday: { isOpen: false, openTime: '', closeTime: '' },
        saturday: { isOpen: false, openTime: '', closeTime: '' },
        sunday: { isOpen: false, openTime: '', closeTime: '' },
      },
      contactInfo: {
        phone: '',
        email: '',
        address: '',
      },
      deliverySettings: {
        enabled: false,
        minOrderAmount: 0,
        deliveryFee: 0,
        freeDeliveryThreshold: 0,
        maxDeliveryDistance: 0,
        estimatedDeliveryTime: 0,
        zones: [],
      },
    },
  } as TenantInfo,
}

/**
 * Default tenant branding for fallback scenarios
 */
export const defaultBranding: TenantBranding = {
  logo: '/icon-192x192.png',
  primaryColor: '#1a1a1a',
  secondaryColor: '#f5f5f5',
  favicon: '/favicon.ico',
  appName: 'Menu Ordering App',
  description: 'Universal menu ordering system',
}

/**
 * Default tenant settings for fallback scenarios
 */
export const defaultSettings: TenantSettings = {
  currency: 'USD',
  timezone: 'UTC',
  language: 'en',
  features: {
    deliveryEnabled: true,
    pickupEnabled: true,
    paymentMethods: ['cash', 'card'],
    loyaltyProgram: false,
    onlineOrdering: true,
    tableReservation: false,
    multiLanguage: false,
    pushNotifications: false,
  },
  businessHours: {
    monday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    saturday: { isOpen: true, openTime: '10:00', closeTime: '23:00' },
    sunday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
  },
  contactInfo: {
    phone: '+1234567890',
    email: 'info@restaurant.com',
    address: '123 Main St',
  },
  deliverySettings: {
    enabled: true,
    minOrderAmount: 10,
    deliveryFee: 5,
    freeDeliveryThreshold: 50,
    maxDeliveryDistance: 10,
    estimatedDeliveryTime: 30,
    zones: [],
  },
}

/**
 * Create a mock tenant store for testing
 */
export function createMockTenantStore(initialTenant: TenantInfo | null = null) {
  return {
    currentTenant: ref<TenantInfo | null>(initialTenant),
    isLoading: ref(false),
    error: ref<string | null>(null),
    isMultiTenant: computed(() => !initialTenant),
    tenantSlug: computed(() => initialTenant?.slug || ''),
    tenantId: computed(() => initialTenant?.id || ''),
    tenantName: computed(() => initialTenant?.name || 'Restaurant'),
    tenantDomain: computed(() => initialTenant?.domain),
    isTenantActive: computed(() => initialTenant?.isActive || false),
    isTenantLoaded: computed(() => !!initialTenant),
    canSwitchTenant: computed(() => true),
    hasError: computed(() => false),
    tenantBranding: computed(() => initialTenant?.branding || defaultBranding),
    tenantSettings: computed(() => initialTenant?.settings || defaultSettings),
    setTenant: vi.fn(),
    switchTenant: vi.fn(),
    refreshTenant: vi.fn(),
    clearTenant: vi.fn(),
    validateTenant: vi.fn(),
    updateTenantInUrl: vi.fn(),
    removeTenantFromUrl: vi.fn(),
    isDataForCurrentTenant: vi.fn(),
    getTenantContext: vi.fn(),
    onTenantChange: vi.fn(),
  }
}

/**
 * Create a mock API client for tenant testing
 */
export function createMockApiClient(tenantSlug?: string) {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    setTenantSlug: vi.fn(),
    getTenantInfo: vi.fn(),
    validateTenantAccess: vi.fn(),
    setTokenStore: vi.fn(),
  }
}

/**
 * Mock localStorage for tenant testing
 */
export function mockLocalStorage() {
  const storage: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
    get length() {
      return Object.keys(storage).length
    },
    key: vi.fn((index: number) => Object.keys(storage)[index] || null),
  }
}

/**
 * Mock router for tenant testing
 */
export function createMockRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    currentRoute: ref({
      path: '/',
      query: {},
      params: {},
    }),
  }
}

/**
 * Mock route for tenant testing
 */
export function createMockRoute(query: Record<string, string> = {}) {
  return {
    path: '/',
    query,
    params: {},
    name: 'index',
    meta: {},
  }
}

/**
 * Mock runtime config for tenant testing
 */
export function createMockRuntimeConfig(overrides: Record<string, any> = {}) {
  return {
    public: {
      apiBaseUrl: 'https://api.test.com',
      tenantSlug: '',
      tenantQueryParam: 'tenant',
      preserveTenantInUrl: true,
      appName: 'Menu Ordering App',
      websocketUrl: 'wss://api.test.com',
      ...overrides,
    },
  }
}

/**
 * Simulate tenant switching scenario
 */
export async function simulateTenantSwitch(
  fromTenant: TenantInfo | null,
  toTenant: TenantInfo,
  mockStore: any
) {
  mockStore.currentTenant.value = fromTenant
  mockStore.isLoading.value = true
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 10))
  
  mockStore.currentTenant.value = toTenant
  mockStore.isLoading.value = false
  
  return true
}

/**
 * Simulate tenant validation
 */
export async function simulateTenantValidation(
  slug: string,
  isValid: boolean = true
) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 10))
  
  return isValid
}

/**
 * Create mock fetch response for tenant API
 */
export function createMockTenantResponse(tenant: TenantInfo, success: boolean = true) {
  return {
    ok: success,
    status: success ? 200 : 404,
    json: () => Promise.resolve(
      success
        ? { success: true, data: tenant }
        : { success: false, message: 'Tenant not found' }
    ),
  } as Response
}

/**
 * Setup tenant test environment
 */
export function setupTenantTestEnvironment(options: {
  tenant?: TenantInfo | null
  multiTenant?: boolean
  localStorage?: boolean
} = {}) {
  const mockStore = createMockTenantStore(options.tenant || null)
  const mockApi = createMockApiClient(options.tenant?.slug)
  const mockRouter = createMockRouter()
  const mockRoute = createMockRoute()
  const mockConfig = createMockRuntimeConfig({
    tenantSlug: options.multiTenant ? '' : options.tenant?.slug || '',
  })

  if (options.localStorage && typeof window !== 'undefined') {
    const mockStorage = mockLocalStorage()
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    })
  }

  return {
    mockStore,
    mockApi,
    mockRouter,
    mockRoute,
    mockConfig,
  }
}
