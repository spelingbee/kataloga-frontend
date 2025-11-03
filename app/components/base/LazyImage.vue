<template>
  <div 
    ref="target" 
    class="lazy-image-container"
    :class="containerClass"
    :style="containerStyle"
  >
    <!-- Loading placeholder -->
    <div 
      v-if="!loaded && !error" 
      class="lazy-image-placeholder"
      :class="placeholderClass"
    >
      <div v-if="showSkeleton" class="animate-pulse bg-gray-200 w-full h-full rounded" />
      <BaseIcon v-else name="image" class="w-8 h-8 text-gray-400" />
    </div>

    <!-- Error state -->
    <div 
      v-else-if="error" 
      class="lazy-image-error flex items-center justify-center"
      :class="errorClass"
    >
      <BaseIcon name="image-off" class="w-8 h-8 text-gray-400" />
    </div>

    <!-- Actual image -->
    <img
      v-show="loaded && !error"
      :src="currentSrc"
      :alt="alt"
      :class="imageClass"
      :loading="nativeLoading ? 'lazy' : 'eager'"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  src: string
  alt: string
  placeholder?: string
  fallback?: string
  width?: number | string
  height?: number | string
  aspectRatio?: string
  containerClass?: string
  imageClass?: string
  placeholderClass?: string
  errorClass?: string
  showSkeleton?: boolean
  nativeLoading?: boolean
  threshold?: number
  rootMargin?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  fallback: '',
  aspectRatio: '',
  containerClass: '',
  imageClass: 'w-full h-full object-cover',
  placeholderClass: 'w-full h-full flex items-center justify-center bg-gray-100',
  errorClass: 'w-full h-full bg-gray-100',
  showSkeleton: true,
  nativeLoading: true,
  threshold: 0.1,
  rootMargin: '50px',
})

const loaded = ref(false)
const error = ref(false)
const currentSrc = ref('')

const { isVisible, target } = useLazyLoading({
  threshold: props.threshold,
  rootMargin: props.rootMargin,
})

// Container styles
const containerStyle = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.width) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  if (props.aspectRatio) {
    styles.aspectRatio = props.aspectRatio
  }
  
  return styles
})

// Load image when visible
watch(isVisible, (visible) => {
  if (visible && !loaded.value && !error.value && !currentSrc.value) {
    loadImage()
  }
})

const loadImage = () => {
  const img = new Image()
  
  img.onload = () => {
    currentSrc.value = props.src
    loaded.value = true
  }
  
  img.onerror = () => {
    if (props.fallback) {
      const fallbackImg = new Image()
      fallbackImg.onload = () => {
        currentSrc.value = props.fallback
        loaded.value = true
      }
      fallbackImg.onerror = () => {
        error.value = true
      }
      fallbackImg.src = props.fallback
    } else {
      error.value = true
    }
  }
  
  // Start with placeholder if available
  if (props.placeholder) {
    currentSrc.value = props.placeholder
  }
  
  img.src = props.src
}

const onLoad = () => {
  loaded.value = true
}

const onError = () => {
  if (props.fallback && currentSrc.value !== props.fallback) {
    currentSrc.value = props.fallback
  } else {
    error.value = true
  }
}

// Preload on hover for better UX
const preloadOnHover = () => {
  if (!loaded.value && !error.value) {
    loadImage()
  }
}

onMounted(() => {
  // If native lazy loading is disabled or not supported, use intersection observer
  if (!props.nativeLoading || !('loading' in HTMLImageElement.prototype)) {
    // Intersection observer will handle loading
  } else {
    // Use native lazy loading
    currentSrc.value = props.src
  }
})
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
}

.lazy-image-placeholder,
.lazy-image-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

img {
  transition: opacity 0.3s ease-in-out;
}
</style>