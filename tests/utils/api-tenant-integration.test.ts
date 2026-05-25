import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient } from '~/utils/api'
import { mockTenantData } from '../utils/tenant-test-helpers'

// Mock fetch globally
global.fetch = vi.fn()

// Helper to construct a valid standard ApiResponse object for fetch mocks
function createMockResponse(data: any, statusCode: number = 200, ok: boolean = true) {
  return {
    ok,
    status: statusCode,
    json: () => Promise.resolve({
      success: ok,
      statusCode,
      data: ok ? data : null,
      error: ok ? null : data,
      meta: {
        requestId: 'test-request-id',
        timestamp: new Date().toISOString(),
      }
    })
  }
}

describe('ApiClient - Tenant Integration', () => {
  let apiClient: ApiClient
  const mockFetch = vi.mocked(fetch)

  beforeEach(() => {
    apiClient = new ApiClient({
      baseURL: 'https://api.test.com',
      tenantSlug: 'test-tenant',
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('tenant header management', () => {
    it('should include tenant slug in request headers', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}) as Response)

      await apiClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-Slug': 'test-tenant',
          }),
        })
      )
    })

    it('should update tenant slug dynamically', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}) as Response)

      apiClient.setTenantSlug('new-tenant')
      await apiClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-Slug': 'new-tenant',
          }),
        })
      )
    })

    it('should allow bypassing tenant header', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}) as Response)

      await apiClient.get('/test', {
        headers: {
          'X-Bypass-Tenant': 'true',
        },
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Bypass-Tenant': 'true',
          }),
        })
      )
    })

    it('should allow overriding tenant for specific request', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}) as Response)

      await apiClient.get('/test', {
        headers: {
          'X-Tenant-Slug': 'override-tenant',
        },
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-Slug': 'override-tenant',
          }),
        })
      )
    })
  })

  describe('tenant-specific requests', () => {
    it('should fetch tenant information', async () => {
      const tenant = mockTenantData.restaurant1
      mockFetch.mockResolvedValue(createMockResponse(tenant) as Response)

      const response = await apiClient.get<any>('/tenants/restaurant-abc', {
        headers: { 'X-Bypass-Tenant': 'true' },
      })

      expect(response).toEqual(tenant)
    })

    it('should validate tenant access', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ 
        valid: true, 
        tenant: mockTenantData.restaurant1 
      }) as Response)

      const response = await apiClient.get<any>('/tenants/restaurant-abc/validate', {
        headers: { 'X-Bypass-Tenant': 'true' },
      })

      expect(response.valid).toBe(true)
    })

    it('should fetch tenant-specific menu data', async () => {
      const menuData = {
        categories: ['Pizza', 'Pasta'],
        items: [
          { id: '1', name: 'Margherita', price: 12.99 },
          { id: '2', name: 'Carbonara', price: 14.99 },
        ],
      }

      mockFetch.mockResolvedValue(createMockResponse(menuData) as Response)

      const response = await apiClient.get('/menu')

      expect(response).toEqual(menuData)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/menu',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-Slug': 'test-tenant',
          }),
        })
      )
    })

    it('should create tenant-specific order', async () => {
      const orderData = {
        items: [{ id: '1', quantity: 2 }],
        total: 25.98,
      }

      mockFetch.mockResolvedValue(createMockResponse({ id: 'order-123', ...orderData }, 201) as Response)

      const response = await apiClient.post<any>('/orders', orderData)

      expect(response.id).toBe('order-123')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(orderData),
          headers: expect.objectContaining({
            'X-Tenant-Slug': 'test-tenant',
          }),
        })
      )
    })
  })

  describe('tenant error handling', () => {
    it('should handle tenant not found error', async () => {
      mockFetch.mockResolvedValue(createMockResponse({
        message: 'Tenant not found',
        code: 'TENANT_NOT_FOUND',
      }, 404, false) as Response)

      await expect(apiClient.get('/test')).rejects.toThrow('Tenant not found')
    })

    it('should handle tenant inactive error', async () => {
      mockFetch.mockResolvedValue(createMockResponse({
        message: 'Tenant is inactive',
        code: 'TENANT_INACTIVE',
      }, 403, false) as Response)

      await expect(apiClient.get('/test')).rejects.toThrow('Tenant is inactive')
    })

    it('should handle tenant access denied error', async () => {
      mockFetch.mockResolvedValue(createMockResponse({
        message: 'Access denied to tenant',
        code: 'TENANT_ACCESS_DENIED',
      }, 403, false) as Response)

      await expect(apiClient.get('/test')).rejects.toThrow('Access denied to tenant')
    })
  })

  describe('tenant switching scenarios', () => {
    it('should update headers when tenant changes', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}) as Response)

      // First request with initial tenant
      await apiClient.get('/test')
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-Slug': 'test-tenant',
          }),
        })
      )

      // Change tenant
      apiClient.setTenantSlug('new-tenant')

      // Second request with new tenant
      await apiClient.get('/test')
      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-Slug': 'new-tenant',
          }),
        })
      )
    })

    it('should handle concurrent requests with different tenants', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}) as Response)

      // Make concurrent requests with different tenant overrides
      await Promise.all([
        apiClient.get('/test', {
          headers: { 'X-Tenant-Slug': 'tenant-1' },
        }),
        apiClient.get('/test', {
          headers: { 'X-Tenant-Slug': 'tenant-2' },
        }),
        apiClient.get('/test', {
          headers: { 'X-Tenant-Slug': 'tenant-3' },
        }),
      ])

      expect(mockFetch).toHaveBeenCalledTimes(3)
      
      // Verify each call had correct tenant
      const calls = mockFetch.mock.calls
      expect(calls[0][1]?.headers).toMatchObject({ 'X-Tenant-Slug': 'tenant-1' })
      expect(calls[1][1]?.headers).toMatchObject({ 'X-Tenant-Slug': 'tenant-2' })
      expect(calls[2][1]?.headers).toMatchObject({ 'X-Tenant-Slug': 'tenant-3' })
    })
  })

  describe('multi-tenant data isolation', () => {
    it('should ensure data isolation between tenants', async () => {
      const tenant1Data = { id: '1', name: 'Item from Tenant 1' }
      const tenant2Data = { id: '2', name: 'Item from Tenant 2' }

      mockFetch
        .mockResolvedValueOnce(createMockResponse(tenant1Data) as Response)
        .mockResolvedValueOnce(createMockResponse(tenant2Data) as Response)

      // Request from tenant 1
      apiClient.setTenantSlug('tenant-1')
      const response1 = await apiClient.get<any>('/data')

      // Request from tenant 2
      apiClient.setTenantSlug('tenant-2')
      const response2 = await apiClient.get<any>('/data')

      expect(response1).toEqual(tenant1Data)
      expect(response2).toEqual(tenant2Data)
      expect(response1).not.toEqual(response2)
    })

    it('should prevent cross-tenant data access', async () => {
      mockFetch.mockResolvedValue(createMockResponse({
        message: 'Cannot access data from different tenant',
        code: 'TENANT_DATA_MISMATCH',
      }, 403, false) as Response)

      apiClient.setTenantSlug('tenant-1')

      // Try to access data from tenant-2
      await expect(
        apiClient.get('/tenants/tenant-2/data')
      ).rejects.toThrow('Cannot access data from different tenant')
    })
  })

  describe('system-wide requests', () => {
    it('should allow system-wide requests without tenant', async () => {
      mockFetch.mockResolvedValue(createMockResponse([mockTenantData.restaurant1, mockTenantData.restaurant2]) as Response)

      const response = await apiClient.get<any>('/tenants', {
        headers: { 'X-Bypass-Tenant': 'true' },
      })

      expect(response).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/tenants',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Bypass-Tenant': 'true',
          }),
        })
      )
    })

    it('should allow admin requests across tenants', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ totalOrders: 150, totalRevenue: 5000 }) as Response)

      const response = await apiClient.get<any>('/admin/stats', {
        headers: { 
          'X-Bypass-Tenant': 'true',
          'X-Admin-Access': 'true',
        },
      })

      expect(response.totalOrders).toBe(150)
    })
  })

  describe('tenant configuration', () => {
    it('should initialize without tenant slug', () => {
      const client = new ApiClient({
        baseURL: 'https://api.test.com',
      })

      expect(client).toBeInstanceOf(ApiClient)
    })

    it('should set tenant slug after initialization', async () => {
      const client = new ApiClient({
        baseURL: 'https://api.test.com',
      })

      mockFetch.mockResolvedValue(createMockResponse({}) as Response)

      client.setTenantSlug('runtime-tenant')
      await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Tenant-Slug': 'runtime-tenant',
          }),
        })
      )
    })

    it('should clear tenant slug', async () => {
      apiClient.setTenantSlug('')

      mockFetch.mockResolvedValue(createMockResponse({}) as Response)

      await apiClient.get('/test')

      const headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>
      expect(headers['X-Tenant-Slug']).toBeFalsy()
    })
  })
})
