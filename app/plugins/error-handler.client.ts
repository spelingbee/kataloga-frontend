export default defineNuxtPlugin((nuxtApp) => {
  // Global error handler for Vue errors
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('Vue Error:', error, info)
    
    // Report to error tracking service
    reportError(error, {
      type: 'vue-error',
      instance: instance?.$options.name || 'Unknown Component',
      info,
    })
  }

  // Global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    
    reportError(event.reason, {
      type: 'unhandled-promise',
      promise: event.promise,
    })
    
    // Prevent the default browser behavior (logging to console)
    event.preventDefault()
  })

  // Global error handler for general JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('JavaScript Error:', event.error)
    
    reportError(event.error, {
      type: 'javascript-error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  // Network error interceptor for fetch requests
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args)
      
      // Log failed HTTP requests
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
        reportError(error, {
          type: 'http-error',
          url: args[0],
          status: response.status,
          statusText: response.statusText,
        })
      }
      
      return response
    } catch (error) {
      // Log network errors
      reportError(error, {
        type: 'network-error',
        url: args[0],
      })
      throw error
    }
  }

  // Provide global error reporting function
  nuxtApp.provide('reportError', reportError)
})

interface ErrorContext {
  type: 'vue-error' | 'javascript-error' | 'network-error' | 'http-error' | 'unhandled-promise'
  [key: string]: any
}

function reportError(error: any, context?: ErrorContext) {
  // Categorize error type if not provided
  const errorType = context?.type || categorizeError(error, context)
  
  // Create enhanced error report with proper categorization
  const errorReport = {
    message: error?.message || String(error),
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    type: errorType,
    context: {
      ...context,
      type: errorType,
      // Add additional context based on error type
      ...getAdditionalContext(error, errorType),
    },
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Report')
    console.error('Error:', error)
    console.log('Context:', context)
    console.log('Full Report:', errorReport)
    console.groupEnd()
  }

  // Send to error tracking service (e.g., Sentry, LogRocket, etc.)
  // This would be replaced with actual error tracking service integration
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: errorReport })
    // Example: LogRocket.captureException(error)
    
    // For now, we'll store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error-reports') || '[]')
      existingErrors.push(errorReport)
      
      // Keep only last 50 errors
      if (existingErrors.length > 50) {
        existingErrors.splice(0, existingErrors.length - 50)
      }
      
      localStorage.setItem('error-reports', JSON.stringify(existingErrors))
    } catch (storageError) {
      console.warn('Failed to store error report:', storageError)
    }
  }

  // Send to backend error logging endpoint with retry mechanism
  if (typeof $fetch !== 'undefined') {
    sendErrorReportWithRetry(errorReport)
  }
}

// Enhanced error reporting with retry mechanism
async function sendErrorReportWithRetry(errorReport: any) {
  const retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    nonRetryableStatuses: [400, 401, 403, 404, 422], // Prevent retry loops for 4xx errors
  }
  
  let attempt = 0
  let lastError: any = null
  
  while (attempt <= retryConfig.maxRetries) {
    try {
      await $fetch('/api/errors', {
        method: 'POST',
        body: errorReport,
      })
      return // Success, exit retry loop
    } catch (error: any) {
      lastError = error
      attempt++
      
      // Check if error is retryable based on status
      const status = error?.status || error?.response?.status
      
      if (status && retryConfig.nonRetryableStatuses.includes(status)) {
        // Don't retry 4xx errors (except 408, 429) - prevents retry loops
        console.warn('Non-retryable error sending error report (4xx client error):', error)
        fallbackErrorToLocalStorage(errorReport, error)
        return
      }
      
      if (attempt > retryConfig.maxRetries) {
        // Max retries reached, fallback to localStorage
        console.warn('Max retries reached for error reporting, falling back to localStorage')
        fallbackErrorToLocalStorage(errorReport, error)
        return
      }
      
      // Calculate exponential backoff delay
      const exponentialDelay = retryConfig.baseDelay * Math.pow(2, attempt - 1)
      const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1)
      const delay = Math.min(Math.max(exponentialDelay + jitter, retryConfig.baseDelay), retryConfig.maxDelay)
      
      if (status && retryConfig.retryableStatuses.includes(status)) {
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      } else if (!status) {
        // Network error or unknown error, retry with backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        // Unknown status code, fallback immediately
        console.warn('Unknown error status sending error report, falling back to localStorage:', error)
        fallbackErrorToLocalStorage(errorReport, error)
        return
      }
    }
  }
}

function fallbackErrorToLocalStorage(errorReport: any, originalError: any) {
  try {
    const fallbackReport = {
      ...errorReport,
      fallback: true,
      originalError: originalError?.message || String(originalError),
      fallbackTimestamp: new Date().toISOString(),
    }
    
    const existingErrors = JSON.parse(localStorage.getItem('error-reports-fallback') || '[]')
    existingErrors.push(fallbackReport)
    
    // Keep only last 100 fallback errors
    if (existingErrors.length > 100) {
      existingErrors.splice(0, existingErrors.length - 100)
    }
    
    localStorage.setItem('error-reports-fallback', JSON.stringify(existingErrors))
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error report stored in localStorage fallback:', fallbackReport)
    }
  } catch (storageError) {
    console.error('Failed to store error report in localStorage fallback:', storageError)
  }
}

// Helper function to categorize errors
function categorizeError(error: any, context?: ErrorContext): ErrorContext['type'] {
  if (context?.type) return context.type
  
  // Check for network errors
  if (error?.message?.includes('fetch') || 
      error?.message?.includes('network') ||
      error?.message?.includes('Failed to fetch') ||
      error?.name === 'NetworkError') {
    return 'network-error'
  }
  
  // Check for HTTP errors
  if (error?.status || error?.response?.status) {
    return 'http-error'
  }
  
  // Check for Vue-specific errors
  if (context?.instance || context?.info) {
    return 'vue-error'
  }
  
  // Check for promise rejections
  if (context?.promise) {
    return 'unhandled-promise'
  }
  
  // Default to javascript error
  return 'javascript-error'
}

// Helper function to get additional context based on error type
function getAdditionalContext(error: any, errorType: ErrorContext['type']): Record<string, any> {
  const additionalContext: Record<string, any> = {}
  
  switch (errorType) {
    case 'http-error':
    case 'network-error':
      additionalContext.status = error?.status || error?.response?.status
      additionalContext.statusText = error?.statusText || error?.response?.statusText
      additionalContext.method = error?.config?.method
      additionalContext.url = error?.config?.url || error?.request?.responseURL
      break
      
    case 'vue-error':
      additionalContext.vueVersion = getCurrentInstance()?.appContext?.app?.version
      additionalContext.componentName = getCurrentInstance()?.type?.name
      break
      
    case 'javascript-error':
      additionalContext.errorName = error?.name
      additionalContext.fileName = error?.fileName
      additionalContext.lineNumber = error?.lineNumber
      additionalContext.columnNumber = error?.columnNumber
      break
      
    case 'unhandled-promise':
      additionalContext.promiseState = 'rejected'
      break
  }
  
  // Add browser and environment context
  additionalContext.browserInfo = {
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
  }
  
  additionalContext.pageInfo = {
    title: document.title,
    referrer: document.referrer,
    pathname: window.location.pathname,
    search: window.location.search,
  }
  
  return additionalContext
}

// Export for use in other parts of the application
export { reportError }