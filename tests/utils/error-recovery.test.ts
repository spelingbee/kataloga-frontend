import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  attemptErrorRecovery, 
  getDefaultRecoveryStrategies,
  createRecoveryStrategy,
  getErrorMessageWithRecovery 
} from '~/utils/error-recovery'
import type { ApiError } from '~/types'

describe('Error Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDefaultRecoveryStrategies', () => {
    it('should return an array of recovery strategies', () => {
      const strategies = getDefaultRecoveryStrategies()
      
      expect(strategies).toBeInstanceOf(Array)
      expect(strategies.length).toBeGreaterThan(0)
      expect(strategies[0]).toHaveProperty('name')
      expect(strategies[0]).toHaveProperty('description')
      expect(strategies[0]).toHaveProperty('canRecover')
      expect(strategies[0]).toHaveProperty('recover')
    })

    it('should include refresh-auth strategy', () => {
      const strategies = getDefaultRecoveryStrategies()
      const authStrategy = strategies.find(s => s.name === 'refresh-auth')
      
      expect(authStrategy).toBeDefined()
      expect(authStrategy?.canRecover({ status: 401 } as ApiError)).toBe(true)
      expect(authStrategy?.canRecover({ status: 404 } as ApiError)).toBe(false)
    })

    it('should include clear-cache strategy', () => {
      const strategies = getDefaultRecoveryStrategies()
      const cacheStrategy = strategies.find(s => s.name === 'clear-cache')
      
      expect(cacheStrategy).toBeDefined()
      expect(cacheStrategy?.canRecover({ status: 409 } as ApiError)).toBe(true)
      expect(cacheStrategy?.canRecover({ status: 412 } as ApiError)).toBe(true)
      // 404 is not explicitly handled, so it returns undefined (falsy)
      expect(cacheStrategy?.canRecover({ status: 404 } as ApiError)).toBeFalsy()
    })

    it('should include offline-fallback strategy', () => {
      const strategies = getDefaultRecoveryStrategies()
      const offlineStrategy = strategies.find(s => s.name === 'offline-fallback')
      
      expect(offlineStrategy).toBeDefined()
      expect(offlineStrategy?.canRecover({ status: 503 } as ApiError)).toBe(true)
      expect(offlineStrategy?.canRecover({ status: 504 } as ApiError)).toBe(true)
    })
  })

  describe('createRecoveryStrategy', () => {
    it('should create a custom recovery strategy', () => {
      const strategy = createRecoveryStrategy(
        'test-strategy',
        'Test strategy description',
        (error) => error.status === 999,
        async () => true
      )

      expect(strategy.name).toBe('test-strategy')
      expect(strategy.description).toBe('Test strategy description')
      expect(strategy.canRecover({ status: 999 } as ApiError)).toBe(true)
      expect(strategy.canRecover({ status: 404 } as ApiError)).toBe(false)
    })
  })

  describe('getErrorMessageWithRecovery', () => {
    it('should return error message with recovery suggestions for 401', () => {
      const result = getErrorMessageWithRecovery({ status: 401 } as ApiError)
      
      expect(result.message).toContain('session has expired')
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.canRecover).toBe(true)
    })

    it('should return error message with recovery suggestions for 409', () => {
      const result = getErrorMessageWithRecovery({ status: 409 } as ApiError)
      
      expect(result.message).toContain('conflict')
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.canRecover).toBe(true)
    })

    it('should return error message with recovery suggestions for 503', () => {
      const result = getErrorMessageWithRecovery({ status: 503 } as ApiError)
      
      expect(result.message).toContain('temporarily unavailable')
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.canRecover).toBe(true)
    })

    it('should return error message for non-recoverable error', () => {
      const result = getErrorMessageWithRecovery({ status: 404 } as ApiError)
      
      expect(result.message).toContain('not found')
      expect(result.canRecover).toBe(false)
    })

    it('should use status-based message for known status codes', () => {
      const result = getErrorMessageWithRecovery({ 
        status: 500,
        message: 'Custom error message'
      } as ApiError)
      
      // For known status codes, we use the standard message
      expect(result.message).toContain('internal server error')
    })

    it('should use custom error message for unknown status codes', () => {
      const result = getErrorMessageWithRecovery({ 
        status: 999,
        message: 'Custom error message'
      } as ApiError)
      
      // For unknown status codes, we use the custom message
      expect(result.message).toBe('Custom error message')
    })
  })

  describe('attemptErrorRecovery', () => {
    it('should return false when no strategies are applicable', async () => {
      const error: ApiError = { status: 404, message: 'Not found' } as ApiError
      const result = await attemptErrorRecovery(error, {
        strategies: [],
      })
      
      expect(result).toBe(false)
    })

    it('should call onRecoveryFailure when no strategies work', async () => {
      const error: ApiError = { status: 404, message: 'Not found' } as ApiError
      const onRecoveryFailure = vi.fn()
      
      await attemptErrorRecovery(error, {
        strategies: [],
        onRecoveryFailure,
      })
      
      expect(onRecoveryFailure).toHaveBeenCalledWith(error)
    })

    it('should attempt recovery with applicable strategy', async () => {
      const error: ApiError = { status: 999, message: 'Test error' } as ApiError
      const recoverFn = vi.fn().mockResolvedValue(true)
      const onRecoverySuccess = vi.fn()
      
      const strategy = createRecoveryStrategy(
        'test',
        'Test',
        (e) => e.status === 999,
        recoverFn
      )
      
      const result = await attemptErrorRecovery(error, {
        strategies: [strategy],
        onRecoverySuccess,
      })
      
      expect(result).toBe(true)
      expect(recoverFn).toHaveBeenCalled()
      expect(onRecoverySuccess).toHaveBeenCalledWith(strategy)
    })

    it('should retry failed recovery attempts', async () => {
      const error: ApiError = { status: 999, message: 'Test error' } as ApiError
      const recoverFn = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(true)
      
      const strategy = createRecoveryStrategy(
        'test',
        'Test',
        (e) => e.status === 999,
        recoverFn
      )
      
      const result = await attemptErrorRecovery(error, {
        strategies: [strategy],
        maxAttempts: 2,
      })
      
      expect(result).toBe(true)
      expect(recoverFn).toHaveBeenCalledTimes(2)
    })

    it('should call onRecoveryAttempt for each attempt', async () => {
      const error: ApiError = { status: 999, message: 'Test error' } as ApiError
      const recoverFn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(true)
      const onRecoveryAttempt = vi.fn()
      
      const strategy = createRecoveryStrategy(
        'test',
        'Test',
        (e) => e.status === 999,
        recoverFn
      )
      
      await attemptErrorRecovery(error, {
        strategies: [strategy],
        maxAttempts: 2,
        onRecoveryAttempt,
      })
      
      expect(onRecoveryAttempt).toHaveBeenCalledTimes(2)
      expect(onRecoveryAttempt).toHaveBeenCalledWith(strategy, 1)
      expect(onRecoveryAttempt).toHaveBeenCalledWith(strategy, 2)
    })
  })
})
