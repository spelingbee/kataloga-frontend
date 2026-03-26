import type { ApiResponse } from '~/types'

export interface UseApiOptions {
  immediate?: boolean
  showError?: boolean
  errorMessage?: string
  retries?: number
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const {
    immediate = false,
    showError = true,
    errorMessage,
    retries = 0
  } = options

  const {
    error,
    isError,
    isLoading,
    handleApiCall,
    getErrorMessage,
    retry,
    clearError
  } = useApiError()

  const data = ref<T | null>(null)
  const isSuccess = computed(() => !isError.value && data.value !== null)

  const execute = async (): Promise<T | null> => {
    const response = await handleApiCall(
      async () => {
        const result = await apiCall()
        if (result.success && result.data !== undefined) {
          data.value = result.data
          return result.data
        } else {
          throw new Error(result.error?.message || 'API call failed')
        }
      },
      { showError, errorMessage }
    )

    return response
  }

  const refresh = async (): Promise<T | null> => {
    clearError()
    return execute()
  }

  const executeWithRetry = async (): Promise<T | null> => {
    if (retries > 0) {
      return retry(
        async () => {
          const result = await apiCall()
          if (result.success && result.data !== undefined) {
            data.value = result.data
            return result.data
          } else {
            throw new Error(result.error?.message || 'API call failed')
          }
        },
        { retryConfig: { maxRetries: retries } }
      )
    } else {
      return execute()
    }
  }

  // Execute immediately if requested
  if (immediate) {
    executeWithRetry()
  }

  return {
    data: readonly(data),
    error,
    isError,
    isLoading,
    isSuccess,
    execute,
    refresh,
    executeWithRetry,
    getErrorMessage,
    clearError,
  }
}

// Specialized composables for common patterns
export function useApiData<T>(
  key: string,
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions & {
    default?: () => T
    server?: boolean
  } = {}
) {
  const { default: defaultValue, server = true } = options

  // Use Nuxt's built-in caching with our API wrapper
  return useLazyAsyncData(key, async () => {
    const response = await apiCall()
    if (response.success && response.data !== undefined) {
      return response.data
    } else {
      throw new Error(response.error?.message || 'API call failed')
    }
  }, {
    default: defaultValue,
    server,
  })
}

export function useLazyApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  return useApi(apiCall, { ...options, immediate: false })
}

export function useImmediateApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  return useApi(apiCall, { ...options, immediate: true })
}