import { defineStore } from 'pinia'
import type { ApiError } from '~/types'
import { isDefined, safePropertyAccess } from '~/types/utils/type-guards'

export interface ErrorState {
  errors: ApiError[]
  globalError: ApiError | null
  isOffline: boolean
  retryQueue: Array<{
    id: string
    action: () => Promise<any>
    retries: number
    maxRetries: number
  }>
}

export const useErrorStore = defineStore('error', {
  state: (): ErrorState => ({
    errors: [],
    globalError: null,
    isOffline: false,
    retryQueue: [],
  }),

  getters: {
    hasErrors: (state) => state.errors.length > 0,
    hasGlobalError: (state) => !!state.globalError,
    errorCount: (state) => state.errors.length,
    
    criticalErrors: (state) => 
      state.errors.filter(error => 
        isDefined(error.status) && error.status >= 500
      ),
    
    authErrors: (state) => 
      state.errors.filter(error => 
        isDefined(error.status) && (error.status === 401 || error.status === 403)
      ),
    
    networkErrors: (state) => 
      state.errors.filter(error => 
        !isDefined(error.status) || 
        error.message?.includes('fetch') || 
        error.message?.includes('network')
      ),
  },

  actions: {
    addError(error: ApiError | Error | string) {
      const normalizedError = this.normalizeError(error)
      
      // Avoid duplicate errors
      const isDuplicate = this.errors.some(existing => 
        existing.message === normalizedError.message &&
        safePropertyAccess(existing, 'status') === safePropertyAccess(normalizedError, 'status')
      )
      
      if (!isDuplicate) {
        this.errors.push(normalizedError)
        
        // Keep only last 50 errors
        if (this.errors.length > 50) {
          this.errors.splice(0, this.errors.length - 50)
        }
      }
      
      // Set as global error if it's critical
      if (this.isCriticalError(normalizedError)) {
        this.globalError = normalizedError
      }
    },

    removeError(error: ApiError) {
      const index = this.errors.findIndex(e => 
        e.message === error.message && 
        safePropertyAccess(e, 'status') === safePropertyAccess(error, 'status')
      )
      if (index > -1) {
        this.errors.splice(index, 1)
      }
    },

    clearErrors() {
      this.errors = []
      this.globalError = null
    },

    setGlobalError(error: ApiError | Error | string | null) {
      this.globalError = error ? this.normalizeError(error) : null
    },

    clearGlobalError() {
      this.globalError = null
    },

    setOfflineStatus(isOffline: boolean) {
      this.isOffline = isOffline
      
      if (!isOffline && this.retryQueue.length > 0) {
        this.processRetryQueue()
      }
    },

    addToRetryQueue(action: () => Promise<any>, maxRetries: number = 3) {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      this.retryQueue.push({
        id,
        action,
        retries: 0,
        maxRetries,
      })
      
      // Process immediately if online
      if (!this.isOffline) {
        this.processRetryQueue()
      }
    },

    async processRetryQueue() {
      const queue = [...this.retryQueue]
      this.retryQueue = []
      
      for (const item of queue) {
        try {
          await item.action()
        } catch (error) {
          item.retries++
          
          if (item.retries < item.maxRetries) {
            // Add back to queue with delay
            setTimeout(() => {
              this.retryQueue.push(item)
            }, 1000 * item.retries)
          } else {
            // Max retries reached, add to errors
            this.addError(error as ApiError)
          }
        }
      }
    },

    normalizeError(error: ApiError | Error | string): ApiError {
      if (typeof error === 'string') {
        return {
          code: 'GENERIC_ERROR',
          message: error,
        }
      }

      if (error instanceof Error) {
        const errorWithExtras = error as Error & Record<string, unknown>
        return {
          code: (typeof errorWithExtras.code === 'string') ? errorWithExtras.code : 'UNKNOWN_ERROR',
          message: error.message,
          status: (typeof errorWithExtras.status === 'number') ? errorWithExtras.status : undefined,
          details: errorWithExtras.details as ApiError['details'],
        }
      }

      return error
    },

    isCriticalError(error: ApiError): boolean {
      // Consider server errors and auth errors as critical
      const status = safePropertyAccess(error, 'status')
      return isDefined(status) && (status >= 500 || status === 401)
    },

    getErrorsByType(type: 'network' | 'auth' | 'validation' | 'server'): ApiError[] {
      return this.errors.filter(error => {
        const status = safePropertyAccess(error, 'status')
        const message = safePropertyAccess(error, 'message')
        
        switch (type) {
          case 'network':
            return !isDefined(status) || 
                   (message && (message.includes('fetch') || message.includes('network')))
          case 'auth':
            return isDefined(status) && (status === 401 || status === 403)
          case 'validation':
            return isDefined(status) && status === 422
          case 'server':
            return isDefined(status) && status >= 500
          default:
            return false
        }
      })
    },

    // Utility method to handle common error scenarios
    handleCommonErrors(error: ApiError) {
      const status = safePropertyAccess(error, 'status')
      
      if (!isDefined(status)) {
        this.addError(error)
        return
      }
      
      switch (status) {
        case 401:
          // Redirect to login
          navigateTo('/login')
          break
        case 403:
          // Show permission denied message
          this.setGlobalError('You do not have permission to perform this action')
          break
        case 404:
          // Show not found message
          this.addError('The requested resource was not found')
          break
        case 429:
          // Add to retry queue
          this.addError('Too many requests. Please try again later.')
          break
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors - show global error
          this.setGlobalError('Server error. Please try again later.')
          break
        default:
          this.addError(error)
      }
    },
  },
})

// Auto-setup online/offline detection
if (import.meta.client) {
  const errorStore = useErrorStore()
  
  window.addEventListener('online', () => {
    errorStore.setOfflineStatus(false)
  })
  
  window.addEventListener('offline', () => {
    errorStore.setOfflineStatus(true)
  })
  
  // Set initial status
  errorStore.setOfflineStatus(typeof navigator !== 'undefined' && 'onLine' in navigator ? !navigator.onLine : false)
}