import type { ApiError, ApiMeta, ErrorCodes } from '~/types/api'

/**
 * Global Error Handler Composable
 * 
 * Provides centralized error handling for API responses according to the
 * standardized ApiResponse format. Handles authentication redirects,
 * toast notifications, and error logging with requestId.
 * 
 * @example
 * ```typescript
 * const { handleApiError } = useGlobalErrorHandler()
 * 
 * try {
 *   const data = await apiClient.get('/data')
 * } catch (error: ApiError) {
 *   await handleApiError(error, response.meta, { url: '/data', method: 'GET' })
 * }
 * ```
 * 
 * @returns Object containing error handling functions
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
export function useGlobalErrorHandler() {
  const router = useRouter()
  const { showError, showWarning, showInfo, showSuccess } = useNotification()
  const { $i18n } = useNuxtApp()

  /**
   * Main API error handler that processes errors according to their codes
   * 
   * @param error - The API error object containing code, message, and details
   * @param meta - API metadata containing requestId and tenantId for tracing
   * @param requestMeta - Additional request context (URL, method, etc.)
   * 
   * @example
   * ```typescript
   * await handleApiError(
   *   { code: 'VALIDATION_ERROR', message: 'Invalid data', details: [...] },
   *   { requestId: 'req-123', timestamp: '2023-12-20T10:30:00Z' },
   *   { url: '/users', method: 'POST' }
   * )
   * ```
   */
  const handleApiError = async (
    error: ApiError, 
    meta: ApiMeta, 
    requestMeta?: { url?: string; method?: string }
  ): Promise<void> => {
    // Log error with requestId for traceability
    console.error(`API Error [${meta.requestId}]:`, {
      error,
      meta,
      requestMeta,
      timestamp: new Date().toISOString()
    })

    // Handle specific error codes
    switch (error.code) {
      case 'AUTHENTICATION_ERROR':
      case 'AUTH_REQUIRED':
        await handleAuthError(error, meta)
        break
        
      case 'AUTHORIZATION_ERROR':
      case 'ACCESS_DENIED':
        await handleAuthorizationError(error, meta)
        break
        
      case 'VALIDATION_ERROR':
        // Don't show toast for validation errors - they are handled in forms
        break
        
      case 'NETWORK_ERROR':
        showNetworkErrorToast(error, meta)
        break
        
      default:
        showGenericErrorToast(error, meta)
    }
  }

  /**
   * Handle authentication errors (401)
   * Clears tokens and redirects to login page
   */
  const handleAuthError = async (error: ApiError, meta: ApiMeta): Promise<void> => {
    try {
      // Clear authentication tokens using auth store
      const { useUserStore } = await import('~/stores/user')
      const authStore = useUserStore()
      
      if (authStore.clearTokens) {
        authStore.clearTokens()
      }
      
      // Redirect to login page
      await router.push('/auth/login')
      
      // Show localized error message
      const message = $i18n.t('errors.authenticationRequired', 'Authentication required. Please log in again.')
      showError('Authentication Required', message)
      
      console.log(`Authentication error handled [${meta.requestId}]: User redirected to login`)
    } catch (redirectError) {
      console.error(`Failed to handle auth error [${meta.requestId}]:`, redirectError)
      // Fallback: reload page to clear state
      window.location.href = '/auth/login'
    }
  }

  /**
   * Handle authorization errors (403)
   * Shows error message or redirects to 403 page
   */
  const handleAuthorizationError = async (error: ApiError, meta: ApiMeta): Promise<void> => {
    try {
      // Check if we should redirect to 403 page or show modal
      const currentRoute = router.currentRoute.value
      
      if (currentRoute.path !== '/403') {
        // Redirect to 403 page for better UX
        await router.push('/403')
      }
      
      // Show localized error message
      const message = $i18n.t('errors.accessDenied', 'Access denied. You do not have permission to perform this action.')
      showError('Access Denied', message)
      
      console.log(`Authorization error handled [${meta.requestId}]: Access denied`)
    } catch (redirectError) {
      console.error(`Failed to handle authorization error [${meta.requestId}]:`, redirectError)
      // Fallback: show error toast
      showError('Access Denied', 'Access denied')
    }
  }

  /**
   * Show network error toast with retry option
   */
  const showNetworkErrorToast = (error: ApiError, meta: ApiMeta): void => {
    const message = $i18n.t('errors.networkError', 'Network error. Please check your connection and try again.')
    
    showError('Network Error', message)
    
    console.warn(`Network error [${meta.requestId}]:`, error.message)
  }

  /**
   * Show generic error toast for unhandled error codes
   */
  const showGenericErrorToast = (error: ApiError, meta: ApiMeta): void => {
    // Try to get localized message based on error code
    const localizedMessage = $i18n.te(`errors.${error.code}`) 
      ? $i18n.t(`errors.${error.code}`)
      : error.message // Fallback to server message
    
    showError('Error', localizedMessage)
    
    console.warn(`Generic error [${meta.requestId}]:`, {
      code: error.code,
      message: error.message,
      details: error.details
    })
  }

  /**
   * Handle network errors (fetch failures, timeouts)
   * Creates synthetic ApiError for network issues
   */
  const handleNetworkError = (fetchError: Error, requestUrl?: string): ApiError => {
    const syntheticError: ApiError = {
      code: 'NETWORK_ERROR',
      message: 'Network request failed. Please check your internet connection.',
      details: {
        originalError: fetchError.message,
        url: requestUrl,
        timestamp: new Date().toISOString()
      }
    }

    const syntheticMeta: ApiMeta = {
      requestId: `network-error-${Date.now()}`,
      timestamp: new Date().toISOString()
    }

    // Handle the synthetic error
    handleApiError(syntheticError, syntheticMeta, { url: requestUrl })
    
    return syntheticError
  }

  /**
   * Check if error should trigger retry logic
   */
  const shouldRetry = (error: ApiError): boolean => {
    // Retry for network errors and server errors (5xx)
    return error.code === 'NETWORK_ERROR' || 
           error.code === 'SERVER_ERROR' ||
           error.code === 'TIMEOUT_ERROR'
  }

  /**
   * Handle offline mode
   * Shows appropriate message and enables offline features
   */
  const handleOfflineMode = (): void => {
    const message = $i18n.t('errors.offline', 'You are currently offline. Some features may be limited.')
    
    showInfo('Offline Mode', message)
    
    console.log('Application entered offline mode')
  }

  /**
   * Handle return to online mode
   */
  const handleOnlineMode = (): void => {
    const message = $i18n.t('success.backOnline', 'Connection restored. You are back online.')
    
    showSuccess('Back Online', message)
    
    console.log('Application returned to online mode')
  }

  return {
    handleApiError,
    handleAuthError,
    handleAuthorizationError,
    handleNetworkError,
    showNetworkErrorToast,
    showGenericErrorToast,
    shouldRetry,
    handleOfflineMode,
    handleOnlineMode
  }
}
