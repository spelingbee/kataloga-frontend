import type { ApiError } from '~/types'

export interface GlobalErrorHandlerOptions {
  enableAutoRecovery?: boolean
  enableSentry?: boolean
  enableLocalStorage?: boolean
  showUserNotifications?: boolean
}

export function useGlobalErrorHandler(options: GlobalErrorHandlerOptions = {}) {
  const {
    enableAutoRecovery = true,
    enableSentry = true,
    enableLocalStorage = true,
    showUserNotifications = true,
  } = options

  const { handleError, handleApiError } = useErrorHandler()
  const { recover } = useErrorRecovery()
  const { showNotification } = useNotifications()
  const nuxtApp = useNuxtApp()

  /**
   * Handle any error with full recovery pipeline
   */
  const handleGlobalError = async (
    error: Error | ApiError | string,
    context?: Record<string, any>
  ): Promise<void> => {
    // Normalize error
    const normalizedError = handleError(error, {
      showToast: false, // We'll handle notifications ourselves
      logError: true,
      reportError: enableSentry,
    })

    // Show user notification if enabled
    if (showUserNotifications) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: normalizedError.message || 'An error occurred',
        duration: 5000,
      })
    }

    // Attempt auto-recovery if enabled
    if (enableAutoRecovery && isRecoverableError(normalizedError)) {
      const recovered = await recover(normalizedError, {
        onRecoverySuccess: () => {
          if (showUserNotifications) {
            showNotification({
              type: 'success',
              title: 'Recovered',
              message: 'The error has been automatically resolved',
              duration: 3000,
            })
          }
        },
        onRecoveryFailure: () => {
          if (showUserNotifications) {
            showNotification({
              type: 'warning',
              title: 'Recovery Failed',
              message: 'Unable to automatically recover. Please try again or contact support.',
              duration: 5000,
            })
          }
        },
      })

      if (recovered) {
        console.log('Error recovered successfully')
      }
    }

    // Store in localStorage if enabled (for debugging and offline sync)
    if (enableLocalStorage) {
      storeErrorLocally(normalizedError, context)
    }

    // Report to Sentry if available and enabled
    if (enableSentry && nuxtApp.$sentry) {
      nuxtApp.$sentry.captureException(error, {
        extra: context,
      })
    }
  }

  /**
   * Handle API errors with retry logic
   */
  const handleGlobalApiError = async <T>(
    apiCall: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      return await handleApiError(apiCall, {
        showToast: showUserNotifications,
        logError: true,
        reportError: enableSentry,
        retryConfig: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          retryableStatuses: [408, 429, 500, 502, 503, 504],
          nonRetryableStatuses: [400, 401, 403, 404, 422],
        },
      })
    } catch (error) {
      await handleGlobalError(error as Error, context)
      return null
    }
  }

  /**
   * Check if error is recoverable
   */
  const isRecoverableError = (error: ApiError): boolean => {
    // Don't try to recover from client errors (except auth)
    if (error.status && error.status >= 400 && error.status < 500) {
      return error.status === 401 || error.status === 409 || error.status === 422
    }

    // Try to recover from server errors and network errors
    return true
  }

  /**
   * Store error locally for debugging and offline sync
   */
  const storeErrorLocally = (error: ApiError, context?: Record<string, any>) => {
    try {
      const errorReport = {
        error: {
          name: error.name,
          message: error.message,
          status: error.status,
          code: error.code,
          details: error.details,
        },
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }

      const existingErrors = JSON.parse(
        localStorage.getItem('global-error-reports') || '[]'
      )
      existingErrors.push(errorReport)

      // Keep only last 100 errors
      if (existingErrors.length > 100) {
        existingErrors.splice(0, existingErrors.length - 100)
      }

      localStorage.setItem('global-error-reports', JSON.stringify(existingErrors))
    } catch (storageError) {
      console.error('Failed to store error locally:', storageError)
    }
  }

  /**
   * Get stored errors from localStorage
   */
  const getStoredErrors = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('global-error-reports') || '[]')
    } catch {
      return []
    }
  }

  /**
   * Clear stored errors
   */
  const clearStoredErrors = () => {
    try {
      localStorage.removeItem('global-error-reports')
      localStorage.removeItem('error-reports')
      localStorage.removeItem('error-reports-fallback')
    } catch (error) {
      console.error('Failed to clear stored errors:', error)
    }
  }

  /**
   * Sync stored errors to server (for offline recovery)
   */
  const syncStoredErrors = async (): Promise<void> => {
    const errors = getStoredErrors()
    
    if (errors.length === 0) {
      return
    }

    try {
      await $fetch('/api/errors/batch', {
        method: 'POST',
        body: { errors },
      })

      // Clear after successful sync
      clearStoredErrors()
      
      console.log(`Synced ${errors.length} stored errors to server`)
    } catch (error) {
      console.error('Failed to sync stored errors:', error)
    }
  }

  return {
    handleGlobalError,
    handleGlobalApiError,
    isRecoverableError,
    getStoredErrors,
    clearStoredErrors,
    syncStoredErrors,
  }
}
