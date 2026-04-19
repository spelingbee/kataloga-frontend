<template>
  <div :class="containerClasses" :style="containerStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  fluid?: boolean
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive'
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  centered?: boolean
  safeArea?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fluid: false,
  padding: 'responsive',
  maxWidth: 'xl',
  centered: true,
  safeArea: false
})

const containerClasses = computed(() => {
  const classes = ['responsive-container']
  
  if (props.fluid) {
    classes.push('responsive-container--fluid')
  }
  
  if (props.centered) {
    classes.push('responsive-container--centered')
  }
  
  if (props.padding !== 'none') {
    classes.push(`responsive-container--padding-${props.padding}`)
  }
  
  if (props.maxWidth !== 'full') {
    classes.push(`responsive-container--max-${props.maxWidth}`)
  }
  
  if (props.safeArea) {
    classes.push('responsive-container--safe-area')
  }
  
  return classes
})

const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  
  // Ensure minimum width support down to 320px
  style['min-width'] = '320px'
  
  return style
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
@use '../../assets/scss/abstracts/mixins' as *;

.responsive-container {
  width: 100%;
  min-width: 320px; // Minimum supported width
  
  // Ensure proper behavior at extreme widths
  @media (max-width: 320px) {
    min-width: 100%;
    overflow-x: auto;
  }
  
  @media (min-width: 1920px) {
    max-width: 1920px;
  }
}

// Centered container
.responsive-container--centered {
  margin: 0 auto;
}

// Fluid container
.responsive-container--fluid {
  max-width: 100%;
}

// Max widths with enhanced breakpoints
.responsive-container--max-xs {
  max-width: 480px;
}

.responsive-container--max-sm {
  max-width: 640px;
}

.responsive-container--max-md {
  max-width: 768px;
}

.responsive-container--max-lg {
  max-width: 1024px;
}

.responsive-container--max-xl {
  max-width: 1280px;
}

.responsive-container--max-2xl {
  max-width: 1536px;
}

.responsive-container--max-3xl {
  max-width: 1920px;
}

// Enhanced padding system using design tokens
.responsive-container--padding-xs {
  padding: 0 var(--space-1);
}

.responsive-container--padding-sm {
  padding: 0 var(--space-2);
}

.responsive-container--padding-md {
  padding: 0 var(--space-4);
}

.responsive-container--padding-lg {
  padding: 0 var(--space-6);
}

.responsive-container--padding-xl {
  padding: 0 var(--space-8);
}

.responsive-container--padding-responsive {
  padding: 0 var(--space-4);
  
  @media (min-width: 480px) {
    padding: 0 var(--space-6);
  }
  
  @include tablet-up {
    padding: 0 var(--space-8);
  }
  
  @include desktop-up {
    padding: 0 var(--space-12);
  }
  
  @include xl-desktop-up {
    padding: 0 var(--space-16);
  }
}

// Safe area support for notched devices
.responsive-container--safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: max(var(--space-4), env(safe-area-inset-left));
  padding-right: max(var(--space-4), env(safe-area-inset-right));
  
  @include tablet-up {
    padding-left: max(var(--space-8), env(safe-area-inset-left));
    padding-right: max(var(--space-8), env(safe-area-inset-right));
  }
}

// Responsive behavior optimizations
@media (max-width: 375px) {
  .responsive-container--padding-responsive {
    padding: 0 var(--space-3);
  }
}

@media (min-width: 1440px) {
  .responsive-container--padding-responsive {
    padding: 0 var(--space-20);
  }
}

@media (min-width: 1920px) {
  .responsive-container {
    max-width: 1920px;
    margin: 0 auto;
  }
}

// Print styles
@media print {
  .responsive-container {
    max-width: none;
    padding: 0;
    margin: 0;
  }
}
</style>
