/**
 * Unit Tests for API Service Error Handling
 * 
 * This test suite validates the API service layer's error handling including:
 * - Service method error handling
 * - Result pattern usage in services
 * - Error context and logging
 * - Service-specific error transformations
 * - Retry logic and error recovery
 * 
 * Requirements: 1.2 - КОГДА разработчик использует методы $apiClient, ТО система ДОЛЖНА обеспечить типобезопасность всех вызовов API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  MenuItemService,
  CategoryService,
  OrderService,
  AuthService,
  AnalyticsService,
  CartService,
  TenantService,
  handleApiResult,
  extractValidationErrors,
  isRetryableError
} from '~/services/api.service'
import {
  AppError,
  NetworkError,
  ValidationError,
  AuthError,
  BusinessError,
  NotFoundError,
  TenantApiError
} from '~/types/errors'

// Mock the API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn()
}

// Mock the useApiClient composable
vi.mock('~/utils/api', () => ({
  useApiClient: () => mockApiClient
}))

// Mock console methods
const mockConsoleError = vi.fn()
const mockConsoleLog = vi.fn()
const originalConsoleError = console.error
const originalConsoleLog = console.log

describe('API Service Error Handling', () => {
  beforeEach(() => {
    console.error = mockConsoleError
    console.log = mockConsoleLog
    vi.clearAllMocks()
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.log = originalConsoleLog
  })

  // =============================================================================
  // MENU ITEM SERVICE ERROR HANDLING
  // =============================================================================

  describe('MenuItemService', () => {
    describe('getMenuItems', () => {
      it('should handle successful API response', async () => {
        const mockResponse = {
          items: [{ id: '1', name: 'Pizza' }],
          total: 1,
          page: 1,
          limit: 10
        }
        mockApiClient.get.mockResolvedValue(mockResponse)

        const result = await MenuItemService.getMenuItems()

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toEqual(mockResponse)
        }
        expect(mockApiClient.get).toHaveBeenCalledWith('/admin/menu-items', {
          params: undefined
        })
      })

      it('should handle network errors', async () => {
        const networkError = new Error('Network connection failed')
        mockApiClient.get.mockRejectedValue(networkError)

        const result = await MenuItemService.getMenuItems()

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
          // Service uses fallback message for this operation
          expect(result.error.message).toBe('Failed to load menu items')
        }
      })

      it('should include proper context in error handling', async () => {
        const filters = { categoryId: 'pizza', isActive: true }
        mockApiClient.get.mockRejectedValue(new Error('API Error'))

        const result = await MenuItemService.getMenuItems(filters)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.context).toEqual({
            operation: 'getMenuItems',
            filters
          })
        }
      })
    })

    describe('createMenuItem', () => {
      it('should handle validation errors', async () => {
        const validationError = {
          status: 422,
          response: {
            data: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                { field: 'name', message: 'Name is required' },
                { field: 'price', message: 'Price must be positive' }
              ]
            }
          }
        }
        mockApiClient.post.mockRejectedValue(validationError)

        const result = await MenuItemService.createMenuItem({ name: '', price: -1 })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
          expect(result.error.context?.operation).toBe('createMenuItem')
        }
      })

      it('should handle business rule violations', async () => {
        const businessError = {
          status: 409,
          response: {
            data: {
              code: 'BUSINESS_RULE_VIOLATION',
              message: 'Menu item with this name already exists'
            }
          }
        }
        mockApiClient.post.mockRejectedValue(businessError)

        const result = await MenuItemService.createMenuItem({ name: 'Existing Item' })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
        }
      })
    })

    describe('updateMenuItem', () => {
      it('should handle not found errors', async () => {
        const notFoundError = {
          status: 404,
          message: 'Menu item not found'
        }
        mockApiClient.patch.mockRejectedValue(notFoundError)

        const result = await MenuItemService.updateMenuItem('nonexistent-id', { name: 'Updated' })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
          expect(result.error.context?.id).toBe('nonexistent-id')
        }
      })
    })

    describe('deleteMenuItem', () => {
      it('should handle authorization errors', async () => {
        const authError = {
          status: 403,
          message: 'Insufficient permissions to delete menu item'
        }
        mockApiClient.delete.mockRejectedValue(authError)

        const result = await MenuItemService.deleteMenuItem('item-123')

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
        }
      })
    })
  })

  // =============================================================================
  // AUTHENTICATION SERVICE ERROR HANDLING
  // =============================================================================

  describe('AuthService', () => {
    describe('login', () => {
      it('should handle authentication failures', async () => {
        const authError = {
          status: 401,
          response: {
            data: {
              code: 'AUTHENTICATION_ERROR',
              message: 'Invalid credentials'
            }
          }
        }
        mockApiClient.post.mockRejectedValue(authError)

        const result = await AuthService.login({
          email: 'test@example.com',
          password: 'wrongpassword'
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
          expect(result.error.context?.email).toBe('test@example.com')
        }
      })

      it('should handle rate limiting', async () => {
        const rateLimitError = {
          status: 429,
          message: 'Too many login attempts'
        }
        mockApiClient.post.mockRejectedValue(rateLimitError)

        const result = await AuthService.login({
          email: 'test@example.com',
          password: 'password'
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
        }
      })
    })

    describe('refreshToken', () => {
      it('should handle expired refresh tokens', async () => {
        const expiredTokenError = {
          status: 401,
          response: {
            data: {
              code: 'TOKEN_EXPIRED',
              message: 'Refresh token has expired'
            }
          }
        }
        mockApiClient.post.mockRejectedValue(expiredTokenError)

        const result = await AuthService.refreshToken('expired-token')

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
        }
      })
    })
  })

  // =============================================================================
  // TENANT SERVICE ERROR HANDLING
  // =============================================================================

  describe('TenantService', () => {
    describe('getTenantInfo', () => {
      it('should handle tenant not found', async () => {
        const tenantError = {
          status: 404,
          response: {
            data: {
              code: 'TENANT_NOT_FOUND',
              message: 'Tenant not found'
            }
          }
        }
        mockApiClient.get.mockRejectedValue(tenantError)

        const result = await TenantService.getTenantInfo('nonexistent-tenant')

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
          expect(result.error.context?.slug).toBe('nonexistent-tenant')
        }
      })

      it('should handle inactive tenant', async () => {
        const inactiveError = {
          status: 403,
          response: {
            data: {
              code: 'TENANT_INACTIVE',
              message: 'Tenant is not active'
            }
          }
        }
        mockApiClient.get.mockRejectedValue(inactiveError)

        const result = await TenantService.getTenantInfo('inactive-tenant')

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
        }
      })
    })
  })

  // =============================================================================
  // CART SERVICE ERROR HANDLING
  // =============================================================================

  describe('CartService', () => {
    describe('validatePromoCode', () => {
      it('should handle invalid promo codes', async () => {
        const promoError = {
          status: 400,
          response: {
            data: {
              code: 'INVALID_PROMO_CODE',
              message: 'Promo code is invalid or expired'
            }
          }
        }
        mockApiClient.post.mockRejectedValue(promoError)

        const result = await CartService.validatePromoCode('INVALID123', 100)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
          expect(result.error.context?.code).toBe('INVALID123')
        }
      })

      it('should handle minimum order requirements', async () => {
        const minimumError = {
          status: 400,
          response: {
            data: {
              code: 'MINIMUM_ORDER_NOT_MET',
              message: 'Minimum order amount not met for this promo code'
            }
          }
        }
        mockApiClient.post.mockRejectedValue(minimumError)

        const result = await CartService.validatePromoCode('MINIMUM50', 25)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
        }
      })
    })
  })

  // =============================================================================
  // UTILITY FUNCTION TESTS
  // =============================================================================

  describe('handleApiResult', () => {
    it('should call success callback for successful results', () => {
      const successCallback = vi.fn()
      const errorCallback = vi.fn()
      const result = { success: true as const, data: { id: 1, name: 'Test' } }

      handleApiResult(result, successCallback, errorCallback)

      expect(successCallback).toHaveBeenCalledWith({ id: 1, name: 'Test' })
      expect(errorCallback).not.toHaveBeenCalled()
    })

    it('should call error callback for failed results', () => {
      const successCallback = vi.fn()
      const errorCallback = vi.fn()
      const error = new AppError('Test error')
      const result = { success: false as const, error }

      handleApiResult(result, successCallback, errorCallback)

      expect(successCallback).not.toHaveBeenCalled()
      expect(errorCallback).toHaveBeenCalledWith(error)
    })

    it('should use default error handling when no error callback provided', () => {
      const successCallback = vi.fn()
      const error = new AppError('Test error')
      const result = { success: false as const, error }

      // Mock window.alert for default error handling
      const mockAlert = vi.fn()
      global.alert = mockAlert

      handleApiResult(result, successCallback)

      expect(successCallback).not.toHaveBeenCalled()
      expect(mockConsoleError).toHaveBeenCalledWith('API operation failed:', error)
      expect(mockAlert).toHaveBeenCalledWith('Test error')
      
      // Clean up
      delete (global as any).alert
    })
  })

  describe('extractValidationErrors', () => {
    it('should extract validation errors from ValidationError', () => {
      const validationError = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' }
      ])

      const fieldErrors = extractValidationErrors(validationError)

      expect(fieldErrors).toEqual({
        email: 'Invalid email format',
        password: 'Password too short'
      })
    })

    it('should return empty object for non-validation errors', () => {
      const networkError = new NetworkError('Network failed')
      const fieldErrors = extractValidationErrors(networkError)

      expect(fieldErrors).toEqual({})
    })

    it('should handle validation errors without details', () => {
      const validationError = new ValidationError('Validation failed')
      const fieldErrors = extractValidationErrors(validationError)

      expect(fieldErrors).toEqual({})
    })
  })

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const retryableErrors = [
        new NetworkError('Network error', { code: 'NETWORK_ERROR' }),
        new NetworkError('Timeout', { code: 'TIMEOUT_ERROR' }),
        new AppError('Server error', 'SERVER_ERROR'),
        new AppError('Service unavailable', 'SERVICE_UNAVAILABLE'),
        new AppError('Gateway timeout', 'GATEWAY_TIMEOUT')
      ]

      retryableErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(true)
      })
    })

    it('should identify non-retryable errors', () => {
      const nonRetryableErrors = [
        new ValidationError('Validation failed'),
        new AuthError('Unauthorized', 'authentication'),
        new BusinessError('Business rule violation', 'RULE_VIOLATION'),
        new NotFoundError('Resource'),
        new AppError('Bad request', 'BAD_REQUEST')
      ]

      nonRetryableErrors.forEach(error => {
        expect(isRetryableError(error)).toBe(false)
      })
    })
  })

  // =============================================================================
  // ERROR CONTEXT AND LOGGING TESTS
  // =============================================================================

  describe('Error Context and Logging', () => {
    it('should include operation context in all service methods', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Test error'))

      const services = [
        () => MenuItemService.getMenuItems(),
        () => CategoryService.getCategories(),
        () => OrderService.getOrders(),
        () => AuthService.getProfile(),
        () => AnalyticsService.getDashboardStats(),
        () => TenantService.getAvailableTenants()
      ]

      for (const serviceCall of services) {
        const result = await serviceCall()
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.context?.operation).toBeDefined()
        }
      }
    })

    it('should include relevant parameters in error context', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Test error'))

      const result = await MenuItemService.getMenuItem('test-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.context?.operation).toBe('getMenuItem')
        expect(result.error.context?.id).toBe('test-id')
      }
    })

    it('should include request data in POST/PUT/PATCH operations', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Test error'))

      const menuItemData = { name: 'Test Item', price: 10.99 }
      const result = await MenuItemService.createMenuItem(menuItemData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.context?.operation).toBe('createMenuItem')
        expect(result.error.context?.data).toEqual(menuItemData)
      }
    })
  })

  // =============================================================================
  // CONCURRENT ERROR HANDLING TESTS
  // =============================================================================

  describe('Concurrent Error Handling', () => {
    it('should handle multiple concurrent API failures', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Concurrent error'))

      const concurrentCalls = [
        MenuItemService.getMenuItems(),
        CategoryService.getCategories(),
        OrderService.getOrders(),
        AnalyticsService.getDashboardStats()
      ]

      const results = await Promise.all(concurrentCalls)

      results.forEach((result, index) => {
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBeInstanceOf(AppError)
          // Each service has its own fallback message
          const expectedMessages = [
            'Failed to load menu items',
            'Failed to load categories', 
            'Failed to load orders',
            'Failed to load dashboard statistics'
          ]
          expect(result.error.message).toBe(expectedMessages[index])
        }
      })
    })

    it('should handle mixed success and failure in concurrent calls', async () => {
      mockApiClient.get
        .mockResolvedValueOnce([{ id: '1', name: 'Category 1' }])
        .mockRejectedValueOnce(new Error('Menu items failed'))
        .mockResolvedValueOnce({ orders: [], total: 0 })
        .mockRejectedValueOnce(new Error('Analytics failed'))

      const concurrentCalls = [
        CategoryService.getCategories(),
        MenuItemService.getMenuItems(),
        OrderService.getOrders(),
        AnalyticsService.getDashboardStats()
      ]

      const results = await Promise.all(concurrentCalls)

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[2].success).toBe(true)
      expect(results[3].success).toBe(false)
    })
  })

  // =============================================================================
  // ERROR RECOVERY AND RETRY TESTS
  // =============================================================================

  describe('Error Recovery and Retry', () => {
    it('should identify which errors are suitable for retry', () => {
      const retryableError = new NetworkError('Timeout', { code: 'TIMEOUT_ERROR' })
      const nonRetryableError = new ValidationError('Invalid data')

      expect(isRetryableError(retryableError)).toBe(true)
      expect(isRetryableError(nonRetryableError)).toBe(false)
    })

    it('should handle retry scenarios in service layer', async () => {
      // First call fails with retryable error, second succeeds
      mockApiClient.get
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce([{ id: '1', name: 'Success' }])

      // In a real implementation, you might have retry logic in the service
      // For now, we just test that the error is properly classified
      const firstResult = await CategoryService.getCategories()
      expect(firstResult.success).toBe(false)

      const secondResult = await CategoryService.getCategories()
      expect(secondResult.success).toBe(true)
    })
  })
})