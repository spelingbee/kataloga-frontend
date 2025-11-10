import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTenantStore } from '~/stores/tenant'
import { 
  mockTenantData,
  createMockApiClient,
  createMockRuntimeConfig,
  mockLocalStorage,
  simulateTenantSwitch
} from '../utils/tenant-test-helpers'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useNuxtApp: vi.fn(() => ({
    $tenantResolver: {
      resolveTenantWithFallback: vi.fn(),
      validateTenant: vi.fn(),
      getTenantInfo: vi.fn(),
      saveStoredTenant: vi.fn(),
      clearStoredTenant: vi.fn(),
      clearTenantCache: vi.fn(),
      getStoredTenant: vi.fn(),
      prefetchTenant: vi.fn(),
    },
    $apiClient: createMockApiClient(),
  })),
  useRoute: vi.fn(() => ({
    query: {},
    path: '/',
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
  useRuntimeConfig: vi.fn(() => createMockRuntimeConfig()),
  navigateTo: vi.fn(),
}))

// Mock stores to avoid circular dependencies
vi.mock('~/stores/cart', () => ({
  useCartStore: vi.fn(() => ({
    clearCart: vi.fn(),
  })),
}))

vi.mock('~/stores/menu', () => ({
  useMenuStore: vi.fn(() => ({
    categories: [],
    menuItems: [],
    favourites: [],
    currentCategory: null,
    searchQuery: '',
    filters: {},
    selectedDish: null,
  })),
}))

vi.mock('~/stores/order', () => ({
  useOrderStore: vi.fn(() => ({
    currentOrder: null,
    orderHistory: [],
  })),
}))

describe('useTenantStore', () => {
  let store: ReturnType<typeof useTenantStore>
  let mockTenantResolver: any
  let mockApiClient: any
  let mockRouter: any
  let mockConfig: any

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTenantStore()

    // Get mocked dependencies
    const nuxtApp = (await import('#app')).useNuxtApp()
    mockTenantResolver = (nuxtApp as any).$tenantResolver
    mockApiClient = (nuxtApp as any).$apiClient
    mockRouter = (await import('#app')).useRouter()
    mockConfig = (await import('#app')).useRuntimeConfig()

    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(store.currentTenant).toBeNull()
      expect(store.availableTenants).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.isInitialized).toBe(false)
    })
  })

  describe('getters', () => {
    it('should return empty tenant slug when no tenant', () => {
      expect(store.tenantSlug).toBe('')
    })

    it('should return tenant slug when tenant is set', () => {
      store.currentTenant = mockTenantData.restaurant1
      expect(store.tenantSlug).toBe('restaurant-abc')
    })

    it('should return tenant ID', () => {
      store.currentTenant = mockTenantData.restaurant1
      expect(store.tenantId).toBe('tenant-1')
    })

    it('should check if multi-tenant mode', () => {
      mockConfig.public.multiTenantMode = true
      expect(store.isMultiTenant).toBe(true)

      mockConfig.public.multiTenantMode = false
      mockConfig.public.tenantSlug = ''
      expect(store.isMultiTenant).toBe(true)

      mockConfig.public.tenantSlug = 'restaurant-abc'
      expect(store.isMultiTenant).toBe(false)
    })

    it('should return tenant branding', () => {
      store.currentTenant = mockTenantData.restaurant1
      const branding = store.tenantBranding

      expect(branding.logo).toBe('/logos/abc-logo.png')
      expect(branding.primaryColor).toBe('#FF5733')
      expect(branding.appName).toBe('Restaurant ABC')
    })

    it('should return default branding when no tenant', () => {
      const branding = store.tenantBranding

      expect(branding.logo).toBe('/icon-192x192.png')
      expect(branding.appName).toBe('Menu Ordering App')
    })

    it('should return tenant settings', () => {
      store.currentTenant = mockTenantData.restaurant1
      const settings = store.tenantSettings

      expect(settings.currency).toBe('USD')
      expect(settings.timezone).toBe('America/New_York')
      expect(settings.features.deliveryEnabled).toBe(true)
    })

    it('should check if tenant is active', () => {
      store.currentTenant = mockTenantData.restaurant1
      expect(store.isTenantActive).toBe(true)

      store.currentTenant = mockTenantData.inactiveTenant
      expect(store.isTenantActive).toBe(false)
    })

    it('should check if tenant switching is allowed', () => {
      mockConfig.public.allowTenantSwitching = true
      mockConfig.public.multiTenantMode = true
      expect(store.canSwitchTenant).toBe(true)

      mockConfig.public.allowTenantSwitching = false
      expect(store.canSwitchTenant).toBe(false)
    })

    it('should return tenant name', () => {
      store.currentTenant = mockTenantData.restaurant1
      expect(store.tenantName).toBe('Restaurant ABC')

      store.currentTenant = null
      expect(store.tenantName).toBe('Restaurant')
    })

    it('should check if store has error', () => {
      expect(store.hasError).toBe(false)

      store.error = 'Test error'
      expect(store.hasError).toBe(true)
    })

    it('should check if tenant is loaded', () => {
      expect(store.isTenantLoaded).toBe(false)

      store.currentTenant = mockTenantData.restaurant1
      expect(store.isTenantLoaded).toBe(true)

      store.isLoading = true
      expect(store.isTenantLoaded).toBe(false)
    })
  })

  describe('initializeTenant', () => {
    it('should initialize tenant successfully', async () => {
      const tenant = mockTenantData.restaurant1
      mockTenantResolver.resolveTenantWithFallback.mockResolvedValue({
        tenant,
        source: 'query',
        requiresSelection: false,
      })

      await store.initializeTenant()

      expect(store.currentTenant).toEqual(tenant)
      expect(store.isInitialized).toBe(true)
      expect(store.error).toBeNull()
    })

    it('should redirect to selection page when no tenant found', async () => {
      mockConfig.public.multiTenantMode = true
      mockTenantResolver.resolveTenantWithFallback.mockResolvedValue({
        tenant: null,
        source: 'none',
        requiresSelection: true,
      })

      const navigateTo = (await import('#app')).navigateTo
      await store.initializeTenant()

      expect(navigateTo).toHaveBeenCalledWith('/select-restaurant')
      expect(store.isInitialized).toBe(true)
    })

    it('should handle initialization errors', async () => {
      mockTenantResolver.resolveTenantWithFallback.mockRejectedValue(
        new Error('Network error')
      )

      await store.initializeTenant()

      expect(store.error).toBe('Network error')
      expect(store.isInitialized).toBe(true)
    })

    it('should not initialize twice', async () => {
      const tenant = mockTenantData.restaurant1
      mockTenantResolver.resolveTenantWithFallback.mockResolvedValue({
        tenant,
        source: 'query',
        requiresSelection: false,
      })

      await store.initializeTenant()
      await store.initializeTenant()

      expect(mockTenantResolver.resolveTenantWithFallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('setTenant', () => {
    it('should set tenant successfully', async () => {
      const tenant = mockTenantData.restaurant1
      mockTenantResolver.validateTenant.mockResolvedValue({
        isValid: true,
        tenant,
      })
      mockTenantResolver.getTenantInfo.mockResolvedValue(tenant)

      const result = await store.setTenant('restaurant-abc')

      expect(result).toBe(true)
      expect(store.currentTenant).toEqual(tenant)
      expect(mockTenantResolver.saveStoredTenant).toHaveBeenCalledWith('restaurant-abc')
    })

    it('should validate tenant before setting', async () => {
      mockTenantResolver.validateTenant.mockResolvedValue({
        isValid: false,
        error: 'Invalid tenant',
      })

      const result = await store.setTenant('invalid-tenant')

      expect(result).toBe(false)
      expect(store.error).toContain('Invalid tenant')
      expect(store.currentTenant).toBeNull()
    })

    it('should skip validation when option is set', async () => {
      const tenant = mockTenantData.restaurant1
      mockTenantResolver.getTenantInfo.mockResolvedValue(tenant)

      await store.setTenant('restaurant-abc', { validateAccess: false })

      expect(mockTenantResolver.validateTenant).not.toHaveBeenCalled()
      expect(mockTenantResolver.getTenantInfo).toHaveBeenCalled()
    })

    it('should update URL when option is set', async () => {
      const tenant = mockTenantData.restaurant1
      mockConfig.public.preserveTenantInUrl = true
      mockTenantResolver.validateTenant.mockResolvedValue({ isValid: true, tenant })
      mockTenantResolver.getTenantInfo.mockResolvedValue(tenant)

      await store.setTenant('restaurant-abc', { updateUrl: true })

      expect(mockRouter.push).toHaveBeenCalled()
    })

    it('should clear tenant data when switching', async () => {
      const tenant1 = mockTenantData.restaurant1
      const tenant2 = mockTenantData.restaurant2
      
      store.currentTenant = tenant1
      
      mockTenantResolver.validateTenant.mockResolvedValue({ isValid: true, tenant: tenant2 })
      mockTenantResolver.getTenantInfo.mockResolvedValue(tenant2)

      await store.setTenant('restaurant-xyz')

      // clearTenantData should have been called
      expect(store.currentTenant).toEqual(tenant2)
    })
  })

  describe('switchTenant', () => {
    it('should switch tenant successfully', async () => {
      const tenant1 = mockTenantData.restaurant1
      const tenant2 = mockTenantData.restaurant2
      
      store.currentTenant = tenant1
      mockConfig.public.allowTenantSwitching = true
      mockConfig.public.multiTenantMode = true
      
      mockTenantResolver.validateTenant.mockResolvedValue({ isValid: true, tenant: tenant2 })
      mockTenantResolver.getTenantInfo.mockResolvedValue(tenant2)

      const result = await store.switchTenant('restaurant-xyz')

      expect(result).toBe(true)
      expect(store.currentTenant).toEqual(tenant2)
    })

    it('should not switch if already on same tenant', async () => {
      const tenant = mockTenantData.restaurant1
      store.currentTenant = tenant
      mockConfig.public.allowTenantSwitching = true
      mockConfig.public.multiTenantMode = true

      const result = await store.switchTenant('restaurant-abc')

      expect(result).toBe(true)
      expect(mockTenantResolver.validateTenant).not.toHaveBeenCalled()
    })

    it('should not switch if switching is not allowed', async () => {
      mockConfig.public.allowTenantSwitching = false

      const result = await store.switchTenant('restaurant-xyz')

      expect(result).toBe(false)
      expect(mockTenantResolver.validateTenant).not.toHaveBeenCalled()
    })

    it('should emit tenant-changed event', async () => {
      const tenant1 = mockTenantData.restaurant1
      const tenant2 = mockTenantData.restaurant2
      
      store.currentTenant = tenant1
      mockConfig.public.allowTenantSwitching = true
      mockConfig.public.multiTenantMode = true
      
      mockTenantResolver.validateTenant.mockResolvedValue({ isValid: true, tenant: tenant2 })
      mockTenantResolver.getTenantInfo.mockResolvedValue(tenant2)

      const eventListener = vi.fn()
      if (typeof window !== 'undefined') {
        window.addEventListener('tenant-changed', eventListener)
      }

      await store.switchTenant('restaurant-xyz')

      if (typeof window !== 'undefined') {
        expect(eventListener).toHaveBeenCalled()
        window.removeEventListener('tenant-changed', eventListener)
      }
    })
  })

  describe('clearTenant', () => {
    it('should clear current tenant', () => {
      store.currentTenant = mockTenantData.restaurant1
      store.error = 'Some error'

      store.clearTenant()

      expect(store.currentTenant).toBeNull()
      expect(store.error).toBeNull()
      expect(mockTenantResolver.clearStoredTenant).toHaveBeenCalled()
    })
  })

  describe('refreshTenant', () => {
    it('should refresh current tenant', async () => {
      const tenant = mockTenantData.restaurant1
      store.currentTenant = tenant
      
      const updatedTenant = { ...tenant, name: 'Updated Restaurant' }
      mockTenantResolver.getTenantInfo.mockResolvedValue(updatedTenant)

      await store.refreshTenant()

      expect(mockTenantResolver.clearTenantCache).toHaveBeenCalledWith('restaurant-abc')
      expect(store.currentTenant).toEqual(updatedTenant)
    })

    it('should do nothing if no current tenant', async () => {
      await store.refreshTenant()

      expect(mockTenantResolver.getTenantInfo).not.toHaveBeenCalled()
    })

    it('should handle refresh errors', async () => {
      store.currentTenant = mockTenantData.restaurant1
      mockTenantResolver.getTenantInfo.mockRejectedValue(new Error('Network error'))

      await store.refreshTenant()

      expect(store.error).toBe('Network error')
    })
  })

  describe('clearTenantData', () => {
    it('should clear data from all stores', async () => {
      const { useCartStore } = await import('~/stores/cart')
      const { useMenuStore } = await import('~/stores/menu')
      const { useOrderStore } = await import('~/stores/order')

      const cartStore = useCartStore()
      const menuStore = useMenuStore()
      const orderStore = useOrderStore()

      await store.clearTenantData()

      expect(cartStore.clearCart).toHaveBeenCalled()
      expect(menuStore.categories).toEqual([])
      expect(menuStore.menuItems).toEqual([])
      expect(orderStore.currentOrder).toBeNull()
      expect(orderStore.orderHistory).toEqual([])
    })
  })

  describe('fetchAvailableTenants', () => {
    it('should fetch available tenants', async () => {
      const tenants = [mockTenantData.restaurant1, mockTenantData.restaurant2]
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: tenants,
      })

      await store.fetchAvailableTenants()

      expect(store.availableTenants).toEqual(tenants)
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/tenants',
        expect.objectContaining({
          headers: { 'X-Bypass-Tenant': 'true' }
        })
      )
    })

    it('should handle fetch errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'))

      await store.fetchAvailableTenants()

      expect(store.error).toBe('Network error')
      expect(store.availableTenants).toEqual([])
    })
  })

  describe('URL management', () => {
    it('should update tenant in URL', async () => {
      store.currentTenant = mockTenantData.restaurant1
      mockConfig.public.preserveTenantInUrl = true

      await store.updateTenantInUrl()

      expect(mockRouter.replace).toHaveBeenCalled()
    })

    it('should not update URL if preserveTenantInUrl is false', async () => {
      store.currentTenant = mockTenantData.restaurant1
      mockConfig.public.preserveTenantInUrl = false

      await store.updateTenantInUrl()

      expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    it('should remove tenant from URL', async () => {
      const route = (await import('#app')).useRoute()
      route.query = { tenant: 'restaurant-abc' }

      await store.removeTenantFromUrl()

      expect(mockRouter.replace).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should set error', () => {
      store.setError('Test error')
      expect(store.error).toBe('Test error')
    })

    it('should clear error', () => {
      store.error = 'Test error'
      store.clearError()
      expect(store.error).toBeNull()
    })

    it('should handle tenant error with fallback', async () => {
      mockConfig.public.defaultTenant = 'default-tenant'
      const defaultTenant = mockTenantData.restaurant1
      
      mockTenantResolver.validateTenant.mockResolvedValue({ isValid: true, tenant: defaultTenant })
      mockTenantResolver.getTenantInfo.mockResolvedValue(defaultTenant)

      await store.handleTenantError(new Error('Tenant error'))

      expect(store.error).toBe('Tenant error')
      // Should attempt fallback to default tenant
      expect(mockTenantResolver.validateTenant).toHaveBeenCalled()
    })
  })

  describe('tenant context', () => {
    it('should get tenant context', () => {
      store.currentTenant = mockTenantData.restaurant1

      const context = store.getTenantContext()

      expect(context).toEqual({
        tenantSlug: 'restaurant-abc',
        tenantId: 'tenant-1',
      })
    })

    it('should return null when no tenant', () => {
      const context = store.getTenantContext()
      expect(context).toBeNull()
    })

    it('should check if data belongs to current tenant', () => {
      store.currentTenant = mockTenantData.restaurant1

      expect(store.isDataForCurrentTenant('tenant-1')).toBe(true)
      expect(store.isDataForCurrentTenant('tenant-2')).toBe(false)
    })
  })

  describe('tenant change subscription', () => {
    it('should subscribe to tenant changes', async () => {
      const callback = vi.fn()
      const unsubscribe = store.onTenantChange(callback)

      store.currentTenant = mockTenantData.restaurant1
      
      // Wait for watch to trigger
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(callback).toHaveBeenCalledWith(mockTenantData.restaurant1)

      unsubscribe()
    })
  })

  describe('prefetch', () => {
    it('should prefetch tenant data', async () => {
      await store.prefetchTenant('restaurant-abc')

      expect(mockTenantResolver.prefetchTenant).toHaveBeenCalledWith('restaurant-abc')
    })
  })
})
