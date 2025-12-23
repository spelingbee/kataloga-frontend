/**
 * API Types for Frontend Application
 * 
 * This file contains all API-related types that align exactly with the backend
 * ApiResponseDto structure. These types are used throughout the application
 * for type-safe API communication.
 * 
 * @see apps/backend/src/common/dto/api-response.dto.ts
 */

// =============================================================================
// CORE API RESPONSE TYPES (EXACT BACKEND ALIGNMENT)
// =============================================================================

/**
 * Structured validation error detail for field-level validation errors
 * Matches ValidationErrorDetail from backend
 */
export interface ApiErrorDetail {
  /** The field name that failed validation */
  field: string;
  /** Human-readable error message for this field */
  message: string;
  /** The value that failed validation (optional) */
  value?: any;
}

/**
 * Standard error object for API responses
 * Matches ApiErrorDto from backend
 */
export interface ApiError {
  /** Machine-readable error code (e.g., "USER_NOT_FOUND", "VALIDATION_ERROR") */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details (validation errors or supplementary information) */
  details?: ApiErrorDetail[] | Record<string, any>;
}

/**
 * Standardized pagination metadata for API responses
 * Matches ApiPaginationMetaDto from backend
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Metadata object containing request tracking and pagination information
 * Matches ApiMetaDto from backend
 */
export interface ApiMeta {
  /** Unique request identifier for tracing and debugging */
  requestId: string;
  /** ISO 8601 timestamp when the response was generated */
  timestamp: string;
  /** Tenant identifier for multi-tenant requests */
  tenantId?: string;
  /** Pagination metadata (only present for paginated responses) */
  pagination?: PaginationMeta;
}

/**
 * Standard API response wrapper for all endpoints
 * Matches ApiResponseDto from backend
 * @template T The type of the data payload
 */
export interface ApiResponse<T = any> {
  /** Indicates whether the operation was successful */
  success: boolean;
  /** HTTP status code (duplicated from HTTP header for convenience) */
  statusCode: number;
  /** Response payload data (null if no data or error occurred) */
  data: T | null;
  /** Error information (null if operation was successful) */
  error: ApiError | null;
  /** Response metadata including request ID, timestamp, and optional pagination */
  meta: ApiMeta;
}

// =============================================================================
// INTERNAL APPLICATION TYPES (VIEW MODELS)
// =============================================================================

/**
 * Result returned by services for paginated lists
 * Combines data and pagination metadata for easier component consumption
 */
export interface PaginatedResult<T> {
  /** Array of items for the current page */
  items: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Configuration options for API requests
 */
export interface RequestOptions {
  /** Whether to automatically unwrap data from ApiResponse (default: true) */
  unwrap?: boolean;
  /** Skip global error handling and let component handle errors */
  skipErrorHandling?: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts for failed requests */
  retries?: number;
  /** Bypass tenant context for system-wide requests */
  bypassTenant?: boolean;
  /** Override current tenant for specific requests */
  targetTenant?: string;
  /** Additional HTTP headers */
  headers?: Record<string, string>;
  /** Query parameters */
  params?: Record<string, any>;
}

// =============================================================================
// ERROR CODES (ALIGNMENT WITH BACKEND)
// =============================================================================

/**
 * Standard error codes used throughout the application
 * Must match backend error codes for proper handling
 */
export enum ErrorCodes {
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Authentication and Authorization
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Network and Server
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Tenants
  TENANT_ERROR = 'TENANT_ERROR',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  TENANT_INACTIVE = 'TENANT_INACTIVE',
  TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
}

/**
 * Mapping of error codes to localization keys
 * Used by error handlers to display appropriate messages
 */
export const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCodes.VALIDATION_ERROR]: 'errors.validation',
  [ErrorCodes.AUTHENTICATION_ERROR]: 'errors.authentication',
  [ErrorCodes.AUTH_REQUIRED]: 'errors.authRequired',
  [ErrorCodes.AUTHORIZATION_ERROR]: 'errors.authorization',
  [ErrorCodes.ACCESS_DENIED]: 'errors.accessDenied',
  [ErrorCodes.NOT_FOUND]: 'errors.notFound',
  [ErrorCodes.RESOURCE_NOT_FOUND]: 'errors.resourceNotFound',
  [ErrorCodes.NETWORK_ERROR]: 'errors.network',
  [ErrorCodes.SERVER_ERROR]: 'errors.server',
  [ErrorCodes.TIMEOUT_ERROR]: 'errors.timeout',
  [ErrorCodes.TENANT_ERROR]: 'errors.tenant',
  [ErrorCodes.TENANT_NOT_FOUND]: 'errors.tenantNotFound',
  [ErrorCodes.TENANT_INACTIVE]: 'errors.tenantInactive',
  [ErrorCodes.TENANT_ACCESS_DENIED]: 'errors.tenantAccessDenied',
  [ErrorCodes.BUSINESS_RULE_VIOLATION]: 'errors.businessRule',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'errors.insufficientPermissions',
};

// =============================================================================
// TYPE GUARDS
// =============================================================================

// Import enhanced type guards from utilities
export { 
  isApiResponse,
  isPaginatedResponse,
  isApiError,
  isValidApiMeta,
  isValidPaginationMeta,
  isSuccessfulResponse,
  isErrorResponse,
  hasPaginationData,
  hasExpectedStatusCode,
  validateApiResponseStructure
} from '~/utils/type-guards';

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract the data type from an ApiResponse
 */
export type ExtractApiResponseData<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * Make an ApiResponse type with specific data type
 */
export type ApiResponseOf<T> = ApiResponse<T>;

/**
 * Make a PaginatedResult type with specific item type
 */
export type PaginatedResultOf<T> = PaginatedResult<T>;