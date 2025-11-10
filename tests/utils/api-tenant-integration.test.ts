import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient } from '~/utils/api'
import { mockTenantData } from '../utils/tenant-test-helpers'

// Mock fetch globally
global.fetch = vi.fn()

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
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response)

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
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response)

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
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response)

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
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response)

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
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: tenant }),
      } as Response)

      const response = await apiClient.get('/tenants/restaurant-abc', {
        headers: { 'X-Bypass-Tenant': 'true' },
      })

      expect(response.success).toBe(true)
      expect(response.data).toEqual(tenant)
    })

    it('should validate tenant access', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ 
          success: true, 
          data: { valid: true, tenant: mockTenantData.restaurant1 } 
        }),
      } as Response)

      const response = await apiClient.get('/tenants/restaurant-abc/validate', {
        headers: { 'X-Bypass-Tenant': 'true' },
      })

      expect(response.success).toBe(true)
      expect(response.data.valid).toBe(true)
    })

    it('should fetch tenant-specific menu data', async () => {
      const menuData = {
        categories: ['Pizza', 'Pasta'],
        items: [
          { id: '1', name: 'Margherita', price: 12.99 },
          { id: '2', name: 'Carbonara', price: 14.99 },
        ],
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: menuData }),
      } as Response)

      const response = await apiClient.get('/menu')

      expect(response.success).toBe(true)
      expect(response.data).toEqual(menuData)
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

      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ 
          success: true, 
          data: { id: 'order-123', ...orderData } 
        }),
      } as Response)

      const response = await apiClient.post('/orders', orderData)

      expect(response.success).toBe(true)
      expect(response.data.id).toBe('order-123')
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
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          message: 'Tenant not found',
          code: 'TENANT_NOT_FOUND',
        }),
      } as Response)

      await expect(apiClient.get('/test')).rejects.toThrow('Tenant not found')
    })

    it('should handle tenant inactive error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          success: false,
          message: 'Tenant is inactive',
          code: 'TENANT_INACTIVE',
        }),
      } as Response)

      await expect(apiClient.get('/test')).rejects.toThrow('Tenant is inactive')
    })

    it('should handle tenant access denied error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          success: false,
          message: 'Access denied to tenant',
          code: 'TENANT_ACCESS_DENIED',
        }),
      } as Response)

      await expect(apiClient.get('/test')).rejects.toThrow('Access denied to tenant')
    })
  })

  describe('tenant switching scenarios', () => {
    it('should update headers when tenant changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response)

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
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response)

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
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: tenant1Data }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: tenant2Data }),
        } as Response)

      // Request from tenant 1
      apiClient.setTenantSlug('tenant-1')
      const response1 = await apiClient.get('/data')

      // Request from tenant 2
      apiClient.setTenantSlug('tenant-2')
      const response2 = await apiClient.get('/data')

      expect(response1.data).toEqual(tenant1Data)
      expect(response2.data).toEqual(tenant2Data)
      expect(response1.data).not.toEqual(response2.data)
    })

    it('should prevent cross-tenant data access', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          success: false,
          message: 'Cannot access data from different tenant',
          code: 'TENANT_DATA_MISMATCH',
        }),
      } as Response)

      apiClient.setTenantSlug('tenant-1')

      // Try to access data from tenant-2
      await expect(
        apiClient.get('/tenants/tenant-2/data')
      ).rejects.toThrow('Cannot access data from different tenant')
    })
  })

  describe('system-wide requests', () => {
    it('should allow system-wide requests without tenant', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ 
          success: true, 
          data: [mockTenantData.restaurant1, mockTenantData.restaurant2] 
        }),
      } as Response)

      const response = await apiClient.get('/tenants', {
        headers: { 'X-Bypass-Tenant': 'true' },
      })

      expect(response.success).toBe(true)
      expect(response.data).toHaveLength(2)
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
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ 
          success: true, 
          data: { totalOrders: 150, totalRevenue: 5000 } 
        }),
      } as Response)

      const response = await apiClient.get('/admin/stats', {
        headers: { 
          'X-Bypass-Tenant': 'true',
          'X-Admin-Access': 'true',
        },
      })

      expect(response.success).toBe(true)
      expect(response.data.totalOrders).toBe(150)
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

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response)

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

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} }),
      } as Response)

      await apiClient.get('/test')

      const headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>
      expect(headers['X-Tenant-Slug']).toBeFalsy()
    })
  })
})
