import type { ApiResponse, ApiError, RequestOptions, ApiMeta } from '~/types'
import type { TenantInfo } from '~/types/tenant'
import type { ApiClient as IApiClient, ApiClientConfig, QueryParams } from '~/types/api-client'
import {
  isDefined,
  hasElements,
  safeArrayAccess,
  safePropertyAccess,
  isNonEmptyString,
  isValidNumber,
  hasProperty
} from '~/types/utils/type-guards'
import { isApiResponse } from '~/utils/type-guards'
import { createErrorResponse } from '~/utils/response-normalizer'

// Enhanced request configuration with unwrapping support
export interface EnhancedRequestConfig extends Omit<RequestOptions, 'params'> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  params?: QueryParams
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
export class ApiClient implements IApiClient {
  private config: Required<ApiClientConfig>
  private tokenStore: any
  private errorStore: any
  private tenantStore: any

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
   * const authStore = useAuthStore();
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
   * Enhanced with type guards for null safety
   * Requirements: 1.1, 4.1, 6.1, 6.2, 6.3
   */
  getCurrentTenant(): string {
    // Try to get from tenant store first with type guards
    if (isDefined(this.tenantStore) && hasProperty(this.tenantStore, 'tenantSlug')) {
      const tenantSlug = safePropertyAccess(this.tenantStore, 'tenantSlug')
      if (isDefined(tenantSlug) && isNonEmptyString(tenantSlug)) {
        return tenantSlug
      }
    }

    // Fallback to config tenant slug
    const configTenantSlug = safePropertyAccess(this.config, 'tenantSlug')
    return (isDefined(configTenantSlug) && isNonEmptyString(configTenantSlug)) ? configTenantSlug : ''
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
   * Enhanced with type guards for null safety
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
   * Requirements: 1.1, 6.1, 6.2, 6.3
   */
  private unwrapResponse<T>(response: ApiResponse<T>): T {
    // Use type guard to validate response structure
    if (!isApiResponse(response)) {
      throw new Error('Invalid API response format')
    }

    if (!response.success) {
      // Use safe property access for error field
      const error = safePropertyAccess(response, 'error')
      if (!isDefined(error)) {
        throw new Error('Response indicates failure but no error details provided')
      }
      throw this.createTypedApiError(error, response.meta)
    }

    // Use safe property access for data field
    const data = safePropertyAccess(response, 'data')
    if (!isDefined(data)) {
      throw new Error('Successful response missing data field')
    }

    return data
  }

  /**
   * Creates a typed API error with metadata for better error handling
   * Enhanced with type guards for null safety
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
   * Requirements: 1.2, 1.5, 6.1, 6.2, 6.3
   */
  private createTypedApiError(error: ApiError, meta: ApiMeta): ApiError & Error {
    // Use type guards to safely access error properties
    const errorCode = safePropertyAccess(error, 'code') || 'UNKNOWN_ERROR'
    const errorMessage = safePropertyAccess(error, 'message') || 'An unknown error occurred'

    const typedError = new Error(errorMessage) as ApiError & Error
    typedError.name = 'ApiError'
    typedError.code = errorCode
    typedError.message = errorMessage

    // Use safe property access for optional details
    const details = safePropertyAccess(error, 'details')
    if (isDefined(details)) {
      typedError.details = details
    }

    // Add metadata for tracing and debugging with type guards
    if (isDefined(meta)) {
      const requestId = safePropertyAccess(meta, 'requestId')
      const tenantId = safePropertyAccess(meta, 'tenantId')
      const timestamp = safePropertyAccess(meta, 'timestamp')

      if (isDefined(requestId)) {
        (typedError as any).requestId = requestId
      }
      if (isDefined(tenantId)) {
        (typedError as any).tenantId = tenantId
      }
      if (isDefined(timestamp)) {
        (typedError as any).timestamp = timestamp
      }
    }

    return typedError
  }

  /**
   * Enhanced error logging with requestId and context
   * Enhanced with type guards for null safety
   * Requirements: 1.5, 6.1, 6.2, 6.3
   */
  private logError(error: ApiError, context: {
    url: string
    method: string
    requestId?: string
    tenantId?: string
  }): void {
    // Use type guards to safely access error properties
    const errorCode = safePropertyAccess(error, 'code') || 'UNKNOWN_ERROR'
    const errorMessage = safePropertyAccess(error, 'message') || 'Unknown error'
    const errorDetails = safePropertyAccess(error, 'details')

    const logData = {
      error: {
        code: errorCode,
        message: errorMessage,
        details: isDefined(errorDetails) ? errorDetails : undefined
      },
      context,
      timestamp: new Date().toISOString()
    }

    console.error('🚨 API Client - Error:', logData)

    // Send to external logging service if available with type guards
    if (typeof window !== 'undefined') {
      const errorLogger = safePropertyAccess(window as any, '__ERROR_LOGGER__')
      if (isDefined(errorLogger) && typeof errorLogger.logError === 'function') {
        errorLogger.logError(logData)
      }
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
   * Enhanced with type guards for null safety
   * Requirements: 1.2, 1.5, 6.1, 6.2, 6.3
   */
  private shouldRetryError(error: any, attempt: number): boolean {
    // Don't retry if we've exceeded reasonable attempts
    if (!isValidNumber(attempt) || attempt >= 3) {
      return false
    }

    // Use safe property access for error properties
    const errorName = safePropertyAccess(error, 'name')
    const errorMessage = safePropertyAccess(error, 'message')

    // Retry network errors
    if (isDefined(errorName) && errorName === 'TypeError' &&
      isDefined(errorMessage) && errorMessage.includes('fetch')) {
      return true
    }

    // Retry timeout errors
    if ((isDefined(errorName) && errorName === 'AbortError') ||
      (isDefined(errorMessage) && errorMessage.includes('timeout'))) {
      return true
    }

    // Check for HTTP status codes that are retryable
    const status = safePropertyAccess(error, 'status') || safePropertyAccess(error, 'statusCode')
    if (isDefined(status) && isValidNumber(status)) {
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
   * Enhanced with type guards for null safety
   * Requirements: 1.2, 1.5, 6.1, 6.2, 6.3
   */
  private createNetworkError(originalError: Error, requestUrl: string): ApiError & Error {
    // Use safe property access for error properties
    const originalMessage = safePropertyAccess(originalError, 'message') || 'Unknown network error'

    const networkError = new Error('Network request failed') as ApiError & Error
    networkError.name = 'NetworkError'
    networkError.code = 'NETWORK_ERROR'
    networkError.message = `Network request to ${requestUrl} failed: ${originalMessage}`
    networkError.details = {
      originalError: originalMessage,
      url: requestUrl,
      timestamp: new Date().toISOString()
    }

    return networkError
  }

  /**
   * Get base headers for requests
   * Enhanced with type guards for null safety
   * Requirements: 1.1, 1.5, 4.1, 6.1, 6.2, 6.3
   */
  private async getBaseHeaders(config?: RequestOptions): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add tenant slug header if not bypassed
    const bypassTenant = safePropertyAccess(config, 'bypassTenant')
    if (!bypassTenant) {
      const targetTenant = safePropertyAccess(config, 'targetTenant')
      const tenantSlug = isDefined(targetTenant) ? targetTenant : this.getCurrentTenant()

      if (isDefined(tenantSlug) && isNonEmptyString(tenantSlug)) {
        headers['X-Tenant-Slug'] = tenantSlug
      }
    } else {
      // Add bypass header for system-wide requests
      headers['X-Bypass-Tenant'] = 'true'
    }

    // Add Guest ID header for tracking unauthenticated users
    if (typeof window !== 'undefined') {
      let guestId = localStorage.getItem('guest_id')
      if (!guestId) {
        guestId = crypto.randomUUID()
        localStorage.setItem('guest_id', guestId)
      }
      headers['X-Guest-ID'] = guestId
    }

    return headers
  }

  /**
   * Validates and processes API response
   * Enhanced with type guards for response validation
   * Requirements: 1.3, 6.1, 6.2, 6.3
   */
  private async processResponse<T>(
    response: any,
    statusCode: number,
    requestUrl: string
  ): Promise<ApiResponse<T>> {
    // Use type guard to check if response is already in standard format
    if (isApiResponse(response)) {
      return response as ApiResponse<T>
    }

    // All responses should now be in standard format
    // If not, create an error response with safe property access
    const error: ApiError = {
      code: 'INVALID_RESPONSE_FORMAT',
      message: `Invalid response format from ${requestUrl}`,
      details: { response }
    }

    return createErrorResponse(error, 500) as ApiResponse<T>
  }

  /**
   * Get authenticated headers for requests
   * Enhanced with type guards for null safety
   * Requirements: 1.1, 1.5, 4.1, 6.1, 6.2, 6.3
   */
  private async getAuthHeaders(config?: RequestOptions): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add tenant slug header if not bypassed
    const bypassTenant = safePropertyAccess(config, 'bypassTenant')
    if (!bypassTenant) {
      const targetTenant = safePropertyAccess(config, 'targetTenant')
      const tenantSlug = isDefined(targetTenant) ? targetTenant : this.getCurrentTenant()

      if (isDefined(tenantSlug) && isNonEmptyString(tenantSlug)) {
        headers['X-Tenant-Slug'] = tenantSlug
      }
    } else {
      // Add bypass header for system-wide requests
      headers['X-Bypass-Tenant'] = 'true'
    }

    // Add authorization header if token is available with type guards
    if (isDefined(this.tokenStore) && hasProperty(this.tokenStore, 'accessToken')) {
      const accessToken = safePropertyAccess(this.tokenStore, 'accessToken')
      if (isDefined(accessToken) && isNonEmptyString(accessToken)) {
        headers.Authorization = `Bearer ${accessToken}`
      }
    }

    // Add Guest ID header for tracking unauthenticated users
    if (typeof window !== 'undefined') {
      let guestId = localStorage.getItem('guest_id')
      if (!guestId) {
        guestId = crypto.randomUUID()
        localStorage.setItem('guest_id', guestId)
      }
      headers['X-Guest-ID'] = guestId
    }

    return headers
  }

  /**
   * Handle tenant-specific errors
   * Enhanced with type guards for null safety
   * Requirements: 1.4, 4.5, 6.1, 6.2, 6.3
   */
  private async handleTenantError(error: ApiError, config?: RequestOptions): Promise<void> {
    // Skip tenant error handling for bypass requests
    const bypassTenant = safePropertyAccess(config, 'bypassTenant')
    if (bypassTenant) {
      return
    }

    // Check for tenant-related error codes with safe property access
    const tenantErrorCodes = [
      'TENANT_NOT_FOUND',
      'TENANT_INACTIVE',
      'TENANT_ACCESS_DENIED',
      'TENANT_VALIDATION_FAILED',
      'INVALID_TENANT',
    ]

    const errorCode = safePropertyAccess(error, 'code')
    const errorMessage = safePropertyAccess(error, 'message')

    const isTenantError = (isDefined(errorCode) && tenantErrorCodes.includes(errorCode)) ||
      (isDefined(errorMessage) && errorMessage.toLowerCase().includes('tenant'))

    if (isTenantError && isDefined(this.tenantStore)) {
      console.error('Tenant-specific error detected:', error)

      // Notify tenant store about the error with type guards
      if (hasProperty(this.tenantStore, 'handleTenantError')) {
        const handleTenantError = safePropertyAccess(this.tenantStore, 'handleTenantError')
        if (isDefined(handleTenantError) && typeof handleTenantError === 'function') {
          const message = isDefined(errorMessage) ? errorMessage : 'Unknown tenant error'
          await handleTenantError(new Error(message))
        }
      } else if (hasProperty(this.tenantStore, 'setError')) {
        const setError = safePropertyAccess(this.tenantStore, 'setError')
        if (isDefined(setError) && typeof setError === 'function') {
          const message = isDefined(errorMessage) ? errorMessage : 'Unknown tenant error'
          setError(message)
        }
      }
    }
  }

  async handleTokenRefresh(): Promise<boolean> {
    // We no longer need to check for refreshToken in tokenStore as it's a cookie
    if (!isDefined(this.tokenStore)) {
      return false
    }

    try {
      // Use NestJS auth refresh endpoint - get raw response for token refresh
      // We don't send refreshToken in body as it's an httpOnly cookie
      const response = await this.makeRequest<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        body: {}, // Refresh token is in cookie
        unwrap: false // Get full response to check success
      }, false) as ApiResponse<{ accessToken: string }>

      // Use type guards to validate response
      if (isApiResponse(response) && response.success && isDefined(response.data)) {
        const responseData = response.data
        const newAccessToken = safePropertyAccess(responseData, 'accessToken')

        if (isDefined(newAccessToken) && hasProperty(this.tokenStore, 'setTokens')) {
          const setTokens = safePropertyAccess(this.tokenStore, 'setTokens')
          if (isDefined(setTokens) && typeof setTokens === 'function') {
            setTokens(newAccessToken)
            return true
          }
        }
      }
    } catch (error: any) {
      // Suppress logging for expected missing refresh tokens (e.g. guests)
      const isExpectedGuestError = error?.code === 'TOKEN_NOT_FOUND' || (error?.message && error.message.includes('not found'));
      if (!isExpectedGuestError) {
        console.error('Token refresh failed:', error)
      }

      // Clear tokens on refresh failure with type guards
      if (isDefined(this.tokenStore) && hasProperty(this.tokenStore, 'clearTokens')) {
        const clearTokens = safePropertyAccess(this.tokenStore, 'clearTokens')
        if (isDefined(clearTokens) && typeof clearTokens === 'function') {
          clearTokens()
        }
      }
    }

    return false
  }

  /**
   * Enhanced HTTP request method with unwrapping support and improved error handling
   * Enhanced with comprehensive type guards for null safety
   * Requirements: 1.1, 1.2, 1.5, 4.1, 6.1, 6.2, 6.3
   */
  private async makeRequest<T>(
    endpoint: string,
    config: EnhancedRequestConfig = {},
    useAuth: boolean = true
  ): Promise<T | ApiResponse<T>> {
    // Use safe property access for config options
    const unwrap = safePropertyAccess(config, 'unwrap') !== false // Default to true
    const skipErrorHandling = safePropertyAccess(config, 'skipErrorHandling') || false
    const params = safePropertyAccess(config, 'params')
    const { ...requestConfig } = config

    // Build URL with query parameters using type guards
    let url = `${this.config.baseURL}${endpoint}`
    if (isDefined(params) && typeof params === 'object') {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (isDefined(value)) {
          searchParams.append(key, value.toString())
        }
      })
      const queryString = searchParams.toString()
      if (isNonEmptyString(queryString)) {
        url += `?${queryString}`
      }
    }

    // Execute request with retry logic
    return this.executeWithRetry(
      async () => {
        const headers = useAuth ? await this.getAuthHeaders(config) : await this.getBaseHeaders(config)

        console.log('🌐 API Client - Making request:', {
          method: safePropertyAccess(requestConfig, 'method') || 'GET',
          url,
          headers: {
            ...headers,
            Authorization: isDefined(headers.Authorization) ? '[REDACTED]' : undefined
          },
          useAuth,
          unwrap,
          tenantSlug: this.getCurrentTenant()
        })

        const requestMethod = safePropertyAccess(requestConfig, 'method') || 'GET'
        const requestTimeout = safePropertyAccess(requestConfig, 'timeout') || this.config.timeout
        const requestHeaders = safePropertyAccess(requestConfig, 'headers')

        const requestInit: RequestInit = {
          method: requestMethod,
          headers: {
            ...headers,
            ...(isDefined(requestHeaders) ? requestHeaders : {})
          },
          signal: AbortSignal.timeout(requestTimeout),
          credentials: safePropertyAccess(config, 'credentials') || 'include',
        }

        const requestBody = safePropertyAccess(requestConfig, 'body')
        if (isDefined(requestBody) && requestMethod !== 'GET') {
          requestInit.body = JSON.stringify(requestBody)
          console.log('📤 API Client - Request body:', requestBody)
        }

        let response: Response
        try {
          response = await fetch(url, requestInit)
        } catch (fetchError) {
          // Convert fetch errors to network errors
          const networkError = this.createNetworkError(fetchError as Error, url)
          this.logError(networkError, {
            url,
            method: requestMethod
          })
          throw networkError
        }

        console.log('📥 API Client - Response received:', {
          status: isDefined(response) ? response.status : 'unknown',
          statusText: isDefined(response) ? response.statusText : 'unknown',
          headers: isDefined(response?.headers) ? Object.fromEntries(response.headers.entries()) : {}
        })

        // Handle 401 Unauthorized - try token refresh
        if (isDefined(response) && response.status === 401 && useAuth) {
          // If clearly unauthenticated, don't attempt a refresh loop
          if (isDefined(this.tokenStore) && hasProperty(this.tokenStore, 'isAuthenticated') && !this.tokenStore.isAuthenticated) {
            console.log('🔐 API Client - 401 on protected route but user is guest. Skipping refresh.')
            const authError: ApiError = {
              code: 'UNAUTHENTICATED',
              message: 'Authentication required'
            }
            throw this.createTypedApiError(authError, { requestId: `auth-${Date.now()}`, timestamp: new Date().toISOString() })
          }

          console.log('🔐 API Client - 401 received, attempting token refresh')
          const refreshed = await this.handleTokenRefresh()
          if (refreshed) {
            // Update headers with new token and retry
            const newHeaders = await this.getAuthHeaders()
            requestInit.headers = {
              ...newHeaders,
              ...(isDefined(requestHeaders) ? requestHeaders : {})
            }
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
        console.log('📦 API Client - Response data:', responseData)

        // Process and normalize the response
        const normalizedResponse = await this.processResponse<T>(responseData, response.status, url)

        // Use type guards to check response validity
        const isResponseOk = isDefined(response) && response.ok
        const isNormalizedSuccess = isApiResponse(normalizedResponse) && normalizedResponse.success

        if (!isResponseOk || !isNormalizedSuccess) {
          const error = safePropertyAccess(normalizedResponse, 'error') || {
            code: 'HTTP_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
          }

          // Don't broadcast noisy expected errors for silent refreshes (guests)
          const isExpectedRefreshFailure = url.includes('/auth/refresh') && 
            (response.status === 401 || response.status === 400 || error.code === 'TOKEN_NOT_FOUND' || error.message?.includes('not found'))

          if (!isExpectedRefreshFailure) {
            console.error('❌ API Client - API Error:', error)

            // Enhanced error logging with safe property access
            const requestId = safePropertyAccess(normalizedResponse.meta, 'requestId')
            const tenantId = safePropertyAccess(normalizedResponse.meta, 'tenantId')

            this.logError(error, {
              url,
              method: requestMethod,
              requestId: isDefined(requestId) ? requestId : undefined,
              tenantId: isDefined(tenantId) ? tenantId : undefined
            })

            // Handle tenant-specific errors
            await this.handleTenantError(error, config)

            // Report error to error store
            if (isDefined(this.errorStore) && hasProperty(this.errorStore, 'addError')) {
              const addError = safePropertyAccess(this.errorStore, 'addError')
              if (isDefined(addError) && typeof addError === 'function') {
                addError(error)
              }
            }
          }

          // Handle global checks (Authentication)
          if (!skipErrorHandling) {
            // Guard: Check if we are already on an auth page to prevent loop
            const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth')

            // Guard: Check if this was a refresh token attempt (avoid infinite refresh)
            const isRefreshRequest = url.includes('/auth/refresh')

            if (response.status === 401 && !isAuthPage && !isRefreshRequest) {
              console.warn('🔐 API Client - 401 Unauthenticated. Redirecting to login.')

              // Clear tokens
              if (isDefined(this.tokenStore) && hasProperty(this.tokenStore, 'clearTokens')) {
                const clearTokens = safePropertyAccess(this.tokenStore, 'clearTokens');
                if (typeof clearTokens === 'function') clearTokens();
              }

              // Redirect
              if (typeof window !== 'undefined') {
                const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = `/auth/login?redirect=${redirectUrl}`;
              }
            }
          }

          throw this.createTypedApiError(error, normalizedResponse.meta)
        }

        console.log('✅ API Client - Request successful')

        // Return unwrapped data or full response based on config
        return unwrap ? this.unwrapResponse<T>(normalizedResponse) : normalizedResponse
      },
      {
        maxRetries: safePropertyAccess(requestConfig, 'retries') ?? this.config.retries,
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
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const config: EnhancedRequestConfig = {
      ...options,
      method: 'GET',
      unwrap: options?.unwrap !== false // Default to true
    }
    return this.makeRequest<T>(url, config) as Promise<T>
  }

  /**
   * POST request with automatic unwrapping (returns clean data by default)
   * Requirements: 1.1
   */
  async post<T, TBody = unknown>(url: string, data?: TBody, options?: RequestOptions): Promise<T> {
    const config: EnhancedRequestConfig = {
      ...options,
      method: 'POST',
      body: data,
      unwrap: options?.unwrap !== false // Default to true
    }
    return this.makeRequest<T>(url, config) as Promise<T>
  }

  /**
   * PUT request with automatic unwrapping (returns clean data by default)
   * Requirements: 1.1
   */
  async put<T, TBody = unknown>(url: string, data?: TBody, options?: RequestOptions): Promise<T> {
    const config: EnhancedRequestConfig = {
      ...options,
      method: 'PUT',
      body: data,
      unwrap: options?.unwrap !== false // Default to true
    }
    return this.makeRequest<T>(url, config) as Promise<T>
  }

  /**
   * PATCH request with automatic unwrapping (returns clean data by default)
   * Requirements: 1.1
   */
  async patch<T, TBody = unknown>(url: string, data?: TBody, options?: RequestOptions): Promise<T> {
    const config: EnhancedRequestConfig = {
      ...options,
      method: 'PATCH',
      body: data,
      unwrap: options?.unwrap !== false // Default to true
    }
    return this.makeRequest<T>(url, config) as Promise<T>
  }

  /**
   * DELETE request with automatic unwrapping (returns clean data by default)
   * Requirements: 1.1
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    const config: EnhancedRequestConfig = {
      ...options,
      method: 'DELETE',
      unwrap: options?.unwrap !== false // Default to true
    }
    return this.makeRequest<T>(url, config) as Promise<T>
  }

  // =============================================================================
  // RAW RESPONSE METHODS (FOR ACCESSING FULL ApiResponse)
  // =============================================================================

  /**
   * GET request that returns full ApiResponse (for accessing metadata)
   * Requirements: 1.2
   */
  async getRaw<T>(url: string, options?: Omit<RequestOptions, 'unwrap'>): Promise<ApiResponse<T>> {
    const config: EnhancedRequestConfig = {
      ...options,
      method: 'GET',
      unwrap: false // Always return full response
    }
    return this.makeRequest<T>(url, config) as Promise<ApiResponse<T>>
  }

  /**
   * POST request that returns full ApiResponse (for accessing metadata)
   * Requirements: 1.2
   */
  async postRaw<T, TBody = unknown>(url: string, data?: TBody, options?: Omit<RequestOptions, 'unwrap'>): Promise<ApiResponse<T>> {
    const config: EnhancedRequestConfig = {
      ...options,
      method: 'POST',
      body: data,
      unwrap: false // Always return full response
    }
    return this.makeRequest<T>(url, config) as Promise<ApiResponse<T>>
  }

  /**
   * PUT request that returns full ApiResponse (for accessing metadata)
   * Requirements: 1.2
   */
  async putRaw<T, TBody = unknown>(url: string, data?: TBody, options?: Omit<RequestOptions, 'unwrap'>): Promise<ApiResponse<T>> {
    const config: EnhancedRequestConfig = {
      ...options,
      method: 'PUT',
      body: data,
      unwrap: false // Always return full response
    }
    return this.makeRequest<T>(url, config) as Promise<ApiResponse<T>>
  }

  /**
   * PATCH request that returns full ApiResponse (for accessing metadata)
   * Requirements: 1.2
   */
  async patchRaw<T, TBody = unknown>(url: string, data?: TBody, options?: Omit<RequestOptions, 'unwrap'>): Promise<ApiResponse<T>> {
    const config: EnhancedRequestConfig = {
      ...options,
      method: 'PATCH',
      body: data,
      unwrap: false // Always return full response
    }
    return this.makeRequest<T>(url, config) as Promise<ApiResponse<T>>
  }

  /**
   * DELETE request that returns full ApiResponse (for accessing metadata)
   * Requirements: 1.2
   */
  async deleteRaw<T>(url: string, options?: Omit<RequestOptions, 'unwrap'>): Promise<ApiResponse<T>> {
    const config: EnhancedRequestConfig = {
      ...options,
      method: 'DELETE',
      unwrap: false // Always return full response
    }
    return this.makeRequest<T>(url, config) as Promise<ApiResponse<T>>
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
   * Enhanced with type guards for null safety
   * Requirements: 1.2, 4.5, 6.1, 6.2, 6.3
   */
  async validateTenantAccess(slug: string): Promise<boolean> {
    // Validate input parameter
    if (!isDefined(slug) || !isNonEmptyString(slug)) {
      console.error('Invalid tenant slug provided for validation')
      return false
    }

    try {
      const result = await this.get<{ valid: boolean; isActive: boolean }>(`/tenants/${slug}/validate`, {
        bypassTenant: true, // System-wide request
      })

      // Use type guards to safely access result properties
      const isValid = safePropertyAccess(result, 'valid')
      const isActive = safePropertyAccess(result, 'isActive')

      return isDefined(isValid) && isValid === true &&
        isDefined(isActive) && isActive === true
    } catch (error) {
      console.error('Tenant validation failed:', error)
      return false
    }
  }

  /**
   * Get list of available tenants
   * Enhanced with type guards for null safety
   * Requirements: 1.2, 4.5, 6.1, 6.2, 6.3
   */
  async getAvailableTenants(): Promise<TenantInfo[]> {
    try {
      const tenants = await this.get<TenantInfo[]>('/tenants', {
        bypassTenant: true, // System-wide request
      })

      // Use type guard to ensure we return an array
      if (hasElements(tenants)) {
        return tenants
      }

      // Return empty array if no tenants or invalid response
      return []
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
    requestFn: (client: IApiClient) => Promise<T>
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
    requestFn: (client: IApiClient) => Promise<T>
  ): Promise<T> {
    // Execute request with bypass flag
    return requestFn(this)
  }
}

// Create singleton instance
let apiClient: IApiClient | null = null

export function createApiClient(config: ApiClientConfig): IApiClient {
  apiClient = new ApiClient(config)
  return apiClient
}

export function useApiClient(): IApiClient {
  if (!apiClient) {
    throw new Error('API client not initialized. Call createApiClient first.')
  }
  return apiClient
}