import type { ApiError, ApiErrorDetail } from '~/types/api'

/**
 * API Form Composable
 * 
 * Provides form-specific error handling for API validation errors.
 * Maps validation errors to form fields and provides helpers for
 * displaying and clearing field-level errors.
 * 
 * @example
 * ```typescript
 * const { fieldErrors, handleValidationError, clearFieldError } = useApiForm()
 * 
 * try {
 *   await apiClient.post('/users', formData)
 * } catch (error: ApiError) {
 *   if (error.code === 'VALIDATION_ERROR') {
 *     handleValidationError(error)
 *   }
 * }
 * ```
 * 
 * @returns Object containing form error handling state and methods
 * 
 * Requirements: 3.1, 3.3
 */
export function useApiForm() {
  const fieldErrors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  /**
   * Handle validation errors from API responses
   * Maps error.details to form fields based on field names
   * 
   * @param error - API error object with validation details
   * 
   * @example
   * ```typescript
   * // Error with field-specific validation details
   * const error: ApiError = {
   *   code: 'VALIDATION_ERROR',
   *   message: 'Validation failed',
   *   details: [
   *     { field: 'email', message: 'Email is required' },
   *     { field: 'password', message: 'Password too short' }
   *   ]
   * }
   * 
   * handleValidationError(error)
   * // fieldErrors.value = { email: 'Email is required', password: 'Password too short' }
   * ```
   */
  const handleValidationError = (error: ApiError): void => {
    if (error.code !== 'VALIDATION_ERROR' || !error.details) {
      return
    }

    // Clear previous errors
    fieldErrors.value = {}
    submitError.value = null

    // Handle array of validation error details
    if (Array.isArray(error.details)) {
      error.details.forEach((detail: ApiErrorDetail) => {
        fieldErrors.value[detail.field] = detail.message
      })
    } 
    // Handle object-based validation errors
    else if (typeof error.details === 'object') {
      Object.entries(error.details).forEach(([field, message]) => {
        if (typeof message === 'string') {
          fieldErrors.value[field] = message
        } else if (Array.isArray(message) && message.length > 0) {
          // Take first error message if multiple
          fieldErrors.value[field] = message[0]
        }
      })
    }
  }

  /**
   * Handle non-validation API errors
   * Sets a general submit error message
   * 
   * @param error - API error object
   */
  const handleSubmitError = (error: ApiError): void => {
    const { $i18n } = useNuxtApp()
    
    // Clear field errors for non-validation errors
    if (error.code !== 'VALIDATION_ERROR') {
      fieldErrors.value = {}
    }

    // Set general error message
    submitError.value = $i18n.te(`errors.${error.code}`) 
      ? $i18n.t(`errors.${error.code}`)
      : error.message
  }

  /**
   * Clear error for a specific field
   * Called when user starts typing in a field
   * 
   * @param fieldName - Name of the field to clear error for
   */
  const clearFieldError = (fieldName: string): void => {
    if (fieldErrors.value[fieldName]) {
      delete fieldErrors.value[fieldName]
    }
  }

  /**
   * Clear all field errors
   * Useful when resetting form or starting fresh submission
   */
  const clearAllErrors = (): void => {
    fieldErrors.value = {}
    submitError.value = null
  }

  /**
   * Get error message for a specific field
   * 
   * @param fieldName - Name of the field
   * @returns Error message or null if no error
   */
  const getFieldError = (fieldName: string): string | null => {
    return fieldErrors.value[fieldName] || null
  }

  /**
   * Check if a specific field has an error
   * 
   * @param fieldName - Name of the field
   * @returns True if field has error
   */
  const hasFieldError = (fieldName: string): boolean => {
    return !!fieldErrors.value[fieldName]
  }

  /**
   * Check if form has any validation errors
   * 
   * @returns True if any field has errors
   */
  const hasErrors = computed((): boolean => {
    return Object.keys(fieldErrors.value).length > 0 || !!submitError.value
  })

  /**
   * Get all field errors as an array
   * Useful for displaying summary of errors
   */
  const getAllErrors = computed((): string[] => {
    const errors = Object.values(fieldErrors.value)
    if (submitError.value) {
      errors.unshift(submitError.value)
    }
    return errors
  })

  /**
   * Set loading state for form submission
   * 
   * @param loading - Loading state
   */
  const setSubmitting = (loading: boolean): void => {
    isSubmitting.value = loading
  }

  /**
   * Handle form submission with error handling
   * Wraps the submit function with loading state and error handling
   * 
   * @param submitFn - Function that performs the actual submission
   * @returns Promise that resolves with the result or rejects with error
   */
  const handleSubmit = async <T>(
    submitFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setSubmitting(true)
      clearAllErrors()
      
      const result = await submitFn()
      return result
    } catch (error) {
      const apiError = error as ApiError
      
      if (apiError.code === 'VALIDATION_ERROR') {
        handleValidationError(apiError)
      } else {
        handleSubmitError(apiError)
      }
      
      throw error // Re-throw so caller can handle if needed
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Create field helpers for a specific field
   * Returns reactive properties and methods for a single field
   * 
   * @param fieldName - Name of the field
   */
  const createFieldHelpers = (fieldName: string) => {
    return {
      error: computed(() => getFieldError(fieldName)),
      hasError: computed(() => hasFieldError(fieldName)),
      clearError: () => clearFieldError(fieldName),
      
      // Helper for input components
      errorProps: computed(() => ({
        error: hasFieldError(fieldName),
        errorMessage: getFieldError(fieldName)
      }))
    }
  }

  /**
   * Watch a reactive field value and clear its error when it changes
   * 
   * @param fieldName - Name of the field
   * @param fieldValue - Reactive reference to the field value
   */
  const watchFieldForErrors = (fieldName: string, fieldValue: Ref<any>): void => {
    watch(fieldValue, () => {
      if (hasFieldError(fieldName)) {
        clearFieldError(fieldName)
      }
    })
  }

  return {
    // State
    fieldErrors: readonly(fieldErrors),
    isSubmitting: readonly(isSubmitting),
    submitError: readonly(submitError),
    hasErrors,
    getAllErrors,

    // Methods
    handleValidationError,
    handleSubmitError,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    hasFieldError,
    setSubmitting,
    handleSubmit,
    createFieldHelpers,
    watchFieldForErrors
  }
}

/**
 * Composable for handling form field validation with automatic error clearing
 * Simplified version for single field usage
 * 
 * @param fieldName - Name of the field
 * @param initialValue - Initial value for the field
 */
export function useFormField<T>(fieldName: string, initialValue: T) {
  const { createFieldHelpers, watchFieldForErrors } = useApiForm()
  const value = ref<T>(initialValue)
  const helpers = createFieldHelpers(fieldName)
  
  // Auto-clear errors when value changes
  watchFieldForErrors(fieldName, value)
  
  return {
    value,
    ...helpers
  }
}
