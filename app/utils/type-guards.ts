import type { ApiResponse } from '~/types'

/**
 * Type guard to check if a value is a valid ApiResponse object.
 * An object is considered an ApiResponse if it has a boolean 'success' property
 * and either a 'data' or 'error' property.
 *
 * @param value - The value to check.
 * @returns True if the value is an ApiResponse, false otherwise.
 */
export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return 'success' in value && typeof (value as any).success === 'boolean' && ('data' in value || 'error' in value)
}
