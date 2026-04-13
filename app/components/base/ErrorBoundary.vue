<template>
  <div>
    <slot v-if="!hasError" />
    <div v-else class="error-boundary">
      <!-- Custom fallback slot -->
      <slot v-if="$slots.fallback" name="fallback" :error="error" :retry="handleRetry" />
      
      <!-- Default error message -->
      <ErrorMessage
        v-else
        :error="error"
        :show-details="showDetails"
        :show-retry="canRetry"
        :retrying="retrying"
        @retry="handleRetry"
        @dismiss="handleDismiss"
      />
      
      <!-- Auto-recovery indicator -->
      <div v-if="autoRecovering" class="auto-recovery">
        <BaseIcon name="refresh-cw" size="sm" class="spinning" />
        <span>Attempting automatic recovery...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiError } from '~/types'
import { attemptErrorRecovery } from '~/utils/error-recovery'
import ErrorMessage from './ErrorMessage.vue'

interface Props {
  fallback?: boolean
  showDetails?: boolean
  autoRecover?: boolean
  maxRetries?: number
  onError?: (error: Error, errorInfo: any) => void
  onRecoverySuccess?: () => void
  onRecoveryFailure?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  fallback: true,
  showDetails: false,
  autoRecover: true,
  maxRetries: 3,
})

const hasError = ref(false)
const error = ref<ApiError | null>(null)
const retrying = ref(false)
const autoRecovering = ref(false)
const retryCount = ref(0)

const canRetry = computed(() => retryCount.value < props.maxRetries)

const handleRetry = async () => {
  if (!canRetry.value) {
    console.warn('Max retry attempts reached')
    return
  }
  
  retrying.value = true
  retryCount.value++
  
  try {
    // Reset error state
    hasError.value = false
    error.value = null
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    retrying.value = false
  }
}

const handleDismiss = () => {
  hasError.value = false
  error.value = null
  retryCount.value = 0
}

const captureError = async (err: Error | ApiError, errorInfo?: any) => {
  hasError.value = true
  error.value = err as ApiError
  retryCount.value = 0
  
  // Log error for debugging
  console.error('ErrorBoundary caught an error:', err, errorInfo)
  
  // Call custom error handler if provided
  if (props.onError) {
    props.onError(err, errorInfo)
  }
  
  // Report to error tracking service
  const { $reportError } = useNuxtApp()
  if ($reportError) {
    $reportError(err, {
      type: 'error-boundary',
      component: errorInfo?.instance?.$options?.name || 'Unknown',
      info: errorInfo,
    })
  }
  
  // Attempt automatic recovery if enabled
  if (props.autoRecover) {
    await attemptAutoRecovery(err as ApiError)
  }
}

const attemptAutoRecovery = async (err: ApiError) => {
  autoRecovering.value = true
  
  try {
    const recovered = await attemptErrorRecovery(err, {
      maxAttempts: 2,
      onRecoverySuccess: () => {
        console.log('Auto-recovery successful')
        hasError.value = false
        error.value = null
        props.onRecoverySuccess?.()
      },
      onRecoveryFailure: () => {
        console.error('Auto-recovery failed')
        props.onRecoveryFailure?.()
      },
    })
    
    if (recovered) {
      // Give a moment for the recovery to take effect
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } catch (recoveryError) {
    console.error('Auto-recovery error:', recoveryError)
  } finally {
    autoRecovering.value = false
  }
}

// Vue 3 error handling
onErrorCaptured((err, instance, info) => {
  captureError(err, { instance, info })
  return false // Prevent error from propagating
})

// Global error handler for unhandled promises (only in client)
if (import.meta.client) {
  const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    captureError(new Error(event.reason), { type: 'unhandledrejection' })
  }
  
  window.addEventListener('unhandledrejection', unhandledRejectionHandler)
  
  onUnmounted(() => {
    window.removeEventListener('unhandledrejection', unhandledRejectionHandler)
  })
}

// Expose methods for manual error handling
defineExpose({
  captureError,
  reset: handleRetry,
  hasError: readonly(hasError),
  error: readonly(error),
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/abstracts/variables' as *;

.error-boundary {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-6;
  gap: $space-4;
}

.auto-recovery {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-4;
  background: var(--bg-secondary);
  border-radius: $radius-md;
  color: $text-secondary;
  font-size: $text-sm;
  
  .spinning {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
