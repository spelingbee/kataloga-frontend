<template>
  <div
    :class="[
      'relative overflow-hidden bg-background-card',
      shapeClasses[shape],
      sizeClasses[size],
      {
        'border-2 border-white': border && shape === 'circular',
        'border border-border-subtle': border && shape !== 'circular',
      }
    ]"
  >
    <!-- Loading placeholder -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-gray-700 animate-pulse"
    >
      <BaseIcon name="spinner" size="lg" color="muted" class="animate-spin" />
    </div>
    
    <!-- Error placeholder -->
    <div
      v-else-if="error"
      class="absolute inset-0 flex items-center justify-center bg-gray-700 text-gray-400"
    >
      <BaseIcon name="x" size="lg" color="muted" />
    </div>
    
    <!-- Image -->
    <img
      v-else
      :src="optimizedSrc"
      :alt="alt"
      :class="[
        'w-full h-full transition-all duration-300',
        objectFitClasses[objectFit],
        {
          'opacity-0': !imageLoaded,
          'opacity-100': imageLoaded,
          'hover:scale-105': hoverable && imageLoaded,
        }
      ]"
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- Overlay -->
    <div
      v-if="$slots.overlay"
      class="absolute inset-0 flex items-center justify-center"
    >
      <slot name="overlay" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  src: string
  alt?: string
  shape?: 'square' | 'circular' | 'rounded'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom'
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down'
  border?: boolean
  hoverable?: boolean
  lazy?: boolean
  quality?: number
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  shape: 'rounded',
  size: 'md',
  objectFit: 'cover',
  border: false,
  hoverable: false,
  lazy: true,
  quality: 80
})

const loading = ref(true)
const error = ref(false)
const imageLoaded = ref(false)

const shapeClasses = {
  square: 'rounded-none',
  circular: 'rounded-full',
  rounded: 'rounded-lg'
}

const sizeClasses = {
  sm: 'w-dish-image h-dish-image',
  md: 'w-dish-image-large h-dish-image-large',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
  custom: ''
}

const objectFitClasses = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill',
  'scale-down': 'object-scale-down'
}

// Optimize image URL (placeholder for actual image optimization service)
const optimizedSrc = computed(() => {
  if (!props.src) return ''
  
  // In a real app, you would integrate with Nuxt Image or similar service
  // For now, just return the original src
  let url = props.src
  
  // Add quality parameter if supported
  if (props.quality && props.quality !== 80) {
    const separator = url.includes('?') ? '&' : '?'
    url += `${separator}q=${props.quality}`
  }
  
  // Add dimensions if provided
  if (props.width || props.height) {
    const separator = url.includes('?') ? '&' : '?'
    if (props.width) url += `${separator}w=${props.width}`
    if (props.height) url += `${url.includes('w=') ? '&' : separator}h=${props.height}`
  }
  
  return url
})

const handleLoad = () => {
  loading.value = false
  error.value = false
  imageLoaded.value = true
}

const handleError = () => {
  loading.value = false
  error.value = true
  imageLoaded.value = false
}

// Reset state when src changes
watch(() => props.src, () => {
  loading.value = true
  error.value = false
  imageLoaded.value = false
})
</script>