<template>
  <div
    :class="spinnerClasses"
    :aria-label="label"
    role="status"
  >
    <div v-if="variant === 'dots'" class="base-spinner__dots">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    
    <div v-else-if="variant === 'ring'" class="base-spinner__ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    
    <div v-else class="base-spinner__circle"></div>
    
    <span v-if="text" class="base-spinner__text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'circle' | 'dots' | 'ring'
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white'
  text?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'circle',
  size: 'md',
  color: 'primary',
  label: 'Loading...'
})

const slots = defineSlots<{}>()

const spinnerClasses = computed(() => {
  const classes = ['base-spinner']
  
  classes.push(`base-spinner--${props.variant}`)
  classes.push(`base-spinner--${props.size}`)
  classes.push(`base-spinner--${props.color}`)
  
  if (props.text) classes.push('base-spinner--with-text')
  
  return classes
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.base-spinner {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  
  // Size variants
  &--sm {
    .base-spinner__circle,
    .base-spinner__ring,
    .base-spinner__dots {
      width: 1rem;
      height: 1rem;
    }
  }
  
  &--md {
    .base-spinner__circle,
    .base-spinner__ring,
    .base-spinner__dots {
      width: 1.5rem;
      height: 1.5rem;
    }
  }
  
  &--lg {
    .base-spinner__circle,
    .base-spinner__ring,
    .base-spinner__dots {
      width: 2rem;
      height: 2rem;
    }
  }
  
  // Color variants
  &--primary {
    .base-spinner__circle {
      border-color: var(--color-primary);
    }
    
    .base-spinner__ring div {
      border-color: var(--color-primary) transparent transparent transparent;
    }
    
    .base-spinner__dots div {
      background-color: var(--color-primary);
    }
  }
  
  &--secondary {
    .base-spinner__circle {
      border-color: var(--text-secondary);
    }
    
    .base-spinner__ring div {
      border-color: var(--text-secondary) transparent transparent transparent;
    }
    
    .base-spinner__dots div {
      background-color: var(--text-secondary);
    }
  }
  
  &--white {
    .base-spinner__circle {
      border-color: white;
    }
    
    .base-spinner__ring div {
      border-color: white transparent transparent transparent;
    }
    
    .base-spinner__dots div {
      background-color: white;
    }
  }
}

// Circle spinner
.base-spinner__circle {
  border: 2px solid transparent;
  border-top: 2px solid;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

// Ring spinner
.base-spinner__ring {
  display: inline-block;
  position: relative;
  
  div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    border: 2px solid;
    border-radius: 50%;
    animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    
    &:nth-child(1) { animation-delay: -0.45s; }
    &:nth-child(2) { animation-delay: -0.3s; }
    &:nth-child(3) { animation-delay: -0.15s; }
  }
}

// Dots spinner
.base-spinner__dots {
  display: inline-block;
  position: relative;
  
  div {
    position: absolute;
    top: 50%;
    width: 13%;
    height: 13%;
    border-radius: 50%;
    transform: translateY(-50%);
    animation: loadingDots 1.2s linear infinite;
    
    &:nth-child(1) {
      left: 8%;
      animation-delay: 0s;
    }
    
    &:nth-child(2) {
      left: 8%;
      animation-delay: -0.4s;
    }
    
    &:nth-child(3) {
      left: 32%;
      animation-delay: -0.2s;
    }
    
    &:nth-child(4) {
      left: 56%;
      animation-delay: 0s;
    }
  }
}

.base-spinner__text {
  font-size: $text-sm;
  color: var(--text-secondary);
  font-weight: $font-medium;
}

// Animations
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes loadingDots {
  0%, 80%, 100% {
    transform: scale(0) translateY(-50%);
  }
  40% {
    transform: scale(1) translateY(-50%);
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .base-spinner__circle,
  .base-spinner__ring div,
  .base-spinner__dots div {
    animation: none;
  }
  
  .base-spinner__circle {
    border-top-color: transparent;
    border-right-color: currentColor;
  }
}
</style>
