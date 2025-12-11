<template>
  <div :class="['skeleton-loader', variantClass, sizeClass]" :style="customStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'text' | 'card' | 'image' | 'circle' | 'button' | 'title'
  width?: string
  height?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  size: 'md',
})

const variantClass = computed(() => `skeleton-loader--${props.variant}`)
const sizeClass = computed(() => `skeleton-loader--${props.size}`)

const customStyle = computed(() => ({
  width: props.width,
  height: props.height,
}))
</script>

<style scoped lang="scss">
.skeleton-loader {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: $radius-md;
}

// Variants
.skeleton-loader--text {
  height: 1em;
  width: 100%;
  border-radius: $radius-sm;
}

.skeleton-loader--title {
  height: 1.5em;
  width: 60%;
  border-radius: $radius-sm;
}

.skeleton-loader--card {
  width: 100%;
  height: 200px;
  border-radius: $radius-lg;
}

.skeleton-loader--image {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: $radius-md;
}

.skeleton-loader--circle {
  border-radius: 50%;
  aspect-ratio: 1 / 1;
}

.skeleton-loader--button {
  height: 40px;
  width: 120px;
  border-radius: $radius-xl;
}

// Sizes
.skeleton-loader--sm {
  &.skeleton-loader--text {
    height: 0.75em;
  }
  
  &.skeleton-loader--circle {
    width: 2rem;
    height: 2rem;
  }
  
  &.skeleton-loader--button {
    height: 32px;
    width: 100px;
  }
}

.skeleton-loader--md {
  &.skeleton-loader--circle {
    width: 3rem;
    height: 3rem;
  }
}

.skeleton-loader--lg {
  &.skeleton-loader--text {
    height: 1.25em;
  }
  
  &.skeleton-loader--circle {
    width: 4rem;
    height: 4rem;
  }
  
  &.skeleton-loader--button {
    height: 48px;
    width: 140px;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
