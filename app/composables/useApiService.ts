/**
 * Composable for using API services with Result pattern
 * 
 * This composable provides easy access to all API services with
 * consistent error handling and loading states.
 * 
 * Requirements: 1.2 - КОГДА разработчик использует методы $apiClient, ТО система ДОЛЖНА обеспечить типобезопасность всех вызовов API
 * 
 * @module composables/useApiService
 */

import { ref } from 'vue'
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
import type { Result, AppError } from '~/types/errors'

/**
 * Composable for API services with loading states and error handling
 * 
 * @example
 * ```typescript
 * const { menuItems, categories, loading, error, loadMenuItems, loadCategories } = useApiService()
 * 
 * // Load data with automatic error handling
 * await loadMenuItems({ categoryId: 'pizza' })
 * 
 * // Handle results manually
 * const result = await MenuItemService.getMenuItems()
 * handleResult(result, (data) => {
 *   menuItems.value = data.items
 * })
 * ```
 */
export function useApiService() {
  // Loading states
  const loading = ref(false)
  const error = ref<AppError | null>(null)

  // Data states
  const menuItems = ref<any[]>([])
  const categories = ref<any[]>([])
  const orders = ref<any[]>([])
  const analytics = ref<any>(null)

  /**
   * Generic result handler with loading state management
   * 
   * @param resultPromise - Promise that returns a Result
   * @param onSuccess - Success callback
   * @param onError - Optional error callback
   */
  async function handleResult<T>(
    resultPromise: Promise<Result<T, AppError>>,
    onSuccess: (data: T) => void,
    onError?: (error: AppError) => void
  ): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const result = await resultPromise

      if (result.success) {
        onSuccess(result.data)
      } else {
        error.value = result.error
        if (onError) {
          onError(result.error)
        } else {
          console.error('API operation failed:', result.error)
        }
      }
    } catch (err) {
      const appError = err as AppError
      error.value = appError
      if (onError) {
        onError(appError)
      } else {
        console.error('Unexpected error:', appError)
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Load menu items with automatic state management
   */
  async function loadMenuItems(filters?: any) {
    await handleResult(
      MenuItemService.getMenuItems(filters),
      (data) => {
        menuItems.value = data.items || []
      }
    )
  }

  /**
   * Load categories with automatic state management
   */
  async function loadCategories() {
    await handleResult(
      CategoryService.getCategories(),
      (data) => {
        categories.value = data || []
      }
    )
  }

  /**
   * Load orders with automatic state management
   */
  async function loadOrders(filters?: any) {
    await handleResult(
      OrderService.getOrders(filters),
      (data) => {
        orders.value = data.orders || []
      }
    )
  }

  /**
   * Load analytics with automatic state management
   */
  async function loadAnalytics(period: string) {
    await handleResult(
      AnalyticsService.getAnalytics(period),
      (data) => {
        analytics.value = data
      }
    )
  }

  /**
   * Create menu item with validation error handling
   */
  async function createMenuItem(data: any): Promise<boolean> {
    let success = false

    await handleResult(
      MenuItemService.createMenuItem(data),
      () => {
        success = true
      },
      (error) => {
        // Extract validation errors for form handling
        if (error.code === 'VALIDATION_ERROR') {
          const fieldErrors = extractValidationErrors(error)
          console.log('Validation errors:', fieldErrors)
        }
      }
    )

    return success
  }

  /**
   * Update menu item with validation error handling
   */
  async function updateMenuItem(id: string, updates: any): Promise<boolean> {
    let success = false

    await handleResult(
      MenuItemService.updateMenuItem(id, updates),
      () => {
        success = true
      }
    )

    return success
  }

  /**
   * Delete menu item with confirmation
   */
  async function deleteMenuItem(id: string): Promise<boolean> {
    let success = false

    await handleResult(
      MenuItemService.deleteMenuItem(id),
      () => {
        success = true
      }
    )

    return success
  }

  /**
   * Update order status
   */
  async function updateOrderStatus(id: string, status: string): Promise<boolean> {
    let success = false

    await handleResult(
      OrderService.updateOrderStatus(id, status),
      () => {
        success = true
      }
    )

    return success
  }

  /**
   * Cancel order
   */
  async function cancelOrder(id: string): Promise<boolean> {
    let success = false

    await handleResult(
      OrderService.cancelOrder(id),
      () => {
        success = true
      }
    )

    return success
  }

  /**
   * Validate promo code
   */
  async function validatePromoCode(code: string, subtotal: number): Promise<{ success: boolean; discount: number; message: string }> {
    let result = { success: false, discount: 0, message: '' }

    await handleResult(
      CartService.validatePromoCode(code, subtotal),
      (data) => {
        result = {
          success: true,
          discount: data.discount,
          message: data.message || 'Promo code applied'
        }
      },
      (error) => {
        result = {
          success: false,
          discount: 0,
          message: error.message || 'Invalid promo code'
        }
      }
    )

    return result
  }

  /**
   * Check if an error is retryable
   */
  function canRetry(error: AppError): boolean {
    return isRetryableError(error)
  }

  /**
   * Clear error state
   */
  function clearError() {
    error.value = null
  }

  /**
   * Reset all data
   */
  function reset() {
    loading.value = false
    error.value = null
    menuItems.value = []
    categories.value = []
    orders.value = []
    analytics.value = null
  }

  return {
    // States
    loading,
    error,
    menuItems,
    categories,
    orders,
    analytics,

    // Generic handlers
    handleResult,

    // Data loaders
    loadMenuItems,
    loadCategories,
    loadOrders,
    loadAnalytics,

    // CRUD operations
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateOrderStatus,
    cancelOrder,
    validatePromoCode,

    // Utilities
    canRetry,
    clearError,
    reset,

    // Direct service access
    services: {
      MenuItemService,
      CategoryService,
      OrderService,
      AuthService,
      AnalyticsService,
      CartService,
      TenantService
    }
  }
}

/**
 * Composable for handling API results with toast notifications
 * 
 * @example
 * ```typescript
 * const { handleWithToast } = useApiWithToast()
 * 
 * await handleWithToast(
 *   MenuItemService.createMenuItem(data),
 *   'Menu item created successfully',
 *   'Failed to create menu item'
 * )
 * ```
 */
export function useApiWithToast() {
  /**
   * Handle API result with toast notifications
   * 
   * @param resultPromise - Promise that returns a Result
   * @param successMessage - Message to show on success
   * @param errorMessage - Message to show on error (optional, uses error message if not provided)
   * @returns Promise<boolean> - True if successful
   */
  async function handleWithToast<T>(
    resultPromise: Promise<Result<T, AppError>>,
    successMessage: string,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const result = await resultPromise

      if (result.success) {
        // In a real app, you would use a toast notification service
        console.log('✅', successMessage)
        return true
      } else {
        const message = errorMessage || result.error.message || 'Operation failed'
        console.error('❌', message)
        return false
      }
    } catch (error) {
      const message = errorMessage || 'An unexpected error occurred'
      console.error('❌', message, error)
      return false
    }
  }

  return {
    handleWithToast
  }
}

/**
 * Composable for handling form submissions with API services
 * 
 * @example
 * ```typescript
 * const { submitForm, submitting, validationErrors } = useApiForm()
 * 
 * const success = await submitForm(
 *   MenuItemService.createMenuItem(formData),
 *   'Menu item created successfully'
 * )
 * ```
 */
export function useApiServiceForm() {
  const submitting = ref(false)
  const validationErrors = ref<Record<string, string>>({})

  /**
   * Submit form with API service
   * 
   * @param resultPromise - Promise that returns a Result
   * @param successMessage - Message to show on success
   * @returns Promise<boolean> - True if successful
   */
  async function submitForm<T>(
    resultPromise: Promise<Result<T, AppError>>,
    successMessage: string
  ): Promise<boolean> {
    submitting.value = true
    validationErrors.value = {}

    try {
      const result = await resultPromise

      if (result.success) {
        console.log('✅', successMessage)
        return true
      } else {
        // Handle validation errors
        if (result.error.code === 'VALIDATION_ERROR') {
          validationErrors.value = extractValidationErrors(result.error)
        } else {
          console.error('❌', result.error.message)
        }
        return false
      }
    } catch (error) {
      console.error('❌', 'Form submission failed', error)
      return false
    } finally {
      submitting.value = false
    }
  }

  /**
   * Clear validation errors
   */
  function clearValidationErrors() {
    validationErrors.value = {}
  }

  return {
    submitting,
    validationErrors,
    submitForm,
    clearValidationErrors
  }
}