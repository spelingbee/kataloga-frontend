/**
 * Response Normalizer
 * 
 * This utility provides response normalization capabilities for the API client.
 * All responses are now expected to be in the standard ApiResponse format.
 */

import type { 
  ApiResponse, 
  ApiError, 
  ApiMeta
} from '~/types/api'

// =============================================================================
// RESPONSE UTILITIES
// =============================================================================

/**
 * Creates a success response for testing and utilities
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  tenantId?: string
): ApiResponse<T> {
  const meta: ApiMeta = {
    requestId: generateRequestId(),
    timestamp: new Date().toISOString(),
    tenantId,
  };

  return {
    success: true,
    statusCode,
    data,
    error: null,
    meta,
  };
}

/**
 * Creates an error response for testing and utilities
 */
export function createErrorResponse(
  error: ApiError,
  statusCode: number = 500,
  tenantId?: string
): ApiResponse<null> {
  const meta: ApiMeta = {
    requestId: generateRequestId(),
    timestamp: new Date().toISOString(),
    tenantId,
  };

  return {
    success: false,
    statusCode,
    data: null,
    error,
    meta,
  };
}

/**
 * Generates a request ID for responses
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `req-${timestamp}-${random}`;
}

/**
 * Checks if a response is in standard ApiResponse format
 */
export function isStandardApiResponse(obj: any): boolean {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.success === 'boolean' &&
         typeof obj.statusCode === 'number' &&
         obj.hasOwnProperty('data') &&
         obj.hasOwnProperty('error') &&
         obj.hasOwnProperty('meta') &&
         obj.meta &&
         typeof obj.meta.requestId === 'string';
}

/**
 * Extracts tenant information from response metadata
 */
export function extractTenantFromResponse(response: any): string | undefined {
  if (isStandardApiResponse(response) && response.meta.tenantId) {
    return response.meta.tenantId;
  }
  return undefined;
}
