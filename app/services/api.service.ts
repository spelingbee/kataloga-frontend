/**
 * Safe API Service Layer
 * 
 * This service provides type-safe API operations using the Result pattern
 * for comprehensive error handling. All API calls are wrapped with safeApiCall
 * to ensure consistent error handling and type safety.
 * 
 * Requirements: 1.2 - КОГДА разработчик использует методы $apiClient, ТО система ДОЛЖНА обеспечить типобезопасность всех вызовов API
 * 
 * @module services/api
 */

import { useApiClient } from '~/utils/api'
import { safeApiCall, type Result, type AppError } from '~/types/errors'
import type {
  MenuItemUI,
  CategoryUI,
  OrderUI,
  User,
  UpdateProfileDto,
  TenantInfo,
  CartItem
} from '~/types'

// =============================================================================
// MENU ITEM OPERATIONS
// =============================================================================

/**
 * Safe menu item operations with Result pattern
 */
export class MenuItemService {
  /**
   * Get all menu items with safe error handling
   * 
   * @param filters - Optional filters for menu items
   * @returns Result containing menu items array or error
   */
  static async getMenuItems(filters?: {
    categoryId?: string
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  }): Promise<Result<{ items: MenuItemUI[]; total: number; page: number; limit: number }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<{ items: MenuItemUI[]; total: number; page: number; limit: number }>('/admin/menu-items', {
        params: filters
      })
    }, {
      fallbackMessage: 'Failed to load menu items',
      context: { operation: 'getMenuItems', filters }
    })
  }

  /**
   * Get single menu item by ID with safe error handling
   * 
   * @param id - Menu item ID
   * @returns Result containing menu item or error
   */
  static async getMenuItem(id: string): Promise<Result<MenuItemUI, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<MenuItemUI>(`/admin/menu-items/${id}`)
    }, {
      fallbackMessage: 'Failed to load menu item',
      context: { operation: 'getMenuItem', id }
    })
  }

  /**
   * Create new menu item with safe error handling
   * 
   * @param menuItemData - Menu item data to create
   * @returns Result containing created menu item or error
   */
  static async createMenuItem(menuItemData: Partial<MenuItemUI>): Promise<Result<MenuItemUI, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.post<MenuItemUI>('/admin/menu-items', menuItemData)
    }, {
      fallbackMessage: 'Failed to create menu item',
      context: { operation: 'createMenuItem', data: menuItemData }
    })
  }

  /**
   * Update existing menu item with safe error handling
   * 
   * @param id - Menu item ID
   * @param updates - Partial menu item data to update
   * @returns Result containing updated menu item or error
   */
  static async updateMenuItem(id: string, updates: Partial<MenuItemUI>): Promise<Result<MenuItemUI, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.patch<MenuItemUI>(`/admin/menu-items/${id}`, updates)
    }, {
      fallbackMessage: 'Failed to update menu item',
      context: { operation: 'updateMenuItem', id, updates }
    })
  }

  /**
   * Delete menu item with safe error handling
   * 
   * @param id - Menu item ID
   * @returns Result containing success status or error
   */
  static async deleteMenuItem(id: string): Promise<Result<{ success: boolean }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.delete<{ success: boolean }>(`/admin/menu-items/${id}`)
    }, {
      fallbackMessage: 'Failed to delete menu item',
      context: { operation: 'deleteMenuItem', id }
    })
  }

  /**
   * Toggle menu item active status with safe error handling
   * 
   * @param id - Menu item ID
   * @param isActive - New active status
   * @returns Result containing success status or error
   */
  static async toggleMenuItemStatus(id: string, isActive: boolean): Promise<Result<{ success: boolean }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.patch<{ success: boolean }>(`/admin/menu-items/${id}`, { isActive })
    }, {
      fallbackMessage: 'Failed to update menu item status',
      context: { operation: 'toggleMenuItemStatus', id, isActive }
    })
  }
}

// =============================================================================
// CATEGORY OPERATIONS
// =============================================================================

/**
 * Safe category operations with Result pattern
 */
export class CategoryService {
  /**
   * Get all categories with safe error handling
   * 
   * @returns Result containing categories array or error
   */
  static async getCategories(): Promise<Result<CategoryUI[], AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<CategoryUI[]>('/admin/categories')
    }, {
      fallbackMessage: 'Failed to load categories',
      context: { operation: 'getCategories' }
    })
  }

  /**
   * Create new category with safe error handling
   * 
   * @param categoryData - Category data to create
   * @returns Result containing created category or error
   */
  static async createCategory(categoryData: Partial<CategoryUI>): Promise<Result<CategoryUI, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.post<CategoryUI>('/admin/categories', categoryData)
    }, {
      fallbackMessage: 'Failed to create category',
      context: { operation: 'createCategory', data: categoryData }
    })
  }

  /**
   * Update existing category with safe error handling
   * 
   * @param id - Category ID
   * @param updates - Partial category data to update
   * @returns Result containing updated category or error
   */
  static async updateCategory(id: string, updates: Partial<CategoryUI>): Promise<Result<CategoryUI, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.patch<CategoryUI>(`/admin/categories/${id}`, updates)
    }, {
      fallbackMessage: 'Failed to update category',
      context: { operation: 'updateCategory', id, updates }
    })
  }

  /**
   * Delete category with safe error handling
   * 
   * @param id - Category ID
   * @returns Result containing success status or error
   */
  static async deleteCategory(id: string): Promise<Result<{ success: boolean }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.delete<{ success: boolean }>(`/admin/categories/${id}`)
    }, {
      fallbackMessage: 'Failed to delete category',
      context: { operation: 'deleteCategory', id }
    })
  }
}

// =============================================================================
// ORDER OPERATIONS
// =============================================================================

/**
 * Safe order operations with Result pattern
 */
export class OrderService {
  /**
   * Get all orders with safe error handling
   * 
   * @param filters - Optional filters for orders
   * @returns Result containing orders data or error
   */
  static async getOrders(filters?: {
    status?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }): Promise<Result<{ orders: OrderUI[]; total: number; stats: Record<string, unknown> }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<{ orders: OrderUI[]; total: number; stats: Record<string, unknown> }>('/admin/orders', {
        params: filters
      })
    }, {
      fallbackMessage: 'Failed to load orders',
      context: { operation: 'getOrders', filters }
    })
  }

  /**
   * Get single order by ID with safe error handling
   * 
   * @param id - Order ID
   * @returns Result containing order or error
   */
  static async getOrder(id: string): Promise<Result<OrderUI, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<OrderUI>(`/admin/orders/${id}`)
    }, {
      fallbackMessage: 'Failed to load order',
      context: { operation: 'getOrder', id }
    })
  }

  /**
   * Update order status with safe error handling
   * 
   * @param id - Order ID
   * @param status - New order status
   * @returns Result containing success status or error
   */
  static async updateOrderStatus(id: string, status: string): Promise<Result<{ success: boolean }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.patch<{ success: boolean }>(`/admin/orders/${id}/status`, { status })
    }, {
      fallbackMessage: 'Failed to update order status',
      context: { operation: 'updateOrderStatus', id, status }
    })
  }

  /**
   * Cancel order with safe error handling
   * 
   * @param id - Order ID
   * @returns Result containing success status or error
   */
  static async cancelOrder(id: string): Promise<Result<{ success: boolean }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.patch<{ success: boolean }>(`/admin/orders/${id}/status`, { status: 'CANCELLED' })
    }, {
      fallbackMessage: 'Failed to cancel order',
      context: { operation: 'cancelOrder', id }
    })
  }
}

// =============================================================================
// AUTHENTICATION OPERATIONS
// =============================================================================

/**
 * Safe authentication operations with Result pattern
 */
export class AuthService {
  /**
   * Login user with safe error handling
   * 
   * @param credentials - Login credentials
   * @returns Result containing auth data or error
   */
  static async login(credentials: {
    email: string
    password: string
    tenantSlug?: string
  }): Promise<Result<{ accessToken: string; user: User }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.post<{ accessToken: string; user: User }>('/auth/login', credentials)
    }, {
      fallbackMessage: 'Login failed',
      context: { operation: 'login', email: credentials.email }
    })
  }

  /**
   * Register user with safe error handling
   * 
   * @param userData - Registration data
   * @returns Result containing auth data or error
   */
  static async register(userData: {
    email: string
    password: string
    name: string
    tenantSlug?: string
  }): Promise<Result<{ accessToken: string; user: User }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.post<{ accessToken: string; user: User }>('/auth/register', userData)
    }, {
      fallbackMessage: 'Registration failed',
      context: { operation: 'register', email: userData.email }
    })
  }

  /**
   * Logout user with safe error handling
   * 
   * @returns Result containing success status or error
   */
  static async logout(): Promise<Result<void, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.post<void>('/auth/logout', {})
    }, {
      fallbackMessage: 'Logout failed',
      context: { operation: 'logout' }
    })
  }

  /**
   * Get user profile with safe error handling
   * 
   * @returns Result containing user profile or error
   */
  static async getProfile(): Promise<Result<User, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<User>('/auth/profile')
    }, {
      fallbackMessage: 'Failed to load user profile',
      context: { operation: 'getProfile' }
    })
  }

  /**
   * Update user profile with safe error handling
   * 
   * @param updates - Profile updates
   * @returns Result containing updated user or error
   */
  static async updateProfile(updates: UpdateProfileDto): Promise<Result<User, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.patch<User>('/auth/profile', updates)
    }, {
      fallbackMessage: 'Failed to update profile',
      context: { operation: 'updateProfile', updates }
    })
  }

  /**
   * Refresh authentication token with safe error handling
   * 
   * @returns Result containing new token or error
   */
  static async refreshToken(): Promise<Result<{ accessToken: string }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.post<{ accessToken: string }>('/auth/refresh', {})
    }, {
      fallbackMessage: 'Token refresh failed',
      context: { operation: 'refreshToken' }
    })
  }
}

// =============================================================================
// ANALYTICS OPERATIONS
// =============================================================================

/**
 * Safe analytics operations with Result pattern
 */
export class AnalyticsService {
  /**
   * Get dashboard statistics with safe error handling
   * 
   * @param dateRange - Optional date range filter
   * @returns Result containing dashboard stats or error
   */
  static async getDashboardStats(dateRange?: {
    startDate: string
    endDate: string
  }): Promise<Result<Record<string, unknown>, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<Record<string, unknown>>('/admin/dashboard/stats', {
        params: dateRange
      })
    }, {
      fallbackMessage: 'Failed to load dashboard statistics',
      context: { operation: 'getDashboardStats', dateRange }
    })
  }

  /**
   * Get analytics data with safe error handling
   * 
   * @param period - Analytics period
   * @returns Result containing analytics data or error
   */
  static async getAnalytics(period: string): Promise<Result<Record<string, unknown>, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<Record<string, unknown>>('/admin/analytics', {
        params: { period }
      })
    }, {
      fallbackMessage: 'Failed to load analytics data',
      context: { operation: 'getAnalytics', period }
    })
  }

  /**
   * Export analytics data with safe error handling
   * 
   * @param options - Export options
   * @returns Result containing export data or error
   */
  static async exportAnalytics(options: {
    period: string
    format: string
  }): Promise<Result<Blob, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<Blob>('/admin/analytics/export', {
        params: options
      })
    }, {
      fallbackMessage: 'Failed to export analytics data',
      context: { operation: 'exportAnalytics', options }
    })
  }
}

// =============================================================================
// CART OPERATIONS
// =============================================================================

/**
 * Safe cart operations with Result pattern
 */
export class CartService {
  /**
   * Validate promo code with safe error handling
   * 
   * @param code - Promo code to validate
   * @param subtotal - Current cart subtotal
   * @returns Result containing discount info or error
   */
  static async validatePromoCode(code: string, subtotal: number): Promise<Result<{ discount: number; message: string }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.post<{ discount: number; message: string }>('/promo/validate', {
        code: code.trim(),
        subtotal
      })
    }, {
      fallbackMessage: 'Failed to validate promo code',
      context: { operation: 'validatePromoCode', code }
    })
  }

  /**
   * Sync cart to server with safe error handling
   * 
   * @param cartItems - Cart items to sync
   * @returns Result containing success status or error
   */
  static async syncCart(cartItems: CartItem[]): Promise<Result<void, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.post<void>('/cart/sync', {
        items: cartItems.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          selectedModifiers: item.selectedModifiers,
          specialInstructions: item.notes
        }))
      })
    }, {
      fallbackMessage: 'Failed to sync cart',
      context: { operation: 'syncCart', itemCount: cartItems.length }
    })
  }

  /**
   * Load cart from server with safe error handling
   * 
   * @returns Result containing cart data or error
   */
  static async loadCart(): Promise<Result<{ items: CartItem[] }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<{ items: CartItem[] }>('/cart')
    }, {
      fallbackMessage: 'Failed to load cart',
      context: { operation: 'loadCart' }
    })
  }

  /**
   * Clear cart on server with safe error handling
   * 
   * @returns Result containing success status or error
   */
  static async clearCart(): Promise<Result<void, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.delete<void>('/cart')
    }, {
      fallbackMessage: 'Failed to clear cart',
      context: { operation: 'clearCart' }
    })
  }
}

// =============================================================================
// TENANT OPERATIONS
// =============================================================================

/**
 * Safe tenant operations with Result pattern
 */
export class TenantService {
  /**
   * Get tenant information with safe error handling
   * 
   * @param slug - Tenant slug
   * @returns Result containing tenant info or error
   */
  static async getTenantInfo(slug: string): Promise<Result<TenantInfo, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<TenantInfo>(`/tenants/${slug}`, {
        bypassTenant: true
      })
    }, {
      fallbackMessage: 'Failed to load tenant information',
      context: { operation: 'getTenantInfo', slug }
    })
  }

  /**
   * Validate tenant access with safe error handling
   * 
   * @param slug - Tenant slug
   * @returns Result containing validation result or error
   */
  static async validateTenant(slug: string): Promise<Result<{ valid: boolean; isActive: boolean }, AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<{ valid: boolean; isActive: boolean }>(`/tenants/${slug}/validate`, {
        bypassTenant: true
      })
    }, {
      fallbackMessage: 'Failed to validate tenant',
      context: { operation: 'validateTenant', slug }
    })
  }

  /**
   * Get available tenants with safe error handling
   * 
   * @returns Result containing tenants list or error
   */
  static async getAvailableTenants(): Promise<Result<TenantInfo[], AppError>> {
    return safeApiCall(async () => {
      const apiClient = useApiClient()
      return apiClient.get<TenantInfo[]>('/tenants', {
        bypassTenant: true
      })
    }, {
      fallbackMessage: 'Failed to load available tenants',
      context: { operation: 'getAvailableTenants' }
    })
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Handle Result in UI components with proper error display
 * 
 * @param result - Result from API operation
 * @param onSuccess - Success callback
 * @param onError - Optional error callback
 */
export function handleApiResult<T>(
  result: Result<T, AppError>,
  onSuccess: (data: T) => void,
  onError?: (error: AppError) => void
): void {
  if (result.success) {
    onSuccess(result.data)
  } else {
    if (onError) {
      onError(result.error)
    } else {
      // Default error handling
      console.error('API operation failed:', result.error)

      // Show user-friendly error message
      const message = result.error.message || 'An unexpected error occurred'

      // In a real app, you might want to use a toast notification service
      if (typeof window !== 'undefined') {
        alert(message)
      }
    }
  }
}

/**
 * Extract validation errors from API error for form handling
 * 
 * @param error - API error that might contain validation details
 * @returns Record of field errors
 */
export function extractValidationErrors(error: AppError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}

  if (error.code === 'VALIDATION_ERROR' && 'details' in error && Array.isArray(error.details)) {
    for (const detail of error.details) {
      if (detail.field && detail.message) {
        fieldErrors[detail.field] = detail.message
      }
    }
  }

  return fieldErrors
}

/**
 * Check if error is retryable
 * 
 * @param error - API error to check
 * @returns True if the operation can be retried
 */
export function isRetryableError(error: AppError): boolean {
  const retryableCodes = [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'SERVER_ERROR',
    'SERVICE_UNAVAILABLE',
    'GATEWAY_TIMEOUT'
  ]

  return retryableCodes.includes(error.code)
}