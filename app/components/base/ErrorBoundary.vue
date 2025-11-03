<template>
  <div>
    <slot v-if="!hasError" />
    <div v-else class="error-boundary">
      <ErrorMessage
        :error="error"
        :show-details="showDetails"
        @retry="handleRetry"
        @dismiss="handleDismiss"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiError } from '~/types'

interface Props {
  fallback?: boolean
  showDetails?: boolean
  onError?: (error: Error, errorInfo: any) => void
}

const props = withDefaults(defineProps<Props>(), {
  fallback: true,
  showDetails: false,
})

const hasError = ref(false)
const error = ref<ApiError | null>(null)

const handleRetry = () => {
  hasError.value = false
  error.value = null
}

const handleDismiss = () => {
  hasError.value = false
  error.value = null
}

const captureError = (err: Error | ApiError, errorInfo?: any) => {
  hasError.value = true
  error.value = err as ApiError
  
  // Log error for debugging
  console.error('ErrorBoundary caught an error:', err, errorInfo)
  
  // Call custom error handler if provided
  if (props.onError) {
    props.onError(err, errorInfo)
  }
  
  // Report to error tracking service (e.g., Sentry)
  // reportError(err, errorInfo)
}

// Vue 3 error handling
onErrorCaptured((err, instance, info) => {
  captureError(err, { instance, info })
  return false // Prevent error from propagating
})

// Global error handler for unhandled promises
if (process.client) {
  window.addEventListener('unhandledrejection', (event) => {
    captureError(new Error(event.reason), { type: 'unhandledrejection' })
  })
}

// Expose methods for manual error handling
defineExpose({
  captureError,
  reset: handleRetry,
})
</script>

<style scoped>
.error-boundary {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
</style>