<template>
  <span :class="badgeClasses">
    <BaseIcon
      v-if="icon"
      :name="icon"
      :size="iconSize"
      :class="{ 'base-badge__icon--with-text': $slots.default }"
    />
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  pulse: false
})

const badgeClasses = computed(() => {
  const classes = ['base-badge']
  
  // Add size modifier
  classes.push(`base-badge--${props.size}`)
  
  // Add variant modifier
  classes.push(`base-badge--${props.variant}`)
  
  // Add state modifiers
  if (props.pulse) classes.push('base-badge--pulse')
  
  return classes
})

const iconSize = computed((): 'xs' | 'sm' | 'md' => {
  const sizes: Record<string, 'xs' | 'sm' | 'md'> = { 
    sm: 'xs', 
    md: 'sm', 
    lg: 'md' 
  }
  return sizes[props.size]
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.base-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: $font-primary;
  font-weight: $font-medium;
  border-radius: $radius-badge;
  transition: $transition-fast-ease;
  white-space: nowrap;
  
  // Size variants
  &--sm {
    padding: $space-1 $space-2;
    font-size: $text-xs;
    min-height: 1.25rem;
    gap: $space-1;
  }
  
  &--md {
    padding: $space-1 $space-3;
    font-size: $text-sm;
    min-height: 1.5rem;
    gap: $space-1;
  }
  
  &--lg {
    padding: $space-2 $space-4;
    font-size: $text-base;
    min-height: 2rem;
    gap: $space-2;
  }
  
  // Variant styles
  &--primary {
    background-color: var(--color-primary);
    color: white;
  }
  
  &--secondary {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
  }
  
  &--success {
    background-color: var(--color-success);
    color: white;
  }
  
  &--warning {
    background-color: var(--color-warning);
    color: white;
  }
  
  &--error {
    background-color: var(--color-error);
    color: white;
  }
  
  &--info {
    background-color: var(--color-info);
    color: white;
  }
  
  // State modifiers
  &--pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}

.base-badge__icon--with-text {
  margin-right: $space-1;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .base-badge--pulse {
    animation: none;
  }
}
</style>