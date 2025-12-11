<template>
  <div class="error-page">
    <div class="error-container">
      <!-- Error Icon -->
      <div class="error-icon">
        <BaseIcon :name="errorIcon" size="xl" />
      </div>
      
      <!-- Error Content -->
      <div class="error-content">
        <h1 class="error-title">{{ errorTitle }}</h1>
        <p class="error-message">{{ errorMessage }}</p>
        
        <!-- Recovery Suggestions -->
        <div v-if="recoverySuggestions.length > 0" class="recovery-suggestions">
          <h3>What you can try:</h3>
          <ul>
            <li v-for="(suggestion, index) in recoverySuggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>
        
        <!-- Error Details (Development only) -->
        <div v-if="showDetails && error?.stack" class="error-details">
          <button 
            class="details-toggle"
            @click="detailsExpanded = !detailsExpanded"
          >
            {{ detailsExpanded ? 'Hide' : 'Show' }} Technical Details
          </button>
          
          <pre v-if="detailsExpanded" class="error-stack">{{ error.stack }}</pre>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="error-actions">
        <RetryButton
          v-if="canRetry"
          :loading="retrying"
          @click="handleRetry"
        />
        
        <BaseButton
          variant="secondary"
          @click="handleGoHome"
        >
          Go to Home
        </BaseButton>
        
        <BaseButton
          v-if="canRecover"
          variant="ghost"
          @click="handleAutoRecover"
        >
          Try Auto-Recovery
        </BaseButton>
      </div>
      
      <!-- Support Link -->
      <div class="error-support">
        <p>
          If the problem persists, please 
          <a href="/support" class="support-link">contact support</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import { attemptErrorRecovery, getErrorMessageWithRecovery } from '~/utils/error-recovery'

const props = defineProps<{
  error: NuxtError
}>()

const router = useRouter()
const detailsExpanded = ref(false)
const retrying = ref(false)
const showDetails = computed(() => process.env.NODE_ENV === 'development')

// Error information
const errorInfo = computed(() => {
  const apiError = {
    name: props.error.name || 'Error',
    message: props.error.message,
    status: props.error.statusCode,
    stack: props.error.stack,
  }
  
  return getErrorMessageWithRecovery(apiError)
})

const errorIcon = computed(() => {
  const status = props.error.statusCode
  
  if (status === 404) return 'search'
  if (status === 401 || status === 403) return 'lock'
  if (status === 500) return 'server'
  if (status === 503 || status === 504) return 'cloud-off'
  
  return 'alert-circle'
})

const errorTitle = computed(() => {
  const status = props.error.statusCode
  
  if (status === 404) return 'Page Not Found'
  if (status === 401) return 'Authentication Required'
  if (status === 403) return 'Access Denied'
  if (status === 500) return 'Internal Server Error'
  if (status === 503) return 'Service Unavailable'
  
  return 'Something Went Wrong'
})

const errorMessage = computed(() => errorInfo.value.message)
const recoverySuggestions = computed(() => errorInfo.value.suggestions)
const canRecover = computed(() => errorInfo.value.canRecover)
const canRetry = computed(() => props.error.statusCode !== 404)

// Handlers
const handleRetry = async () => {
  retrying.value = true
  
  try {
    // Try to reload the current page
    await router.replace(router.currentRoute.value.fullPath)
  } catch (error) {
    console.error('Retry failed:', error)
  } finally {
    retrying.value = false
  }
}

const handleGoHome = () => {
  router.push('/')
}

const handleAutoRecover = async () => {
  retrying.value = true
  
  try {
    const apiError = {
      name: props.error.name || 'Error',
      message: props.error.message,
      status: props.error.statusCode,
    }
    
    const recovered = await attemptErrorRecovery(apiError, {
      onRecoverySuccess: () => {
        // Navigate back or to home
        router.back()
      },
      onRecoveryFailure: () => {
        alert('Auto-recovery failed. Please try manual recovery or contact support.')
      },
    })
    
    if (!recovered) {
      console.error('Auto-recovery failed')
    }
  } catch (error) {
    console.error('Auto-recovery error:', error)
  } finally {
    retrying.value = false
  }
}

// Report error to tracking service
onMounted(() => {
  const { $reportError } = useNuxtApp()
  if ($reportError) {
    $reportError(props.error, {
      type: 'page-error',
      statusCode: props.error.statusCode,
      url: props.error.url,
    })
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;

.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
}

.error-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.error-icon {
  margin-bottom: var(--spacing-xl);
  color: var(--color-error);
  
  svg {
    width: 4rem;
    height: 4rem;
  }
}

.error-content {
  margin-bottom: $space-8;
}

.error-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.error-message {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
  line-height: var(--leading-relaxed);
}

.recovery-suggestions {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  text-align: left;
  
  h3 {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-md);
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      padding: var(--spacing-sm) 0;
      padding-left: var(--spacing-lg);
      position: relative;
      color: var(--text-secondary);
      
      &::before {
        content: '→';
        position: absolute;
        left: 0;
        color: var(--color-success);
        font-weight: var(--font-bold);
      }
    }
  }
}

.error-details {
  margin-top: var(--spacing-lg);
  text-align: left;
}

.details-toggle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  
  &:hover {
    color: var(--text-primary);
  }
}

.error-stack {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-neutral-900);
  color: var(--color-neutral-50);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  overflow-x: auto;
  text-align: left;
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xl);
}

.error-support {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  
  .support-link {
    color: var(--color-success);
    text-decoration: none;
    font-weight: var(--font-medium);
    
    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: 768px) {
  .error-icon svg {
    width: 3rem;
    height: 3rem;
  }
  
  .error-title {
    font-size: var(--text-2xl);
  }
  
  .error-message {
    font-size: var(--text-base);
  }
  
  .error-actions {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
}
</style>
