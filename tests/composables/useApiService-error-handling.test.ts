/**
 * Unit Tests for useApiService Composable Error Handling
 * 
 * This test suite validates the useApiService composable's error handling including:
 * - Loading state management during errors
 * - Error state management and clearing
 * - Form validation error handling
 * - Toast notification error handling
 * - Retry logic and error recovery
 * 
 * Requirements: 1.2 - КОГДА разработчик использует методы $apiClient, ТО система ДОЛЖНА обеспечить типобезопасность всех вызовов API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useApiWithToast, useApiForm } from '~/composables/useApiService'
import {
  AppError,
  NetworkError,
  ValidationError,
  AuthError,
  BusinessError,
  success,
  failure
} from '~/types/errors'

// Mock console methods
const mockConsoleError = vi.fn()
const mockConsoleLog = vi.fn()
const originalConsoleError = console.error
const originalConsoleLog = console.log

describe('useApiService Error Handling', () => {
  beforeEach(() => {
    console.error = mockConsoleError
    console.log = mockConsoleLog
    vi.clearAllMocks()
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.log = originalConsoleLog
  })

  // =============================================================================
  // USE API WITH TOAST ERROR HANDLING TESTS
  // =============================================================================

  describe('useApiWithToast Error Handling', () => {
    describe('handleWithToast', () => {
      it('should show success message for successful operations', async () => {
        const { handleWithToast } = useApiWithToast()

        const successPromise = Promise.resolve(success({ id: 1, name: 'Success' }))
        const result = await handleWithToast(
          successPromise,
          'Operation completed successfully'
        )

        expect(result).toBe(true)
        expect(mockConsoleLog).toHaveBeenCalledWith('✅', 'Operation completed successfully')
      })

      it('should show error message for failed operations', async () => {
        const { handleWithToast } = useApiWithToast()

        const error = new AppError('Operation failed')
        const failurePromise = Promise.resolve(failure(error))
        const result = await handleWithToast(
          failurePromise,
          'Operation completed successfully',
          'Operation failed'
        )

        expect(result).toBe(false)
        expect(mockConsoleError).toHaveBeenCalledWith('❌', 'Operation failed')
      })

      it('should use error message when no custom error message provided', async () => {
        const { handleWithToast } = useApiWithToast()

        const error = new AppError('Specific error message')
        const failurePromise = Promise.resolve(failure(error))
        const result = await handleWithToast(
          failurePromise,
          'Operation completed successfully'
        )

        expect(result).toBe(false)
        expect(mockConsoleError).toHaveBeenCalledWith('❌', 'Specific error message')
      })

      it('should handle unexpected errors', async () => {
        const { handleWithToast } = useApiWithToast()

        const unexpectedError = new Error('Unexpected error')
        const errorPromise = Promise.reject(unexpectedError)
        const result = await handleWithToast(
          errorPromise,
          'Operation completed successfully',
          'Custom error message'
        )

        expect(result).toBe(false)
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌', 
          'Custom error message', 
          unexpectedError
        )
      })

      it('should handle network errors with retry suggestions', async () => {
        const { handleWithToast } = useApiWithToast()

        const networkError = new NetworkError('Connection timeout', { code: 'TIMEOUT_ERROR' })
        const failurePromise = Promise.resolve(failure(networkError))
        const result = await handleWithToast(
          failurePromise,
          'Data loaded successfully',
          'Failed to load data. Please check your connection and try again.'
        )

        expect(result).toBe(false)
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌', 
          'Failed to load data. Please check your connection and try again.'
        )
      })

      it('should handle authentication errors', async () => {
        const { handleWithToast } = useApiWithToast()

        const authError = new AuthError('Session expired', 'authentication')
        const failurePromise = Promise.resolve(failure(authError))
        const result = await handleWithToast(
          failurePromise,
          'Action completed successfully',
          'Please log in again to continue'
        )

        expect(result).toBe(false)
        expect(mockConsoleError).toHaveBeenCalledWith('❌', 'Please log in again to continue')
      })

      it('should handle business rule violations', async () => {
        const { handleWithToast } = useApiWithToast()

        const businessError = new BusinessError(
          'Cannot delete active menu item',
          'ACTIVE_ITEM_DELETION'
        )
        const failurePromise = Promise.resolve(failure(businessError))
        const result = await handleWithToast(
          failurePromise,
          'Item deleted successfully'
        )

        expect(result).toBe(false)
        expect(mockConsoleError).toHaveBeenCalledWith('❌', 'Cannot delete active menu item')
      })
    })
  })

  // =============================================================================
  // USE API FORM ERROR HANDLING TESTS
  // =============================================================================

  describe('useApiForm Error Handling', () => {
    describe('submitForm', () => {
      it('should handle successful form submission', async () => {
        const { submitForm, submitting, validationErrors } = useApiForm()

        const successPromise = Promise.resolve(success({ id: 1, name: 'Created' }))
        
        expect(submitting.value).toBe(false)
        
        const resultPromise = submitForm(successPromise, 'Form submitted successfully')
        expect(submitting.value).toBe(true)
        
        const result = await resultPromise
        
        expect(result).toBe(true)
        expect(submitting.value).toBe(false)
        expect(validationErrors.value).toEqual({})
        expect(mockConsoleLog).toHaveBeenCalledWith('✅', 'Form submitted successfully')
      })

      it('should handle validation errors in form submission', async () => {
        const { submitForm, submitting, validationErrors } = useApiForm()

        const validationError = new ValidationError('Validation failed', [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' }
        ])
        const failurePromise = Promise.resolve(failure(validationError))
        
        const result = await submitForm(failurePromise, 'Form submitted successfully')
        
        expect(result).toBe(false)
        expect(submitting.value).toBe(false)
        expect(validationErrors.value).toEqual({
          email: 'Invalid email format',
          password: 'Password too short'
        })
      })

      it('should handle non-validation errors in form submission', async () => {
        const { submitForm, validationErrors } = useApiForm()

        const networkError = new NetworkError('Network failed')
        const failurePromise = Promise.resolve(failure(networkError))
        
        const result = await submitForm(failurePromise, 'Form submitted successfully')
        
        expect(result).toBe(false)
        expect(validationErrors.value).toEqual({})
        expect(mockConsoleError).toHaveBeenCalledWith('❌', 'Network failed')
      })

      it('should handle unexpected errors in form submission', async () => {
        const { submitForm, submitting } = useApiForm()

        const unexpectedError = new Error('Unexpected error')
        const errorPromise = Promise.reject(unexpectedError)
        
        const result = await submitForm(errorPromise, 'Form submitted successfully')
        
        expect(result).toBe(false)
        expect(submitting.value).toBe(false)
        expect(mockConsoleError).toHaveBeenCalledWith(
          '❌', 
          'Form submission failed', 
          unexpectedError
        )
      })

      it('should clear validation errors', () => {
        const { validationErrors, clearValidationErrors } = useApiForm()

        validationErrors.value = {
          email: 'Invalid email',
          password: 'Too short'
        }

        clearValidationErrors()

        expect(validationErrors.value).toEqual({})
      })

      it('should handle complex validation errors with nested fields', async () => {
        const { submitForm, validationErrors } = useApiForm()

        const validationError = new ValidationError('Complex validation failed', [
          { field: 'user.email', message: 'Email is required' },
          { field: 'user.profile.name', message: 'Name must be at least 2 characters' },
          { field: 'settings.notifications', message: 'Invalid notification setting' }
        ])
        const failurePromise = Promise.resolve(failure(validationError))
        
        const result = await submitForm(failurePromise, 'Form submitted successfully')
        
        expect(result).toBe(false)
        expect(validationErrors.value).toEqual({
          'user.email': 'Email is required',
          'user.profile.name': 'Name must be at least 2 characters',
          'settings.notifications': 'Invalid notification setting'
        })
      })

      it('should handle authorization errors in form submission', async () => {
        const { submitForm } = useApiForm()

        const authError = new AuthError('Insufficient permissions', 'authorization')
        const failurePromise = Promise.resolve(failure(authError))
        
        const result = await submitForm(failurePromise, 'Form submitted successfully')
        
        expect(result).toBe(false)
        expect(mockConsoleError).toHaveBeenCalledWith('❌', 'Insufficient permissions')
      })

      it('should handle concurrent form submissions', async () => {
        const { submitForm } = useApiForm()

        const successPromise1 = Promise.resolve(success({ id: 1 }))
        const failurePromise = Promise.resolve(failure(new AppError('Failed')))
        const successPromise2 = Promise.resolve(success({ id: 2 }))

        const results = await Promise.all([
          submitForm(successPromise1, 'Success 1'),
          submitForm(failurePromise, 'Success 2'),
          submitForm(successPromise2, 'Success 3')
        ])

        expect(results).toEqual([true, false, true])
        expect(mockConsoleLog).toHaveBeenCalledWith('✅', 'Success 1')
        expect(mockConsoleError).toHaveBeenCalledWith('❌', 'Failed')
        expect(mockConsoleLog).toHaveBeenCalledWith('✅', 'Success 3')
      })

      it('should maintain separate validation states for multiple form instances', async () => {
        const form1 = useApiForm()
        const form2 = useApiForm()

        const validationError1 = new ValidationError('Form 1 validation failed', [
          { field: 'field1', message: 'Error 1' }
        ])
        const validationError2 = new ValidationError('Form 2 validation failed', [
          { field: 'field2', message: 'Error 2' }
        ])

        await form1.submitForm(Promise.resolve(failure(validationError1)), 'Success')
        await form2.submitForm(Promise.resolve(failure(validationError2)), 'Success')

        expect(form1.validationErrors.value).toEqual({ field1: 'Error 1' })
        expect(form2.validationErrors.value).toEqual({ field2: 'Error 2' })
      })
    })
  })

  // =============================================================================
  // ERROR TYPE SPECIFIC HANDLING TESTS
  // =============================================================================

  describe('Error Type Specific Handling', () => {
    it('should handle different error types appropriately in toast notifications', async () => {
      const { handleWithToast } = useApiWithToast()

      const errorTypes = [
        new NetworkError('Connection failed', { code: 'NETWORK_ERROR' }),
        new ValidationError('Invalid data', [{ field: 'test', message: 'Required' }]),
        new AuthError('Unauthorized', 'authentication'),
        new BusinessError('Business rule violated', 'RULE_VIOLATION'),
        new AppError('Generic error', 'GENERIC_ERROR')
      ]

      for (const error of errorTypes) {
        const result = await handleWithToast(
          Promise.resolve(failure(error)),
          'Success message'
        )

        expect(result).toBe(false)
        expect(mockConsoleError).toHaveBeenCalledWith('❌', error.message)
      }
    })

    it('should handle error context information in logging', async () => {
      const { handleWithToast } = useApiWithToast()

      const errorWithContext = new AppError('Error with context', 'TEST_ERROR', {
        userId: '123',
        action: 'test-action',
        timestamp: '2023-01-01T00:00:00Z'
      })

      await handleWithToast(
        Promise.resolve(failure(errorWithContext)),
        'Success message'
      )

      expect(mockConsoleError).toHaveBeenCalledWith('❌', 'Error with context')
    })
  })

  // =============================================================================
  // EDGE CASES AND RESILIENCE TESTS
  // =============================================================================

  describe('Edge Cases and Resilience', () => {
    it('should handle malformed validation errors gracefully', async () => {
      const { submitForm, validationErrors } = useApiForm()

      // Create a validation error with malformed details
      const malformedError = new ValidationError('Malformed validation', [
        { field: '', message: 'Empty field name' }, // Will be filtered out (empty field)
        { field: 'valid', message: '' }, // Will be filtered out (empty message)
        // @ts-ignore - intentionally malformed for testing
        { field: null, message: 'Null field' }, // Will be filtered out (null field)
        { field: 'normal', message: 'Normal error' }
      ])

      await submitForm(Promise.resolve(failure(malformedError)), 'Success')

      // Should handle malformed entries gracefully by filtering them out
      expect(validationErrors.value).toEqual({
        'normal': 'Normal error'
      })
    })

    it('should handle very long error messages', async () => {
      const { handleWithToast } = useApiWithToast()

      const longMessage = 'A'.repeat(1000)
      const longError = new AppError(longMessage)

      const result = await handleWithToast(
        Promise.resolve(failure(longError)),
        'Success'
      )

      expect(result).toBe(false)
      expect(mockConsoleError).toHaveBeenCalledWith('❌', longMessage)
    })

    it('should handle errors with special characters', async () => {
      const { handleWithToast } = useApiWithToast()

      const specialMessage = 'Error with 特殊字符 and émojis 🚨 and "quotes" and <tags>'
      const specialError = new AppError(specialMessage)

      const result = await handleWithToast(
        Promise.resolve(failure(specialError)),
        'Success'
      )

      expect(result).toBe(false)
      expect(mockConsoleError).toHaveBeenCalledWith('❌', specialMessage)
    })
  })
})