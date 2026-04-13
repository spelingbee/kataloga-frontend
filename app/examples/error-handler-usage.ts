/**
 * Example usage of the Global Error Handler and API Form composables
 * 
 * This file demonstrates how to use the newly created composables
 * for handling API errors and form validation.
 */

import type { ApiError, ApiMeta } from '~/types/api'

// Example 1: Using Global Error Handler
export function exampleGlobalErrorHandler() {
  const { handleApiError, handleNetworkError } = useGlobalErrorHandler()
  
  // Example API error with metadata
  const apiError: ApiError = {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: [
      { field: 'email', message: 'Email is required' },
      { field: 'password', message: 'Password must be at least 8 characters' }
    ]
  }
  
  const apiMeta: ApiMeta = {
    requestId: 'req-123456',
    timestamp: new Date().toISOString(),
    tenantId: 'tenant-abc'
  }
  
  // Handle the API error
  handleApiError(apiError, apiMeta, { url: '/api/auth/login', method: 'POST' })
  
  // Handle network error
  const networkError = new Error('Network request failed')
  handleNetworkError(networkError, '/api/users/profile')
}

// Example 2: Using API Form composable
export function exampleApiForm() {
  const {
    fieldErrors,
    isSubmitting,
    submitError,
    handleValidationError,
    handleSubmit,
    createFieldHelpers,
    clearFieldError
  } = useApiForm()
  
  // Create field helpers for specific fields
  const emailField = createFieldHelpers('email')
  const passwordField = createFieldHelpers('password')
  
  // Example form data
  const formData = reactive({
    email: '',
    password: ''
  })
  
  // Watch for changes and clear errors
  watch(() => formData.email, () => {
    if (emailField.hasError.value) {
      clearFieldError('email')
    }
  })
  
  watch(() => formData.password, () => {
    if (passwordField.hasError.value) {
      clearFieldError('password')
    }
  })
  
  // Submit function with error handling
  const submitForm = async () => {
    return handleSubmit(async () => {
      // Simulate API call
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: formData
      })
      
      return response
    })
  }
  
  // Handle validation error from API
  const handleApiValidationError = () => {
    const validationError: ApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: [
        { field: 'email', message: 'Email format is invalid' },
        { field: 'password', message: 'Password is too weak' }
      ]
    }
    
    handleValidationError(validationError)
  }
  
  return {
    formData,
    emailField,
    passwordField,
    fieldErrors,
    isSubmitting,
    submitError,
    submitForm,
    handleApiValidationError
  }
}

// Example 3: Using Form Field composable (simplified)
export function exampleFormField() {
  const emailField = useFormField('email', '')
  const passwordField = useFormField('password', '')
  
  return {
    email: emailField,
    password: passwordField
  }
}

// Example 4: Integration with Vue component
export function exampleVueComponentUsage() {
  // This would be used inside a Vue component's setup function
  const { handleApiError } = useGlobalErrorHandler()
  const apiForm = useApiForm()
  
  // Example of handling an API response
  const handleApiResponse = async (apiCall: () => Promise<any>) => {
    try {
      const result = await apiCall()
      return result
    } catch (error) {
      const apiError = error as ApiError
      
      if (apiError.code === 'VALIDATION_ERROR') {
        // Handle validation errors in the form
        apiForm.handleValidationError(apiError)
      } else {
        // Handle other errors globally
        const meta: ApiMeta = {
          requestId: `req-${Date.now()}`,
          timestamp: new Date().toISOString()
        }
        await handleApiError(apiError, meta)
      }
      
      throw error // Re-throw if component needs to handle it
    }
  }
  
  return {
    handleApiResponse,
    ...apiForm
  }
}
