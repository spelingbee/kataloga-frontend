# Error Handling and Recovery Guide

This guide explains how to use the comprehensive error handling and recovery system in the customer frontend application.

## Overview

The error handling system provides:

1. **Automatic Error Detection** - Catches Vue errors, JavaScript errors, network errors, and unhandled promise rejections
2. **Error Reporting** - Integrates with Sentry for production error tracking
3. **Automatic Recovery** - Attempts to recover from errors using various strategies
4. **User-Friendly Messages** - Displays clear, actionable error messages to users
5. **Retry Logic** - Implements exponential backoff for failed API calls
6. **Fallback Strategies** - Provides graceful degradation when errors occur

## Components

### ErrorBoundary

Wraps components to catch and handle errors gracefully.

```vue
<template>
  <ErrorBoundary
    :auto-recover="true"
    :max-retries="3"
    @error="handleError"
  >
    <YourComponent />
    
    <!-- Custom fallback (optional) -->
    <template #fallback="{ error, retry }">
      <ErrorFallback
        :title="error.message"
        @retry="retry"
      />
    </template>
  </ErrorBoundary>
</template>

<script setup lang="ts">
const handleError = (error: Error, errorInfo: any) => {
  console.error('Component error:', error, errorInfo)
}
</script>
```

### ErrorMessage

Displays user-friendly error messages with retry options.

```vue
<template>
  <ErrorMessage
    :error="error"
    :show-retry="true"
    :show-details="isDevelopment"
    @retry="handleRetry"
    @dismiss="handleDismiss"
  />
</template>
```

### ErrorFallback

A simple fallback UI for error states.

```vue
<template>
  <ErrorFallback
    variant="compact"
    title="Failed to load data"
    message="Please try again or contact support"
    @retry="loadData"
  />
</template>
```

## Composables

### useErrorHandler

Basic error handling with retry logic.

```typescript
const { handleError, handleApiError, getErrorMessage } = useErrorHandler()

// Handle a simple error
try {
  // ... some code
} catch (error) {
  handleError(error, {
    showToast: true,
    logError: true,
    reportError: true,
  })
}

// Handle API call with automatic retry
const data = await handleApiError(
  async () => {
    return await $fetch('/api/menu')
  },
  {
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
    },
  }
)
```

### useErrorRecovery

Advanced error recovery with multiple strategies.

```typescript
const { recover, withRecovery, makeRecoverable } = useErrorRecovery()

// Attempt recovery from an error
try {
  // ... some code that fails
} catch (error) {
  const recovered = await recover(error as ApiError, {
    onRecoverySuccess: () => {
      console.log('Recovered successfully')
    },
    onRecoveryFailure: () => {
      console.error('Recovery failed')
    },
  })
}

// Wrap an operation with automatic recovery
const result = await withRecovery(
  async () => {
    return await fetchMenuData()
  },
  {
    fallback: [], // Return empty array if recovery fails
  }
)

// Create a recoverable version of an API call
const fetchMenuRecoverable = makeRecoverable(
  () => $fetch('/api/menu')
)

const menu = await fetchMenuRecoverable()
```

### useGlobalErrorHandler

Comprehensive error handling with all features enabled.

```typescript
const {
  handleGlobalError,
  handleGlobalApiError,
  syncStoredErrors,
} = useGlobalErrorHandler({
  enableAutoRecovery: true,
  enableSentry: true,
  enableLocalStorage: true,
  showUserNotifications: true,
})

// Handle any error with full pipeline
try {
  // ... some code
} catch (error) {
  await handleGlobalError(error, {
    component: 'MenuPage',
    action: 'loadMenu',
  })
}

// Handle API call with full pipeline
const data = await handleGlobalApiError(
  () => $fetch('/api/orders'),
  { context: 'OrderHistory' }
)

// Sync offline errors when back online
await syncStoredErrors()
```

## Recovery Strategies

The system includes several built-in recovery strategies:

### 1. Refresh Authentication

Automatically refreshes expired auth tokens.

```typescript
{
  name: 'refresh-auth',
  canRecover: (error) => error.status === 401,
  recover: async () => {
    const authStore = useAuthStore()
    await authStore.refreshToken()
    return true
  }
}
```

### 2. Clear Cache

Clears stale cached data and reloads.

```typescript
{
  name: 'clear-cache',
  canRecover: (error) => error.status === 409 || error.status === 412,
  recover: async () => {
    const menuStore = useMenuStore()
    await menuStore.fetchMenu()
    return true
  }
}
```

### 3. Offline Fallback

Switches to offline mode when server is unavailable.

```typescript
{
  name: 'offline-fallback',
  canRecover: (error) => error.status === 503 || !navigator.onLine,
  recover: async () => {
    const offlineStore = useOfflineStore()
    offlineStore.setOfflineMode(true)
    return true
  }
}
```

### 4. Page Reload

Reloads the page as a last resort (with user confirmation).

```typescript
{
  name: 'page-reload',
  canRecover: (error) => error.status === 500,
  recover: async () => {
    if (confirm('Reload page to try again?')) {
      window.location.reload()
      return true
    }
    return false
  }
}
```

## Custom Recovery Strategies

You can create custom recovery strategies for specific scenarios:

```typescript
import { createRecoveryStrategy } from '~/utils/error-recovery'

const customStrategy = createRecoveryStrategy(
  'clear-cart',
  'Clear cart and retry',
  (error) => error.message?.includes('cart'),
  async () => {
    const cartStore = useCartStore()
    cartStore.clearCart()
    return true
  }
)

// Use with recovery
await recover(error, {
  strategies: [customStrategy, ...getDefaultRecoveryStrategies()],
})
```

## Error Pages

### Global Error Page

The app includes a global error page at `/error` that handles:

- 404 Not Found
- 401 Unauthorized
- 403 Forbidden
- 500 Internal Server Error
- 503 Service Unavailable

The error page provides:
- User-friendly error messages
- Recovery suggestions
- Retry button
- Auto-recovery option
- Support link

## Sentry Integration

### Configuration

Add your Sentry DSN to `.env`:

```env
NUXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### Features

- Automatic error capture
- Performance monitoring
- Session replay
- User context
- Tenant context
- Cart context for order errors
- Error filtering (browser extensions, expected errors)

### Manual Error Reporting

```typescript
const { $sentry } = useNuxtApp()

try {
  // ... some code
} catch (error) {
  $sentry.captureException(error, {
    tags: {
      component: 'MenuPage',
      action: 'loadMenu',
    },
    extra: {
      menuId: '123',
      userId: user.id,
    },
  })
}
```

## Best Practices

### 1. Wrap Critical Components

```vue
<template>
  <ErrorBoundary :auto-recover="true">
    <CriticalComponent />
  </ErrorBoundary>
</template>
```

### 2. Use Appropriate Error Handlers

```typescript
// For simple errors
handleError(error)

// For API calls with retry
await handleApiError(() => fetchData())

// For complex scenarios with recovery
await handleGlobalError(error, context)
```

### 3. Provide Context

```typescript
handleGlobalError(error, {
  component: 'CheckoutPage',
  action: 'submitOrder',
  orderId: order.id,
  userId: user.id,
})
```

### 4. Handle Offline Scenarios

```typescript
if (!navigator.onLine) {
  // Show offline message
  showNotification({
    type: 'warning',
    message: 'You are offline. Some features may be limited.',
  })
  
  // Enable offline mode
  const offlineStore = useOfflineStore()
  offlineStore.setOfflineMode(true)
}
```

### 5. Test Error Scenarios

```typescript
// Simulate errors in development
if (process.env.NODE_ENV === 'development') {
  // Test error boundary
  throw new Error('Test error')
  
  // Test API error
  throw { status: 500, message: 'Test server error' }
  
  // Test network error
  throw new Error('Failed to fetch')
}
```

## Monitoring

### View Stored Errors

```typescript
const { getStoredErrors } = useGlobalErrorHandler()
const errors = getStoredErrors()
console.log('Stored errors:', errors)
```

### Clear Stored Errors

```typescript
const { clearStoredErrors } = useGlobalErrorHandler()
clearStoredErrors()
```

### Sync Offline Errors

```typescript
const { syncStoredErrors } = useGlobalErrorHandler()

// Sync when back online
window.addEventListener('online', async () => {
  await syncStoredErrors()
})
```

## Troubleshooting

### Errors Not Being Caught

1. Ensure ErrorBoundary wraps the component
2. Check that error is thrown in component lifecycle
3. Verify error handler plugin is loaded

### Recovery Not Working

1. Check that error is recoverable (see `isRecoverableError`)
2. Verify recovery strategies are applicable
3. Check console for recovery attempt logs

### Sentry Not Reporting

1. Verify SENTRY_DSN is configured
2. Check that error is not filtered out
3. Verify network connectivity
4. Check Sentry dashboard for rate limits

## Examples

### Complete Example: Menu Page with Error Handling

```vue
<template>
  <ErrorBoundary
    :auto-recover="true"
    @error="handleComponentError"
  >
    <div class="menu-page">
      <ErrorMessage
        v-if="error"
        :error="error"
        @retry="loadMenu"
        @dismiss="error = null"
      />
      
      <MenuGrid v-else :items="menuItems" />
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
const { handleGlobalApiError } = useGlobalErrorHandler()
const menuStore = useMenuStore()

const menuItems = ref([])
const error = ref(null)

const loadMenu = async () => {
  error.value = null
  
  const data = await handleGlobalApiError(
    () => menuStore.fetchMenu(),
    { component: 'MenuPage', action: 'loadMenu' }
  )
  
  if (data) {
    menuItems.value = data
  } else {
    error.value = { message: 'Failed to load menu' }
  }
}

const handleComponentError = (err: Error) => {
  error.value = err
}

onMounted(() => {
  loadMenu()
})
</script>
```

## Summary

The error handling system provides a comprehensive solution for:

- ✅ Catching all types of errors
- ✅ Reporting errors to Sentry
- ✅ Attempting automatic recovery
- ✅ Showing user-friendly messages
- ✅ Implementing retry logic
- ✅ Providing fallback strategies
- ✅ Storing errors offline
- ✅ Syncing errors when online

Use the appropriate tools based on your needs, and always provide context for better debugging and monitoring.
