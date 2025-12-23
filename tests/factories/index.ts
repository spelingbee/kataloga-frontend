/**
 * Test Factories Index
 * 
 * This file exports all test factory functions for easy importing
 * throughout the test suite.
 */

// API Response Factories
export {
  createMockSuccessResponse,
  createMockErrorResponse,
  createMockPaginatedResponse,
  createMockValidationError,
  createMockAuthError,
  createMockNetworkError,
  createMockTenantError,
  createMockApiMeta,
  createMockPaginationMeta,
  createMockApiError,
  createMockSuccessResponseBatch,
  createMockErrorResponseBatch
} from './api-response.factory'

// Re-export types for convenience
export type {
  ApiResponse,
  ApiError,
  ApiErrorDetail,
  ApiMeta,
  PaginationMeta,
  PaginatedResult
} from '~/types/api'