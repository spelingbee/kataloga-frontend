<template>
  <Transition
    name="loading-overlay"
    @enter="onEnter"
    @leave="onLeave"
  >
    <div
      v-if="visible"
      :class="overlayClasses"
      :aria-label="ariaLabel"
      role="status"
    >
      <div class="loading-overlay__backdrop" />
      
      <div class="loading-overlay__content">
        <BaseSpinner
          :variant="spinnerVariant"
          :size="spinnerSize"
          :color="spinnerColor"
          :text="text"
        />
        
        <p v-if="message" class="loading-overlay__message">
          {{ message }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  variant?: 'full' | 'container' | 'inline'
  spinnerVariant?: 'circle' | 'dots' | 'ring'
  spinnerSize?: 'sm' | 'md' | 'lg'
  spinnerColor?: 'primary' | 'secondary' | 'white'
  text?: string
  message?: string
  ariaLabel?: string
  blur?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'container',
  spinnerVariant: 'circle',
  spinnerSize: 'md',
  spinnerColor: 'primary',
  ariaLabel: 'Loading content...',
  blur: true
})

const emit = defineEmits<{
  enter: []
  leave: []
}>()

const overlayClasses = computed(() => {
  const classes = ['loading-overlay']
  
  classes.push(`loading-overlay--${props.variant}`)
  
  if (props.blur) classes.push('loading-overlay--blur')
  
  return classes
})

const onEnter = () => {
  emit('enter')
}

const onLeave = () => {
  emit('leave')
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  
  // Variant styles
  &--full {
    position: fixed;
    inset: 0;
  }
  
  &--container {
    position: absolute;
    inset: 0;
  }
  
  &--inline {
    position: relative;
    min-height: 8rem;
    width: 100%;
  }
}

.loading-overlay__backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.8);
  
  .loading-overlay--blur & {
    backdrop-filter: blur(4px);
  }
  
  @media (prefers-color-scheme: dark) {
    background-color: rgba(0, 0, 0, 0.8);
  }
}

.loading-overlay__content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  padding: $space-6;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
  box-shadow: var(--shadow-lg);
  max-width: 20rem;
  text-align: center;
  
  .loading-overlay--inline & {
    background-color: transparent;
    border: none;
    box-shadow: none;
  }
}

.loading-overlay__message {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

// Transitions
.loading-overlay-enter-active,
.loading-overlay-leave-active {
  transition: opacity $transition-base $ease-in-out;
  
  .loading-overlay__backdrop {
    transition: opacity $transition-base $ease-in-out;
  }
  
  .loading-overlay__content {
    transition: all $transition-base $ease-out;
  }
}

.loading-overlay-enter-from,
.loading-overlay-leave-to {
  opacity: 0;
  
  .loading-overlay__backdrop {
    opacity: 0;
  }
  
  .loading-overlay__content {
    opacity: 0;
    transform: scale(0.9) translateY(1rem);
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .loading-overlay-enter-active,
  .loading-overlay-leave-active {
    transition: opacity 0.01ms;
  }
  
  .loading-overlay__content {
    transition: none;
  }
  
  .loading-overlay-enter-from,
  .loading-overlay-leave-to {
    .loading-overlay__content {
      transform: none;
    }
  }
}
</style>