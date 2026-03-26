<template>
  <div :class="gridClasses" :style="gridStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  cols?: number | { mobile?: number; tablet?: number; desktop?: number; xl?: number }
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
  justifyItems?: 'start' | 'center' | 'end' | 'stretch'
  autoRows?: string
  minItemWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  cols: () => ({ mobile: 1, tablet: 2, desktop: 3, xl: 4 }),
  gap: 'md',
  alignItems: 'stretch',
  justifyItems: 'stretch',
})

const gridClasses = computed(() => {
  const classes = ['responsive-grid']
  
  if (typeof props.cols === 'number') {
    classes.push(`responsive-grid--cols-${props.cols}`)
  } else {
    classes.push('responsive-grid--responsive')
  }
  
  classes.push(`responsive-grid--gap-${props.gap}`)
  classes.push(`responsive-grid--align-${props.alignItems}`)
  classes.push(`responsive-grid--justify-${props.justifyItems}`)
  
  return classes
})

const gridStyle = computed(() => {
  const style: Record<string, any> = {}
  
  if (typeof props.cols === 'object') {
    style['--grid-cols-mobile'] = props.cols.mobile || 1
    style['--grid-cols-tablet'] = props.cols.tablet || 2
    style['--grid-cols-desktop'] = props.cols.desktop || 3
    style['--grid-cols-xl'] = props.cols.xl || 4
  }
  
  if (props.autoRows) {
    style['--grid-auto-rows'] = props.autoRows
  }
  
  if (props.minItemWidth) {
    style['--grid-min-item-width'] = props.minItemWidth
  }
  
  return style
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens' as *;
@use '../../assets/scss/abstracts/mixins' as *;

.responsive-grid {
  display: grid;
  width: 100%;
}

// Fixed columns
.responsive-grid--cols-1 {
  grid-template-columns: repeat(1, 1fr);
}

.responsive-grid--cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.responsive-grid--cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.responsive-grid--cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.responsive-grid--cols-5 {
  grid-template-columns: repeat(5, 1fr);
}

.responsive-grid--cols-6 {
  grid-template-columns: repeat(6, 1fr);
}

// Responsive columns with enhanced breakpoints
.responsive-grid--responsive {
  grid-template-columns: repeat(var(--grid-cols-mobile, 1), 1fr);
  
  @include tablet-up {
    grid-template-columns: repeat(var(--grid-cols-tablet, 2), 1fr);
  }
  
  @include desktop-up {
    grid-template-columns: repeat(var(--grid-cols-desktop, 3), 1fr);
  }
  
  @include xl-desktop-up {
    grid-template-columns: repeat(var(--grid-cols-xl, 4), 1fr);
  }
}

// Auto-fit grid for dynamic layouts
.responsive-grid--auto-fit {
  grid-template-columns: repeat(auto-fit, minmax(var(--grid-min-item-width, 250px), 1fr));
}

// Auto-fill grid for consistent sizing
.responsive-grid--auto-fill {
  grid-template-columns: repeat(auto-fill, minmax(var(--grid-min-item-width, 250px), 1fr));
}

// Auto rows
.responsive-grid[style*="--grid-auto-rows"] {
  grid-auto-rows: var(--grid-auto-rows);
}

// Gap sizes using design tokens
.responsive-grid--gap-xs {
  gap: var(--space-1);
}

.responsive-grid--gap-sm {
  gap: var(--space-2);
}

.responsive-grid--gap-md {
  gap: var(--space-4);
}

.responsive-grid--gap-lg {
  gap: var(--space-6);
}

.responsive-grid--gap-xl {
  gap: var(--space-8);
}

// Alignment
.responsive-grid--align-start {
  align-items: start;
}

.responsive-grid--align-center {
  align-items: center;
}

.responsive-grid--align-end {
  align-items: end;
}

.responsive-grid--align-stretch {
  align-items: stretch;
}

// Justify
.responsive-grid--justify-start {
  justify-items: start;
}

.responsive-grid--justify-center {
  justify-items: center;
}

.responsive-grid--justify-end {
  justify-items: end;
}

.responsive-grid--justify-stretch {
  justify-items: stretch;
}

// Responsive behavior from 320px to 1920px
@media (max-width: 320px) {
  .responsive-grid--responsive {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1920px) {
  .responsive-grid--responsive {
    grid-template-columns: repeat(var(--grid-cols-xl, 4), 1fr);
    max-width: 1920px;
    margin: 0 auto;
  }
}
</style>