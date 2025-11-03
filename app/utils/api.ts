import type { ApiResponse, ApiError } from '~/types'

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
}

export class ApiClient {
  private config: Required<ApiClientConfig>
  private tokenStore: any
  private errorStore: any

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

  setTenantSlug(tenantSlug: string) {
    this.config.tenantSlug = tenantSlug
  }

  private async getBaseHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add tenant slug header if configured
    if (this.config.tenantSlug) {
      headers['X-Tenant-Slug'] = this.config.tenantSlug
    }

    return headers
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add tenant slug header if configured
    if (this.config.tenantSlug) {
      headers['X-Tenant-Slug'] = this.config.tenantSlug
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

  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {},
    useAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`
    const headers = useAuth ? await this.getAuthHeaders() : await this.getBaseHeaders()

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
          
          // Report error to error store
          if (this.errorStore && 'addError' in this.errorStore) {
            this.errorStore.addError(error)
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
        
        // Don't retry on authentication errors or client errors (4xx)
        if (error instanceof Error && 'status' in error) {
          const apiError = error as ApiError
          if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
            throw error
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