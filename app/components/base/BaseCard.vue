<template>
  <div
    :class="cardClasses"
    @click="handleClick"
  >
    <div v-if="slots.image" class="base-card__image">
      <slot name="image" />
    </div>
    
    <div class="base-card__content">
      <div v-if="slots.header" class="base-card__header">
        <slot name="header" />
      </div>
      
      <div class="base-card__body">
        <slot />
      </div>
      
      <div v-if="slots.footer" class="base-card__footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  hoverable: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const slots = defineSlots<{
  default?: () => any
  image?: () => any
  header?: () => any
  footer?: () => any
}>()

const cardClasses = computed(() => {
  const classes = ['base-card']
  
  // Add variant modifier
  classes.push(`base-card--${props.variant}`)
  
  // Add padding modifier
  classes.push(`base-card--padding-${props.padding}`)
  
  // Add state modifiers
  if (props.hoverable) classes.push('base-card--hoverable')
  
  return classes
})

const handleClick = (event: Event) => {
  if (props.hoverable) {
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

.base-card {
  background-color: var(--bg-primary);
  border-radius: $radius-card;
  overflow: hidden;
  transition: $transition-card;
  
  // Variant styles
  &--default {
    box-shadow: $shadow-card;
  }
  
  &--elevated {
    box-shadow: $shadow-lg;
  }
  
  &--outlined {
    border: 1px solid var(--border-primary);
    box-shadow: none;
  }
  
  // Padding variants
  &--padding-sm {
    .base-card__content {
      padding: $space-3;
    }
  }
  
  &--padding-md {
    .base-card__content {
      padding: $card-padding;
    }
  }
  
  &--padding-lg {
    .base-card__content {
      padding: $space-8;
    }
  }
  
  // Hoverable state
  &--hoverable {
    cursor: pointer;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
      opacity: 0;
      transition: opacity $transition-base $ease-in-out;
      border-radius: inherit;
      pointer-events: none;
    }
    
    &:hover {
      box-shadow: var(--hover-shadow-card);
      transform: translateY(-4px) scale(1.02);
      
      &::before {
        opacity: 1;
      }
    }
    
    &:active {
      transform: translateY(-2px) scale(1.01);
    }
  }
}

.base-card__image {
  width: 100%;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.base-card__content {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.base-card__header {
  // Header styles can be customized via slots
}

.base-card__body {
  flex: 1;
}

.base-card__footer {
  // Footer styles can be customized via slots
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .base-card {
    transition: none;
    
    &--hoverable:hover {
      transform: none;
    }
  }
}
</style>
