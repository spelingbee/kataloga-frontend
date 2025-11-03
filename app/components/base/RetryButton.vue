<template>
  <BaseButton
    :variant="variant"
    :size="size"
    :loading="loading"
    :disabled="disabled || loading"
    @click="handleRetry"
    class="retry-button"
  >
    <BaseIcon 
      v-if="!loading" 
      name="refresh-cw" 
      :size="iconSize"
      class="mr-2"
    />
    {{ buttonText }}
  </BaseButton>
</template>

<script setup lang="ts">
interface Props {
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  retryCount?: number
  maxRetries?: number
  customText?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  variant: 'primary',
  size: 'sm',
  retryCount: 0,
  maxRetries: 3,
})

const emit = defineEmits<{
  click: []
}>()

const iconSize = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'xs'
    case 'sm':
      return 'xs'
    case 'lg':
      return 'sm'
    default:
      return 'xs'
  }
})

const buttonText = computed(() => {
  if (props.customText) {
    return props.customText
  }
  
  if (props.loading) {
    return 'Retrying...'
  }
  
  if (props.retryCount > 0) {
    const remaining = props.maxRetries - props.retryCount
    if (remaining <= 0) {
      return 'No more retries'
    }
    return `Retry (${remaining} left)`
  }
  
  return 'Try Again'
})

const canRetry = computed(() => {
  return !props.disabled && !props.loading && props.retryCount < props.maxRetries
})

const handleRetry = () => {
  if (canRetry.value) {
    emit('click')
  }
}
</script>

<style scoped>
.retry-button {
  transition: all 0.2s ease;
}

.retry-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.retry-button:active:not(:disabled) {
  transform: scale(0.95);
}
</style>