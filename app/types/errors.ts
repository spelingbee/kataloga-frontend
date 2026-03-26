/**
 * Type-Safe Error Handling System
 * 
 * This file provides comprehensive error type definitions and utilities for safe error handling:
 * - Result<T, E> type for functional error handling
 * - Specific error classes (NetworkError, ValidationError, etc.)
 * - safeApiCall function with proper error handling
 * - Error handling utilities and type guards
 * - Development vs production error handling
 * 
 * Requirements: 1.2 - КОГДА разработчик использует методы $apiClient, ТО система ДОЛЖНА обеспечить типобезопасность всех вызовов API
 * 
 * @module types/errors
 */

import type { ApiError, ApiErrorDetail, ErrorCodes } from './api'

// =============================================================================
// RESULT TYPE FOR FUNCTIONAL ERROR HANDLING
// =============================================================================

/**
 * Result type for safe error handling without exceptions
 * Represents either a successful result with data or a failure with error
 * 
 * @template T - The success data type
 * @template E - The error type (defaults to AppError)
 * 
 * @example
 * ```typescript
 * // Function that returns Result instead of throwing
 * async function fetchUser(id: string): Promise<Result<User, ApiError>> {
 *   return safeApiCall(() => apiClient.get<User>(`/users/${id}`))
 * }
 * 
 * // Usage with pattern matching
 * const result = await fetchUser('123')
 * if (result.success) {
 *   console.log('User:', result.data) // TypeScript knows this is User
 * } else {
 *   console.error('Error:', result.error) // TypeScript knows this is ApiError
 * }
 * ```
 */
export type Result<T, E = AppError> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E }

/**
 * Async Result type for promises that return Result
 */
export type AsyncResult<T, E = AppError> = Promise<Result<T, E>>

// =============================================================================
// ERROR CLASS HIERARCHY
// =============================================================================

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public override readonly name: string
  public readonly code: string
  public readonly timestamp: string
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.timestamp = new Date().toISOString()
    this.context = context

    // Maintain proper stack trace for V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    }
  }

  /**
   * Create error with additional context
   */
  withContext(context: Record<string, any>): AppError {
    return new AppError(this.message, this.code, { ...this.context, ...context })
  }
}

/**
 * Network-related errors (connection issues, timeouts, etc.)
 */
export class NetworkError extends AppError {
  public readonly status?: number
  public readonly url?: string
  public readonly method?: string

  constructor(
    message: string,
    options: {
      status?: number
      url?: string
      method?: string
      code?: string
      context?: Record<string, any>
    } = {}
  ) {
    super(message, options.code || 'NETWORK_ERROR', options.context)
    this.status = options.status
    this.url = options.url
    this.method = options.method
  }

  /**
   * Check if this is a timeout error
   */
  isTimeout(): boolean {
    return this.code === 'TIMEOUT_ERROR' || this.message.toLowerCase().includes('timeout')
  }

  /**
   * Check if this is a connection error
   */
  isConnectionError(): boolean {
    return this.code === 'NETWORK_ERROR' || 
           this.message.toLowerCase().includes('network') ||
           this.message.toLowerCase().includes('connection')
  }

  /**
   * Check if this error is retryable
   */
  isRetryable(): boolean {
    // Timeout and connection errors are generally retryable
    if (this.isTimeout() || this.isConnectionError()) {
      return true
    }

    // 5xx server errors are retryable
    if (this.status && this.status >= 500) {
      return true
    }

    // 429 (Too Many Requests) is retryable
    if (this.status === 429) {
      return true
    }

    // 4xx client errors are generally not retryable
    if (this.status && this.status >= 400 && this.status < 500) {
      return false
    }

    return true
  }
}

/**
 * Validation errors with field-level details
 */
export class ValidationError extends AppError {
  public readonly details: ValidationErrorDetail[]

  constructor(
    message: string,
    details: ValidationErrorDetail[] = [],
    context?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', context)
    this.details = details
  }

  /**
   * Get validation errors as a field map
   */
  getFieldErrors(): Record<string, string> {
    const fieldErrors: Record<string, string> = {}
    for (const detail of this.details) {
      fieldErrors[detail.field] = detail.message
    }
    return fieldErrors
  }

  /**
   * Check if a specific field has an error
   */
  hasFieldError(field: string): boolean {
    return this.details.some(detail => detail.field === field)
  }

  /**
   * Get error message for a specific field
   */
  getFieldError(field: string): string | undefined {
    const detail = this.details.find(d => d.field === field)
    return detail?.message
  }

  /**
   * Add a field error
   */
  addFieldError(field: string, message: string, value?: any): ValidationError {
    const newDetails = [...this.details, { field, message, value }]
    return new ValidationError(this.message, newDetails, this.context)
  }
}

/**
 * Validation error detail for field-level errors
 */
export interface ValidationErrorDetail {
  /** The field name that failed validation */
  field: string
  /** Human-readable error message for this field */
  message: string
  /** The value that failed validation (optional) */
  value?: any
}

/**
 * Authentication and authorization errors
 */
export class AuthError extends AppError {
  public readonly authType: 'authentication' | 'authorization'
  public readonly requiredRole?: string
  public readonly currentRole?: string

  constructor(
    message: string,
    authType: 'authentication' | 'authorization',
    options: {
      code?: string
      requiredRole?: string
      currentRole?: string
      context?: Record<string, any>
    } = {}
  ) {
    const defaultCode = authType === 'authentication' ? 'AUTHENTICATION_ERROR' : 'AUTHORIZATION_ERROR'
    super(message, options.code || defaultCode, options.context)
    this.authType = authType
    this.requiredRole = options.requiredRole
    this.currentRole = options.currentRole
  }

  /**
   * Check if this is an authentication error (user not logged in)
   */
  isAuthenticationError(): boolean {
    return this.authType === 'authentication'
  }

  /**
   * Check if this is an authorization error (user lacks permissions)
   */
  isAuthorizationError(): boolean {
    return this.authType === 'authorization'
  }
}

/**
 * Business logic errors (domain-specific validation failures)
 */
export class BusinessError extends AppError {
  public readonly businessRule: string
  public readonly entityType?: string
  public readonly entityId?: string

  constructor(
    message: string,
    businessRule: string,
    options: {
      code?: string
      entityType?: string
      entityId?: string
      context?: Record<string, any>
    } = {}
  ) {
    super(message, options.code || 'BUSINESS_RULE_VIOLATION', options.context)
    this.businessRule = businessRule
    this.entityType = options.entityType
    this.entityId = options.entityId
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  public readonly resourceType: string
  public readonly resourceId?: string

  constructor(
    resourceType: string,
    resourceId?: string,
    message?: string,
    context?: Record<string, any>
  ) {
    const defaultMessage = resourceId 
      ? `${resourceType} with ID '${resourceId}' not found`
      : `${resourceType} not found`
    
    super(message || defaultMessage, 'RESOURCE_NOT_FOUND', context)
    this.resourceType = resourceType
    this.resourceId = resourceId
  }
}

/**
 * Tenant-related errors
 */
export class TenantApiError extends AppError {
  public readonly tenantId?: string
  public readonly tenantSlug?: string

  constructor(
    message: string,
    options: {
      code?: string
      tenantId?: string
      tenantSlug?: string
      context?: Record<string, any>
    } = {}
  ) {
    super(message, options.code || 'TENANT_ERROR', options.context)
    this.tenantId = options.tenantId
    this.tenantSlug = options.tenantSlug
  }
}

// =============================================================================
// SAFE API CALL FUNCTION
// =============================================================================

/**
 * Configuration for safeApiCall function
 */
export interface SafeApiCallOptions {
  /** Custom error message for unexpected errors */
  fallbackMessage?: string
  /** Whether to log errors to console (default: true in development) */
  logErrors?: boolean
  /** Whether to report errors to monitoring service (default: true) */
  reportErrors?: boolean
  /** Additional context for error reporting */
  context?: Record<string, any>
  /** Transform function for custom error handling */
  errorTransform?: (error: any) => AppError
}

/**
 * Safe API call wrapper that returns Result instead of throwing exceptions
 * Provides comprehensive error handling with proper type safety
 * 
 * @template T - The expected success data type
 * @param apiCall - The API call function to execute
 * @param options - Configuration options for error handling
 * @returns Promise<Result<T, AppError>> - Result with success data or error
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const result = await safeApiCall(() => 
 *   apiClient.get<User[]>('/users')
 * )
 * 
 * if (result.success) {
 *   console.log('Users:', result.data)
 * } else {
 *   console.error('Error:', result.error.message)
 * }
 * 
 * // With custom error handling
 * const result = await safeApiCall(
 *   () => apiClient.post<Order>('/orders', orderData),
 *   {
 *     fallbackMessage: 'Failed to create order',
 *     context: { orderId: orderData.id },
 *     errorTransform: (error) => {
 *       if (error.status === 409) {
 *         return new BusinessError('Order already exists', 'DUPLICATE_ORDER')
 *       }
 *       return createAppErrorFromApiError(error)
 *     }
 *   }
 * )
 * ```
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: SafeApiCallOptions = {}
): Promise<Result<T, AppError>> {
  const {
    fallbackMessage = 'An unexpected error occurred',
    logErrors = process.env.NODE_ENV === 'development',
    reportErrors = true,
    context = {},
    errorTransform
  } = options

  try {
    const data = await apiCall()
    return { success: true, data }
  } catch (error) {
    // Transform error using custom function or default transformation
    const appError = errorTransform 
      ? errorTransform(error)
      : createAppErrorFromApiError(error, fallbackMessage, context)

    // Log error in development or when explicitly requested
    if (logErrors) {
      console.error('API call failed:', {
        error: appError.toJSON(),
        context,
        originalError: error
      })
    }

    // Report error to monitoring service
    if (reportErrors) {
      try {
        await reportError(appError, context)
      } catch (reportingError) {
        // Don't let error reporting failures break the application
        if (logErrors) {
          console.warn('Failed to report error:', reportingError)
        }
      }
    }

    return { success: false, error: appError }
  }
}

/**
 * Batch version of safeApiCall for multiple API calls
 * Returns results for all calls, with individual success/failure status
 * 
 * @template T - The expected success data type
 * @param apiCalls - Array of API call functions to execute
 * @param options - Configuration options for error handling
 * @returns Promise<Result<T, AppError>[]> - Array of results
 * 
 * @example
 * ```typescript
 * const results = await safeBatchApiCall([
 *   () => apiClient.get<User>('/users/1'),
 *   () => apiClient.get<User>('/users/2'),
 *   () => apiClient.get<User>('/users/3')
 * ])
 * 
 * const successfulUsers = results
 *   .filter(result => result.success)
 *   .map(result => result.data)
 * 
 * const errors = results
 *   .filter(result => !result.success)
 *   .map(result => result.error)
 * ```
 */
export async function safeBatchApiCall<T>(
  apiCalls: (() => Promise<T>)[],
  options: SafeApiCallOptions = {}
): Promise<Result<T, AppError>[]> {
  const promises = apiCalls.map(apiCall => safeApiCall(apiCall, options))
  return Promise.all(promises)
}

// =============================================================================
// ERROR TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Create AppError from various error types
 * Handles API errors, network errors, and unexpected errors
 */
export function createAppErrorFromApiError(
  error: any,
  fallbackMessage: string = 'An unexpected error occurred',
  context: Record<string, any> = {}
): AppError {
  // Handle null/undefined errors
  if (error == null) {
    return new AppError(fallbackMessage, 'UNEXPECTED_ERROR', context)
  }

  // Handle network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError('Network connection failed', {
      code: 'NETWORK_ERROR',
      context: { ...context, originalError: error.message }
    })
  }

  // Handle timeout errors
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return new NetworkError('Request timeout', {
      code: 'TIMEOUT_ERROR',
      context: { ...context, originalError: error.message }
    })
  }

  // Handle API errors with structured response
  if (isApiErrorResponse(error)) {
    return createAppErrorFromApiResponse(error, context)
  }

  // Handle HTTP errors with status codes
  if (error.status || error.response?.status) {
    const status = error.status || error.response?.status
    const message = error.message || error.response?.data?.message || fallbackMessage
    
    return new NetworkError(message, {
      status,
      code: getErrorCodeFromStatus(status),
      context: { ...context, originalError: error }
    })
  }

  // Handle validation errors
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
    const details = extractValidationDetails(error)
    return new ValidationError(
      error.message || 'Validation failed',
      details,
      context
    )
  }

  // Handle authentication/authorization errors
  if (isAuthError(error)) {
    const authType = error.status === 401 ? 'authentication' : 'authorization'
    return new AuthError(
      error.message || (authType === 'authentication' ? 'Authentication required' : 'Access denied'),
      authType,
      {
        code: error.code,
        context: { ...context, originalError: error }
      }
    )
  }

  // Handle business logic errors
  if (error.code === 'BUSINESS_RULE_VIOLATION') {
    return new BusinessError(
      error.message || 'Business rule violation',
      error.businessRule || 'UNKNOWN_RULE',
      {
        code: error.code,
        context: { ...context, originalError: error }
      }
    )
  }

  // Handle not found errors
  if (error.status === 404 || error.code === 'NOT_FOUND') {
    return new NotFoundError(
      error.resourceType || 'Resource',
      error.resourceId,
      error.message,
      context
    )
  }

  // Handle tenant errors
  if (error.code?.startsWith('TENANT_')) {
    return new TenantApiError(
      error.message || 'Tenant error',
      {
        code: error.code,
        tenantId: error.tenantId,
        tenantSlug: error.tenantSlug,
        context: { ...context, originalError: error }
      }
    )
  }

  // Fallback for unexpected errors
  if (process.env.NODE_ENV === 'development') {
    // In development, preserve original error for debugging
    console.error('Unexpected error in safeApiCall:', error)
    return new AppError(
      error.message || fallbackMessage,
      'UNEXPECTED_ERROR',
      { ...context, originalError: error, stack: error.stack }
    )
  }

  // In production, return generic error to avoid leaking sensitive information
  return new AppError(fallbackMessage, 'UNEXPECTED_ERROR', context)
}

/**
 * Create AppError from structured API error response
 */
function createAppErrorFromApiResponse(apiError: ApiError, context: Record<string, any> = {}): AppError {
  const { code, message, status, details } = apiError

  // Handle validation errors
  if (code === 'VALIDATION_ERROR' && Array.isArray(details)) {
    const validationDetails = details.map(detail => ({
      field: detail.field || 'unknown',
      message: detail.message || 'Invalid value',
      value: detail.value
    }))
    return new ValidationError(message, validationDetails, context)
  }

  // Handle authentication/authorization errors
  if (code === 'AUTHENTICATION_ERROR' || status === 401) {
    return new AuthError(message, 'authentication', { code, context })
  }

  if (code === 'AUTHORIZATION_ERROR' || code === 'ACCESS_DENIED' || status === 403) {
    return new AuthError(message, 'authorization', { code, context })
  }

  // Handle not found errors
  if (code === 'NOT_FOUND' || code === 'RESOURCE_NOT_FOUND' || status === 404) {
    return new NotFoundError('Resource', undefined, message, context)
  }

  // Handle business rule violations
  if (code === 'BUSINESS_RULE_VIOLATION') {
    return new BusinessError(message, 'UNKNOWN_RULE', { code, context })
  }

  // Handle tenant errors
  if (code?.startsWith('TENANT_')) {
    return new TenantApiError(message, { code, context })
  }

  // Handle network errors
  if (code === 'NETWORK_ERROR' || code === 'TIMEOUT_ERROR') {
    return new NetworkError(message, { code, status, context })
  }

  // Default to generic AppError
  return new AppError(message, code || 'API_ERROR', context)
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if error is an API error response
 */
function isApiErrorResponse(error: any): error is ApiError {
  return error && 
         typeof error === 'object' && 
         typeof error.code === 'string' && 
         typeof error.message === 'string'
}

/**
 * Type guard to check if error is an authentication/authorization error
 */
function isAuthError(error: any): boolean {
  return error.status === 401 || 
         error.status === 403 || 
         error.code === 'AUTHENTICATION_ERROR' || 
         error.code === 'AUTHORIZATION_ERROR' || 
         error.code === 'ACCESS_DENIED'
}

/**
 * Extract validation details from various error formats
 */
function extractValidationDetails(error: any): ValidationErrorDetail[] {
  if (Array.isArray(error.details)) {
    return error.details.map((detail: any) => ({
      field: detail.field || 'unknown',
      message: detail.message || 'Invalid value',
      value: detail.value
    }))
  }

  if (error.details && typeof error.details === 'object') {
    return Object.entries(error.details).map(([field, message]) => ({
      field,
      message: String(message),
      value: undefined
    }))
  }

  return []
}

/**
 * Get error code from HTTP status code
 */
function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST'
    case 401: return 'AUTHENTICATION_ERROR'
    case 403: return 'AUTHORIZATION_ERROR'
    case 404: return 'NOT_FOUND'
    case 408: return 'TIMEOUT_ERROR'
    case 409: return 'CONFLICT'
    case 422: return 'VALIDATION_ERROR'
    case 429: return 'RATE_LIMIT_EXCEEDED'
    case 500: return 'SERVER_ERROR'
    case 502: return 'BAD_GATEWAY'
    case 503: return 'SERVICE_UNAVAILABLE'
    case 504: return 'GATEWAY_TIMEOUT'
    default: return 'HTTP_ERROR'
  }
}

/**
 * Report error to monitoring service
 * This is a placeholder - integrate with your actual error reporting service
 */
async function reportError(error: AppError, context: Record<string, any> = {}): Promise<void> {
  // In a real application, this would integrate with services like:
  // - Sentry
  // - LogRocket
  // - Bugsnag
  // - Custom error reporting API
  
  const errorReport = {
    ...error.toJSON(),
    context,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString()
  }

  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('Error reported:', errorReport)
  }

  // TODO: Integrate with actual error reporting service
  // Example:
  // await fetch('/api/errors', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(errorReport)
  // })
}

// =============================================================================
// RESULT UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a successful Result
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data }
}

/**
 * Create a failed Result
 */
export function failure<E extends AppError>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Check if Result is successful
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success
}

/**
 * Check if Result is a failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success
}

/**
 * Map over successful Result data
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  mapper: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return { success: true, data: mapper(result.data) }
  }
  return result
}

/**
 * Chain Result operations (flatMap)
 */
export function chainResult<T, U, E>(
  result: Result<T, E>,
  mapper: (data: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return mapper(result.data)
  }
  return result
}

/**
 * Map over Result error
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  mapper: (error: E) => F
): Result<T, F> {
  if (result.success) {
    return result
  }
  return { success: false, error: mapper(result.error) }
}

/**
 * Get data from Result or return default value
 */
export function getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue
}

/**
 * Get data from Result or throw error
 */
export function getOrThrow<T, E extends Error>(result: Result<T, E>): T {
  if (result.success) {
    return result.data
  }
  throw result.error
}

/**
 * Combine multiple Results into a single Result with array of data
 * Fails if any Result fails
 */
export function combineResults<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const data: T[] = []
  
  for (const result of results) {
    if (!result.success) {
      return result
    }
    data.push(result.data)
  }
  
  return { success: true, data }
}

/**
 * Convert Promise to Result (catches exceptions)
 */
export async function promiseToResult<T>(
  promise: Promise<T>,
  errorTransform?: (error: any) => AppError
): Promise<Result<T, AppError>> {
  try {
    const data = await promise
    return { success: true, data }
  } catch (error) {
    const appError = errorTransform 
      ? errorTransform(error)
      : createAppErrorFromApiError(error)
    return { success: false, error: appError }
  }
}

// Note: All exports are done inline above, no need for duplicate export statements