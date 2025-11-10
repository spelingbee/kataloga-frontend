import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTenant, useTenantBranding, useTenantSettings } from '~/composables/useTenant'
import type { TenantInfo } from '~/types/tenant'

// Mock tenant store
vi.mock('~/stores/tenant', () => ({
  useTenantStore: vi.fn(() => ({
    currentTenant: ref<TenantInfo | null>(null),
    isLoading: ref(false),
    error: ref<string | null>(null),
    isMultiTenant: true,
    tenantSlug: '',
    tenantId: '',
    tenantName: 'Restaurant',
    tenantDomain: undefined,
    isTenantActive: false,
    isTenantLoaded: false,
    canSwitchTenant: true,
    hasError: false,
    tenantBranding: {
      logo: '/icon-192x192.png',
      primaryColor: '#1a1a1a',
      secondaryColor: '#f5f5f5',
      favicon: '/favicon.ico',
      appName: 'Menu Ordering App',
      description: 'Universal menu ordering system',
    },
    tenantSettings: {
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
    },
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
  })),
}))

// Mock router
vi.mock('#app', () => ({
  useRoute: vi.fn(() => ({
    query: {},
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      tenantQueryParam: 'tenant',
      preserveTenantInUrl: true,
      appName: 'Menu Ordering App',
    },
  })),
}))

describe('useTenant', () => {
  let mockTenantStore: any

  beforeEach(async () => {
    mockTenantStore = {
      currentTenant: ref<TenantInfo | null>(null),
      isLoading: ref(false),
      error: ref<string | null>(null),
      isMultiTenant: true,
      tenantSlug: '',
      tenantId: '',
      tenantName: 'Restaurant',
      tenantDomain: undefined,
      isTenantActive: false,
      isTenantLoaded: false,
      canSwitchTenant: true,
      hasError: false,
      tenantBranding: {
        logo: '/icon-192x192.png',
        primaryColor: '#1a1a1a',
        secondaryColor: '#f5f5f5',
        favicon: '/favicon.ico',
        appName: 'Menu Ordering App',
        description: 'Universal menu ordering system',
      },
      tenantSettings: {
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
      },
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

    vi.mocked(await import('~/stores/tenant')).useTenantStore.mockReturnValue(mockTenantStore)
  })

  describe('basic tenant operations', () => {
    it('should provide reactive tenant state', () => {
      const { currentTenant, isLoading, error } = useTenant()

      expect(currentTenant.value).toBeNull()
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should call setTenant', async () => {
      mockTenantStore.setTenant.mockResolvedValue(true)
      
      const { setTenant } = useTenant()
      const result = await setTenant('restaurant-abc')

      expect(mockTenantStore.setTenant).toHaveBeenCalledWith('restaurant-abc', {})
      expect(result).toBe(true)
    })

    it('should call switchTenant', async () => {
      mockTenantStore.switchTenant.mockResolvedValue(true)
      
      const { switchTenant } = useTenant()
      const result = await switchTenant('restaurant-xyz')

      expect(mockTenantStore.switchTenant).toHaveBeenCalledWith('restaurant-xyz', {})
      expect(result).toBe(true)
    })

    it('should call refreshTenant', async () => {
      const { refreshTenant } = useTenant()
      await refreshTenant()

      expect(mockTenantStore.refreshTenant).toHaveBeenCalled()
    })

    it('should call clearTenant', () => {
      const { clearTenant } = useTenant()
      clearTenant()

      expect(mockTenantStore.clearTenant).toHaveBeenCalled()
    })

    it('should call validateTenant', async () => {
      mockTenantStore.validateTenant.mockResolvedValue(true)
      
      const { validateTenant } = useTenant()
      const result = await validateTenant('restaurant-abc')

      expect(mockTenantStore.validateTenant).toHaveBeenCalledWith('restaurant-abc')
      expect(result).toBe(true)
    })
  })

  describe('computed properties', () => {
    it('should provide tenant slug', () => {
      mockTenantStore.tenantSlug = 'restaurant-abc'
      
      const { tenantSlug } = useTenant()

      expect(tenantSlug.value).toBe('restaurant-abc')
    })

    it('should provide tenant name', () => {
      mockTenantStore.tenantName = 'Test Restaurant'
      
      const { tenantName } = useTenant()

      expect(tenantName.value).toBe('Test Restaurant')
    })

    it('should provide multi-tenant flag', () => {
      mockTenantStore.isMultiTenant = true
      
      const { isMultiTenant } = useTenant()

      expect(isMultiTenant.value).toBe(true)
    })
  })

  describe('branding and settings', () => {
    it('should provide tenant branding', () => {
      const { tenantBranding } = useTenant()

      expect(tenantBranding.value.logo).toBe('/icon-192x192.png')
      expect(tenantBranding.value.primaryColor).toBe('#1a1a1a')
      expect(tenantBranding.value.appName).toBe('Menu Ordering App')
    })

    it('should provide tenant settings', () => {
      const { tenantSettings } = useTenant()

      expect(tenantSettings.value.currency).toBe('USD')
      expect(tenantSettings.value.language).toBe('en')
      expect(tenantSettings.value.features.deliveryEnabled).toBe(true)
    })
  })
})

describe('useTenantBranding', () => {
  it('should provide branding properties with fallbacks', () => {
    const { logo, primaryColor, appName } = useTenantBranding()

    expect(logo.value).toBe('/icon-192x192.png')
    expect(primaryColor.value).toBe('#1a1a1a')
    expect(appName.value).toBe('Menu Ordering App')
  })
})

describe('useTenantSettings', () => {
  it('should provide settings properties', () => {
    const { currency, language, isDeliveryEnabled } = useTenantSettings()

    expect(currency.value).toBe('USD')
    expect(language.value).toBe('en')
    expect(isDeliveryEnabled.value).toBe(true)
  })

  it('should format currency correctly', () => {
    const { formatCurrency } = useTenantSettings()

    const formatted = formatCurrency(29.99)

    expect(formatted).toContain('29.99')
  })

  it('should calculate delivery fee', () => {
    const { calculateDeliveryFee } = useTenantSettings()

    // Below free delivery threshold
    expect(calculateDeliveryFee(30)).toBe(5)

    // Above free delivery threshold
    expect(calculateDeliveryFee(60)).toBe(0)
  })

  it('should check minimum order amount', () => {
    const { meetsMinimumOrder } = useTenantSettings()

    expect(meetsMinimumOrder(15)).toBe(true)
    expect(meetsMinimumOrder(5)).toBe(false)
  })

  it('should check if feature is enabled', () => {
    const { isFeatureEnabled } = useTenantSettings()

    expect(isFeatureEnabled('deliveryEnabled')).toBe(true)
    expect(isFeatureEnabled('loyaltyProgram')).toBe(false)
  })

  it('should check payment method support', () => {
    const { isPaymentMethodSupported } = useTenantSettings()

    expect(isPaymentMethodSupported('cash')).toBe(true)
    expect(isPaymentMethodSupported('card')).toBe(true)
    expect(isPaymentMethodSupported('crypto')).toBe(false)
  })
})
