import type { ApiError } from '~/types'
import { attemptErrorRecovery, type RecoveryStrategy, type RecoveryOptions } from '~/utils/error-recovery'

export function useErrorRecovery() {
  const recovering = ref(false)
  const recoveryAttempts = ref(0)
  const lastRecoveryStrategy = ref<string | null>(null)

  /**
   * Attempt to recover from an error
   */
  const recover = async (
    error: ApiError,
    options?: RecoveryOptions
  ): Promise<boolean> => {
    recovering.value = true
    recoveryAttempts.value = 0

    try {
      const recovered = await attemptErrorRecovery(error, {
        ...options,
        onRecoveryAttempt: (strategy, attempt) => {
          recoveryAttempts.value = attempt
          lastRecoveryStrategy.value = strategy.name
          options?.onRecoveryAttempt?.(strategy, attempt)
        },
        onRecoverySuccess: (strategy) => {
          lastRecoveryStrategy.value = strategy.name
          options?.onRecoverySuccess?.(strategy)
        },
        onRecoveryFailure: (err) => {
          lastRecoveryStrategy.value = null
          options?.onRecoveryFailure?.(err)
        },
      })

      return recovered
    } finally {
      recovering.value = false
    }
  }

  /**
   * Wrap an async operation with automatic error recovery
   */
  const withRecovery = async <T>(
    operation: () => Promise<T>,
    options?: RecoveryOptions & {
      fallback?: T
      onError?: (error: ApiError) => void
    }
  ): Promise<T | null> => {
    try {
      return await operation()
    } catch (error) {
      const apiError = error as ApiError
      
      // Notify about error
      options?.onError?.(apiError)
      
      // Attempt recovery
      const recovered = await recover(apiError, options)
      
      if (recovered) {
        // Retry the operation after successful recovery
        try {
          return await operation()
        } catch (retryError) {
          console.error('Operation failed after recovery:', retryError)
          return options?.fallback ?? null
        }
      }
      
      return options?.fallback ?? null
    }
  }

  /**
   * Create a recoverable version of an API call
   */
  const makeRecoverable = <T>(
    apiCall: () => Promise<T>,
    customStrategies?: RecoveryStrategy[]
  ) => {
    return async (): Promise<T | null> => {
      return withRecovery(apiCall, {
        strategies: customStrategies,
      })
    }
  }

  return {
    recovering: readonly(recovering),
    recoveryAttempts: readonly(recoveryAttempts),
    lastRecoveryStrategy: readonly(lastRecoveryStrategy),
    recover,
    withRecovery,
    makeRecoverable,
  }
}
