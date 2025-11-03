import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient } from '~/utils/api'

// Mock fetch globally
global.fetch = vi.fn()

describe('ApiClient', () => {
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

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const client = new ApiClient({ baseURL: 'https://api.test.com' })
      expect(client).toBeInstanceOf(ApiClient)
    })

    it('should merge provided config with defaults', () => {
      const client = new ApiClient({
        baseURL: 'https://api.test.com',
        timeout: 5000,
        retries: 2,
      })
      expect(client).toBeInstanceOf(ApiClient)
    })
  })

  describe('HTTP methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { id: 1 } }),
      } as Response)
    })

    it('should make GET request', async () => {
      const response = await apiClient.get('/test')
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Tenant-Slug': 'test-tenant',
          }),
        })
      )
      expect(response).toEqual({ success: true, data: { id: 1 } })
    })

    it('should make POST request with body', async () => {
      const testData = { name: 'test' }
      await apiClient.post('/test', testData)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(testData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Tenant-Slug': 'test-tenant',
          }),
        })
      )
    })

    it('should make PUT request', async () => {
      const testData = { id: 1, name: 'updated' }
      await apiClient.put('/test/1', testData)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(testData),
        })
      )
    })

    it('should make DELETE request', async () => {
      await apiClient.delete('/test/1')
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('authentication', () => {
    it('should add authorization header when token is available', async () => {
      const mockTokenStore = {
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
      }
      apiClient.setTokenStore(mockTokenStore)

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response)

      await apiClient.get('/protected')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      )
    })

    it('should handle token refresh on 401 error', async () => {
      const mockTokenStore = {
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        setTokens: vi.fn(),
      }
      apiClient.setTokenStore(mockTokenStore)

      // First call returns 401
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
        } as Response)
        // Refresh token call succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { accessToken: 'new-token', refreshToken: 'new-refresh' }
          }),
        } as Response)
        // Retry with new token succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, data: { id: 1 } }),
        } as Response)

      const response = await apiClient.get('/protected')

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockTokenStore.setTokens).toHaveBeenCalledWith('new-token', 'new-refresh')
      expect(response).toEqual({ success: true, data: { id: 1 } })
    })
  })

  describe('error handling', () => {
    it('should throw error on HTTP error status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          message: 'Bad Request',
          code: 'VALIDATION_ERROR',
        }),
      } as Response)

      await expect(apiClient.get('/test')).rejects.toThrow('Bad Request')
    }, 10000)

    it('should retry on network errors', async () => {
      // Create a client with faster retry delay for testing
      const fastApiClient = new ApiClient({
        baseURL: 'https://api.test.com',
        tenantSlug: 'test-tenant',
        retryDelay: 10, // Very fast retry for testing
      })

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        } as Response)

      const response = await fastApiClient.get('/test')

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(response).toEqual({ success: true })
    }, 10000)

    it('should fail after max retries', async () => {
      // Create a client with faster retry delay for testing
      const fastApiClient = new ApiClient({
        baseURL: 'https://api.test.com',
        tenantSlug: 'test-tenant',
        retryDelay: 10, // Very fast retry for testing
      })

      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(fastApiClient.get('/test')).rejects.toThrow('Network error')
      expect(mockFetch).toHaveBeenCalledTimes(4) // Initial + 3 retries
    }, 10000)
  })

  describe('tenant configuration', () => {
    it('should set tenant slug in headers', async () => {
      apiClient.setTenantSlug('new-tenant')

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response)

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
  })
})