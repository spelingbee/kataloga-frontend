<template>
  <div
    :class="skeletonClasses"
    :style="customStyle"
    :aria-label="ariaLabel"
    role="status"
  >
    <!-- Complex skeleton variants -->
    <template v-if="variant === 'menu-item'">
      <div class="skeleton__image" />
      <div class="skeleton__content">
        <div class="skeleton__title" />
        <div class="skeleton__description" />
        <div class="skeleton__description skeleton__description--short" />
        <div class="skeleton__footer">
          <div class="skeleton__price" />
          <div class="skeleton__button" />
        </div>
      </div>
    </template>
    
    <template v-else-if="variant === 'card-header'">
      <div class="skeleton__avatar" />
      <div class="skeleton__header-content">
        <div class="skeleton__title" />
        <div class="skeleton__subtitle" />
      </div>
    </template>
    
    <template v-else-if="variant === 'list-item'">
      <div class="skeleton__icon" />
      <div class="skeleton__list-content">
        <div class="skeleton__title" />
        <div class="skeleton__description skeleton__description--short" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'text' | 'card' | 'image' | 'circle' | 'button' | 'menu-item' | 'card-header' | 'list-item'
  width?: string
  height?: string
  animated?: boolean
  lines?: number
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  animated: true,
  lines: 1,
  ariaLabel: 'Loading content...'
})

const skeletonClasses = computed(() => {
  const classes = ['skeleton']
  
  classes.push(`skeleton--${props.variant}`)
  
  if (props.animated) classes.push('skeleton--animated')
  if (props.lines > 1) classes.push('skeleton--multiline')
  
  return classes
})

const customStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.width) {
    style.width = props.width
  }
  
  if (props.height) {
    style.height = props.height
  }
  
  return style
})

const slots = defineSlots<{}>()
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 100%
  );
  background-size: 200px 100%;
  border-radius: $radius-md;
  
  &--animated {
    animation: skeletonShimmer 1.2s ease-in-out infinite;
  }
}

// Basic variants
.skeleton--text {
  height: 1rem;
  width: 100%;
  border-radius: $radius-sm;
  
  &.skeleton--multiline {
    height: auto;
    
    &::after {
      content: '';
      display: block;
      height: 1rem;
      margin-top: $space-2;
      width: 75%;
      background: inherit;
      border-radius: $radius-sm;
    }
  }
}

.skeleton--card {
  height: 12rem;
  width: 100%;
  border-radius: $radius-lg;
}

.skeleton--image {
  height: 8rem;
  width: 100%;
  border-radius: $radius-md;
  aspect-ratio: 16 / 9;
}

.skeleton--circle {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
}

.skeleton--button {
  height: 2.5rem;
  width: 6rem;
  border-radius: $radius-button;
}

// Complex variants
.skeleton--menu-item {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
  
  .skeleton__image {
    width: 100%;
    height: 8rem;
    background: inherit;
    border-radius: $radius-md;
    aspect-ratio: 16 / 9;
  }
  
  .skeleton__content {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }
  
  .skeleton__title {
    height: 1.25rem;
    width: 80%;
    background: inherit;
    border-radius: $radius-sm;
  }
  
  .skeleton__description {
    height: 1rem;
    width: 100%;
    background: inherit;
    border-radius: $radius-sm;
    
    &--short {
      width: 60%;
    }
  }
  
  .skeleton__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $space-2;
  }
  
  .skeleton__price {
    height: 1.5rem;
    width: 4rem;
    background: inherit;
    border-radius: $radius-sm;
  }
  
  .skeleton__button {
    height: 2.5rem;
    width: 6rem;
    background: inherit;
    border-radius: $radius-button;
  }
}

.skeleton--card-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  
  .skeleton__avatar {
    width: 3rem;
    height: 3rem;
    background: inherit;
    border-radius: 50%;
    flex-shrink: 0;
  }
  
  .skeleton__header-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }
  
  .skeleton__title {
    height: 1.25rem;
    width: 70%;
    background: inherit;
    border-radius: $radius-sm;
  }
  
  .skeleton__subtitle {
    height: 1rem;
    width: 50%;
    background: inherit;
    border-radius: $radius-sm;
  }
}

.skeleton--list-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  
  .skeleton__icon {
    width: 2rem;
    height: 2rem;
    background: inherit;
    border-radius: $radius-md;
    flex-shrink: 0;
  }
  
  .skeleton__list-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }
  
  .skeleton__title {
    height: 1.25rem;
    width: 60%;
    background: inherit;
    border-radius: $radius-sm;
  }
  
  .skeleton__description {
    height: 1rem;
    width: 40%;
    background: inherit;
    border-radius: $radius-sm;
    
    &--short {
      width: 30%;
    }
  }
}

// Animations
@keyframes skeletonShimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
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
  .skeleton--animated {
    animation: pulse 2s ease-in-out infinite;
  }
}

// Dark theme support
@media (prefers-color-scheme: dark) {
  .skeleton {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 100%
    );
  }
}
</style>
