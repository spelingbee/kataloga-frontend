<template>
  <div class="error-message" :class="errorTypeClass">
    <div class="error-content">
      <!-- Error Icon -->
      <div class="error-icon">
        <BaseIcon 
          :name="errorIcon" 
          :size="iconSize"
          class="text-current"
        />
      </div>
      
      <!-- Error Text -->
      <div class="error-text">
        <h3 class="error-title">{{ errorTitle }}</h3>
        <p class="error-description">{{ errorMessage }}</p>
        
        <!-- Error Details (collapsible) -->
        <div v-if="showDetails && error?.details" class="error-details">
          <button 
            @click="detailsExpanded = !detailsExpanded"
            class="details-toggle"
          >
            <BaseIcon 
              :name="detailsExpanded ? 'chevron-up' : 'chevron-down'" 
              size="sm"
            />
            {{ detailsExpanded ? 'Hide Details' : 'Show Details' }}
          </button>
          
          <div v-if="detailsExpanded" class="details-content">
            <pre>{{ JSON.stringify(error.details, null, 2) }}</pre>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="error-actions">
        <RetryButton 
          v-if="showRetry"
          @click="$emit('retry')"
          :loading="retrying"
          :disabled="!canRetry"
        />
        
        <BaseButton
          v-if="showDismiss"
          variant="ghost"
          size="sm"
          @click="$emit('dismiss')"
        >
          Dismiss
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiError } from '~/types'

interface Props {
  error: ApiError | Error | string | null
  variant?: 'default' | 'compact' | 'inline'
  showRetry?: boolean
  showDismiss?: boolean
  showDetails?: boolean
  retrying?: boolean
  canRetry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  showRetry: true,
  showDismiss: true,
  showDetails: false,
  retrying: false,
  canRetry: true,
})

defineEmits<{
  retry: []
  dismiss: []
}>()

const detailsExpanded = ref(false)

const errorData = computed(() => {
  if (!props.error) return null
  
  if (typeof props.error === 'string') {
    return {
      name: 'Error',
      message: props.error,
      status: undefined,
    } as ApiError
  }
  
  if (props.error instanceof Error) {
    return {
      name: props.error.name,
      message: props.error.message,
      status: 'status' in props.error ? (props.error as ApiError).status : undefined,
      code: 'code' in props.error ? (props.error as ApiError).code : undefined,
      details: 'details' in props.error ? (props.error as ApiError).details : undefined,
    } as ApiError
  }
  
  return props.error as ApiError
})

const errorType = computed(() => {
  if (!errorData.value?.status) return 'unknown'
  
  const status = errorData.value.status
  if (status === 401 || status === 403) return 'auth'
  if (status === 404) return 'not-found'
  if (status === 422) return 'validation'
  if (status === 429) return 'rate-limit'
  if (status >= 500) return 'server'
  if (status >= 400) return 'client'
  return 'network'
})

const errorTypeClass = computed(() => {
  const baseClass = 'error-message'
  const variantClass = `error-message--${props.variant}`
  const typeClass = `error-message--${errorType.value}`
  
  return [baseClass, variantClass, typeClass]
})

const errorIcon = computed(() => {
  switch (errorType.value) {
    case 'auth':
      return 'lock'
    case 'not-found':
      return 'search'
    case 'validation':
      return 'alert-triangle'
    case 'rate-limit':
      return 'clock'
    case 'server':
      return 'server'
    case 'network':
      return 'wifi-off'
    default:
      return 'alert-circle'
  }
})

const iconSize = computed(() => {
  switch (props.variant) {
    case 'compact':
      return 'sm'
    case 'inline':
      return 'xs'
    default:
      return 'md'
  }
})

const errorTitle = computed(() => {
  switch (errorType.value) {
    case 'auth':
      return 'Authentication Required'
    case 'not-found':
      return 'Not Found'
    case 'validation':
      return 'Invalid Input'
    case 'rate-limit':
      return 'Too Many Requests'
    case 'server':
      return 'Server Error'
    case 'network':
      return 'Connection Error'
    default:
      return 'Something went wrong'
  }
})

const errorMessage = computed(() => {
  if (!errorData.value) return 'An unknown error occurred'
  
  // Use custom error messages based on status
  switch (errorData.value.status) {
    case 401:
      return 'Please log in to continue'
    case 403:
      return 'You do not have permission to perform this action'
    case 404:
      return 'The requested resource was not found'
    case 422:
      return 'Please check your input and try again'
    case 429:
      return 'Too many requests. Please try again later'
    case 500:
      return 'Internal server error. Please try again later'
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later'
    default:
      return errorData.value.message || 'An unexpected error occurred'
  }
})
</script>

<style scoped>
.error-message {
  border-radius: 0.5rem;
  border: 1px solid;
  padding: 1rem;
}

.error-message--default {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.error-message--compact {
  padding: 0.75rem;
}

.error-message--inline {
  padding: 0.5rem;
  background-color: transparent;
  border: none;
}

.error-message--auth {
  background-color: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.error-message--validation {
  background-color: #fff7ed;
  border-color: #fed7aa;
  color: #c2410c;
}

.error-message--server {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.error-message--network {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.error-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-text {
  flex: 1;
  min-width: 0;
}

.error-title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.error-description {
  font-size: 0.875rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.error-details {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid;
  border-color: currentColor;
  border-opacity: 0.2;
}

.details-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.details-toggle:hover {
  text-decoration: underline;
}

.details-toggle:focus {
  outline: none;
}

.details-content {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: monospace;
  overflow: auto;
  max-height: 8rem;
}

.error-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

/* Dark theme support */
.dark .error-message--default {
  background-color: rgba(127, 29, 29, 0.2);
  border-color: #991b1b;
  color: #fecaca;
}

.dark .error-message--auth {
  background-color: rgba(146, 64, 14, 0.2);
  border-color: #92400e;
  color: #fde68a;
}

.dark .error-message--validation {
  background-color: rgba(194, 65, 12, 0.2);
  border-color: #c2410c;
  color: #fed7aa;
}

.dark .error-message--server {
  background-color: rgba(127, 29, 29, 0.2);
  border-color: #991b1b;
  color: #fecaca;
}

.dark .error-message--network {
  background-color: rgba(30, 64, 175, 0.2);
  border-color: #1e40af;
  color: #bfdbfe;
}
</style>