import { useOfflineStore } from '~/stores/offline'
import { useCartStore } from '~/stores/cart'
import { useMenuStore } from '~/stores/menu'
import { useAuthStore } from '~/stores/auth'
import { useNotification } from '~/composables/useNotification'
import type { ApiError } from '~/types'
import { isDefined, safePropertyAccess } from '~/types/utils/type-guards'

export interface RecoveryStrategy {
  name: string
  canRecover: (error: ApiError) => boolean
  recover: () => Promise<boolean>
  description: string
}

export interface RecoveryOptions {
  maxAttempts?: number
  strategies?: RecoveryStrategy[]
  onRecoveryAttempt?: (strategy: RecoveryStrategy, attempt: number) => void
  onRecoverySuccess?: (strategy: RecoveryStrategy) => void
  onRecoveryFailure?: (error: ApiError) => void
}

/**
 * Attempts to recover from an error using various strategies
 */
export async function attemptErrorRecovery(
  error: ApiError,
  options: RecoveryOptions = {}
): Promise<boolean> {
  const {
    maxAttempts = 3,
    strategies = getDefaultRecoveryStrategies(),
    onRecoveryAttempt,
    onRecoverySuccess,
    onRecoveryFailure,
  } = options

  // Find applicable recovery strategies
  const applicableStrategies = strategies.filter(strategy =>
    strategy.canRecover(error)
  )

  if (applicableStrategies.length === 0) {
    console.warn('No recovery strategies available for error:', error)
    onRecoveryFailure?.(error)
    return false
  }

  // Try each strategy
  for (const strategy of applicableStrategies) {
    let attempt = 0

    while (attempt < maxAttempts) {
      attempt++

      try {
        onRecoveryAttempt?.(strategy, attempt)

        const recovered = await strategy.recover()

        if (recovered) {
          console.log(`Recovery successful using strategy: ${strategy.name}`)
          onRecoverySuccess?.(strategy)
          return true
        }
      } catch (recoveryError) {
        console.error(`Recovery attempt ${attempt} failed for strategy ${strategy.name}:`, recoveryError)
      }

      // Wait before next attempt with exponential backoff
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error('All recovery strategies exhausted')
  onRecoveryFailure?.(error)
  return false
}

/**
 * Default recovery strategies
 */
export function getDefaultRecoveryStrategies(): RecoveryStrategy[] {
  return [
    // Strategy 1: Refresh authentication token
    {
      name: 'refresh-auth',
      description: 'Refresh authentication token',
      canRecover: (error) => safePropertyAccess(error, 'status') === 401,
      recover: async () => {
        try {
          const apiClient = useApiClient()

          // Use API client's handleTokenRefresh
          const success = await apiClient.handleTokenRefresh()
          return success
        } catch {
          return false
        }
      },
    },

    // Strategy 2: Clear and reload cached data
    {
      name: 'clear-cache',
      description: 'Clear cached data and reload',
      canRecover: (error) => {
        const status = safePropertyAccess(error, 'status')
        const message = safePropertyAccess(error, 'message')

        return (isDefined(status) && (status === 409 || status === 412)) ||
          (typeof message === 'string' && (message.includes('cache') || message.includes('stale')))
      },
      recover: async () => {
        try {
          // Clear relevant caches
          const menuStore = useMenuStore()
          const cartStore = useCartStore()

          await menuStore.fetchMenu()

          // Check if validateCartAgainstMenu method exists and is callable
          if (typeof cartStore.validateCartAgainstMenu === 'function') {
            await cartStore.validateCartAgainstMenu()
          }

          return true
        } catch {
          return false
        }
      },
    },

    // Strategy 3: Retry with fresh data
    {
      name: 'retry-fresh',
      description: 'Retry operation with fresh data',
      canRecover: (error) => {
        const status = safePropertyAccess(error, 'status')
        return isDefined(status) && (status === 422 || status === 409)
      },
      recover: async () => {
        // This is a placeholder - actual implementation would depend on context
        // The calling code should provide a custom strategy for this
        return false
      },
    },

    // Strategy 4: Fallback to offline mode
    {
      name: 'offline-fallback',
      description: 'Switch to offline mode',
      canRecover: (error) => {
        const status = safePropertyAccess(error, 'status')
        return (isDefined(status) && (status === 503 || status === 504)) ||
          (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine)
      },
      recover: async () => {
        try {
          // Enable offline mode
          const offlineStore = useOfflineStore()
          offlineStore.setOfflineMode(true)

          // Try to show notification to user
          try {
            const { showNotification } = useNotification()
            if (typeof showNotification === 'function') {
              showNotification({
                type: 'warning',
                title: 'Offline Mode',
                message: 'You are now in offline mode. Some features may be limited.',
              })
            }
          } catch (notificationError) {
            // Notification failed, but offline mode is still enabled
            console.warn('Failed to show offline notification:', notificationError)
          }

          return true
        } catch {
          return false
        }
      },
    },

    // Strategy 5: Reload page as last resort
    {
      name: 'page-reload',
      description: 'Reload the page',
      canRecover: (error) => {
        const status = safePropertyAccess(error, 'status')
        const message = safePropertyAccess(error, 'message')

        return (isDefined(status) && status === 500) ||
          (typeof message === 'string' && (message.includes('chunk') || message.includes('module')))
      },
      recover: async () => {
        // Ask user before reloading
        const confirmed = confirm(
          'An error occurred. Would you like to reload the page to try again?'
        )

        if (confirmed) {
          window.location.reload()
          return true
        }

        return false
      },
    },
  ]
}

/**
 * Get user-friendly error message with recovery suggestions
 */
export function getErrorMessageWithRecovery(error: ApiError): {
  message: string
  suggestions: string[]
  canRecover: boolean
} {
  const strategies = getDefaultRecoveryStrategies()
  const applicableStrategies = strategies.filter(s => s.canRecover(error))

  const baseMessage = getBaseErrorMessage(error)
  const suggestions = applicableStrategies.map(s => s.description)

  return {
    message: baseMessage,
    suggestions,
    canRecover: applicableStrategies.length > 0,
  }
}

function getBaseErrorMessage(error: ApiError): string {
  const status = safePropertyAccess(error, 'status')

  if (!isDefined(status)) {
    return safePropertyAccess(error, 'message') || 'An unexpected error occurred.'
  }

  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.'
    case 401:
      return 'Your session has expired. Please log in again.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return 'A conflict occurred. The data may have been updated by someone else.'
    case 422:
      return 'Please check your input and try again.'
    case 429:
      return 'Too many requests. Please wait a moment and try again.'
    case 500:
      return 'An internal server error occurred. Please try again later.'
    case 502:
    case 503:
    case 504:
      return 'The service is temporarily unavailable. Please try again later.'
    default:
      return safePropertyAccess(error, 'message') || 'An unexpected error occurred.'
  }
}

/**
 * Create a custom recovery strategy
 */
export function createRecoveryStrategy(
  name: string,
  description: string,
  canRecover: (error: ApiError) => boolean,
  recover: () => Promise<boolean>
): RecoveryStrategy {
  return {
    name,
    description,
    canRecover,
    recover,
  }
}
