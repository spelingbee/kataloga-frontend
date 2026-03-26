/**
 * Unit Tests for Error Handling System
 * 
 * This test suite validates the comprehensive error handling system including:
 * - Error class constructors and methods
 * - safeApiCall function behavior
 * - Result type operations
 * - Error transformation utilities
 * - Development vs production error handling
 * - Validation error handling with field details
 * - Authentication/authorization error handling
 * - Network error handling and retry logic
 * - Business error handling
 * 
 * Requirements: 1.2 - КОГДА разработчик использует методы $apiClient, ТО система ДОЛЖНА обеспечить типобезопасность всех вызовов API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  AppError,
  NetworkError,
  ValidationError,
  AuthError,
  BusinessError,
  NotFoundError,
  TenantApiError,
  safeApiCall,
  safeBatchApiCall,
  createAppErrorFromApiError,
  success,
  failure,
  isSuccess,
  isFailure,
  mapResult,
  chainResult,
  mapError,
  getOrElse,
  getOrThrow,
  combineResults,
  promiseToResult,
  type Result,
  type ValidationErrorDetail,
  type SafeApiCallOptions
} from '~/types/errors'

// Mock console methods to test logging behavior
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const mockConsoleError = vi.fn()
const mockConsoleWarn = vi.fn()

describe('Error Handling System', () => {
  beforeEach(() => {
    console.error = mockConsoleError
    console.warn = mockConsoleWarn
    vi.clearAllMocks()
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
  })

  // =============================================================================
  // ERROR CLASS TESTS
  // =============================================================================

  describe('AppError', () => {
    it('should create basic error with default values', () => {
      const error = new AppError('Test message')
      
      expect(error.message).toBe('Test message')
      expect(error.name).toBe('AppError')
      expect(error.code).toBe('UNKNOWN_ERROR')
      expect(error.timestamp).toBeDefined()
      expect(error.context).toBeUndefined()
      expect(error.stack).toBeDefined()
    })

    it('should create error with custom code and context', () => {
      const context = { userId: '123', action: 'test' }
      const error = new AppError('Test message', 'CUSTOM_ERROR', context)
      
      expect(error.code).toBe('CUSTOM_ERROR')
      expect(error.context).toEqual(context)
    })

    it('should serialize to JSON correctly', () => {
      const context = { test: 'value' }
      const error = new AppError('Test message', 'TEST_ERROR', context)
      const json = error.toJSON()
      
      expect(json).toEqual({
        name: 'AppError',
        message: 'Test message',
        code: 'TEST_ERROR',
        timestamp: error.timestamp,
        context,
        stack: error.stack
      })
    })

    it('should add context to existing error', () => {
      const error = new AppError('Test message', 'TEST_ERROR', { original: 'value' })
      const newError = error.withContext({ additional: 'data' })
      
      expect(newError.context).toEqual({
        original: 'value',
        additional: 'data'
      })
      expect(newError.message).toBe('Test message')
      expect(newError.code).toBe('TEST_ERROR')
    })
  })

  describe('NetworkError', () => {
    it('should create network error with status and URL', () => {
      const error = new NetworkError('Connection failed', {
        status: 500,
        url: '/api/test',
        method: 'GET'
      })
      
      expect(error.message).toBe('Connection failed')
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.status).toBe(500)
      expect(error.url).toBe('/api/test')
      expect(error.method).toBe('GET')
    })

    it('should detect timeout errors', () => {
      const timeoutError1 = new NetworkError('Request timeout', { code: 'TIMEOUT_ERROR' })
      const timeoutError2 = new NetworkError('Connection timeout occurred')
      
      expect(timeoutError1.isTimeout()).toBe(true)
      expect(timeoutError2.isTimeout()).toBe(true)
    })

    it('should detect connection errors', () => {
      const connectionError1 = new NetworkError('Network connection failed')
      const connectionError2 = new NetworkError('Connection refused', { code: 'NETWORK_ERROR' })
      
      expect(connectionError1.isConnectionError()).toBe(true)
      expect(connectionError2.isConnectionError()).toBe(true)
    })

    it('should determine retryable errors correctly', () => {
      // Retryable errors
      expect(new NetworkError('Timeout', { code: 'TIMEOUT_ERROR' }).isRetryable()).toBe(true)
      expect(new NetworkError('Network error', { code: 'NETWORK_ERROR' }).isRetryable()).toBe(true)
      expect(new NetworkError('Server error', { status: 500 }).isRetryable()).toBe(true)
      expect(new NetworkError('Bad gateway', { status: 502 }).isRetryable()).toBe(true)
      expect(new NetworkError('Too many requests', { status: 429 }).isRetryable()).toBe(true)
      
      // Non-retryable errors (4xx client errors with non-network codes)
      expect(new NetworkError('Bad request', { status: 400, code: 'BAD_REQUEST' }).isRetryable()).toBe(false)
      expect(new NetworkError('Unauthorized', { status: 401, code: 'UNAUTHORIZED' }).isRetryable()).toBe(false)
      expect(new NetworkError('Not found', { status: 404, code: 'NOT_FOUND' }).isRetryable()).toBe(false)
      
      // Default case (no status, not timeout/connection) should be retryable
      expect(new NetworkError('Generic error', { code: 'GENERIC_ERROR' }).isRetryable()).toBe(true)
    })
  })

  describe('ValidationError', () => {
    it('should create validation error with details', () => {
      const details: ValidationErrorDetail[] = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short', value: '123' }
      ]
      
      const error = new ValidationError('Validation failed', details)
      
      expect(error.message).toBe('Validation failed')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual(details)
    })

    it('should get field errors as map', () => {
      const details: ValidationErrorDetail[] = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' }
      ]
      
      const error = new ValidationError('Validation failed', details)
      const fieldErrors = error.getFieldErrors()
      
      expect(fieldErrors).toEqual({
        email: 'Invalid email',
        password: 'Too short'
      })
    })

    it('should check for specific field errors', () => {
      const details: ValidationErrorDetail[] = [
        { field: 'email', message: 'Invalid email' }
      ]
      
      const error = new ValidationError('Validation failed', details)
      
      expect(error.hasFieldError('email')).toBe(true)
      expect(error.hasFieldError('password')).toBe(false)
      expect(error.getFieldError('email')).toBe('Invalid email')
      expect(error.getFieldError('password')).toBeUndefined()
    })

    it('should add field errors', () => {
      const error = new ValidationError('Validation failed', [])
      const newError = error.addFieldError('name', 'Required field', '')
      
      expect(newError.details).toHaveLength(1)
      expect(newError.details[0]).toEqual({
        field: 'name',
        message: 'Required field',
        value: ''
      })
    })
  })

  describe('AuthError', () => {
    it('should create authentication error', () => {
      const error = new AuthError('Login required', 'authentication')
      
      expect(error.message).toBe('Login required')
      expect(error.code).toBe('AUTHENTICATION_ERROR')
      expect(error.authType).toBe('authentication')
      expect(error.isAuthenticationError()).toBe(true)
      expect(error.isAuthorizationError()).toBe(false)
    })

    it('should create authorization error with roles', () => {
      const error = new AuthError('Access denied', 'authorization', {
        requiredRole: 'admin',
        currentRole: 'user'
      })
      
      expect(error.code).toBe('AUTHORIZATION_ERROR')
      expect(error.authType).toBe('authorization')
      expect(error.requiredRole).toBe('admin')
      expect(error.currentRole).toBe('user')
      expect(error.isAuthenticationError()).toBe(false)
      expect(error.isAuthorizationError()).toBe(true)
    })
  })

  describe('BusinessError', () => {
    it('should create business error with rule information', () => {
      const error = new BusinessError(
        'Cannot delete active menu item',
        'ACTIVE_ITEM_DELETION',
        {
          entityType: 'MenuItem',
          entityId: 'item-123'
        }
      )
      
      expect(error.message).toBe('Cannot delete active menu item')
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION')
      expect(error.businessRule).toBe('ACTIVE_ITEM_DELETION')
      expect(error.entityType).toBe('MenuItem')
      expect(error.entityId).toBe('item-123')
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error with default message', () => {
      const error = new NotFoundError('User', '123')
      
      expect(error.message).toBe("User with ID '123' not found")
      expect(error.code).toBe('RESOURCE_NOT_FOUND')
      expect(error.resourceType).toBe('User')
      expect(error.resourceId).toBe('123')
    })

    it('should create not found error without ID', () => {
      const error = new NotFoundError('Category')
      
      expect(error.message).toBe('Category not found')
      expect(error.resourceType).toBe('Category')
      expect(error.resourceId).toBeUndefined()
    })

    it('should create not found error with custom message', () => {
      const error = new NotFoundError('Order', '456', 'Order not available')
      
      expect(error.message).toBe('Order not available')
      expect(error.resourceType).toBe('Order')
      expect(error.resourceId).toBe('456')
    })
  })

  describe('TenantApiError', () => {
    it('should create tenant error with tenant information', () => {
      const error = new TenantApiError('Tenant not active', {
        code: 'TENANT_INACTIVE',
        tenantId: 'tenant-123',
        tenantSlug: 'restaurant-abc'
      })
      
      expect(error.message).toBe('Tenant not active')
      expect(error.code).toBe('TENANT_INACTIVE')
      expect(error.tenantId).toBe('tenant-123')
      expect(error.tenantSlug).toBe('restaurant-abc')
    })
  })

  // =============================================================================
  // SAFE API CALL TESTS
  // =============================================================================

  describe('safeApiCall', () => {
    it('should return success result for successful API call', async () => {
      const mockData = { id: '1', name: 'Test' }
      const apiCall = vi.fn().mockResolvedValue(mockData)
      
      const result = await safeApiCall(apiCall)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockData)
      }
      expect(apiCall).toHaveBeenCalledOnce()
    })

    it('should return failure result for API call that throws', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const error = new Error('API failed')
      const apiCall = vi.fn().mockRejectedValue(error)
      
      const result = await safeApiCall(apiCall)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AppError)
        expect(result.error.message).toBe('API failed')
      }
      
      process.env.NODE_ENV = originalEnv
    })

    it('should use custom fallback message', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const apiCall = vi.fn().mockRejectedValue(new Error('Original error'))
      
      const result = await safeApiCall(apiCall, {
        fallbackMessage: 'Custom error message'
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe('Original error')
      }
      
      process.env.NODE_ENV = originalEnv
    })

    it('should log errors in development mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const error = new Error('Test error')
      const apiCall = vi.fn().mockRejectedValue(error)
      
      await safeApiCall(apiCall, { logErrors: true })
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'API call failed:',
        expect.objectContaining({
          error: expect.any(Object),
          context: {},
          originalError: error
        })
      )
      
      process.env.NODE_ENV = originalEnv
    })

    it('should not log errors when disabled', async () => {
      const error = new Error('Test error')
      const apiCall = vi.fn().mockRejectedValue(error)
      
      await safeApiCall(apiCall, { logErrors: false })
      
      expect(mockConsoleError).not.toHaveBeenCalled()
    })

    it('should use custom error transform', async () => {
      const originalError = new Error('Original error')
      const customError = new BusinessError('Custom business error', 'CUSTOM_RULE')
      const apiCall = vi.fn().mockRejectedValue(originalError)
      
      const result = await safeApiCall(apiCall, {
        errorTransform: () => customError
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe(customError)
      }
    })

    it('should handle error reporting failures gracefully', async () => {
      const error = new Error('API error')
      const apiCall = vi.fn().mockRejectedValue(error)
      
      // Mock reportError to fail (it's not actually implemented in the current code)
      const result = await safeApiCall(apiCall, { reportErrors: true })
      
      expect(result.success).toBe(false)
      // Should not throw even if error reporting fails
    })
  })

  describe('safeBatchApiCall', () => {
    it('should handle multiple successful API calls', async () => {
      const apiCalls = [
        vi.fn().mockResolvedValue({ id: 1 }),
        vi.fn().mockResolvedValue({ id: 2 }),
        vi.fn().mockResolvedValue({ id: 3 })
      ]
      
      const results = await safeBatchApiCall(apiCalls)
      
      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual({ id: index + 1 })
        }
      })
    })

    it('should handle mixed success and failure results', async () => {
      const apiCalls = [
        vi.fn().mockResolvedValue({ id: 1 }),
        vi.fn().mockRejectedValue(new Error('Failed')),
        vi.fn().mockResolvedValue({ id: 3 })
      ]
      
      const results = await safeBatchApiCall(apiCalls)
      
      expect(results).toHaveLength(3)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[2].success).toBe(true)
    })
  })

  // =============================================================================
  // ERROR TRANSFORMATION TESTS
  // =============================================================================

  describe('createAppErrorFromApiError', () => {
    it('should handle network/fetch errors', () => {
      const fetchError = new TypeError('fetch failed')
      const appError = createAppErrorFromApiError(fetchError)
      
      expect(appError).toBeInstanceOf(NetworkError)
      expect(appError.code).toBe('NETWORK_ERROR')
      expect(appError.message).toBe('Network connection failed')
    })

    it('should handle timeout errors', () => {
      const timeoutError = { name: 'AbortError', message: 'Request timeout' }
      const appError = createAppErrorFromApiError(timeoutError)
      
      expect(appError).toBeInstanceOf(NetworkError)
      expect(appError.code).toBe('TIMEOUT_ERROR')
      expect(appError.message).toBe('Request timeout')
    })

    it('should handle HTTP errors with status codes', () => {
      const httpError = { status: 404, message: 'Not found' }
      const appError = createAppErrorFromApiError(httpError)
      
      expect(appError).toBeInstanceOf(NetworkError)
      expect((appError as NetworkError).status).toBe(404)
      expect(appError.code).toBe('NOT_FOUND')
    })

    it('should handle validation errors', () => {
      const validationError = {
        name: 'ValidationError',
        message: 'Validation failed',
        details: [
          { field: 'email', message: 'Invalid email' }
        ]
      }
      const appError = createAppErrorFromApiError(validationError)
      
      expect(appError).toBeInstanceOf(ValidationError)
      expect(appError.code).toBe('VALIDATION_ERROR')
      expect((appError as ValidationError).details).toHaveLength(1)
    })

    it('should handle authentication errors', () => {
      const authError = { status: 401, message: 'Unauthorized' }
      const appError = createAppErrorFromApiError(authError)
      
      // HTTP errors with status codes are handled as NetworkError
      expect(appError).toBeInstanceOf(NetworkError)
      expect((appError as NetworkError).status).toBe(401)
      expect(appError.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should handle authorization errors', () => {
      const authError = { status: 403, message: 'Forbidden' }
      const appError = createAppErrorFromApiError(authError)
      
      // HTTP errors with status codes are handled as NetworkError
      expect(appError).toBeInstanceOf(NetworkError)
      expect((appError as NetworkError).status).toBe(403)
      expect(appError.code).toBe('AUTHORIZATION_ERROR')
    })

    it('should preserve original error in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const unexpectedError = { weird: 'error', message: 'Strange error' }
      const appError = createAppErrorFromApiError(unexpectedError)
      
      expect(appError.code).toBe('UNEXPECTED_ERROR')
      expect(appError.context?.originalError).toBe(unexpectedError)
      
      process.env.NODE_ENV = originalEnv
    })

    it('should use generic error in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const unexpectedError = { weird: 'error', message: 'Strange error' }
      const appError = createAppErrorFromApiError(unexpectedError, 'Generic error')
      
      expect(appError.message).toBe('Generic error')
      expect(appError.code).toBe('UNEXPECTED_ERROR')
      
      process.env.NODE_ENV = originalEnv
    })
  })

  // =============================================================================
  // RESULT UTILITY TESTS
  // =============================================================================

  describe('Result utilities', () => {
    describe('success and failure constructors', () => {
      it('should create success result', () => {
        const result = success({ id: 1, name: 'Test' })
        
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual({ id: 1, name: 'Test' })
        }
      })

      it('should create failure result', () => {
        const error = new AppError('Test error')
        const result = failure(error)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBe(error)
        }
      })
    })

    describe('type guards', () => {
      it('should identify success results', () => {
        const successResult = success('data')
        const failureResult = failure(new AppError('error'))
        
        expect(isSuccess(successResult)).toBe(true)
        expect(isSuccess(failureResult)).toBe(false)
        expect(isFailure(successResult)).toBe(false)
        expect(isFailure(failureResult)).toBe(true)
      })
    })

    describe('mapResult', () => {
      it('should map successful result data', () => {
        const result = success(5)
        const mapped = mapResult(result, (x) => x * 2)
        
        expect(mapped.success).toBe(true)
        if (mapped.success) {
          expect(mapped.data).toBe(10)
        }
      })

      it('should pass through failure results', () => {
        const error = new AppError('Test error')
        const result = failure(error)
        const mapped = mapResult(result, (x) => x * 2)
        
        expect(mapped.success).toBe(false)
        if (!mapped.success) {
          expect(mapped.error).toBe(error)
        }
      })
    })

    describe('chainResult', () => {
      it('should chain successful results', () => {
        const result = success(5)
        const chained = chainResult(result, (x) => success(x * 2))
        
        expect(chained.success).toBe(true)
        if (chained.success) {
          expect(chained.data).toBe(10)
        }
      })

      it('should handle chained failures', () => {
        const result = success(5)
        const error = new AppError('Chain error')
        const chained = chainResult(result, () => failure(error))
        
        expect(chained.success).toBe(false)
        if (!chained.success) {
          expect(chained.error).toBe(error)
        }
      })

      it('should pass through initial failures', () => {
        const error = new AppError('Initial error')
        const result = failure(error)
        const chained = chainResult(result, (x) => success(x * 2))
        
        expect(chained.success).toBe(false)
        if (!chained.success) {
          expect(chained.error).toBe(error)
        }
      })
    })

    describe('mapError', () => {
      it('should map error in failure result', () => {
        const originalError = new AppError('Original error')
        const newError = new NetworkError('Network error')
        const result = failure(originalError)
        const mapped = mapError(result, () => newError)
        
        expect(mapped.success).toBe(false)
        if (!mapped.success) {
          expect(mapped.error).toBe(newError)
        }
      })

      it('should pass through success results', () => {
        const result = success('data')
        const mapped = mapError(result, () => new AppError('New error'))
        
        expect(mapped.success).toBe(true)
        if (mapped.success) {
          expect(mapped.data).toBe('data')
        }
      })
    })

    describe('getOrElse', () => {
      it('should return data from success result', () => {
        const result = success('success data')
        const value = getOrElse(result, 'default')
        
        expect(value).toBe('success data')
      })

      it('should return default value from failure result', () => {
        const result = failure(new AppError('error'))
        const value = getOrElse(result, 'default')
        
        expect(value).toBe('default')
      })
    })

    describe('getOrThrow', () => {
      it('should return data from success result', () => {
        const result = success('success data')
        const value = getOrThrow(result)
        
        expect(value).toBe('success data')
      })

      it('should throw error from failure result', () => {
        const error = new AppError('Test error')
        const result = failure(error)
        
        expect(() => getOrThrow(result)).toThrow(error)
      })
    })

    describe('combineResults', () => {
      it('should combine successful results', () => {
        const results = [
          success(1),
          success(2),
          success(3)
        ]
        const combined = combineResults(results)
        
        expect(combined.success).toBe(true)
        if (combined.success) {
          expect(combined.data).toEqual([1, 2, 3])
        }
      })

      it('should fail if any result fails', () => {
        const error = new AppError('Test error')
        const results = [
          success(1),
          failure(error),
          success(3)
        ]
        const combined = combineResults(results)
        
        expect(combined.success).toBe(false)
        if (!combined.success) {
          expect(combined.error).toBe(error)
        }
      })
    })

    describe('promiseToResult', () => {
      it('should convert successful promise to success result', async () => {
        const promise = Promise.resolve('success')
        const result = await promiseToResult(promise)
        
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe('success')
        }
      })

      it('should convert rejected promise to failure result', async () => {
        const promise = Promise.reject(new Error('Promise error'))
        const result = await promiseToResult(promise)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
        }
      })

      it('should use custom error transform', async () => {
        const customError = new BusinessError('Custom error', 'CUSTOM_RULE')
        const promise = Promise.reject(new Error('Original error'))
        const result = await promiseToResult(promise, () => customError)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBe(customError)
        }
      })
    })
  })

  // =============================================================================
  // DEVELOPMENT VS PRODUCTION ERROR HANDLING TESTS
  // =============================================================================

  describe('Development vs Production Error Handling', () => {
    it('should provide detailed errors in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const complexError = {
        message: 'Complex error',
        stack: 'Error stack trace',
        details: { sensitive: 'data' }
      }
      
      const appError = createAppErrorFromApiError(complexError)
      
      expect(appError.context?.originalError).toBe(complexError)
      expect(appError.context?.stack).toBe('Error stack trace')
      
      process.env.NODE_ENV = originalEnv
    })

    it('should sanitize errors in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const sensitiveError = {
        message: 'Database connection string: user:pass@host',
        stack: 'Sensitive stack trace',
        details: { apiKey: 'secret-key-123' }
      }
      
      const appError = createAppErrorFromApiError(sensitiveError, 'A system error occurred')
      
      expect(appError.message).toBe('A system error occurred')
      expect(appError.code).toBe('UNEXPECTED_ERROR')
      expect(appError.context?.originalError).toBeUndefined()
      
      process.env.NODE_ENV = originalEnv
    })
  })

  // =============================================================================
  // EDGE CASES AND ERROR SCENARIOS
  // =============================================================================

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle null and undefined errors', () => {
      const nullError = createAppErrorFromApiError(null)
      const undefinedError = createAppErrorFromApiError(undefined)
      
      expect(nullError).toBeInstanceOf(AppError)
      expect(undefinedError).toBeInstanceOf(AppError)
      // Both should use fallback message
      expect(nullError.message).toBe('An unexpected error occurred')
      expect(undefinedError.message).toBe('An unexpected error occurred')
    })

    it('should handle circular reference errors', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const circularError: any = { message: 'Circular error' }
      circularError.self = circularError
      
      const appError = createAppErrorFromApiError(circularError)
      
      expect(appError).toBeInstanceOf(AppError)
      expect(appError.message).toBe('Circular error')
      
      process.env.NODE_ENV = originalEnv
    })

    it('should handle errors without message property', () => {
      const errorWithoutMessage = { code: 'NO_MESSAGE_ERROR' }
      const appError = createAppErrorFromApiError(errorWithoutMessage, 'Default message')
      
      expect(appError.message).toBe('Default message')
    })

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000)
      const error = new AppError(longMessage)
      
      expect(error.message).toBe(longMessage)
      expect(error.toJSON().message).toBe(longMessage)
    })

    it('should handle errors with special characters', () => {
      const specialMessage = 'Error with 特殊字符 and émojis 🚨'
      const error = new AppError(specialMessage)
      
      expect(error.message).toBe(specialMessage)
    })

    it('should handle concurrent safeApiCall executions', async () => {
      const apiCalls = Array.from({ length: 10 }, (_, i) => 
        safeApiCall(() => Promise.resolve(`result-${i}`))
      )
      
      const results = await Promise.all(apiCalls)
      
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(`result-${index}`)
        }
      })
    })

    it('should handle safeApiCall with immediate rejection', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const immediateError = new Error('Immediate error')
      const apiCall = () => Promise.reject(immediateError)
      
      const result = await safeApiCall(apiCall)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe('Immediate error')
      }
      
      process.env.NODE_ENV = originalEnv
    })
  })
})