import type { ApiError } from '~/types'
import type { RetryConfig } from './useErrorHandler'

export interface ErrorState {
  error: ApiError | null
  isError: boolean
  isLoading: boolean
}

export function useApiError() {
  const error = ref<ApiError | null>(null)
  const isError = computed(() => !!error.value)
  const isLoading = ref(false)
  const { handleApiError, DEFAULT_RETRY_CONFIG } = useErrorHandler()

  const setError = (err: ApiError | Error | string) => {
    if (typeof err === 'string') {
      error.value = {
        name: 'ApiError',
        message: err,
      }
    } else if (err instanceof Error) {
      error.value = {
        name: err.name,
        message: err.message,
        status: 'status' in err ? (err as ApiError).status : undefined,
        code: 'code' in err ? (err as ApiError).code : undefined,
        details: 'details' in err ? (err as ApiError).details : undefined,
      }
    } else {
      error.value = err
    }
  }

  const clearError = () => {
    error.value = null
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const handleApiCall = async <T>(
    apiCall: () => Promise<T>,
    options?: {
      showError?: boolean
      errorMessage?: string
      retryConfig?: Partial<RetryConfig>
      errorContext?: Record<string, any>
    }
  ): Promise<T | null> => {
    clearError()
    setLoading(true)

    try {
      const result = await handleApiError(apiCall, {
        showToast: options?.showError !== false,
        fallbackMessage: options?.errorMessage,
        retryConfig: {
          ...DEFAULT_RETRY_CONFIG,
          ...options?.retryConfig,
        },
        reportError: true,
      })
      
      return result
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError)
      
      // Report error with additional context for better categorization
      const { $reportError } = useNuxtApp()
      if ($reportError && typeof $reportError === 'function') {
        $reportError(apiError, {
          type: 'http-error',
          apiCall: apiCall.name || 'anonymous',
          ...options?.errorContext,
        })
      }
      
      return null
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (fallback: string = 'An error occurred'): string => {
    if (!error.value) return fallback
    
    // Handle specific error types
    if (error.value.status === 401) {
      return 'Please log in to continue'
    }
    
    if (error.value.status === 403) {
      return 'You do not have permission to perform this action'
    }
    
    if (error.value.status === 404) {
      return 'The requested resource was not found'
    }
    
    if (error.value.status === 422) {
      return 'Please check your input and try again'
    }
    
    if (error.value.status === 429) {
      return 'Too many requests. Please try again later'
    }
    
    if (error.value.status && error.value.status >= 500) {
      return 'Server error. Please try again later'
    }
    
    return error.value.message || fallback
  }

  const isNetworkError = computed(() => {
    return error.value?.message?.includes('fetch') || 
           error.value?.message?.includes('network') ||
           error.value?.message?.includes('timeout')
  })

  const isAuthError = computed(() => {
    return error.value?.status === 401 || error.value?.status === 403
  })

  const isValidationError = computed(() => {
    return error.value?.status === 422
  })

  const isServerError = computed(() => {
    return error.value?.status && error.value.status >= 500
  })

  const isClientError = computed(() => {
    return error.value?.status && error.value.status >= 400 && error.value.status < 500
  })

  const isRetryableError = computed(() => {
    if (!error.value?.status) return true // Network errors are generally retryable
    
    const status = error.value.status
    const retryableStatuses = DEFAULT_RETRY_CONFIG.retryableStatuses
    const nonRetryableStatuses = DEFAULT_RETRY_CONFIG.nonRetryableStatuses
    
    // Check if status is explicitly non-retryable (prevents retry loops for 4xx errors)
    if (nonRetryableStatuses.includes(status)) {
      return false
    }
    
    // Check if status is explicitly retryable
    if (retryableStatuses.includes(status)) {
      return true
    }
    
    // Default: retry server errors (5xx), don't retry client errors (4xx)
    return status >= 500
  })

  const getErrorCategory = computed(() => {
    if (!error.value) return null
    
    if (isNetworkError.value) return 'network'
    if (isAuthError.value) return 'authentication'
    if (isValidationError.value) return 'validation'
    if (isServerError.value) return 'server'
    if (isClientError.value) return 'client'
    
    return 'unknown'
  })

  const retry = async <T>(
    apiCall: () => Promise<T>,
    options?: {
      retryConfig?: Partial<RetryConfig>
      showError?: boolean
      errorContext?: Record<string, any>
    }
  ): Promise<T | null> => {
    return await handleApiCall(apiCall, {
      showError: options?.showError,
      retryConfig: options?.retryConfig,
      errorContext: {
        ...options?.errorContext,
        isRetry: true,
      },
    })
  }

  return {
    error: readonly(error),
    isError,
    isLoading: readonly(isLoading),
    isNetworkError,
    isAuthError,
    isValidationError,
    isServerError,
    isClientError,
    isRetryableError,
    getErrorCategory,
    setError,
    clearError,
    setLoading,
    handleApiCall,
    getErrorMessage,
    retry,
  }
}
