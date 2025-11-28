import { defineStore } from 'pinia'
import type { ApiError } from '~/types'

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
        error.status && error.status >= 500
      ),
    
    authErrors: (state) => 
      state.errors.filter(error => 
        error.status === 401 || error.status === 403
      ),
    
    networkErrors: (state) => 
      state.errors.filter(error => 
        !error.status || error.message?.includes('fetch') || error.message?.includes('network')
      ),
  },

  actions: {
    addError(error: ApiError | Error | string) {
      const normalizedError = this.normalizeError(error)
      
      // Avoid duplicate errors
      const isDuplicate = this.errors.some(existing => 
        existing.message === normalizedError.message &&
        existing.status === normalizedError.status
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
        e.message === error.message && e.status === error.status
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
          name: 'Error',
          message: error,
        }
      }

      if (error instanceof Error) {
        return {
          name: error.name,
          message: error.message,
          status: 'status' in error ? (error as ApiError).status : undefined,
          code: 'code' in error ? (error as ApiError).code : undefined,
          details: 'details' in error ? (error as ApiError).details : undefined,
        }
      }

      return error
    },

    isCriticalError(error: ApiError): boolean {
      // Consider server errors and auth errors as critical
      return !!(error.status && (error.status >= 500 || error.status === 401))
    },

    getErrorsByType(type: 'network' | 'auth' | 'validation' | 'server'): ApiError[] {
      return this.errors.filter(error => {
        switch (type) {
          case 'network':
            return !error.status || error.message?.includes('fetch') || error.message?.includes('network')
          case 'auth':
            return error.status === 401 || error.status === 403
          case 'validation':
            return error.status === 422
          case 'server':
            return error.status && error.status >= 500
          default:
            return false
        }
      })
    },

    // Utility method to handle common error scenarios
    handleCommonErrors(error: ApiError) {
      switch (error.status) {
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
  errorStore.setOfflineStatus(!navigator.onLine)
}