import type { ApiResponse, ApiError } from '~/types'
import type { TenantInfo, TenantRequestConfig } from '~/types/tenant'

export interface ApiClientConfig {
  baseURL: string
  tenantSlug?: string
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
  bypassTenant?: boolean // For system-wide requests
  targetTenant?: string  // Override current tenant
}

export class ApiClient {
  private config: Required<ApiClientConfig>
  private tokenStore: any
  private errorStore: any
  private tenantStore: any

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      tenantSlug: '',
      ...config,
    }
  }

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
   * Get current tenant slug
   * Requirements: 1.1, 4.1
   */
  getCurrentTenant(): string {
    // Try to get from tenant store first
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
   * Get base headers for requests
   * Requirements: 1.1, 1.5, 4.1
   */
  private async getBaseHeaders(config?: RequestConfig): Promise<Record<string, string>> {
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
   * Get authenticated headers for requests
   * Requirements: 1.1, 1.5, 4.1
   */
  private async getAuthHeaders(config?: RequestConfig): Promise<Record<string, string>> {
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
      if (tokenStore.accessToken) {
        headers.Authorization = `Bearer ${tokenStore.accessToken}`
      }
    }

    return headers
  }

  /**
   * Handle tenant-specific errors
   * Requirements: 1.4, 4.5
   */
  private async handleTenantError(error: ApiError, config?: RequestConfig): Promise<void> {
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

    const isTenantError = tenantErrorCodes.includes(error.code || '') || 
                          (error.message && error.message.toLowerCase().includes('tenant'))

    if (isTenantError && this.tenantStore) {
      console.error('Tenant-specific error detected:', error)
      
      // Notify tenant store about the error
      if ('handleTenantError' in this.tenantStore && typeof this.tenantStore.handleTenantError === 'function') {
        await this.tenantStore.handleTenantError(new Error(error.message))
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
      // Use NestJS auth refresh endpoint
      const response = await this.makeRequest('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: tokenStore.refreshToken },
      }, false) // Don't use auth headers for refresh

      if (response.success && response.data) {
        if ('setTokens' in this.tokenStore && typeof this.tokenStore.setTokens === 'function') {
          const data = response.data as any
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
   * Make HTTP request with tenant context
   * Requirements: 1.1, 1.5, 4.1
   */
  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {},
    useAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`
    const headers = useAuth ? await this.getAuthHeaders(config) : await this.getBaseHeaders(config)

    const requestConfig: RequestInit = {
      method: config.method || 'GET',
      headers: { ...headers, ...config.headers },
      signal: AbortSignal.timeout(config.timeout || this.config.timeout),
    }

    if (config.body && config.method !== 'GET') {
      requestConfig.body = JSON.stringify(config.body)
    }

    let lastError: Error | null = null
    const maxRetries = config.retries ?? this.config.retries

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestConfig)
        
        // Handle 401 Unauthorized - try token refresh
        if (response.status === 401 && useAuth && attempt === 0) {
          const refreshed = await this.handleTokenRefresh()
          if (refreshed) {
            // Update headers with new token and retry
            const newHeaders = await this.getAuthHeaders()
            requestConfig.headers = { ...newHeaders, ...config.headers }
            continue
          } else {
            // Refresh failed, redirect to login or handle as needed
            throw new Error('Authentication failed')
          }
        }

        const data = await response.json()

        if (!response.ok) {
          const error: ApiError = {
            name: 'ApiError',
            message: data.message || `HTTP ${response.status}`,
            status: response.status,
            code: data.code,
            details: data.details,
          }
          
          // Handle tenant-specific errors
          await this.handleTenantError(error, config)
          
          // Report error to error store
          if (this.errorStore && 'addError' in this.errorStore) {
            this.errorStore.addError(error)
          }
          
          // Don't retry 4xx errors except 408 and 429
          if (response.status >= 400 && response.status < 500) {
            if (response.status !== 408 && response.status !== 429) {
              throw error
            }
          }
          
          throw error
        }

        return data as ApiResponse<T>
      } catch (error) {
        lastError = error as Error
        
        // Report error to error store
        if (this.errorStore && 'addError' in this.errorStore) {
          this.errorStore.addError(error as ApiError)
        }
        
        // Don't retry on client errors (4xx) except for specific retryable ones
        if (error instanceof Error && 'status' in error) {
          const apiError = error as ApiError
          if (apiError.status) {
            // Don't retry 4xx errors except 408 (timeout) and 429 (rate limit)
            if (apiError.status >= 400 && apiError.status < 500) {
              if (apiError.status !== 408 && apiError.status !== 429) {
                throw error
              }
            }
          }
        }
        
        // Also check for response status in case error doesn't have status property
        if (lastError && typeof lastError === 'object' && 'response' in lastError) {
          const response = (lastError as any).response
          if (response && response.status >= 400 && response.status < 500) {
            if (response.status !== 408 && response.status !== 429) {
              throw lastError
            }
          }
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)))
      }
    }

    throw lastError || new Error('Request failed after all retries')
  }

  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'POST', body })
  }

  async put<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PUT', body })
  }

  async patch<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PATCH', body })
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'DELETE' })
  }

  /**
   * Get tenant information by slug
   * Requirements: 1.2, 4.5
   */
  async getTenantInfo(slug: string): Promise<TenantInfo> {
    const response = await this.get<TenantInfo>(`/tenants/${slug}`, {
      bypassTenant: true, // System-wide request
    })

    if (!response.success || !response.data) {
      throw new Error(`Tenant not found: ${slug}`)
    }

    return response.data
  }

  /**
   * Validate tenant access
   * Requirements: 1.2, 4.5
   */
  async validateTenantAccess(slug: string): Promise<boolean> {
    try {
      const response = await this.get<{ valid: boolean; isActive: boolean }>(`/tenants/${slug}/validate`, {
        bypassTenant: true, // System-wide request
      })

      return response.success && response.data?.valid === true && response.data?.isActive === true
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
      const response = await this.get<TenantInfo[]>('/tenants', {
        bypassTenant: true, // System-wide request
      })

      if (response.success && response.data) {
        return response.data
      }

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
    requestFn: (client: ApiClient) => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
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
    requestFn: (client: ApiClient) => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
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