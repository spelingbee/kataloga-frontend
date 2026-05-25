import type { ApiResponse, ApiError, RequestOptions, ApiMeta } from '~/types'
import type { TenantInfo } from '~/types/tenant'
import { isApiResponse } from '~/utils/type-guards'
import { createErrorResponse } from '~/utils/response-normalizer'

export interface ApiClientConfig {
  baseURL: string
  tenantSlug?: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

// Enhanced request configuration with unwrapping support
export interface EnhancedRequestConfig extends Omit<RequestOptions, 'params'> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  params?: Record<string, any>
}

/**
 * Enhanced API Client for Frontend Application
 * 
 * This class provides a standardized HTTP client with automatic response unwrapping,
 * error handling, retry logic, and tenant context management. It works exclusively
 * with the new ApiResponse<T> format from the backend.
 * 
 * @example
 * ```typescript
 * // Initialize the client
 * const client = createApiClient({ baseURL: 'https://api.example.com' });
 * 
 * // Simple GET request (returns unwrapped data)
 * const users = await client.get<User[]>('/users');
 * 
 * // GET request with full response (includes metadata)
 * const response = await client.getRaw<User[]>('/users');
 * console.log(response.meta.requestId);
 * 
 * // POST request with error handling
 * try {
 *   const newUser = await client.post<User>('/users', userData);
 * } catch (error) {
 *   if (error.code === 'VALIDATION_ERROR') {
 *     // Handle validation errors
 *   }
 * }
 * ```
 * 
 * @see {@link https://docs.example.com/api-client} API Client Documentation
 * @since 2.0.0
 */
export class ApiClient {
  private config: Required<ApiClientConfig>
  private tokenStore: any
  private errorStore: any
  private tenantStore: any
  private tenantErrorCount = 0
  private lastTenantErrorTime = 0
  private readonly RECURSION_LIMIT = 2
  private readonly RECURSION_WINDOW = 30000 // 30 seconds

  /**
   * Creates a new API client instance
   * 
   * @param config - Configuration options for the API client
   * @param config.baseURL - Base URL for all API requests
   * @param config.tenantSlug - Default tenant slug for multi-tenant requests
   * @param config.timeout - Request timeout in milliseconds (default: 10000)
   * @param config.retries - Number of retry attempts for failed requests (default: 3)
   * @param config.retryDelay - Base delay between retries in milliseconds (default: 1000)
   * 
   * @example
   * ```typescript
   * const client = new ApiClient({
   *   baseURL: 'https://api.example.com',
   *   tenantSlug: 'my-tenant',
   *   timeout: 15000,
   *   retries: 2
   * });
   * ```
   */
  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      tenantSlug: '',
      ...config,
    }
  }

  /**
   * Set the token store for authentication
   * 
   * @param tokenStore - Store instance that manages authentication tokens
   * @param tokenStore.accessToken - Current access token
   * @param tokenStore.refreshToken - Refresh token for token renewal
   * @param tokenStore.setTokens - Method to update tokens
   * @param tokenStore.clearTokens - Method to clear tokens
   * 
   * @example
   * ```typescript
   * const authStore = useUserStore();
   * client.setTokenStore(authStore);
   * ```
   */
  setTokenStore(tokenStore: any) {
    this.tokenStore = tokenStore
  }

  setErrorStore(errorStore: any) {
    this.errorStore = errorStore
  }

  setTenantStore(tenantStore: any) {
    this.tenantStore = tenantStore
  }

  /**
   * Set tenant slug for API requests
   * Requirements: 1.1, 4.1
   */
  setTenant(tenantSlug: string): void {
    this.config.tenantSlug = tenantSlug
    console.log('API Client tenant set to:', tenantSlug)
  }

  /**
   * Alias for setTenant - for backward compatibility
   * Requirements: 1.1, 4.1
   */
  setTenantSlug(tenantSlug: string): void {
    this.setTenant(tenantSlug)
  }

  /**
   * Get current tenant slug
   * Requirements: 1.1, 4.1
   */
  getCurrentTenant(): string {
    // 1. Try to get from URL query first (most reliable for direct links)
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search)
      const tenantParam = urlParams.get('tenant')
      if (tenantParam) return tenantParam

      // Try to get from path parameter /t/[slug]
      const match = window.location.pathname.match(/^\/t\/([^/]+)/)
      if (match && match[1]) return match[1]
    }

    // 2. Try to get from tenant store
    if (this.tenantStore && 'tenantSlug' in this.tenantStore) {
      return this.tenantStore.tenantSlug || this.config.tenantSlug
    }
    return this.config.tenantSlug
  }

  /**
   * Clear tenant configuration
   * Requirements: 4.1
   */
  clearTenant(): void {
    this.config.tenantSlug = ''
    console.log('API Client tenant cleared')
  }

  /**
   * Unwraps data from ApiResponse for clean component consumption
   * 
   * @template T The type of data being unwrapped
   * @param response - The ApiResponse to unwrap
   * @returns The unwrapped data of type T
   * @throws {ApiError} When the response indicates failure
   * 
   * @example
   * ```typescript
   * const response: ApiResponse<User[]> = await fetch('/users').then(r => r.json())
   * const users = this.unwrapResponse(response) // Returns User[]
   * ```
   * 
   * Requirements: 1.1
   */
  private unwrapResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw this.createTypedApiError(response.error!, response.meta)
    }
    return response.data as T
  }

  /**
   * Creates a typed API error with metadata for better error handling
   * 
   * @param error - The API error object from the response
   * @param meta - API metadata containing requestId and other context
   * @returns A typed error that extends both ApiError and Error interfaces
   * 
   * @example
   * ```typescript
   * const apiError = this.createTypedApiError(
   *   { code: 'NOT_FOUND', message: 'User not found' },
   *   { requestId: 'req-123', timestamp: '2023-12-20T10:30:00Z' }
   * )
   * console.log(apiError.requestId) // 'req-123'
   * ```
   * 
   * Requirements: 1.2, 1.5
   */
  private createTypedApiError(error: ApiError, meta: ApiMeta): ApiError & Error {
    const typedError = new Error(error.message) as ApiError & Error
    typedError.name = 'ApiError'
    typedError.code = error.code
    typedError.message = error.message
    typedError.details = error.details
    
    // Add metadata for tracing and debugging
    if (meta) {
      (typedError as any).requestId = meta.requestId;
      (typedError as any).tenantId = meta.tenantId;
      (typedError as any).timestamp = meta.timestamp;
    }
    
    return typedError
  }

  /**
   * Enhanced error logging with requestId and context
   * Requirements: 1.5
   */
  private logError(error: ApiError, context: {
    url: string
    method: string
    requestId?: string
    tenantId?: string
  }): void {
    const logData = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      context,
      timestamp: new Date().toISOString()
    }

    console.error('🚨 API Client - Error:', logData)

    // Send to external logging service if available
    if (typeof window !== 'undefined' && (window as any).__ERROR_LOGGER__) {
      (window as any).__ERROR_LOGGER__.logError(logData)
    }
  }

  /**
   * Implements retry logic for network errors
   * Requirements: 1.2, 1.5
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: {
      maxRetries: number
      retryDelay: number
      shouldRetry: (error: any, attempt: number) => boolean
    }
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on the last attempt
        if (attempt === config.maxRetries) {
          break
        }

        // Check if we should retry this error
        if (!config.shouldRetry(error, attempt)) {
          throw error
        }

        // Wait before retrying with exponential backoff
        const delay = config.retryDelay * Math.pow(2, attempt)
        console.log(`🔄 API Client - Retrying in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('Operation failed after all retries')
  }

  /**
   * Determines if an error should be retried
   * Requirements: 1.2, 1.5
   */
  private shouldRetryError(error: any, attempt: number): boolean {
    // Don't retry if we've exceeded reasonable attempts
    if (attempt >= 3) {
      return false
    }

    // Retry network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR' || (error.name === 'TypeError' && error.message.includes('fetch'))) {
      return true
    }

    // Retry timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return true
    }

    // Check for HTTP status codes that are retryable
    const status = (error as any).status || (error as any).statusCode
    if (status) {
      // Retry 5xx server errors
      if (status >= 500) {
        return true
      }
      
      // Retry specific 4xx errors
      if (status === 408 || status === 429) { // Timeout or Rate Limited
        return true
      }
    }

    return false
  }

  /**
   * Creates network error for failed requests
   * Requirements: 1.2, 1.5
   */
  private createNetworkError(originalError: Error, requestUrl: string): ApiError & Error {
    const networkError = new Error('Network request failed') as ApiError & Error
    networkError.name = 'NetworkError'
    networkError.code = 'NETWORK_ERROR'
    networkError.message = `Network request to ${requestUrl} failed: ${originalError.message}`
    networkError.details = {
      originalError: originalError.message,
      url: requestUrl,
      timestamp: new Date().toISOString()
    }

    return networkError
  }

  /**
   * Get base headers for requests
   * Requirements: 1.1, 1.5, 4.1
   */
  private async getBaseHeaders(config?: RequestOptions): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add tenant slug header if not bypassed
    if (!config?.bypassTenant) {
      const tenantSlug = config?.targetTenant || this.getCurrentTenant()
      if (tenantSlug) {
        headers['X-Tenant-Slug'] = tenantSlug
      }
    } else {
      // Add bypass header for system-wide requests
      headers['X-Bypass-Tenant'] = 'true'
    }

    return headers
  }

  /**
   * Validates and processes API response
   * Requirements: 1.3
   */
  private async processResponse<T>(
    response: any, 
    statusCode: number, 
    requestUrl: string
  ): Promise<ApiResponse<T>> {
    // Check if response is already in standard format
    if (isApiResponse(response)) {
      return response as ApiResponse<T>
    }

    // All responses should now be in standard format
    // If not, create an error response
    const error: ApiError = {
      code: 'INVALID_RESPONSE_FORMAT',
      message: `Invalid response format from ${requestUrl}`,
      details: { response }
    }

    return createErrorResponse(error, 500) as ApiResponse<T>
  }

  /**
   * Get authenticated headers for requests
   * Requirements: 1.1, 1.5, 4.1
   */
  private async getAuthHeaders(config?: RequestOptions): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add tenant slug header if not bypassed
    if (!config?.bypassTenant) {
      const tenantSlug = config?.targetTenant || this.getCurrentTenant()
      if (tenantSlug) {
        headers['X-Tenant-Slug'] = tenantSlug
      }
    } else {
      // Add bypass header for system-wide requests
      headers['X-Bypass-Tenant'] = 'true'
    }

    // Add authorization header if token is available
    if (this.tokenStore && 'accessToken' in this.tokenStore) {
      const tokenStore = this.tokenStore as any
      const token = tokenStore.accessToken
      if (token && typeof token === 'string' && token !== 'undefined' && token !== 'null') {
        headers.Authorization = `Bearer ${token}`
      }
    }

    return headers
  }

  /**
   * Handle tenant-specific errors
   * Requirements: 1.4, 4.5
   */
  private async handleTenantError(error: ApiError, config?: RequestOptions): Promise<void> {
    // Skip tenant error handling for bypass requests
    if (config?.bypassTenant) {
      return
    }

    // Check for tenant-related error codes
    const tenantErrorCodes = [
      'TENANT_NOT_FOUND',
      'TENANT_INACTIVE',
      'TENANT_ACCESS_DENIED',
      'TENANT_VALIDATION_FAILED',
      'INVALID_TENANT',
    ]

    // Refinement: Only treat it as a tenant error if it has a specific code
    // OR if the message explicitly indicates a missing/invalid tenant context.
    // Avoid broad keyword matching for "tenant" which catches general 403s.
    const isTenantError = tenantErrorCodes.includes(error.code || '') || 
                          (error.message && (
                            error.message.includes('Tenant not found') || 
                            error.message.includes('Invalid tenant') ||
                            error.message.includes('No tenant configured')
                          ))

    if (isTenantError && this.tenantStore) {
      const now = Date.now()
      
      // Reset counter if outside window
      if (now - this.lastTenantErrorTime > this.RECURSION_WINDOW) {
        this.tenantErrorCount = 0
      }
      
      this.tenantErrorCount++
      this.lastTenantErrorTime = now
      
      if (this.tenantErrorCount > this.RECURSION_LIMIT) {
        console.error('🛑 API Client - Recursion guard triggered for tenant error handling. Stopping recovery loop.')
        return
      }

      console.error('Tenant-specific error detected:', error)
      
      // Notify tenant store about the error
      if ('handleTenantError' in this.tenantStore && typeof this.tenantStore.handleTenantError === 'function') {
        // We do NOT await this in case it triggers more API calls that come back here
        this.tenantStore.handleTenantError(new Error(error.message)).catch((err: any) => {
          console.error('Failed to handle tenant error in store:', err)
        })
      } else if ('setError' in this.tenantStore && typeof this.tenantStore.setError === 'function') {
        this.tenantStore.setError(error.message)
      }
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    if (!this.tokenStore || !('refreshToken' in this.tokenStore)) {
      return false
    }

    const tokenStore = this.tokenStore as any
    if (!tokenStore.refreshToken) {
      return false
    }

    try {
      // Use NestJS auth refresh endpoint - get raw response for token refresh
      const response = await this.makeRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: tokenStore.refreshToken },
        unwrap: false // Get full response to check success
      }, false) as ApiResponse<{ accessToken: string; refreshToken: string }>

      if (response.success && response.data) {
        if ('setTokens' in this.tokenStore && typeof this.tokenStore.setTokens === 'function') {
          const data = response.data
          this.tokenStore.setTokens(data.accessToken, data.refreshToken)
        }
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      if ('clearTokens' in this.tokenStore && typeof this.tokenStore.clearTokens === 'function') {
        this.tokenStore.clearTokens()
      }
    }

    return false
  }

  /**
   * Enhanced HTTP request method with unwrapping support and improved error handling
   * Requirements: 1.1, 1.2, 1.5, 4.1
   */
  private async makeRequest<T>(
    endpoint: string,
    config: EnhancedRequestConfig = {},
    useAuth: boolean = true
  ): Promise<T | ApiResponse<T>> {
    const { unwrap = true, skipErrorHandling = false, params, ...requestConfig } = config
    
    // Build URL with query parameters
    let url = `${this.config.baseURL}${endpoint}`
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString())
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    // Execute request with retry logic
    return this.executeWithRetry(
      async () => {
        const headers = useAuth ? await this.getAuthHeaders(config) : await this.getBaseHeaders(config)

        console.log(`🌐 API ${requestConfig.method || 'GET'} ${endpoint}`)

        const requestInit: RequestInit = {
          method: requestConfig.method || 'GET',
          headers: { ...headers, ...requestConfig.headers },
        }

        // Add timeout using AbortController
        const timeout = requestConfig.timeout || this.config.timeout || 10000
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          console.warn(`[ApiClient] ⏱️ Timeout triggered for ${endpoint} after ${timeout}ms`)
          controller.abort()
        }, timeout)
        
        requestInit.signal = controller.signal

        if (requestConfig.body && requestConfig.method !== 'GET') {
          requestInit.body = JSON.stringify(requestConfig.body)
        }

        let response: Response
        try {
          response = await fetch(url, {
            ...requestInit,
            credentials: 'include'
          })
          clearTimeout(timeoutId)
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            const timeoutError: ApiError = {
              code: 'TIMEOUT_ERROR',
              message: `Request to ${endpoint} timed out after ${timeout}ms`
            }
            throw this.createTypedApiError(timeoutError, { requestId: `timeout-${Date.now()}`, timestamp: new Date().toISOString() })
          }
          // Convert fetch errors to network errors
          const networkError = this.createNetworkError(fetchError as Error, url)
          this.logError(networkError, {
            url,
            method: requestConfig.method || 'GET'
          })
          throw networkError
        }
        
        console.log(`📥 ${endpoint} -> ${response.status}`)
        
        // Handle 401 Unauthorized - try token refresh
        if (response.status === 401 && useAuth) {
          console.log('🔐 API Client - 401 received, attempting token refresh')
          const refreshed = await this.handleTokenRefresh()
          if (refreshed) {
            // Update headers with new token and retry
            const newHeaders = await this.getAuthHeaders()
            requestInit.headers = { ...newHeaders, ...requestConfig.headers }
            console.log('✅ API Client - Token refreshed, retrying request')
            
            // Retry the request with new token
            response = await fetch(url, requestInit)
          } else {
            // Refresh failed, create authentication error
            const authError: ApiError = {
              code: 'AUTHENTICATION_ERROR',
              message: 'Authentication failed - unable to refresh token'
            }
            const meta = { requestId: `auth-${Date.now()}`, timestamp: new Date().toISOString() }
            throw this.createTypedApiError(authError, meta)
          }
        }

        const responseData = await response.json()

        // Process and normalize the response
        const normalizedResponse = await this.processResponse<T>(responseData, response.status, url)

        if (!response.ok || !normalizedResponse.success) {
          const error = normalizedResponse.error || {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          }
          
          console.error('❌ API Client - API Error:', error)
          
          // Enhanced error logging
          this.logError(error, {
            url,
            method: requestConfig.method || 'GET',
            requestId: normalizedResponse.meta.requestId,
            tenantId: normalizedResponse.meta.tenantId
          })
          
          // Handle tenant-specific errors
          await this.handleTenantError(error, config)
          
          // Report error to error store
          if (this.errorStore && 'addError' in this.errorStore) {
            this.errorStore.addError(error)
          }

          // Handle global error processing if not skipped
          if (!skipErrorHandling) {
            // Global error handling will be implemented in task 4
            console.log('🔄 API Client - Global error handling (to be implemented in task 4)')
          }
          
          throw this.createTypedApiError(error, normalizedResponse.meta)
        }

        console.log(`✅ ${endpoint} OK`)
        
        // Return unwrapped data or full response based on config
        return unwrap ? this.unwrapResponse<T>(normalizedResponse) : normalizedResponse
      },
      {
        maxRetries: requestConfig.retries ?? this.config.retries,
        retryDelay: this.config.retryDelay,
        shouldRetry: this.shouldRetryError.bind(this)
      }
    )
  }

  // =============================================================================
  // PUBLIC HTTP METHODS WITH UNWRAPPING SUPPORT
  // =============================================================================

  /**
   * GET request with automatic unwrapping (returns clean data by default)
   * Requirements: 1.1
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const config: EnhancedRequestConfig = { 
      ...options, 
      method: 'GET',
      unwrap: options?.unwrap !== false // Default to true
    }
    return this.makeRequest<T>(endpoint, config) as Promise<T>
  }

  /**
   * POST request with automatic unwrapping (returns clean data by default)
   * Requirements: 1.1
   */
  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const config: EnhancedRequestConfig = { 
      ...options, 
      method: 'POST', 
      body,
      unwrap: options?.unwrap !== false // Default to true
    }
    return this.makeRequest<T>(endpoint, config) as Promise<T>
  }

  /**
   * PUT request with automatic unwrapping (returns clean data by default)
   * Requirements: 1.1
   */
  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const config: EnhancedRequestConfig = { 
      ...options, 
      method: 'PUT', 
      body,
      unwrap: options?.unwrap !== false // Default to true
    }
    return this.makeRequest<T>(endpoint, config) as Promise<T>
  }

  /**
   * PATCH request with automatic unwrapping (returns clean data by default)
   * Requirements: 1.1
   */
  async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const config: EnhancedRequestConfig = { 
      ...options, 
      method: 'PATCH', 
      body,
      unwrap: options?.unwrap !== false // Default to true
    }
    return this.makeRequest<T>(endpoint, config) as Promise<T>
  }

  /**
   * DELETE request with automatic unwrapping (returns clean data by default)
   * Requirements: 1.1
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const config: EnhancedRequestConfig = { 
      ...options, 
      method: 'DELETE',
      unwrap: options?.unwrap !== false // Default to true
    }
    return this.makeRequest<T>(endpoint, config) as Promise<T>
  }

  // =============================================================================
  // RAW RESPONSE METHODS (FOR ACCESSING FULL ApiResponse)
  // =============================================================================

  /**
   * GET request that returns full ApiResponse (for accessing metadata)
   * Requirements: 1.2
   */
  async getRaw<T>(endpoint: string, options?: Omit<RequestOptions, 'unwrap'>): Promise<ApiResponse<T>> {
    const config: EnhancedRequestConfig = { 
      ...options, 
      method: 'GET',
      unwrap: false // Always return full response
    }
    return this.makeRequest<T>(endpoint, config) as Promise<ApiResponse<T>>
  }

  /**
   * POST request that returns full ApiResponse (for accessing metadata)
   * Requirements: 1.2
   */
  async postRaw<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'unwrap'>): Promise<ApiResponse<T>> {
    const config: EnhancedRequestConfig = { 
      ...options, 
      method: 'POST', 
      body,
      unwrap: false // Always return full response
    }
    return this.makeRequest<T>(endpoint, config) as Promise<ApiResponse<T>>
  }

  /**
   * PUT request that returns full ApiResponse (for accessing metadata)
   * Requirements: 1.2
   */
  async putRaw<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'unwrap'>): Promise<ApiResponse<T>> {
    const config: EnhancedRequestConfig = { 
      ...options, 
      method: 'PUT', 
      body,
      unwrap: false // Always return full response
    }
    return this.makeRequest<T>(endpoint, config) as Promise<ApiResponse<T>>
  }

  /**
   * PATCH request that returns full ApiResponse (for accessing metadata)
   * Requirements: 1.2
   */
  async patchRaw<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'unwrap'>): Promise<ApiResponse<T>> {
    const config: EnhancedRequestConfig = { 
      ...options, 
      method: 'PATCH', 
      body,
      unwrap: false // Always return full response
    }
    return this.makeRequest<T>(endpoint, config) as Promise<ApiResponse<T>>
  }

  /**
   * DELETE request that returns full ApiResponse (for accessing metadata)
   * Requirements: 1.2
   */
  async deleteRaw<T>(endpoint: string, options?: Omit<RequestOptions, 'unwrap'>): Promise<ApiResponse<T>> {
    const config: EnhancedRequestConfig = { 
      ...options, 
      method: 'DELETE',
      unwrap: false // Always return full response
    }
    return this.makeRequest<T>(endpoint, config) as Promise<ApiResponse<T>>
  }

  // =============================================================================
  // TENANT-RELATED METHODS (UPDATED FOR UNWRAPPING)
  // =============================================================================

  /**
   * Get tenant information by slug
   * Requirements: 1.2, 4.5
   */
  async getTenantInfo(slug: string): Promise<TenantInfo> {
    try {
      return await this.get<TenantInfo>(`/tenants/${slug}`, {
        bypassTenant: true, // System-wide request
      })
    } catch (error) {
      throw new Error(`Tenant not found: ${slug}`)
    }
  }

  /**
   * Validate tenant access
   * Requirements: 1.2, 4.5
   */
  async validateTenantAccess(slug: string): Promise<boolean> {
    try {
      const result = await this.get<{ valid: boolean; isActive: boolean }>(`/tenants/${slug}/validate`, {
        bypassTenant: true, // System-wide request
      })

      return result.valid === true && result.isActive === true
    } catch (error) {
      console.error('Tenant validation failed:', error)
      return false
    }
  }

  /**
   * Get list of available tenants
   * Requirements: 1.2, 4.5
   */
  async getAvailableTenants(): Promise<TenantInfo[]> {
    try {
      return await this.get<TenantInfo[]>('/tenants', {
        bypassTenant: true, // System-wide request
      })
    } catch (error) {
      console.error('Failed to fetch available tenants:', error)
      return []
    }
  }

  /**
   * Make a request with a specific tenant override
   * Requirements: 1.2, 4.5
   */
  async withTenant<T>(
    tenantSlug: string,
    requestFn: (client: ApiClient) => Promise<T>
  ): Promise<T> {
    const originalTenant = this.config.tenantSlug
    
    try {
      // Temporarily set the target tenant
      this.config.tenantSlug = tenantSlug
      
      // Execute the request
      const result = await requestFn(this)
      
      return result
    } finally {
      // Restore original tenant
      this.config.tenantSlug = originalTenant
    }
  }

  /**
   * Make a system-wide request bypassing tenant context
   * Requirements: 1.2, 4.5
   */
  async withoutTenant<T>(
    requestFn: (client: ApiClient) => Promise<T>
  ): Promise<T> {
    // Execute request with bypass flag
    return requestFn(this)
  }
}

// Create singleton instance
let apiClient: ApiClient | null = null

export function createApiClient(config: ApiClientConfig): ApiClient {
  apiClient = new ApiClient(config)
  return apiClient
}

export function useApiClient(): ApiClient {
  if (!apiClient) {
    throw new Error('API client not initialized. Call createApiClient first.')
  }
  return apiClient
}
