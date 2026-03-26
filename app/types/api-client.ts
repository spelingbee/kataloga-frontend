/**
 * Type-Safe API Client Interface
 * 
 * This file provides complete type definitions for the API client with:
 * - Generic types for requests and responses
 * - Query parameter support with arrays
 * - Full type safety for all HTTP methods
 * - Support for both unwrapped data and full ApiResponse
 * 
 * Requirements: 1.1, 1.2
 * 
 * @module types/api-client
 */

import type { ApiResponse, RequestOptions } from './api'

// =============================================================================
// QUERY PARAMETER TYPES
// =============================================================================

/**
 * Supported query parameter value types
 * Includes support for arrays as required by the design
 */
export type QueryParamValue = string | number | boolean | (string | number)[]

/**
 * Query parameters object with type-safe values
 * Supports arrays for multi-value parameters (e.g., ?tags=tag1&tags=tag2)
 */
export type QueryParams = Record<string, QueryParamValue | undefined>

// =============================================================================
// REQUEST CONFIGURATION TYPES
// =============================================================================

/**
 * Enhanced request options with query parameter support
 * Extends base RequestOptions with typed query parameters
 */
export interface ApiClientRequestOptions extends Omit<RequestOptions, 'params'> {
  /** Type-safe query parameters with array support */
  params?: QueryParams
}

/**
 * Configuration for API client initialization
 */
export interface ApiClientConfig {
  /** Base URL for all API requests */
  baseURL: string
  /** Default tenant slug for multi-tenant requests */
  tenantSlug?: string
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number
  /** Number of retry attempts for failed requests (default: 3) */
  retries?: number
  /** Base delay between retries in milliseconds (default: 1000) */
  retryDelay?: number
}

// =============================================================================
// CORE API CLIENT INTERFACE
// =============================================================================

/**
 * Type-safe API Client Interface
 * 
 * Provides complete type safety for all HTTP operations with:
 * - Generic response types
 * - Type-safe query parameters
 * - Support for both unwrapped data and full ApiResponse
 * - Tenant context management
 * 
 * @example
 * ```typescript
 * // Basic usage with automatic unwrapping
 * const users = await apiClient.get<User[]>('/users')
 * 
 * // With query parameters (including arrays)
 * const filteredUsers = await apiClient.get<User[]>('/users', {
 *   params: {
 *     status: 'active',
 *     roles: ['admin', 'user'], // Array support
 *     page: 1,
 *     limit: 10
 *   }
 * })
 * 
 * // POST with typed request body
 * const newUser = await apiClient.post<User, CreateUserDto>('/users', userData)
 * 
 * // Access full response with metadata
 * const response = await apiClient.getRaw<User[]>('/users')
 * console.log(response.meta.requestId)
 * ```
 */
export interface ApiClient {
  // =============================================================================
  // HTTP METHODS WITH AUTOMATIC UNWRAPPING (RETURNS CLEAN DATA)
  // =============================================================================

  /**
   * GET request with automatic data unwrapping
   * 
   * @template TResponse - The expected response data type
   * @param url - The endpoint URL (relative to baseURL)
   * @param options - Request configuration options
   * @returns Promise resolving to the unwrapped response data
   * 
   * @example
   * ```typescript
   * // Simple GET request
   * const users = await apiClient.get<User[]>('/users')
   * 
   * // With query parameters
   * const filteredUsers = await apiClient.get<User[]>('/users', {
   *   params: {
   *     status: 'active',
   *     tags: ['premium', 'verified'], // Array support
   *     page: 1
   *   }
   * })
   * ```
   */
  get<TResponse>(
    url: string, 
    options?: ApiClientRequestOptions
  ): Promise<TResponse>

  /**
   * POST request with automatic data unwrapping
   * 
   * @template TResponse - The expected response data type
   * @template TBody - The request body type (optional, defaults to unknown)
   * @param url - The endpoint URL (relative to baseURL)
   * @param data - The request body data
   * @param options - Request configuration options
   * @returns Promise resolving to the unwrapped response data
   * 
   * @example
   * ```typescript
   * // POST with typed request and response
   * const newUser = await apiClient.post<User, CreateUserDto>('/users', {
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * })
   * 
   * // POST without body
   * const result = await apiClient.post<ActionResult>('/users/123/activate')
   * ```
   */
  post<TResponse, TBody = unknown>(
    url: string, 
    data?: TBody, 
    options?: ApiClientRequestOptions
  ): Promise<TResponse>

  /**
   * PUT request with automatic data unwrapping
   * 
   * @template TResponse - The expected response data type
   * @template TBody - The request body type (optional, defaults to unknown)
   * @param url - The endpoint URL (relative to baseURL)
   * @param data - The request body data
   * @param options - Request configuration options
   * @returns Promise resolving to the unwrapped response data
   */
  put<TResponse, TBody = unknown>(
    url: string, 
    data?: TBody, 
    options?: ApiClientRequestOptions
  ): Promise<TResponse>

  /**
   * PATCH request with automatic data unwrapping
   * 
   * @template TResponse - The expected response data type
   * @template TBody - The request body type (optional, defaults to unknown)
   * @param url - The endpoint URL (relative to baseURL)
   * @param data - The request body data
   * @param options - Request configuration options
   * @returns Promise resolving to the unwrapped response data
   */
  patch<TResponse, TBody = unknown>(
    url: string, 
    data?: TBody, 
    options?: ApiClientRequestOptions
  ): Promise<TResponse>

  /**
   * DELETE request with automatic data unwrapping
   * 
   * @template TResponse - The expected response data type
   * @param url - The endpoint URL (relative to baseURL)
   * @param options - Request configuration options
   * @returns Promise resolving to the unwrapped response data
   */
  delete<TResponse>(
    url: string, 
    options?: ApiClientRequestOptions
  ): Promise<TResponse>

  // =============================================================================
  // RAW RESPONSE METHODS (RETURNS FULL ApiResponse WITH METADATA)
  // =============================================================================

  /**
   * GET request returning full ApiResponse (for accessing metadata)
   * 
   * @template TResponse - The expected response data type
   * @param url - The endpoint URL (relative to baseURL)
   * @param options - Request configuration options (unwrap is ignored)
   * @returns Promise resolving to the full ApiResponse with metadata
   * 
   * @example
   * ```typescript
   * const response = await apiClient.getRaw<User[]>('/users')
   * console.log(response.meta.requestId)
   * console.log(response.meta.pagination)
   * const users = response.data
   * ```
   */
  getRaw<TResponse>(
    url: string, 
    options?: Omit<ApiClientRequestOptions, 'unwrap'>
  ): Promise<ApiResponse<TResponse>>

  /**
   * POST request returning full ApiResponse (for accessing metadata)
   * 
   * @template TResponse - The expected response data type
   * @template TBody - The request body type (optional, defaults to unknown)
   * @param url - The endpoint URL (relative to baseURL)
   * @param data - The request body data
   * @param options - Request configuration options (unwrap is ignored)
   * @returns Promise resolving to the full ApiResponse with metadata
   */
  postRaw<TResponse, TBody = unknown>(
    url: string, 
    data?: TBody, 
    options?: Omit<ApiClientRequestOptions, 'unwrap'>
  ): Promise<ApiResponse<TResponse>>

  /**
   * PUT request returning full ApiResponse (for accessing metadata)
   * 
   * @template TResponse - The expected response data type
   * @template TBody - The request body type (optional, defaults to unknown)
   * @param url - The endpoint URL (relative to baseURL)
   * @param data - The request body data
   * @param options - Request configuration options (unwrap is ignored)
   * @returns Promise resolving to the full ApiResponse with metadata
   */
  putRaw<TResponse, TBody = unknown>(
    url: string, 
    data?: TBody, 
    options?: Omit<ApiClientRequestOptions, 'unwrap'>
  ): Promise<ApiResponse<TResponse>>

  /**
   * PATCH request returning full ApiResponse (for accessing metadata)
   * 
   * @template TResponse - The expected response data type
   * @template TBody - The request body type (optional, defaults to unknown)
   * @param url - The endpoint URL (relative to baseURL)
   * @param data - The request body data
   * @param options - Request configuration options (unwrap is ignored)
   * @returns Promise resolving to the full ApiResponse with metadata
   */
  patchRaw<TResponse, TBody = unknown>(
    url: string, 
    data?: TBody, 
    options?: Omit<ApiClientRequestOptions, 'unwrap'>
  ): Promise<ApiResponse<TResponse>>

  /**
   * DELETE request returning full ApiResponse (for accessing metadata)
   * 
   * @template TResponse - The expected response data type
   * @param url - The endpoint URL (relative to baseURL)
   * @param options - Request configuration options (unwrap is ignored)
   * @returns Promise resolving to the full ApiResponse with metadata
   */
  deleteRaw<TResponse>(
    url: string, 
    options?: Omit<ApiClientRequestOptions, 'unwrap'>
  ): Promise<ApiResponse<TResponse>>

  // =============================================================================
  // TENANT MANAGEMENT METHODS
  // =============================================================================

  /**
   * Set the tenant slug for subsequent requests
   * 
   * @param tenantSlug - The tenant identifier
   * 
   * @example
   * ```typescript
   * apiClient.setTenant('my-restaurant')
   * const menu = await apiClient.get<MenuItem[]>('/menu') // Uses 'my-restaurant' tenant
   * ```
   */
  setTenant(tenantSlug: string): void

  /**
   * Get the current tenant slug
   * 
   * @returns The current tenant slug or empty string if not set
   */
  getCurrentTenant(): string

  /**
   * Clear the current tenant context
   */
  clearTenant(): void

  /**
   * Execute a request with a specific tenant override
   * 
   * @template T - The return type of the request function
   * @param tenantSlug - The tenant to use for this request
   * @param requestFn - Function that makes the API request
   * @returns Promise resolving to the request result
   * 
   * @example
   * ```typescript
   * const menu = await apiClient.withTenant('other-restaurant', (client) =>
   *   client.get<MenuItem[]>('/menu')
   * )
   * ```
   */
  withTenant<T>(
    tenantSlug: string,
    requestFn: (client: ApiClient) => Promise<T>
  ): Promise<T>

  /**
   * Execute a system-wide request bypassing tenant context
   * 
   * @template T - The return type of the request function
   * @param requestFn - Function that makes the API request
   * @returns Promise resolving to the request result
   * 
   * @example
   * ```typescript
   * const tenants = await apiClient.withoutTenant((client) =>
   *   client.get<TenantInfo[]>('/tenants')
   * )
   * ```
   */
  withoutTenant<T>(
    requestFn: (client: ApiClient) => Promise<T>
  ): Promise<T>

  // =============================================================================
  // STORE INTEGRATION METHODS
  // =============================================================================

  /**
   * Set the authentication token store for automatic token management
   * 
   * @param tokenStore - Store instance managing authentication tokens
   */
  setTokenStore(tokenStore: any): void

  /**
   * Set the error store for centralized error handling
   * 
   * @param errorStore - Store instance managing application errors
   */
  setErrorStore(errorStore: any): void

  /**
   * Set the tenant store for reactive tenant management
   * 
   * @param tenantStore - Store instance managing tenant context
   */
  setTenantStore(tenantStore: any): void

  /**
   * Handle token refresh for expired authentication
   * 
   * @returns Promise resolving to true if refresh was successful
   */
  handleTokenRefresh(): Promise<boolean>
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a new API client instance with the given configuration
 * 
 * @param config - API client configuration
 * @returns Configured API client instance
 * 
 * @example
 * ```typescript
 * const apiClient = createApiClient({
 *   baseURL: 'https://api.example.com',
 *   tenantSlug: 'my-tenant',
 *   timeout: 15000
 * })
 * ```
 */
export declare function createApiClient(config: ApiClientConfig): ApiClient

/**
 * Get the current API client instance
 * Throws an error if the client hasn't been initialized
 * 
 * @returns The current API client instance
 * @throws Error if API client is not initialized
 * 
 * @example
 * ```typescript
 * // In a composable or component
 * const apiClient = useApiClient()
 * const data = await apiClient.get<MyData>('/endpoint')
 * ```
 */
export declare function useApiClient(): ApiClient

// =============================================================================
// UTILITY TYPES FOR ADVANCED USAGE
// =============================================================================

/**
 * Extract the response type from an API client method
 * Useful for creating derived types
 */
export type ExtractApiClientResponse<T> = T extends (...args: any[]) => Promise<infer R> ? R : never

/**
 * Create a typed API client method signature
 * Useful for creating wrapper functions
 */
export type ApiClientMethod<TResponse, TBody = unknown> = TBody extends unknown
  ? (url: string, options?: ApiClientRequestOptions) => Promise<TResponse>
  : (url: string, data: TBody, options?: ApiClientRequestOptions) => Promise<TResponse>

/**
 * Type for API client methods that support request bodies
 */
export type ApiClientMethodWithBody<TResponse, TBody = unknown> = (
  url: string, 
  data?: TBody, 
  options?: ApiClientRequestOptions
) => Promise<TResponse>

/**
 * Type for API client methods that don't support request bodies
 */
export type ApiClientMethodWithoutBody<TResponse> = (
  url: string, 
  options?: ApiClientRequestOptions
) => Promise<TResponse>