import type { ApiError } from '~/types'

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  reportError?: boolean
  fallbackMessage?: string
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  retryableStatuses: number[]
  nonRetryableStatuses: number[]
}

// Default retry configuration based on requirements
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  nonRetryableStatuses: [400, 401, 403, 404, 422],
}

export function useErrorHandler() {
  const nuxtApp = useNuxtApp()
  const $reportError = (nuxtApp.$reportError as Function) || (() => {})

  const hasError = ref(false)
  const errorMessage = ref('')

  const handleError = (
    error: Error | ApiError | string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      reportError = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options

    // Normalize error
    const normalizedError = normalizeError(error, fallbackMessage)

    hasError.value = true
    errorMessage.value = normalizedError.message || fallbackMessage

    // Log error
    if (logError) {
      console.error('Error handled:', normalizedError)
    }

    // Report error to tracking service with fallback to localStorage
    if (reportError && $reportError) {
      try {
        $reportError(normalizedError, {
          type: 'handled-error',
          component: getCurrentInstance()?.type.name || 'Unknown',
        })
      } catch (reportingError) {
        // Fallback to localStorage when API is unavailable
        fallbackToLocalStorage(normalizedError, {
          type: 'handled-error',
          component: getCurrentInstance()?.type.name || 'Unknown',
          reportingError: reportingError instanceof Error ? reportingError.message : String(reportingError)
        })
      }
    }

    // Show toast notification (if toast system is available)
    if (showToast) {
      showErrorToast(normalizedError)
    }

    return normalizedError
  }

  const handleApiError = async <T>(
    apiCall: () => Promise<T>,
    options: ErrorHandlerOptions & {
      retryConfig?: Partial<RetryConfig>
    } = {}
  ): Promise<T | null> => {
    const config = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig }
    const { retryConfig, ...errorOptions } = options

    let lastError: Error | null = null
    let attempt = 0

    while (attempt <= config.maxRetries) {
      try {
        return await apiCall()
      } catch (error) {
        lastError = error as Error
        attempt++

        // Check if error is retryable
        if (!isRetryableError(error, config)) {
          break
        }

        // Don't wait after the last attempt
        if (attempt <= config.maxRetries) {
          const delay = calculateExponentialBackoff(attempt - 1, config.baseDelay, config.maxDelay)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // Handle the final error
    if (lastError) {
      handleError(lastError, errorOptions)
    }

    return null
  }

  const isRetryableError = (error: any, config: RetryConfig): boolean => {
    if (!isApiError(error)) {
      // Network errors and other non-API errors are generally retryable
      return true
    }

    const status = error.status
    if (!status) return true

    // Check if status is explicitly non-retryable
    if (config.nonRetryableStatuses.includes(status)) {
      return false
    }

    // Check if status is explicitly retryable
    if (config.retryableStatuses.includes(status)) {
      return true
    }

    // Default: retry server errors (5xx), don't retry client errors (4xx)
    return status >= 500
  }

  const calculateExponentialBackoff = (
    attempt: number,
    baseDelay: number,
    maxDelay: number
  ): number => {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelay * Math.pow(2, attempt)
    
    // Add jitter to prevent thundering herd (±10% random variation)
    const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1)
    const delayWithJitter = exponentialDelay + jitter
    
    // Cap at maxDelay
    return Math.min(Math.max(delayWithJitter, baseDelay), maxDelay)
  }

  const fallbackToLocalStorage = (error: ApiError, context: any) => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        status: error.status,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        context,
        fallback: true, // Mark as fallback storage
      }

      const existingErrors = JSON.parse(localStorage.getItem('error-reports-fallback') || '[]')
      existingErrors.push(errorReport)
      
      // Keep only last 100 fallback errors
      if (existingErrors.length > 100) {
        existingErrors.splice(0, existingErrors.length - 100)
      }
      
      localStorage.setItem('error-reports-fallback', JSON.stringify(existingErrors))
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error reporting failed, stored in localStorage fallback:', errorReport)
      }
    } catch (storageError) {
      console.error('Failed to store error in localStorage fallback:', storageError)
    }
  }

  const normalizeError = (
    error: Error | ApiError | string,
    fallback: string
  ): ApiError => {
    if (typeof error === 'string') {
      return {
        name: 'Error',
        message: error || fallback,
      }
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message || fallback,
        status: 'status' in error ? (error as ApiError).status : undefined,
        code: 'code' in error ? (error as ApiError).code : undefined,
        details: 'details' in error ? (error as ApiError).details : undefined,
      }
    }

    return error
  }

  const isApiError = (error: any): error is ApiError => {
    return error && typeof error === 'object' && 'status' in error
  }

  const getErrorMessage = (error: Error | ApiError | string): string => {
    const normalized = normalizeError(error, 'An error occurred')

    // Return user-friendly messages based on status
    switch (normalized.status) {
      case 400:
        return 'Invalid request. Please check your input.'
      case 401:
        return 'Please log in to continue.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return 'The requested resource was not found.'
      case 408:
        return 'Request timeout. Please try again.'
      case 409:
        return 'Conflict detected. Please refresh and try again.'
      case 422:
        return 'Please check your input and try again.'
      case 429:
        return 'Too many requests. Please try again later.'
      case 500:
        return 'Internal server error. Please try again later.'
      case 502:
        return 'Bad gateway. Please try again later.'
      case 503:
        return 'Service temporarily unavailable. Please try again later.'
      case 504:
        return 'Gateway timeout. Please try again later.'
      default:
        return normalized.message || 'An unexpected error occurred.'
    }
  }

  const showErrorToast = (error: ApiError) => {
    // This would integrate with your toast/notification system
    // For now, we'll use a simple console log
    const message = getErrorMessage(error)
    
    // Example integration with a toast library:
    // toast.error(message)
    
    console.warn('Error Toast:', message)
  }

  return {
    handleError,
    handleApiError,
    normalizeError,
    getErrorMessage,
    isRetryableError: (error: Error | ApiError) => isRetryableError(error, DEFAULT_RETRY_CONFIG),
    calculateExponentialBackoff,
    fallbackToLocalStorage,
    isApiError,
    DEFAULT_RETRY_CONFIG,
    hasError,
    errorMessage,
  }
}
