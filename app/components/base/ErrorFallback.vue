<template>
  <div class="error-fallback" :class="`error-fallback--${variant}`">
    <div class="error-fallback__content">
      <!-- Icon -->
      <div class="error-fallback__icon">
        <BaseIcon :name="icon" :size="iconSize" />
      </div>
      
      <!-- Title -->
      <h3 class="error-fallback__title">{{ title }}</h3>
      
      <!-- Message -->
      <p class="error-fallback__message">{{ message }}</p>
      
      <!-- Actions -->
      <div class="error-fallback__actions">
        <slot name="actions">
          <RetryButton
            v-if="showRetry"
            :loading="retrying"
            :disabled="!canRetry"
            @click="$emit('retry')"
          />
          
          <BaseButton
            v-if="showHome"
            variant="secondary"
            size="sm"
            @click="handleGoHome"
          >
            Go Home
          </BaseButton>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTenant } from '~/composables/useTenant'
interface Props {
  variant?: 'default' | 'compact' | 'minimal'
  title?: string
  message?: string
  icon?: string
  iconSize?: 'sm' | 'md' | 'lg' | 'xl'
  showRetry?: boolean
  showHome?: boolean
  retrying?: boolean
  canRetry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  title: 'Something went wrong',
  message: 'We encountered an error. Please try again.',
  icon: 'alert-circle',
  iconSize: 'lg',
  showRetry: true,
  showHome: true,
  retrying: false,
  canRetry: true,
})

defineEmits<{
  retry: []
}>()

const router = useRouter()

const { tPath } = useTenant()

const handleGoHome = () => {
  router.push(tPath('/'))
}
</script>

<style scoped lang="scss">


.error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-8;
  min-height: 300px;
}

.error-fallback--compact {
  min-height: 200px;
  padding: $space-6;
}

.error-fallback--minimal {
  min-height: 100px;
  padding: $space-4;
}

.error-fallback__content {
  text-align: center;
  max-width: 500px;
}

.error-fallback__icon {
  margin-bottom: $space-6;
  color: $color-error;
  
  .error-fallback--compact & {
    margin-bottom: $space-4;
  }
  
  .error-fallback--minimal & {
    margin-bottom: $space-2;
  }
}

.error-fallback__title {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $text-primary;
  margin-bottom: $space-2;
  
  .error-fallback--compact & {
    font-size: $text-lg;
  }
  
  .error-fallback--minimal & {
    font-size: $text-base;
  }
}

.error-fallback__message {
  font-size: $text-base;
  color: $text-secondary;
  margin-bottom: $space-6;
  line-height: $line-relaxed;
  
  .error-fallback--compact & {
    font-size: $text-sm;
    margin-bottom: $space-4;
  }
  
  .error-fallback--minimal & {
    font-size: $text-sm;
    margin-bottom: $space-2;
  }
}

.error-fallback__actions {
  display: flex;
  gap: $space-4;
  justify-content: center;
  flex-wrap: wrap;
  
  .error-fallback--minimal & {
    gap: $space-2;
  }
}

@media (max-width: 768px) {
  .error-fallback {
    padding: $space-6;
  }
  
  .error-fallback__actions {
    flex-direction: column;
    width: 100%;
    
    button {
      width: 100%;
    }
  }
}
</style>
