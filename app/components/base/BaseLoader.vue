<template>
  <div class="base-loader" :class="loaderClasses">
    <!-- Spinner Variant -->
    <div v-if="variant === 'spinner'" class="spinner">
      <div class="spinner-circle"></div>
    </div>
    
    <!-- Dots Variant -->
    <div v-else-if="variant === 'dots'" class="dots">
      <div class="dot" v-for="i in 3" :key="i"></div>
    </div>
    
    <!-- Pulse Variant -->
    <div v-else-if="variant === 'pulse'" class="pulse">
      <div class="pulse-circle"></div>
    </div>
    
    <!-- Bar Variant -->
    <div v-else-if="variant === 'bar'" class="bar">
      <div class="bar-fill"></div>
    </div>
    
    <!-- Skeleton Variant -->
    <div v-else-if="variant === 'skeleton'" class="skeleton">
      <div class="skeleton-line" v-for="i in lines" :key="i" :style="getSkeletonLineStyle(i)"></div>
    </div>
    
    <!-- Text (if provided) -->
    <p v-if="text" class="loader-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'spinner' | 'dots' | 'pulse' | 'bar' | 'skeleton'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'accent' | 'neutral'
  text?: string
  lines?: number // For skeleton variant
  fullscreen?: boolean
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'spinner',
  size: 'md',
  color: 'primary',
  lines: 3,
  fullscreen: false,
  overlay: false,
})

const loaderClasses = computed(() => [
  `loader--${props.variant}`,
  `loader--${props.size}`,
  `loader--${props.color}`,
  {
    'loader--fullscreen': props.fullscreen,
    'loader--overlay': props.overlay,
  }
])

const getSkeletonLineStyle = (index: number) => {
  // Vary the width of skeleton lines for more realistic appearance
  const widths = ['100%', '85%', '92%', '78%', '95%']
  return {
    width: widths[index % widths.length] || '90%'
  }
}
</script>

<style scoped>
.base-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loader--fullscreen {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  background-color: rgba(255, 255, 255, 0.8);
}

.loader--overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.6);
}

/* Size variants */
.loader--xs { font-size: 0.75rem; }
.loader--sm { font-size: 0.875rem; }
.loader--md { font-size: 1rem; }
.loader--lg { font-size: 1.125rem; }
.loader--xl { font-size: 1.25rem; }

/* Color variants */
.loader--primary { color: var(--color-primary-red); }
.loader--secondary { color: var(--color-neutral-80); }
.loader--accent { color: var(--color-primary-green); }
.loader--neutral { color: var(--color-neutral-20); }

/* Spinner Variant */
.spinner {
  position: relative;
}

.spinner-circle {
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loader--xs .spinner-circle { width: 1rem; height: 1rem; }
.loader--sm .spinner-circle { width: 1.25rem; height: 1.25rem; }
.loader--md .spinner-circle { width: 1.5rem; height: 1.5rem; }
.loader--lg .spinner-circle { width: 2rem; height: 2rem; }
.loader--xl .spinner-circle { width: 2.5rem; height: 2.5rem; }

/* Dots Variant */
.dots {
  display: flex;
  gap: 0.25rem;
}

.dot {
  background-color: currentColor;
  border-radius: 50%;
  animation: pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

.loader--xs .dot { width: 0.25rem; height: 0.25rem; }
.loader--sm .dot { width: 0.375rem; height: 0.375rem; }
.loader--md .dot { width: 0.5rem; height: 0.5rem; }
.loader--lg .dot { width: 0.625rem; height: 0.625rem; }
.loader--xl .dot { width: 0.75rem; height: 0.75rem; }

/* Pulse Variant */
.pulse {
  position: relative;
}

.pulse-circle {
  background-color: currentColor;
  border-radius: 50%;
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.loader--xs .pulse-circle { width: 0.75rem; height: 0.75rem; }
.loader--sm .pulse-circle { width: 1rem; height: 1rem; }
.loader--md .pulse-circle { width: 1.25rem; height: 1.25rem; }
.loader--lg .pulse-circle { width: 1.5rem; height: 1.5rem; }
.loader--xl .pulse-circle { width: 2rem; height: 2rem; }

/* Bar Variant */
.bar {
  position: relative;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background-color: currentColor;
  border-radius: 9999px;
  animation: loading-bar 2s ease-in-out infinite, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.loader--xs .bar { width: 4rem; height: 0.25rem; }
.loader--sm .bar { width: 5rem; height: 0.375rem; }
.loader--md .bar { width: 6rem; height: 0.5rem; }
.loader--lg .bar { width: 8rem; height: 0.625rem; }
.loader--xl .bar { width: 10rem; height: 0.75rem; }

@keyframes loading-bar {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

/* Skeleton Variant */
.skeleton {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.loader--xs .skeleton-line { height: 0.5rem; }
.loader--sm .skeleton-line { height: 0.75rem; }
.loader--md .skeleton-line { height: 1rem; }
.loader--lg .skeleton-line { height: 1.25rem; }
.loader--xl .skeleton-line { height: 1.5rem; }

/* Loader Text */
.loader-text {
  margin-top: 0.5rem;
  color: currentColor;
  opacity: 0.7;
  font-weight: 500;
}

/* Dark theme support */
.dark .loader--fullscreen {
  background-color: rgba(128, 128, 128, 0.8);
}

.dark .loader--overlay {
  background-color: rgba(128, 128, 128, 0.6);
}

.dark .bar {
  background-color: rgba(255, 255, 255, 0.2);
}

.dark .skeleton-line {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>