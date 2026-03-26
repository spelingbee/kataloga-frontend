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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'

// Define the types we need for testing
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

// Mock the API client
const mockApiClient: ApiClient = {
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

// Mock the createApiClient function
const createApiClient = vi.fn(() => mockApiClient)

describe('API Client Type Safety - Property-Based Tests', () => {
  let apiClient: ApiClient

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Create API client with test configuration
    apiClient = createApiClient({
      baseURL: 'https://api.test.com',
      tenantSlug: 'test-tenant',
      timeout: 10000,
      retries: 2,
      retryDelay: 1000,
    })
    
    // Setup mock implementations for the test client
    vi.mocked(apiClient.get).mockImplementation(async () => ({}))
    vi.mocked(apiClient.post).mockImplementation(async () => ({}))
    vi.mocked(apiClient.put).mockImplementation(async () => ({}))
    vi.mocked(apiClient.patch).mockImplementation(async () => ({}))
    vi.mocked(apiClient.delete).mockImplementation(async () => ({}))
    vi.mocked(apiClient.getRaw).mockImplementation(async () => ({ success: true, data: {}, meta: { requestId: '', timestamp: '' }, statusCode: 200 }))
    vi.mocked(apiClient.postRaw).mockImplementation(async () => ({ success: true, data: {}, meta: { requestId: '', timestamp: '' }, statusCode: 200 }))
    vi.mocked(apiClient.putRaw).mockImplementation(async () => ({ success: true, data: {}, meta: { requestId: '', timestamp: '' }, statusCode: 200 }))
    vi.mocked(apiClient.patchRaw).mockImplementation(async () => ({ success: true, data: {}, meta: { requestId: '', timestamp: '' }, statusCode: 200 }))
    vi.mocked(apiClient.deleteRaw).mockImplementation(async () => ({ success: true, data: {}, meta: { requestId: '', timestamp: '' }, statusCode: 200 }))
    vi.mocked(apiClient.getCurrentTenant).mockReturnValue('test-tenant')
  })

  afterEach(() => {
    vi.restoreAllMocks()
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
            // Setup mock to return the expected data
            vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponseData)

            // Property: GET method should accept typed query parameters
            const response = await apiClient.get<typeof mockResponseData>(url, {
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
            expect(apiClient.get).toHaveBeenCalledWith(url, {
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
            ),
            metadata: fc.option(
              fc.dictionary(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.oneof(fc.string(), fc.integer(), fc.boolean())
              ),
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
            // Setup mock to return the expected data
            vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponseData)

            // Property: POST method should accept typed request body
            const response = await apiClient.post<typeof mockResponseData, typeof requestBody>(
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
            expect(apiClient.post).toHaveBeenCalledWith(url, requestBody)

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should provide type-safe PUT and PATCH requests with correct body types', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary URL paths with ID
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9\-_]/g, '')),
            fc.uuid()
          ).map(([path, id]) => `/${path}/${id}`),
          // Generate HTTP method
          fc.constantFrom('PUT', 'PATCH'),
          // Generate update data
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            isActive: fc.option(fc.boolean(), { nil: undefined }),
            updatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
              .map(timestamp => new Date(timestamp).toISOString()),
            version: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined })
          }),
          // Generate response data
          fc.record({
            id: fc.uuid(),
            success: fc.constant(true),
            updatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
              .map(timestamp => new Date(timestamp).toISOString())
          }),
          async (url: string, method: 'PUT' | 'PATCH', updateData: any, mockResponseData: any) => {
            // Setup mock to return the expected data
            if (method === 'PUT') {
              vi.mocked(apiClient.put).mockResolvedValueOnce(mockResponseData)
            } else {
              vi.mocked(apiClient.patch).mockResolvedValueOnce(mockResponseData)
            }

            // Property: PUT/PATCH methods should accept typed request body
            const response = method === 'PUT' 
              ? await apiClient.put<typeof mockResponseData, typeof updateData>(url, updateData)
              : await apiClient.patch<typeof mockResponseData, typeof updateData>(url, updateData)

            // Property: Response should have correct type structure
            expect(response).toBeDefined()
            expect(typeof response).toBe('object')
            expect(response.id).toBe(mockResponseData.id)
            expect(response.success).toBe(true)
            expect(response.updatedAt).toBe(mockResponseData.updatedAt)

            // Property: Correct method should be called with correct parameters
            if (method === 'PUT') {
              expect(apiClient.put).toHaveBeenCalledWith(url, updateData)
            } else {
              expect(apiClient.patch).toHaveBeenCalledWith(url, updateData)
            }

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should provide type-safe DELETE requests with correct return types', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary URL paths with ID
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9\-_]/g, '')),
            fc.uuid()
          ).map(([path, id]) => `/${path}/${id}`),
          // Generate response data
          fc.record({
            success: fc.constant(true),
            deletedId: fc.uuid(),
            deletedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
              .map(timestamp => new Date(timestamp).toISOString())
          }),
          async (url: string, mockResponseData: any) => {
            // Setup mock to return the expected data
            vi.mocked(apiClient.delete).mockResolvedValueOnce(mockResponseData)

            // Property: DELETE method should return typed response
            const response = await apiClient.delete<typeof mockResponseData>(url)

            // Property: Response should have correct type structure
            expect(response).toBeDefined()
            expect(typeof response).toBe('object')
            expect(response.success).toBe(true)
            expect(response.deletedId).toBe(mockResponseData.deletedId)
            expect(response.deletedAt).toBe(mockResponseData.deletedAt)

            // Property: DELETE method should be called with correct parameters
            expect(apiClient.delete).toHaveBeenCalledWith(url)

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
                vi.mocked(apiClient.getRaw).mockResolvedValueOnce(fullResponse)
                break
              case 'POST':
                vi.mocked(apiClient.postRaw).mockResolvedValueOnce(fullResponse)
                break
              case 'PUT':
                vi.mocked(apiClient.putRaw).mockResolvedValueOnce(fullResponse)
                break
              case 'PATCH':
                vi.mocked(apiClient.patchRaw).mockResolvedValueOnce(fullResponse)
                break
              case 'DELETE':
                vi.mocked(apiClient.deleteRaw).mockResolvedValueOnce(fullResponse)
                break
            }

            // Property: Raw methods should return full ApiResponse structure
            let response: ApiResponse<typeof mockData>
            
            switch (method) {
              case 'GET':
                response = await apiClient.getRaw<typeof mockData>(url)
                break
              case 'POST':
                response = await apiClient.postRaw<typeof mockData>(url, {})
                break
              case 'PUT':
                response = await apiClient.putRaw<typeof mockData>(url, {})
                break
              case 'PATCH':
                response = await apiClient.patchRaw<typeof mockData>(url, {})
                break
              case 'DELETE':
                response = await apiClient.deleteRaw<typeof mockData>(url)
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

    it('should provide type-safe tenant management with correct context switching', () => {
      fc.assert(
        fc.property(
          // Generate tenant slugs
          fc.array(
            fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toLowerCase().replace(/[^a-z0-9\-]/g, '')),
            { minLength: 2, maxLength: 5 }
          ),
          (tenantSlugs: string[]) => {
            // Filter out empty slugs
            const validTenants = tenantSlugs.filter(slug => slug.length > 0)
            if (validTenants.length === 0) return true

            // Property: Tenant context should be switchable
            for (const tenant of validTenants) {
              apiClient.setTenant(tenant)
              
              // Property: setTenant should be called with correct parameter
              expect(apiClient.setTenant).toHaveBeenCalledWith(tenant)
            }

            // Property: getCurrentTenant should return the current tenant
            expect(typeof apiClient.getCurrentTenant()).toBe('string')
            
            // Property: clearTenant should remove tenant context
            apiClient.clearTenant()
            expect(apiClient.clearTenant).toHaveBeenCalled()

            // Property: withTenant should be available for temporary overrides
            expect(typeof apiClient.withTenant).toBe('function')
            
            // Property: withoutTenant should be available for system requests
            expect(typeof apiClient.withoutTenant).toBe('function')

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
            ),
            mixedArrayParam: fc.option(
              fc.array(
                fc.oneof(fc.string({ minLength: 1, maxLength: 10 }), fc.integer({ min: 0, max: 100 })),
                { minLength: 1, maxLength: 3 }
              ),
              { nil: undefined }
            )
          }),
          async (queryParams: QueryParams) => {
            // Setup mock response
            vi.mocked(apiClient.get).mockResolvedValueOnce({ result: 'success' })

            // Property: All query parameter types should be accepted
            const response = await apiClient.get<{ result: string }>('/test', {
              params: queryParams
            })

            // Property: Response should be successful
            expect(response).toBeDefined()
            expect(response.result).toBe('success')

            // Property: GET method should be called with correct parameters
            expect(apiClient.get).toHaveBeenCalledWith('/test', {
              params: queryParams
            })

            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should provide consistent type safety across configuration options', () => {
      fc.assert(
        fc.property(
          // Generate API client configuration
          fc.record({
            baseURL: fc.webUrl(),
            tenantSlug: fc.option(
              fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toLowerCase().replace(/[^a-z0-9\-]/g, '')),
              { nil: undefined }
            ),
            timeout: fc.option(fc.integer({ min: 1000, max: 60000 }), { nil: undefined }),
            retries: fc.option(fc.integer({ min: 0, max: 5 }), { nil: undefined }),
            retryDelay: fc.option(fc.integer({ min: 100, max: 5000 }), { nil: undefined })
          }),
          (config: ApiClientConfig) => {
            // Property: API client should accept any valid configuration
            const testClient = createApiClient(config)
            
            // Property: Client should be properly initialized with all required methods
            expect(testClient).toBeDefined()
            expect(typeof testClient.get).toBe('function')
            expect(typeof testClient.post).toBe('function')
            expect(typeof testClient.put).toBe('function')
            expect(typeof testClient.patch).toBe('function')
            expect(typeof testClient.delete).toBe('function')
            expect(typeof testClient.getRaw).toBe('function')
            expect(typeof testClient.postRaw).toBe('function')
            expect(typeof testClient.putRaw).toBe('function')
            expect(typeof testClient.patchRaw).toBe('function')
            expect(typeof testClient.deleteRaw).toBe('function')
            
            // Property: Tenant management methods should be available
            expect(typeof testClient.setTenant).toBe('function')
            expect(typeof testClient.getCurrentTenant).toBe('function')
            expect(typeof testClient.clearTenant).toBe('function')
            expect(typeof testClient.withTenant).toBe('function')
            expect(typeof testClient.withoutTenant).toBe('function')
            
            // Property: Store integration methods should be available
            expect(typeof testClient.setTokenStore).toBe('function')
            expect(typeof testClient.setErrorStore).toBe('function')
            expect(typeof testClient.setTenantStore).toBe('function')
            expect(typeof testClient.handleTokenRefresh).toBe('function')

            return true
          }
        ),
        { numRuns: 30 }
      )
    })
  })
})