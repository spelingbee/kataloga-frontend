/**
 * Type Guards for API Response Validation
 * 
 * This file contains type guards for validating API responses
 * and ensuring type safety throughout the application.
 * All responses are now expected to be in the standard ApiResponse format.
 * 
 * Requirements: 1.3
 */

import type { 
  ApiResponse, 
  ApiError, 
  ApiMeta, 
  PaginationMeta
} from '~/types/api';

// =============================================================================
// CORE TYPE GUARDS
// =============================================================================

/**
 * Enhanced type guard to check if an object is a valid ApiResponse
 * Performs comprehensive validation of all required fields
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid ApiResponse
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/users').then(r => r.json())
 * 
 * if (isApiResponse(response)) {
 *   // TypeScript now knows response is ApiResponse<any>
 *   console.log(response.meta.requestId)
 *   console.log(response.success)
 * }
 * ```
 * 
 * Requirements: 1.3
 */
export function isApiResponse(obj: any): obj is ApiResponse<any> {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check required top-level fields
  if (typeof obj.success !== 'boolean' ||
      typeof obj.statusCode !== 'number' ||
      !obj.hasOwnProperty('data') ||
      !obj.hasOwnProperty('error') ||
      !obj.hasOwnProperty('meta')) {
    return false;
  }

  // Validate meta object
  if (!isValidApiMeta(obj.meta)) {
    return false;
  }

  // Validate error object if present
  if (obj.error !== null && !isApiError(obj.error)) {
    return false;
  }

  // Additional validation: success and error should be mutually exclusive
  if (obj.success && obj.error !== null) {
    return false;
  }

  if (!obj.success && obj.error === null) {
    return false;
  }

  return true;
}

/**
 * Type guard to check if an object is a valid ApiMeta
 * 
 * @param obj - The object to validate
 * @returns True if the object is a valid ApiMeta
 * 
 * @example
 * ```typescript
 * if (isValidApiMeta(response.meta)) {
 *   // TypeScript knows meta has requestId, timestamp, etc.
 *   console.log(meta.requestId)
 * }
 * ```
 * 
 * Requirements: 1.3
 */
export function isValidApiMeta(obj: any): obj is ApiMeta {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof obj.requestId !== 'string' || 
      typeof obj.timestamp !== 'string') {
    return false;
  }

  // Validate optional fields if present
  if (obj.tenantId !== undefined && typeof obj.tenantId !== 'string') {
    return false;
  }

  if (obj.pagination !== undefined && !isValidPaginationMeta(obj.pagination)) {
    return false;
  }

  // Validate timestamp format (ISO 8601)
  const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!timestampRegex.test(obj.timestamp)) {
    return false;
  }

  return true;
}

/**
 * Type guard to check if an object is a valid PaginationMeta
 * 
 * Requirements: 1.3
 */
export function isValidPaginationMeta(obj: any): obj is PaginationMeta {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  return typeof obj.page === 'number' &&
         typeof obj.limit === 'number' &&
         typeof obj.totalItems === 'number' &&
         typeof obj.totalPages === 'number' &&
         obj.page > 0 &&
         obj.limit > 0 &&
         obj.totalItems >= 0 &&
         obj.totalPages >= 0 &&
         // Validate pagination logic
         obj.totalPages === Math.ceil(obj.totalItems / obj.limit);
}

/**
 * Type guard to check if an object is a valid ApiError
 * 
 * Requirements: 1.3
 */
export function isApiError(obj: any): obj is ApiError {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check required fields
  if (typeof obj.code !== 'string' || 
      typeof obj.message !== 'string') {
    return false;
  }

  // Validate optional details field
  if (obj.details !== undefined) {
    // Details can be an array of ApiErrorDetail or a generic object
    if (Array.isArray(obj.details)) {
      // Validate each detail if it's an array
      return obj.details.every((detail: any) => 
        detail &&
        typeof detail === 'object' &&
        typeof detail.field === 'string' &&
        typeof detail.message === 'string'
      );
    } else if (typeof obj.details !== 'object') {
      return false;
    }
  }

  return true;
}

/**
 * Type guard to check if an ApiResponse contains paginated data
 * 
 * Requirements: 1.3
 */
export function isPaginatedResponse<T>(obj: any): obj is ApiResponse<T[]> {
  if (!isApiResponse(obj)) {
    return false;
  }

  // Must have pagination metadata
  if (!obj.meta.pagination) {
    return false;
  }

  // Data should be an array for paginated responses
  if (!Array.isArray(obj.data)) {
    return false;
  }

  return true;
}

// =============================================================================
// UTILITY TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a response is successful
 * 
 * Requirements: 1.3
 */
export function isSuccessfulResponse(obj: any): boolean {
  if (isApiResponse(obj)) {
    return obj.success === true;
  }
  return false;
}

/**
 * Type guard to check if a response contains an error
 * 
 * Requirements: 1.3
 */
export function isErrorResponse(obj: any): boolean {
  if (isApiResponse(obj)) {
    return obj.success === false;
  }
  return false;
}

/**
 * Type guard to check if an object has pagination data
 * 
 * Requirements: 1.3
 */
export function hasPaginationData(obj: any): boolean {
  return isPaginatedResponse(obj);
}

/**
 * Validates that a response matches expected HTTP status code
 * 
 * Requirements: 1.3
 */
export function hasExpectedStatusCode(obj: any, expectedStatus: number): boolean {
  if (isApiResponse(obj)) {
    return obj.statusCode === expectedStatus;
  }
  return false;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates the structure of an API response and returns detailed error information
 * Useful for debugging and development
 * 
 * Requirements: 1.3
 */
export function validateApiResponseStructure(obj: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!obj) {
    errors.push('Response is null or undefined');
    return { isValid: false, errors, warnings };
  }

  if (typeof obj !== 'object') {
    errors.push('Response is not an object');
    return { isValid: false, errors, warnings };
  }

  // Validate as new format
  if (typeof obj.success !== 'boolean') {
    errors.push('Field "success" must be a boolean');
  }

  if (typeof obj.statusCode !== 'number') {
    errors.push('Field "statusCode" must be a number');
  }

  if (!obj.hasOwnProperty('data')) {
    errors.push('Field "data" is required');
  }

  if (!obj.hasOwnProperty('error')) {
    errors.push('Field "error" is required');
  }

  if (!obj.hasOwnProperty('meta')) {
    errors.push('Field "meta" is required');
  } else if (!isValidApiMeta(obj.meta)) {
    errors.push('Field "meta" has invalid structure');
  }

  if (obj.error !== null && !isApiError(obj.error)) {
    errors.push('Field "error" has invalid structure');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
