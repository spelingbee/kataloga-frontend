<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :disabled="disabled || loading"
    :aria-disabled="disabled || loading"
    :aria-busy="loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <BaseIcon
      v-if="loading"
      name="spinner"
      :size="iconSize"
      class="base-button__icon base-button__icon--loading"
    />
    <BaseIcon
      v-else-if="icon && iconPosition === 'left'"
      :name="icon"
      :size="iconSize"
      :class="['base-button__icon', { 'base-button__icon--left': slots.default }]"
    />
    
    <slot />
    
    <BaseIcon
      v-if="icon && iconPosition === 'right' && !loading"
      :name="icon"
      :size="iconSize"
      :class="['base-button__icon', { 'base-button__icon--right': slots.default }]"
    />
  </component>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'circular'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  tag?: 'button' | 'a' | 'router-link' | 'nuxt-link'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  circular?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  tag: 'button',
  disabled: false,
  loading: false,
  fullWidth: false,
  circular: false,
  iconPosition: 'left',
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const slots = defineSlots<{
  default?: () => any
}>()

const buttonClasses = computed(() => {
  const classes = ['base-button']
  
  // Add size modifier
  classes.push(`base-button--${props.size}`)
  
  // Add variant modifier
  classes.push(`base-button--${props.variant}`)
  
  // Add state modifiers
  if (props.fullWidth) classes.push('base-button--full-width')
  if (props.circular) classes.push('base-button--circular')
  if (props.loading) classes.push('base-button--loading')
  if (props.disabled) classes.push('base-button--disabled')
  
  return classes
})

const iconSize = computed((): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
  const sizes: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = { sm: 'sm', md: 'md', lg: 'lg' }
  return sizes[props.size] || 'md'
})

const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  font-family: $font-secondary;
  font-weight: $font-bold;
  border: none;
  border-radius: $radius-button;
  cursor: pointer;
  transition: $transition-button;
  text-decoration: none;
  min-height: $touch-target-min;
  
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  
  // Size variants
  &--sm {
    padding: $space-2 $space-3;
    font-size: $text-sm;
    min-height: 36px; // Smaller buttons can be slightly smaller but still accessible
  }
  
  &--md {
    padding: $space-3 $space-4;
    font-size: $text-base;
  }
  
  &--lg {
    padding: $space-4 $space-6;
    font-size: $text-lg;
    min-height: 52px; // Larger buttons for better accessibility
  }
  
  // Variant styles
  &--primary {
    background: var(--gradient-primary);
    color: white;
    box-shadow: var(--shadow-glow-primary); // Using new glow token
    position: relative;
    overflow: hidden;
    border: none;
    
    // Shine effect
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
        to right,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      transform: skewX(-25deg);
      transition: none;
    }
    
    &:hover:not(.base-button--disabled):not(.base-button--loading) {
      background: var(--gradient-primary-hover);
      box-shadow: var(--shadow-glow-primary-hover);
      transform: translateY(-2px);
      
      &::before {
        left: 200%;
        transition: left 0.7s ease-in-out;
      }
    }
    
    &:active:not(.base-button--disabled):not(.base-button--loading) {
      transform: translateY(0) scale(0.98);
      box-shadow: var(--shadow-sm);
    }
    
    &:focus-visible {
      box-shadow: var(--shadow-glow-primary), 0 0 0 3px rgba(var(--color-primary-rgb), 0.3);
    }
  }
  
  &--secondary {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
    
    &:hover:not(.base-button--disabled):not(.base-button--loading) {
      background-color: var(--bg-tertiary);
      border-color: var(--color-primary);
      color: var(--color-primary);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
    
    &:active:not(.base-button--disabled):not(.base-button--loading) {
      transform: translateY(0) scale(0.98);
    }
  }
  
  &--outline {
    background-color: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: var(--color-primary);
      transition: left $transition-base $ease-out;
      z-index: -1;
    }
    
    &:hover:not(.base-button--disabled):not(.base-button--loading) {
      color: white;
      transform: translateY(-1px);
      
      &::before {
        left: 0;
      }
    }
    
    &:active:not(.base-button--disabled):not(.base-button--loading) {
      transform: translateY(0) scale(0.98);
    }
  }
  
  &--ghost {
    background-color: transparent;
    color: var(--text-primary);
    
    &:hover:not(.base-button--disabled):not(.base-button--loading) {
      background-color: var(--bg-secondary);
      transform: translateY(-1px);
    }
    
    &:active:not(.base-button--disabled):not(.base-button--loading) {
      transform: translateY(0) scale(0.98);
      background-color: var(--bg-tertiary);
    }
  }
  
  // State modifiers
  &--full-width {
    width: 100%;
  }
  
  &--circular {
    border-radius: 50%;
    padding: 0;
    
    // Ensure circular buttons maintain proper touch targets
    &.base-button--sm {
      width: $touch-target-min;
      height: $touch-target-min;
      min-width: $touch-target-min;
      min-height: $touch-target-min;
    }
    
    &.base-button--md {
      width: $touch-target-min;
      height: $touch-target-min;
      min-width: $touch-target-min;
      min-height: $touch-target-min;
    }
    
    &.base-button--lg {
      width: 52px;
      height: 52px;
      min-width: 52px;
      min-height: 52px;
    }
  }
  
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &--loading {
    cursor: wait;
  }
}

.base-button__icon {
  &--loading {
    animation: spin 1s linear infinite;
  }
  
  &--left {
    margin-right: $space-1;
  }
  
  &--right {
    margin-left: $space-1;
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

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .base-button {
    transition: none;
    
    &:hover {
      transform: none;
    }
  }
  
  .base-button__icon--loading {
    animation: none;
  }
}
</style>