import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TenantResolverService } from '~/services/tenant-resolver.service'
import { 
  mockTenantData, 
  createMockApiClient, 
  mockLocalStorage,
  createMockRuntimeConfig,
  createMockTenantResponse
} from '../utils/tenant-test-helpers'

describe('TenantResolverService', () => {
  let service: TenantResolverService
  let mockApiClient: ReturnType<typeof createMockApiClient>
  let mockConfig: ReturnType<typeof createMockRuntimeConfig>
  let mockStorage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    mockApiClient = createMockApiClient()
    mockConfig = createMockRuntimeConfig()
    mockStorage = mockLocalStorage()
    
    // Mock localStorage
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        value: mockStorage,
        writable: true,
      })
    }

    service = new TenantResolverService(mockApiClient, mockConfig)
  })

  afterEach(() => {
    vi.clearAllMocks()
    service.clearCache()
  })

  describe('resolveTenantSlug', () => {
    it('should prioritize environment variable', async () => {
      mockConfig.public.tenantSlug = 'env-tenant'
      
      const slug = await service.resolveTenantSlug({
        fromQuery: 'query-tenant',
        fromLocalStorage: 'storage-tenant',
      })

      expect(slug).toBe('env-tenant')
    })

    it('should use query parameter when no environment variable', async () => {
      mockConfig.public.tenantSlug = ''
      
      const slug = await service.resolveTenantSlug({
        fromQuery: 'query-tenant',
        fromLocalStorage: 'storage-tenant',
      })

      expect(slug).toBe('query-tenant')
    })

    it('should use localStorage when no environment or query', async () => {
      mockConfig.public.tenantSlug = ''
      
      const slug = await service.resolveTenantSlug({
        fromLocalStorage: 'storage-tenant',
      })

      expect(slug).toBe('storage-tenant')
    })

    it('should use default tenant as last resort', async () => {
      mockConfig.public.tenantSlug = ''
      mockConfig.public.defaultTenant = 'default-tenant'
      
      const slug = await service.resolveTenantSlug({})

      expect(slug).toBe('default-tenant')
    })

    it('should return null when no tenant source available', async () => {
      mockConfig.public.tenantSlug = ''
      mockConfig.public.defaultTenant = ''
      
      const slug = await service.resolveTenantSlug({})

      expect(slug).toBeNull()
    })
  })

  describe('validateTenant', () => {
    it('should validate tenant through API', async () => {
      const tenant = mockTenantData.restaurant1
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { valid: true, tenant }
      })

      const result = await service.validateTenant('restaurant-abc')

      expect(result.isValid).toBe(true)
      expect(result.tenant).toEqual(tenant)
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/tenants/restaurant-abc/validate',
        expect.objectContaining({
          headers: { 'X-Bypass-Tenant': 'true' }
        })
      )
    })

    it('should return invalid for empty slug', async () => {
      const result = await service.validateTenant('')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Tenant slug is required')
      expect(mockApiClient.get).not.toHaveBeenCalled()
    })

    it('should cache validation results', async () => {
      const tenant = mockTenantData.restaurant1
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { valid: true, tenant }
      })

      // First call
      await service.validateTenant('restaurant-abc')
      
      // Second call should use cache
      const result = await service.validateTenant('restaurant-abc')

      expect(result.isValid).toBe(true)
      expect(mockApiClient.get).toHaveBeenCalledTimes(1) // Only called once
    })

    it('should handle validation failure', async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { valid: false }
      })

      const result = await service.validateTenant('invalid-tenant')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Tenant not found or inactive')
    })

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'))

      const result = await service.validateTenant('restaurant-abc')

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should deduplicate concurrent validation requests', async () => {
      const tenant = mockTenantData.restaurant1
      mockApiClient.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { valid: true, tenant }
        }), 50))
      )

      // Make multiple concurrent requests
      const promises = [
        service.validateTenant('restaurant-abc'),
        service.validateTenant('restaurant-abc'),
        service.validateTenant('restaurant-abc'),
      ]

      await Promise.all(promises)

      // Should only make one API call
      expect(mockApiClient.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('getTenantInfo', () => {
    it('should fetch tenant info from API', async () => {
      const tenant = mockTenantData.restaurant1
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: tenant
      })

      const result = await service.getTenantInfo('restaurant-abc')

      expect(result).toEqual(tenant)
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/tenants/restaurant-abc',
        expect.objectContaining({
          headers: { 'X-Bypass-Tenant': 'true' }
        })
      )
    })

    it('should cache tenant info', async () => {
      const tenant = mockTenantData.restaurant1
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: tenant
      })

      // First call
      await service.getTenantInfo('restaurant-abc')
      
      // Second call should use cache
      const result = await service.getTenantInfo('restaurant-abc')

      expect(result).toEqual(tenant)
      expect(mockApiClient.get).toHaveBeenCalledTimes(1)
    })

    it('should throw error when tenant not found', async () => {
      mockApiClient.get.mockResolvedValue({
        success: false,
        data: null
      })

      await expect(service.getTenantInfo('invalid-tenant')).rejects.toThrow('Tenant not found')
    })

    it('should deduplicate concurrent fetch requests', async () => {
      const tenant = mockTenantData.restaurant1
      mockApiClient.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: tenant
        }), 50))
      )

      // Make multiple concurrent requests
      const promises = [
        service.getTenantInfo('restaurant-abc'),
        service.getTenantInfo('restaurant-abc'),
        service.getTenantInfo('restaurant-abc'),
      ]

      await Promise.all(promises)

      // Should only make one API call
      expect(mockApiClient.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('cache management', () => {
    it('should clear all caches', async () => {
      const tenant = mockTenantData.restaurant1
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { valid: true, tenant }
      })

      // Populate cache
      await service.validateTenant('restaurant-abc')
      
      // Clear cache
      service.clearCache()
      
      // Next call should hit API again
      await service.validateTenant('restaurant-abc')

      expect(mockApiClient.get).toHaveBeenCalledTimes(2)
    })

    it('should clear cache for specific tenant', async () => {
      const tenant1 = mockTenantData.restaurant1
      const tenant2 = mockTenantData.restaurant2
      
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: { valid: true, tenant: tenant1 } })
        .mockResolvedValueOnce({ success: true, data: { valid: true, tenant: tenant2 } })
        .mockResolvedValueOnce({ success: true, data: { valid: true, tenant: tenant1 } })

      // Populate cache for both tenants
      await service.validateTenant('restaurant-abc')
      await service.validateTenant('restaurant-xyz')
      
      // Clear cache for one tenant
      service.clearTenantCache('restaurant-abc')
      
      // restaurant-abc should hit API, restaurant-xyz should use cache
      await service.validateTenant('restaurant-abc')
      await service.validateTenant('restaurant-xyz')

      expect(mockApiClient.get).toHaveBeenCalledTimes(3) // 2 initial + 1 after clear
    })

    it('should get cache statistics', async () => {
      const tenant = mockTenantData.restaurant1
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { valid: true, tenant }
      })

      await service.validateTenant('restaurant-abc')
      
      const stats = service.getCacheStats()

      expect(stats.tenantCache).toBeDefined()
      expect(stats.tenantCache.size).toBeGreaterThan(0)
      expect(stats.validationCache).toBeDefined()
      expect(stats.validationCache.size).toBeGreaterThan(0)
    })
  })

  describe('localStorage integration', () => {
    it('should save tenant to localStorage', () => {
      service.saveStoredTenant('restaurant-abc')

      expect(mockStorage.setItem).toHaveBeenCalledWith('selectedTenant', 'restaurant-abc')
    })

    it('should get tenant from localStorage', () => {
      mockStorage.getItem.mockReturnValue('restaurant-abc')

      const tenant = service.getStoredTenant()

      expect(tenant).toBe('restaurant-abc')
      expect(mockStorage.getItem).toHaveBeenCalledWith('selectedTenant')
    })

    it('should clear tenant from localStorage', () => {
      service.clearStoredTenant()

      expect(mockStorage.removeItem).toHaveBeenCalledWith('selectedTenant')
    })

    it('should handle localStorage errors gracefully', () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })

      // Should not throw
      expect(() => service.saveStoredTenant('restaurant-abc')).not.toThrow()
    })
  })

  describe('tenant change listeners', () => {
    it('should notify listeners on tenant change', () => {
      const listener = vi.fn()
      service.onTenantChange(listener)

      const tenant = mockTenantData.restaurant1
      service.setCurrentTenant(tenant)

      expect(listener).toHaveBeenCalledWith(tenant)
    })

    it('should allow unsubscribing from changes', () => {
      const listener = vi.fn()
      const unsubscribe = service.onTenantChange(listener)

      unsubscribe()

      const tenant = mockTenantData.restaurant1
      service.setCurrentTenant(tenant)

      expect(listener).not.toHaveBeenCalled()
    })

    it('should handle multiple listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()
      
      service.onTenantChange(listener1)
      service.onTenantChange(listener2)

      const tenant = mockTenantData.restaurant1
      service.setCurrentTenant(tenant)

      expect(listener1).toHaveBeenCalledWith(tenant)
      expect(listener2).toHaveBeenCalledWith(tenant)
    })
  })

  describe('resolveAndValidateTenant', () => {
    it('should resolve tenant from environment', async () => {
      const tenant = mockTenantData.restaurant1
      mockConfig.public.tenantSlug = 'restaurant-abc'
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { valid: true, tenant }
      })

      const result = await service.resolveAndValidateTenant()

      expect(result).toEqual(tenant)
    })

    it('should fallback to query parameter', async () => {
      const tenant = mockTenantData.restaurant1
      mockConfig.public.tenantSlug = ''
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { valid: true, tenant }
      })

      const result = await service.resolveAndValidateTenant({
        fromQuery: 'restaurant-abc'
      })

      expect(result).toEqual(tenant)
    })

    it('should save valid tenant to localStorage', async () => {
      const tenant = mockTenantData.restaurant1
      mockConfig.public.tenantSlug = ''
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { valid: true, tenant }
      })

      await service.resolveAndValidateTenant({
        fromQuery: 'restaurant-abc'
      })

      expect(mockStorage.setItem).toHaveBeenCalledWith('selectedTenant', 'restaurant-abc')
    })

    it('should clear localStorage on validation failure', async () => {
      mockConfig.public.tenantSlug = ''
      mockStorage.getItem.mockReturnValue('invalid-tenant')
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { valid: false }
      })

      await service.resolveAndValidateTenant({
        fromLocalStorage: 'invalid-tenant'
      })

      expect(mockStorage.removeItem).toHaveBeenCalledWith('selectedTenant')
    })

    it('should return null when no valid tenant found', async () => {
      mockConfig.public.tenantSlug = ''
      mockConfig.public.defaultTenant = ''
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { valid: false }
      })

      const result = await service.resolveAndValidateTenant({
        fromQuery: 'invalid-tenant'
      })

      expect(result).toBeNull()
    })
  })

  describe('prefetch functionality', () => {
    it('should prefetch tenant data', async () => {
      const tenant = mockTenantData.restaurant1
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: tenant
      })

      await service.prefetchTenant('restaurant-abc')

      expect(mockApiClient.get).toHaveBeenCalled()
      
      // Verify it's cached
      const cached = service.getCachedTenantInfo('restaurant-abc')
      expect(cached).toEqual(tenant)
    })

    it('should not prefetch if already cached', async () => {
      const tenant = mockTenantData.restaurant1
      mockApiClient.get.mockResolvedValue({
        success: true,
        data: tenant
      })

      // First prefetch
      await service.prefetchTenant('restaurant-abc')
      
      // Second prefetch should not call API
      await service.prefetchTenant('restaurant-abc')

      expect(mockApiClient.get).toHaveBeenCalledTimes(1)
    })

    it('should prefetch multiple tenants', async () => {
      const tenant1 = mockTenantData.restaurant1
      const tenant2 = mockTenantData.restaurant2
      
      mockApiClient.get
        .mockResolvedValueOnce({ success: true, data: tenant1 })
        .mockResolvedValueOnce({ success: true, data: tenant2 })

      await service.prefetchTenants(['restaurant-abc', 'restaurant-xyz'])

      expect(mockApiClient.get).toHaveBeenCalledTimes(2)
    })

    it('should handle prefetch errors silently', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'))

      // Should not throw
      await expect(service.prefetchTenant('restaurant-abc')).resolves.toBeUndefined()
    })
  })
})
