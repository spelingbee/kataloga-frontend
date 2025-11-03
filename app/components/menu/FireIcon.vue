<template>
  <span
    :class="[
      'inline-flex items-center justify-center transition-all duration-200',
      sizeClasses[size],
      {
        'animate-pulse': animated,
        'animate-bounce': bounce
      }
    ]"
    role="img"
    :aria-label="ariaLabel"
  >
    <!-- Fire Emoji -->
    <span 
      v-if="variant === 'emoji'"
      :class="textSizeClasses[size]"
      class="select-none filter drop-shadow-sm"
    >
      🔥
    </span>
    
    <!-- SVG Fire Icon -->
    <svg
      v-else
      :class="svgSizeClasses[size]"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="text-primary-orange drop-shadow-sm"
    >
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.3 13.3 6.3 12.4 6.7C12.1 6.9 12 7.2 12 7.5C12 8.1 12.4 8.5 13 8.5C14.1 8.5 15 9.4 15 10.5C15 11.6 14.1 12.5 13 12.5C12.4 12.5 12 12.9 12 13.5C12 14.1 12.4 14.5 13 14.5C14.1 14.5 15 15.4 15 16.5C15 17.6 14.1 18.5 13 18.5C11.9 18.5 11 17.6 11 16.5C11 15.2 11.7 14.2 12.6 13.8C12.9 13.6 13 13.3 13 13C13 12.4 12.6 12 12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C12.6 8 13 7.6 13 7C13 6.4 12.6 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"/>
    </svg>
  </span>
</template>

<script setup lang="ts">
interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'emoji' | 'svg'
  animated?: boolean
  bounce?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'emoji',
  animated: false,
  bounce: false
})

// Size classes for the container
const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
}

// Text size classes for emoji
const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl'
}

// SVG size classes
const svgSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
}

const ariaLabel = 'Popular item indicator'
</script>

<style scoped>
/* Custom fire animation */
@keyframes fire-flicker {
  0%, 100% { 
    transform: scale(1) rotate(0deg);
    filter: hue-rotate(0deg);
  }
  25% { 
    transform: scale(1.05) rotate(-1deg);
    filter: hue-rotate(5deg);
  }
  50% { 
    transform: scale(0.95) rotate(1deg);
    filter: hue-rotate(-5deg);
  }
  75% { 
    transform: scale(1.02) rotate(-0.5deg);
    filter: hue-rotate(3deg);
  }
}

.animate-pulse {
  animation: fire-flicker 2s ease-in-out infinite;
}

/* Glow effect */
span:hover {
  filter: drop-shadow(0 0 8px rgba(254, 165, 41, 0.6));
}
</style>