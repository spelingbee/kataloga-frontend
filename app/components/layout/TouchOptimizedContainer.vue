<template>
  <div 
    :class="containerClasses"
    :style="containerStyle"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  touchTarget?: 'small' | 'medium' | 'large'
  swipeEnabled?: boolean
  hapticFeedback?: boolean
  preventScrollBounce?: boolean
  optimizeScrolling?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  touchTarget: 'medium',
  swipeEnabled: false,
  hapticFeedback: true,
  preventScrollBounce: true,
  optimizeScrolling: true
})

const emit = defineEmits<{
  swipeLeft: []
  swipeRight: []
  swipeUp: []
  swipeDown: []
  touchStart: [TouchEvent]
  touchEnd: [TouchEvent]
}>()

// Touch tracking
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchStartTime = ref(0)

const containerClasses = computed(() => [
  'touch-optimized-container',
  `touch-optimized-container--${props.touchTarget}`,
  {
    'touch-optimized-container--swipe-enabled': props.swipeEnabled,
    'touch-optimized-container--no-bounce': props.preventScrollBounce,
    'touch-optimized-container--optimized-scroll': props.optimizeScrolling
  }
])

const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  
  // Touch target sizes
  const touchSizes = {
    small: '44px',
    medium: '48px',
    large: '56px'
  }
  
  style['--touch-target-size'] = touchSizes[props.touchTarget]
  
  return style
})

// Touch event handlers
const handleTouchStart = (event: TouchEvent) => {
  if (!props.swipeEnabled) return
  
  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchStartTime.value = Date.now()
  
  emit('touchStart', event)
}

const handleTouchMove = (event: TouchEvent) => {
  if (!props.swipeEnabled) return
  
  // Prevent scroll bouncing on iOS
  if (props.preventScrollBounce) {
    const element = event.currentTarget as HTMLElement
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight
    const height = element.clientHeight
    
    if (scrollTop === 0 && event.touches[0].clientY > touchStartY.value) {
      event.preventDefault()
    } else if (scrollTop + height >= scrollHeight && event.touches[0].clientY < touchStartY.value) {
      event.preventDefault()
    }
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  if (!props.swipeEnabled) return
  
  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value
  const deltaTime = Date.now() - touchStartTime.value
  
  // Minimum swipe distance and maximum time for swipe detection
  const minSwipeDistance = 50
  const maxSwipeTime = 300
  
  if (deltaTime > maxSwipeTime) return
  
  const absDeltaX = Math.abs(deltaX)
  const absDeltaY = Math.abs(deltaY)
  
  // Determine swipe direction
  if (absDeltaX > minSwipeDistance && absDeltaX > absDeltaY) {
    // Horizontal swipe
    if (deltaX > 0) {
      emit('swipeRight')
    } else {
      emit('swipeLeft')
    }
    
    // Haptic feedback
    if (props.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
  } else if (absDeltaY > minSwipeDistance && absDeltaY > absDeltaX) {
    // Vertical swipe
    if (deltaY > 0) {
      emit('swipeDown')
    } else {
      emit('swipeUp')
    }
    
    // Haptic feedback
    if (props.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }
  
  emit('touchEnd', event)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens' as *;
@use '../../assets/scss/abstracts/mixins' as *;

.touch-optimized-container {
  // Base touch optimizations
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
  
  // Touch target sizing
  &--small {
    --touch-target-size: 44px;
  }
  
  &--medium {
    --touch-target-size: 48px;
  }
  
  &--large {
    --touch-target-size: 56px;
  }
  
  // Apply touch target size to interactive elements
  :deep(button),
  :deep(a),
  :deep([role="button"]),
  :deep(.touch-target) {
    min-width: var(--touch-target-size);
    min-height: var(--touch-target-size);
    position: relative;
    
    // Ensure touch area covers the minimum size
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: var(--touch-target-size);
      height: var(--touch-target-size);
      z-index: -1;
    }
  }
  
  // Optimized scrolling
  &--optimized-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    
    // Momentum scrolling for iOS
    overflow-y: auto;
    
    // Snap scrolling support
    &.scroll-snap {
      scroll-snap-type: y mandatory;
      
      > * {
        scroll-snap-align: start;
      }
    }
  }
  
  // Prevent scroll bouncing
  &--no-bounce {

    // iOS specific bounce prevention
    @supports (-webkit-overflow-scrolling: touch) {
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: transparent;
      }
      
      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: transparent;
      }
    }
  }
  
  // Swipe gesture support
  &--swipe-enabled {
    touch-action: pan-y; // Allow vertical scrolling but capture horizontal swipes
    
    &.horizontal-swipe {
      touch-action: pan-x; // Allow horizontal scrolling but capture vertical swipes
    }
    
    &.no-scroll {
      touch-action: none; // Capture all touch events
    }
  }
}

// Touch-friendly spacing
.touch-optimized-container {
  :deep(.touch-spacing) {
    padding: var(--space-3);
    margin: var(--space-2);
    
    @include mobile-only {
      padding: var(--space-4);
      margin: var(--space-3);
    }
  }
  
  // Touch-friendly gaps between interactive elements
  :deep(.touch-group) {
    display: flex;
    gap: var(--space-3);
    
    @include mobile-only {
      gap: var(--space-4);
    }
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .touch-optimized-container {
    :deep(button),
    :deep(a),
    :deep([role="button"]) {
      border: 1px solid ButtonText;
      
      &:focus {
        outline: 2px solid Highlight;
        outline-offset: 2px;
      }
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .touch-optimized-container {
    scroll-behavior: auto;
    
    :deep(*) {
      transition: none !important;
      animation: none !important;
    }
  }
}

// Large text support
@media (prefers-font-size: large) {
  .touch-optimized-container {
    --touch-target-size: 56px; // Larger touch targets for accessibility
    
    :deep(.touch-spacing) {
      padding: var(--space-4);
      margin: var(--space-3);
    }
  }
}

// Safe area support for notched devices
.touch-optimized-container {
  &.safe-area {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}
</style>
