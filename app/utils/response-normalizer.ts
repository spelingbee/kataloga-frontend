import type { ApiResponse, ApiError, ApiMeta } from '~/types'

/**
 * Creates a standardized success response object.
 *
 * @param data - The payload to include in the response.
 * @param meta - Optional metadata for the response.
 * @returns A successful ApiResponse object.
 */
export function createSuccessResponse<T>(data: T, meta?: Partial<ApiMeta>): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId: meta?.requestId || `req-${Date.now()}`,
      timestamp: meta?.timestamp || new Date().toISOString(),
      ...meta,
    },
  }
}

/**
 * Creates a standardized error response object.
 *
 * @param error - The error details.
 * @param statusCode - The HTTP status code to associate with the error.
 * @param meta - Optional metadata for the response.
 * @returns A failed ApiResponse object.
 */
export function createErrorResponse(error: ApiError, statusCode: number, meta?: Partial<ApiMeta>): ApiResponse<never> {
  return {
    success: false,
    error,
    meta: {
      requestId: meta?.requestId || `req-${Date.now()}`,
      timestamp: meta?.timestamp || new Date().toISOString(),
      ...meta,
    },
  }
}

/**
 * Type guard to check if a value is a standard ApiResponse object.
 *
 * @param value - The value to check.
 * @returns True if the value is an ApiResponse, false otherwise.
 */
export function isStandardApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const res = value as Record<string, unknown>
  return typeof res.success === 'boolean' && ('data' in res || 'error' in res) && 'meta' in res
}
