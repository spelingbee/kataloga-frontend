import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useErrorHandler } from '~/composables/useErrorHandler'

// Mock getCurrentInstance
vi.mock('vue', () => ({
  getCurrentInstance: vi.fn(() => ({
    type: { name: 'TestComponent' }
  }))
}))

// Mock useNuxtApp
vi.mock('#app', () => ({
  useNuxtApp: vi.fn(() => ({
    $reportError: vi.fn()
  }))
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('retry mechanism', () => {
    it('should implement maximum retry limits', async () => {
      const { handleApiError } = useErrorHandler()
      let callCount = 0
      
      const failingApiCall = vi.fn(() => {
        callCount++
        throw new Error('Network error')
      })

      const result = await handleApiError(failingApiCall, {
        retryConfig: { maxRetries: 2, baseDelay: 10, maxDelay: 100, retryableStatuses: [500], nonRetryableStatuses: [400] }
      })

      expect(result).toBeNull()
      expect(callCount).toBe(3) // Initial call + 2 retries
    })

    it('should use exponential backoff', async () => {
      const { calculateExponentialBackoff } = useErrorHandler()
      
      const delay1 = calculateExponentialBackoff(0, 1000, 30000)
      const delay2 = calculateExponentialBackoff(1, 1000, 30000)
      const delay3 = calculateExponentialBackoff(2, 1000, 30000)

      expect(delay1).toBeGreaterThanOrEqual(900) // ~1000ms with jitter
      expect(delay1).toBeLessThanOrEqual(1100)
      
      expect(delay2).toBeGreaterThanOrEqual(1800) // ~2000ms with jitter
      expect(delay2).toBeLessThanOrEqual(2200)
      
      expect(delay3).toBeGreaterThanOrEqual(3600) // ~4000ms with jitter
      expect(delay3).toBeLessThanOrEqual(4400)
    })

    it('should not retry 4xx errors', async () => {
      const { handleApiError } = useErrorHandler()
      let callCount = 0
      
      const failingApiCall = vi.fn(() => {
        callCount++
        const error = new Error('Bad Request') as any
        error.status = 400
        throw error
      })

      const result = await handleApiError(failingApiCall, {
        retryConfig: { maxRetries: 3, baseDelay: 10, maxDelay: 100, retryableStatuses: [500], nonRetryableStatuses: [400] }
      })

      expect(result).toBeNull()
      expect(callCount).toBe(1) // Only initial call, no retries
    })

    it('should retry 5xx errors', async () => {
      const { handleApiError } = useErrorHandler()
      let callCount = 0
      
      const failingApiCall = vi.fn(() => {
        callCount++
        const error = new Error('Internal Server Error') as any
        error.status = 500
        throw error
      })

      const result = await handleApiError(failingApiCall, {
        retryConfig: { maxRetries: 2, baseDelay: 10, maxDelay: 100, retryableStatuses: [500], nonRetryableStatuses: [400] }
      })

      expect(result).toBeNull()
      expect(callCount).toBe(3) // Initial call + 2 retries
    })

    it('should fallback to localStorage when reporting fails', () => {
      const { fallbackToLocalStorage } = useErrorHandler()
      
      const error = {
        name: 'TestError',
        message: 'Test error message',
        status: 500,
        code: 'TEST_ERROR',
        details: { test: 'data' }
      }
      
      const context = { type: 'test-error', component: 'TestComponent' }
      
      mockLocalStorage.getItem.mockReturnValue('[]')
      
      fallbackToLocalStorage(error, context)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'error-reports-fallback',
        expect.stringContaining('"fallback":true')
      )
    })
  })

  describe('error categorization', () => {
    it('should correctly identify retryable errors', () => {
      const { isRetryableError, DEFAULT_RETRY_CONFIG } = useErrorHandler()
      
      // Network errors should be retryable
      const networkError = new Error('Network error')
      expect(isRetryableError(networkError, DEFAULT_RETRY_CONFIG)).toBe(true)
      
      // 500 errors should be retryable
      const serverError = { status: 500 } as any
      expect(isRetryableError(serverError, DEFAULT_RETRY_CONFIG)).toBe(true)
      
      // 400 errors should not be retryable
      const clientError = { status: 400 } as any
      expect(isRetryableError(clientError, DEFAULT_RETRY_CONFIG)).toBe(false)
      
      // 429 errors should be retryable
      const rateLimitError = { status: 429 } as any
      expect(isRetryableError(rateLimitError, DEFAULT_RETRY_CONFIG)).toBe(true)
    })
  })
})