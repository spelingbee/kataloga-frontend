/**
 * Mock Factories for API Response Testing
 * 
 * This file provides factory functions to create mock API responses for testing.
 * These factories generate standardized ApiResponse objects that match the backend
 * structure, making it easy to test components, services, and stores.
 * 
 * @see apps/frontend/app/types/api.ts
 */

import type { 
  ApiResponse, 
  ApiError, 
  ApiErrorDetail, 
  ApiMeta, 
  PaginationMeta 
} from '~/types/api'

// =============================================================================
// CORE MOCK FACTORIES
// =============================================================================

/**
 * Creates a successful ApiResponse for testing
 * 
 * @template T The type of the data payload
 * @param data The data to include in the response
 * @param options Optional configuration for the response
 * @returns A mock ApiResponse with success: true
 * 
 * @example
 * ```typescript
 * const response = createMockSuccessResponse(['item1', 'item2'], {
 *   statusCode: 200,
 *   requestId: 'test-123'
 * })
 * ```
 */
export function createMockSuccessResponse<T>(
  data: T,
  options?: {
    statusCode?: number;
    requestId?: string;
    tenantId?: string;
    pagination?: Partial<PaginationMeta>;
    timestamp?: string;
  }
): ApiResponse<T> {
  const requestId = options?.requestId || `test-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const timestamp = options?.timestamp || new Date().toISOString()
  
  return {
    success: true,
    statusCode: options?.statusCode || 200,
    data,
    error: null,
    meta: {
      requestId,
      timestamp,
      tenantId: options?.tenantId,
      pagination: options?.pagination ? {
        page: 1,
        limit: 20,
        totalItems: 100,
        totalPages: 5,
        ...options.pagination
      } : undefined
    },
  }
}

/**
 * Creates an error ApiResponse for testing
 * 
 * @param code Machine-readable error code
 * @param message Human-readable error message
 * @param options Optional configuration for the error response
 * @returns A mock ApiResponse with success: false
 * 
 * @example
 * ```typescript
 * const response = createMockErrorResponse('USER_NOT_FOUND', 'User not found', {
 *   statusCode: 404,
 *   details: { userId: '123' }
 * })
 * ```
 */
export function createMockErrorResponse(
  code: string,
  message: string,
  options?: {
    statusCode?: number;
    details?: ApiErrorDetail[] | Record<string, any>;
    requestId?: string;
    tenantId?: string;
    timestamp?: string;
  }
): ApiResponse<null> {
  const requestId = options?.requestId || `test-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const timestamp = options?.timestamp || new Date().toISOString()
  
  return {
    success: false,
    statusCode: options?.statusCode ?? 400,
    data: null,
    error: {
      code,
      message,
      details: options?.details
    },
    meta: {
      requestId,
      timestamp,
      tenantId: options?.tenantId,
    },
  }
}

/**
 * Creates a paginated ApiResponse for testing
 * 
 * @template T The type of items in the array
 * @param items Array of items for the current page
 * @param pagination Pagination metadata (partial, will be filled with defaults)
 * @param options Optional configuration for the response
 * @returns A mock ApiResponse with pagination metadata
 * 
 * @example
 * ```typescript
 * const response = createMockPaginatedResponse(
 *   [{ id: 1, name: 'Item 1' }],
 *   { page: 2, totalItems: 50 }
 * )
 * ```
 */
export function createMockPaginatedResponse<T>(
  items: T[],
  pagination: Partial<PaginationMeta> = {},
  options?: {
    statusCode?: number;
    requestId?: string;
    tenantId?: string;
    timestamp?: string;
  }
): ApiResponse<T[]> {
  const page = pagination.page || 1
  const limit = pagination.limit || 20
  const totalItems = pagination.totalItems || items.length
  const totalPages = pagination.totalPages || Math.ceil(totalItems / limit)
  
  return createMockSuccessResponse(items, {
    ...options,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages
    }
  })
}

// =============================================================================
// SPECIALIZED MOCK FACTORIES
// =============================================================================

/**
 * Creates a validation error response for testing forms
 * 
 * @param fieldErrors Object mapping field names to error messages
 * @param options Optional configuration for the response
 * @returns A mock ApiResponse with VALIDATION_ERROR
 * 
 * @example
 * ```typescript
 * const response = createMockValidationError({
 *   email: 'Email is required',
 *   password: 'Password must be at least 8 characters'
 * })
 * ```
 */
export function createMockValidationError(
  fieldErrors: Record<string, string>,
  options?: {
    statusCode?: number;
    requestId?: string;
    tenantId?: string;
    timestamp?: string;
  }
): ApiResponse<null> {
  const details: ApiErrorDetail[] = Object.entries(fieldErrors).map(([field, message]) => ({
    field,
    message,
  }))
  
  return createMockErrorResponse('VALIDATION_ERROR', 'Validation failed', {
    statusCode: 422,
    details,
    ...options
  })
}

/**
 * Creates an authentication error response for testing auth flows
 * 
 * @param options Optional configuration for the response
 * @returns A mock ApiResponse with AUTH_REQUIRED error
 * 
 * @example
 * ```typescript
 * const response = createMockAuthError()
 * ```
 */
export function createMockAuthError(
  options?: {
    code?: 'AUTH_REQUIRED' | 'AUTHENTICATION_ERROR' | 'ACCESS_DENIED';
    message?: string;
    statusCode?: number;
    requestId?: string;
    tenantId?: string;
    timestamp?: string;
  }
): ApiResponse<null> {
  const code = options?.code || 'AUTH_REQUIRED'
  const message = options?.message || 'Authentication required'
  const statusCode = options?.statusCode || (code === 'ACCESS_DENIED' ? 403 : 401)
  
  return createMockErrorResponse(code, message, {
    statusCode,
    requestId: options?.requestId,
    tenantId: options?.tenantId,
    timestamp: options?.timestamp,
  })
}

/**
 * Creates a network error response for testing offline scenarios
 * 
 * @param options Optional configuration for the response
 * @returns A mock ApiResponse with NETWORK_ERROR
 * 
 * @example
 * ```typescript
 * const response = createMockNetworkError()
 * ```
 */
export function createMockNetworkError(
  options?: {
    message?: string;
    statusCode?: number;
    requestId?: string;
    timestamp?: string;
  }
): ApiResponse<null> {
  return createMockErrorResponse(
    'NETWORK_ERROR', 
    options?.message || 'Network connection failed',
    {
      statusCode: options?.statusCode ?? 0, // Network errors typically don't have HTTP status codes
      requestId: options?.requestId,
      timestamp: options?.timestamp,
    }
  )
}

/**
 * Creates a tenant-related error response for testing multi-tenant scenarios
 * 
 * @param options Optional configuration for the response
 * @returns A mock ApiResponse with tenant error
 * 
 * @example
 * ```typescript
 * const response = createMockTenantError('TENANT_NOT_FOUND', 'test-tenant')
 * ```
 */
export function createMockTenantError(
  code: 'TENANT_NOT_FOUND' | 'TENANT_INACTIVE' | 'TENANT_ACCESS_DENIED' = 'TENANT_NOT_FOUND',
  tenantId?: string,
  options?: {
    message?: string;
    statusCode?: number;
    requestId?: string;
    timestamp?: string;
  }
): ApiResponse<null> {
  const messages = {
    TENANT_NOT_FOUND: 'Tenant not found',
    TENANT_INACTIVE: 'Tenant is inactive',
    TENANT_ACCESS_DENIED: 'Access denied for tenant'
  }
  
  const statusCodes = {
    TENANT_NOT_FOUND: 404,
    TENANT_INACTIVE: 403,
    TENANT_ACCESS_DENIED: 403
  }
  
  return createMockErrorResponse(code, options?.message || messages[code], {
    statusCode: options?.statusCode || statusCodes[code],
    requestId: options?.requestId,
    tenantId,
    timestamp: options?.timestamp,
  })
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a mock ApiMeta object for testing
 * 
 * @param options Optional configuration for the metadata
 * @returns A mock ApiMeta object
 */
export function createMockApiMeta(
  options?: {
    requestId?: string;
    timestamp?: string;
    tenantId?: string;
    pagination?: PaginationMeta;
  }
): ApiMeta {
  return {
    requestId: options?.requestId || `test-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: options?.timestamp || new Date().toISOString(),
    tenantId: options?.tenantId,
    pagination: options?.pagination,
  }
}

/**
 * Creates a mock PaginationMeta object for testing
 * 
 * @param options Optional configuration for pagination
 * @returns A mock PaginationMeta object
 */
export function createMockPaginationMeta(
  options?: Partial<PaginationMeta>
): PaginationMeta {
  const page = options?.page || 1
  const limit = options?.limit || 20
  const totalItems = options?.totalItems || 100
  const totalPages = options?.totalPages || Math.ceil(totalItems / limit)
  
  return {
    page,
    limit,
    totalItems,
    totalPages
  }
}

/**
 * Creates a mock ApiError object for testing
 * 
 * @param code Error code
 * @param message Error message
 * @param details Optional error details
 * @returns A mock ApiError object
 */
export function createMockApiError(
  code: string,
  message: string,
  details?: ApiErrorDetail[] | Record<string, any>
): ApiError {
  return {
    code,
    message,
    details
  }
}

// =============================================================================
// BATCH CREATION UTILITIES
// =============================================================================

/**
 * Creates multiple mock success responses for batch testing
 * 
 * @template T The type of the data payload
 * @param dataArray Array of data objects to create responses for
 * @param options Optional configuration applied to all responses
 * @returns Array of mock ApiResponse objects
 */
export function createMockSuccessResponseBatch<T>(
  dataArray: T[],
  options?: {
    statusCode?: number;
    tenantId?: string;
    baseRequestId?: string;
  }
): ApiResponse<T>[] {
  return dataArray.map((data, index) => 
    createMockSuccessResponse(data, {
      ...options,
      requestId: options?.baseRequestId ? `${options.baseRequestId}-${index}` : undefined
    })
  )
}

/**
 * Creates multiple mock error responses for batch testing
 * 
 * @param errors Array of error configurations
 * @param options Optional configuration applied to all responses
 * @returns Array of mock error ApiResponse objects
 */
export function createMockErrorResponseBatch(
  errors: Array<{ code: string; message: string; details?: any }>,
  options?: {
    statusCode?: number;
    tenantId?: string;
    baseRequestId?: string;
  }
): ApiResponse<null>[] {
  return errors.map((error, index) => 
    createMockErrorResponse(error.code, error.message, {
      ...options,
      details: error.details,
      requestId: options?.baseRequestId ? `${options.baseRequestId}-${index}` : undefined
    })
  )
}