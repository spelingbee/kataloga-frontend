<template>
  <div
    :class="[
      'relative overflow-hidden transition-all duration-300',
      sizeClasses[size],
      shapeClasses[shape],
      {
        'ring-2 ring-white ring-offset-2 ring-offset-transparent': withBorder,
        'shadow-lg': withShadow,
        'cursor-pointer': clickable
      }
    ]"
    @click="handleClick"
  >
    <!-- Main Image -->
    <BaseImage
      :src="imageUrl || ''"
      :alt="alt"
      :class="[
        'w-full h-full object-cover transition-transform duration-300',
        {
          'group-hover:scale-110': hoverEffect,
          'scale-110': isHovered
        }
      ]"
      :loading="loading"
      :placeholder="placeholder"
    />
    
    <!-- Overlay for hover effects -->
    <div
      v-if="hoverEffect"
      :class="[
        'absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300',
        {
          'group-hover:opacity-100': true,
          'opacity-100': isHovered
        }
      ]"
    />
    
    <!-- Popular indicator -->
    <div
      v-if="isPopular"
      class="absolute top-1 right-1 z-10"
    >
      <FireIcon 
        :size="popularIconSize"
        :animated="true"
        class="drop-shadow-md"
      />
    </div>
    
    <!-- Availability overlay -->
    <div
      v-if="!isAvailable"
      class="absolute inset-0 bg-black/60 flex items-center justify-center"
    >
      <AppText size="caption" color="white" class="font-medium">
        Unavailable
      </AppText>
    </div>
    
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-background-card/80 flex items-center justify-center"
    >
      <BaseIcon name="spinner" size="md" class="animate-spin text-neutral-80" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  imageUrl?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circular' | 'rounded' | 'square'
  withBorder?: boolean
  withShadow?: boolean
  hoverEffect?: boolean
  clickable?: boolean
  isPopular?: boolean
  isAvailable?: boolean
  loading?: 'lazy' | 'eager'
  placeholder?: string
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  shape: 'circular',
  withBorder: true,
  withShadow: false,
  hoverEffect: true,
  clickable: false,
  isPopular: false,
  isAvailable: true,
  loading: 'lazy',
  isLoading: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Local state for hover
const isHovered = ref(false)

// Size classes
const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-24 h-24'
}

// Shape classes
const shapeClasses = {
  circular: 'rounded-full',
  rounded: 'rounded-lg',
  square: 'rounded-none'
}

// Popular icon size based on image size
const popularIconSize = computed(() => {
  const sizeMap = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
    xl: 'lg'
  }
  return sizeMap[props.size] as 'xs' | 'sm' | 'md' | 'lg'
})

// Methods
const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}

// Mouse events for manual hover control
const handleMouseEnter = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}
</script>

<style scoped>
/* Smooth transitions */
div {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover effects */
.cursor-pointer:hover {
  transform: scale(1.05);
}

.cursor-pointer:active {
  transform: scale(0.95);
}

/* Ring offset for better visibility */
.ring-offset-2 {
  --tw-ring-offset-width: 2px;
}

/* Custom shadow for circular images */
.rounded-full.shadow-lg {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Focus styles for accessibility */
.cursor-pointer:focus-visible {
  outline: 2px solid var(--color-primary-green);
  outline-offset: 2px;
}
</style>