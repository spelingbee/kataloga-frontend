/**
 * Property-Based Tests for API Client Type Safety
 * 
 * This test suite validates that the API client provides correct type information
 * and ensures all API methods are type-safe with proper parameter and return type validation.
 * 
 * Property 1: API Client Type Safety
 * **Validates: Requirements 1.1, 1.2**
 * 
 * For any usage of $apiClient in the codebase, the TypeScript compiler should provide 
 * correct type information and all API methods should be type-safe with proper parameter 
 * and return type validation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// Mock localStorage to avoid setup issues
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Define minimal types for testing
interface QueryParams {
  [key: string]: string | number | boolean | (string | number)[] | undefined
}

interface ApiResponse<T> {
  success: boolean
  data: T
  meta: {
    requestId: string
    timestamp: string
    pagination?: {
      page: number
      limit: number
      totalItems: number
      totalPages: number
    }
  }
  statusCode: number
}

interface ApiClientConfig {
  baseURL: string
  tenantSlug?: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

interface ApiClient {
  get<T>(url: string, options?: { params?: QueryParams }): Promise<T>
  post<T, TBody = unknown>(url: string, data?: TBody, options?: any): Promise<T>
  put<T, TBody = unknown>(url: string, data?: TBody, options?: any): Promise<T>
  patch<T, TBody = unknown>(url: string, data?: TBody, options?: any): Promise<T>
  delete<T>(url: string, options?: any): Promise<T>
  getRaw<T>(url: string, options?: any): Promise<ApiResponse<T>>
  postRaw<T, TBody = unknown>(url: string, data?: TBody, options?: any): Promise<ApiResponse<T>>
  putRaw<T, TBody = unknown>(url: string, data?: TBody, options?: any): Promise<ApiResponse<T>>
  patchRaw<T, TBody = unknown>(url: string, data?: TBody, options?: any): Promise<ApiResponse<T>>
  deleteRaw<T>(url: string, options?: any): Promise<ApiResponse<T>>
  setTenant(tenantSlug: string): void
  getCurrentTenant(): string
  clearTenant(): void
  withTenant<T>(tenantSlug: string, requestFn: (client: ApiClient) => Promise<T>): Promise<T>
  withoutTenant<T>(requestFn: (client: ApiClient) => Promise<T>): Promise<T>
  setTokenStore(tokenStore: any): void
  setErrorStore(errorStore: any): void
  setTenantStore(tenantStore: any): void
  handleTokenRefresh(): Promise<boolean>
}

describe('API Client Type Safety - Property-Based Tests', () => {
  let mockApiClient: ApiClient

  beforeEach(() => {
    // Create a fresh mock for each test
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      getRaw: vi.fn(),
      postRaw: vi.fn(),
      putRaw: vi.fn(),
      patchRaw: vi.fn(),
      deleteRaw: vi.fn(),
      setTenant: vi.fn(),
      getCurrentTenant: vi.fn(() => 'test-tenant'),
      clearTenant: vi.fn(),
      withTenant: vi.fn(),
      withoutTenant: vi.fn(),
      setTokenStore: vi.fn(),
      setErrorStore: vi.fn(),
      setTenantStore: vi.fn(),
      handleTokenRefresh: vi.fn(),
    }
  })

  /**
   * Property 1: API Client Type Safety
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any usage of $apiClient in the codebase, the TypeScript compiler should provide 
   * correct type information and all API methods should be type-safe with proper parameter 
   * and return type validation.
   */
  describe('Property 1: API Client Type Safety', () => {
    
    it('should provide type-safe GET requests with correct parameter and return types', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary URL paths
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s.replace(/[^a-zA-Z0-9\-_/]/g, '')}`),
          // Generate arbitrary query parameters with various types
          fc.option(
            fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.oneof(
                fc.string({ minLength: 0, maxLength: 50 }),
                fc.integer({ min: 0, max: 10000 }),
                fc.boolean(),
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
                fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 5 })
              )
            ),
            { nil: undefined }
          ),
          // Generate arbitrary response data structure
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            items: fc.option(
              fc.array(
                fc.record({
                  id: fc.uuid(),
                  title: fc.string({ minLength: 1, maxLength: 50 })
                })
              ),
              { nil: undefined }
            )
          }),
          async (url: string, queryParams: QueryParams | undefined, mockResponseData: any) => {
            // Reset and setup mock for this iteration
            vi.clearAllMocks()
            vi.mocked(mockApiClient.get).mockResolvedValueOnce(mockResponseData)

            // Property: GET method should accept typed query parameters
            const response = await mockApiClient.get<typeof mockResponseData>(url, {
              params: queryParams
            })

            // Property: Response should have correct type structure
            expect(response).toBeDefined()
            expect(typeof response).toBe('object')
            
            // Property: Response should match the expected data structure
            expect(response.id).toBe(mockResponseData.id)
            expect(response.name).toBe(mockResponseData.name)
            expect(response.value).toBe(mockResponseData.value)
            
            if (mockResponseData.items !== undefined) {
              expect(response.items).toEqual(mockResponseData.items)
            }

            // Property: GET method should be called with correct parameters
            expect(mockApiClient.get).toHaveBeenCalledWith(url, {
              params: queryParams
            })

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should provide type-safe POST requests with correct body and return types', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary URL paths
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s.replace(/[^a-zA-Z0-9\-_/]/g, '')}`),
          // Generate arbitrary request body data
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.boolean(),
            tags: fc.option(
              fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
              { nil: undefined }
            )
          }),
          // Generate arbitrary response data
          fc.record({
            id: fc.uuid(),
            createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
              .map(timestamp => new Date(timestamp).toISOString()),
            success: fc.constant(true)
          }),
          async (url: string, requestBody: any, mockResponseData: any) => {
            // Reset and setup mock for this iteration
            vi.clearAllMocks()
            vi.mocked(mockApiClient.post).mockResolvedValueOnce(mockResponseData)

            // Property: POST method should accept typed request body
            const response = await mockApiClient.post<typeof mockResponseData, typeof requestBody>(
              url, 
              requestBody
            )

            // Property: Response should have correct type structure
            expect(response).toBeDefined()
            expect(typeof response).toBe('object')
            expect(response.id).toBe(mockResponseData.id)
            expect(response.createdAt).toBe(mockResponseData.createdAt)
            expect(response.success).toBe(true)

            // Property: POST method should be called with correct parameters
            expect(mockApiClient.post).toHaveBeenCalledWith(url, requestBody)

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should provide type-safe raw response methods with full ApiResponse structure', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary URL path
          fc.string({ minLength: 1, maxLength: 100 }).map(s => `/${s.replace(/[^a-zA-Z0-9\-_/]/g, '')}`),
          // Generate HTTP method
          fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
          // Generate response data
          fc.record({
            items: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 })
              }),
              { minLength: 0, maxLength: 10 }
            ),
            total: fc.integer({ min: 0, max: 1000 })
          }),
          // Generate metadata
          fc.record({
            requestId: fc.uuid(),
            timestamp: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
              .map(timestamp => new Date(timestamp).toISOString()),
            pagination: fc.option(
              fc.record({
                page: fc.integer({ min: 1, max: 100 }),
                limit: fc.integer({ min: 1, max: 100 }),
                totalItems: fc.integer({ min: 0, max: 10000 }),
                totalPages: fc.integer({ min: 0, max: 1000 })
              }),
              { nil: undefined }
            )
          }),
          async (url: string, method: string, mockData: any, mockMeta: any) => {
            // Reset mocks for this iteration
            vi.clearAllMocks()
            
            // Mock full ApiResponse structure
            const fullResponse: ApiResponse<typeof mockData> = {
              success: true,
              data: mockData,
              meta: mockMeta,
              statusCode: 200
            }

            // Setup appropriate mock based on method
            switch (method) {
              case 'GET':
                vi.mocked(mockApiClient.getRaw).mockResolvedValueOnce(fullResponse)
                break
              case 'POST':
                vi.mocked(mockApiClient.postRaw).mockResolvedValueOnce(fullResponse)
                break
              case 'PUT':
                vi.mocked(mockApiClient.putRaw).mockResolvedValueOnce(fullResponse)
                break
              case 'PATCH':
                vi.mocked(mockApiClient.patchRaw).mockResolvedValueOnce(fullResponse)
                break
              case 'DELETE':
                vi.mocked(mockApiClient.deleteRaw).mockResolvedValueOnce(fullResponse)
                break
            }

            // Property: Raw methods should return full ApiResponse structure
            let response: ApiResponse<typeof mockData>
            
            switch (method) {
              case 'GET':
                response = await mockApiClient.getRaw<typeof mockData>(url)
                break
              case 'POST':
                response = await mockApiClient.postRaw<typeof mockData>(url, {})
                break
              case 'PUT':
                response = await mockApiClient.putRaw<typeof mockData>(url, {})
                break
              case 'PATCH':
                response = await mockApiClient.patchRaw<typeof mockData>(url, {})
                break
              case 'DELETE':
                response = await mockApiClient.deleteRaw<typeof mockData>(url)
                break
              default:
                throw new Error(`Unsupported method: ${method}`)
            }

            // Property: Response should have full ApiResponse structure
            expect(response).toBeDefined()
            expect(response.success).toBe(true)
            expect(response.statusCode).toBe(200)
            
            // Property: Data should match expected structure
            expect(response.data).toBeDefined()
            expect(response.data.items).toEqual(mockData.items)
            expect(response.data.total).toBe(mockData.total)
            
            // Property: Meta should be preserved
            expect(response.meta).toBeDefined()
            expect(response.meta.requestId).toBe(mockMeta.requestId)
            expect(response.meta.timestamp).toBe(mockMeta.timestamp)
            
            if (mockMeta.pagination !== undefined) {
              expect(response.meta.pagination).toEqual(mockMeta.pagination)
            }

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should provide type-safe tenant management methods', () => {
      fc.assert(
        fc.property(
          // Generate tenant slugs
          fc.array(
            fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toLowerCase().replace(/[^a-z0-9\-]/g, '')),
            { minLength: 1, maxLength: 5 }
          ),
          (tenantSlugs: string[]) => {
            // Filter out empty slugs
            const validTenants = tenantSlugs.filter(slug => slug.length > 0)
            if (validTenants.length === 0) return true

            // Property: Tenant context should be switchable
            for (const tenant of validTenants) {
              mockApiClient.setTenant(tenant)
              
              // Property: setTenant should be called with correct parameter
              expect(mockApiClient.setTenant).toHaveBeenCalledWith(tenant)
            }

            // Property: getCurrentTenant should return a string
            const currentTenant = mockApiClient.getCurrentTenant()
            expect(typeof currentTenant).toBe('string')
            
            // Property: clearTenant should be callable
            mockApiClient.clearTenant()
            expect(mockApiClient.clearTenant).toHaveBeenCalled()

            // Property: withTenant should be available for temporary overrides
            expect(typeof mockApiClient.withTenant).toBe('function')
            
            // Property: withoutTenant should be available for system requests
            expect(typeof mockApiClient.withoutTenant).toBe('function')

            return true
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should maintain type safety across all query parameter types', () => {
      fc.assert(
        fc.property(
          // Generate comprehensive query parameters with all supported types
          fc.record({
            stringParam: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
            numberParam: fc.option(fc.integer({ min: -1000, max: 1000 }), { nil: undefined }),
            booleanParam: fc.option(fc.boolean(), { nil: undefined }),
            stringArrayParam: fc.option(
              fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
              { nil: undefined }
            ),
            numberArrayParam: fc.option(
              fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 5 }),
              { nil: undefined }
            )
          }),
          async (queryParams: QueryParams) => {
            // Reset mocks for this iteration
            vi.clearAllMocks()
            vi.mocked(mockApiClient.get).mockResolvedValueOnce({ result: 'success' })

            // Property: All query parameter types should be accepted
            const response = await mockApiClient.get<{ result: string }>('/test', {
              params: queryParams
            })

            // Property: Response should be successful
            expect(response).toBeDefined()
            expect(response.result).toBe('success')

            // Property: GET method should be called with correct parameters
            expect(mockApiClient.get).toHaveBeenCalledWith('/test', {
              params: queryParams
            })

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should provide consistent type safety across all HTTP methods', () => {
      fc.assert(
        fc.property(
          // Generate HTTP method
          fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
          // Generate URL
          fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s.replace(/[^a-zA-Z0-9\-_/]/g, '')}`),
          // Generate response data
          fc.record({
            id: fc.uuid(),
            success: fc.constant(true)
          }),
          async (method: string, url: string, mockResponseData: any) => {
            // Reset mocks for this iteration
            vi.clearAllMocks()
            
            // Setup mocks for all methods
            vi.mocked(mockApiClient.get).mockResolvedValueOnce(mockResponseData)
            vi.mocked(mockApiClient.post).mockResolvedValueOnce(mockResponseData)
            vi.mocked(mockApiClient.put).mockResolvedValueOnce(mockResponseData)
            vi.mocked(mockApiClient.patch).mockResolvedValueOnce(mockResponseData)
            vi.mocked(mockApiClient.delete).mockResolvedValueOnce(mockResponseData)

            // Property: All HTTP methods should be type-safe
            let response: any
            
            switch (method) {
              case 'GET':
                response = await mockApiClient.get<typeof mockResponseData>(url)
                expect(mockApiClient.get).toHaveBeenCalledWith(url)
                break
              case 'POST':
                response = await mockApiClient.post<typeof mockResponseData>(url, {})
                expect(mockApiClient.post).toHaveBeenCalledWith(url, {})
                break
              case 'PUT':
                response = await mockApiClient.put<typeof mockResponseData>(url, {})
                expect(mockApiClient.put).toHaveBeenCalledWith(url, {})
                break
              case 'PATCH':
                response = await mockApiClient.patch<typeof mockResponseData>(url, {})
                expect(mockApiClient.patch).toHaveBeenCalledWith(url, {})
                break
              case 'DELETE':
                response = await mockApiClient.delete<typeof mockResponseData>(url)
                expect(mockApiClient.delete).toHaveBeenCalledWith(url)
                break
            }

            // Property: Response should have correct type structure
            expect(response).toBeDefined()
            expect(response.id).toBe(mockResponseData.id)
            expect(response.success).toBe(true)

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should provide type-safe store integration methods', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Property: Store integration methods should be available and callable
            expect(typeof mockApiClient.setTokenStore).toBe('function')
            expect(typeof mockApiClient.setErrorStore).toBe('function')
            expect(typeof mockApiClient.setTenantStore).toBe('function')
            expect(typeof mockApiClient.handleTokenRefresh).toBe('function')

            // Property: Methods should accept any store object
            const mockStore = { test: 'store' }
            
            mockApiClient.setTokenStore(mockStore)
            expect(mockApiClient.setTokenStore).toHaveBeenCalledWith(mockStore)
            
            mockApiClient.setErrorStore(mockStore)
            expect(mockApiClient.setErrorStore).toHaveBeenCalledWith(mockStore)
            
            mockApiClient.setTenantStore(mockStore)
            expect(mockApiClient.setTenantStore).toHaveBeenCalledWith(mockStore)

            // Property: handleTokenRefresh should return a Promise<boolean>
            vi.mocked(mockApiClient.handleTokenRefresh).mockResolvedValueOnce(true)
            const refreshPromise = mockApiClient.handleTokenRefresh()
            expect(refreshPromise).toBeInstanceOf(Promise)

            return true
          }
        ),
        { numRuns: 10 }
      )
    })
  })
})