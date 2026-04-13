<template>
  <div 
    class="relative w-full h-full overflow-hidden"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Images Container -->
    <div 
      class="flex transition-transform duration-300 ease-out h-full"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <div
        v-for="(image, index) in images"
        :key="index"
        class="flex-shrink-0 w-full h-full"
      >
        <BaseImage
          :src="image"
          :alt="`${alt} - Image ${index + 1}`"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    </div>

    <!-- Loading Indicator -->
    <div 
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-background-card/80"
    >
      <div class="w-6 h-6 border-2 border-primary-red border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  images: string[]
  currentIndex: number
  alt: string
  autoAdvance?: boolean
  autoAdvanceInterval?: number
}

interface Emits {
  (e: 'update:current-index', index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  autoAdvance: false,
  autoAdvanceInterval: 3000,
})

const emit = defineEmits<Emits>()

const loading = ref(false)

// Touch handling for mobile swipe
const touchStartX = ref(0)
const touchEndX = ref(0)
const minSwipeDistance = 50

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchMove = (e: TouchEvent) => {
  touchEndX.value = e.touches[0].clientX
}

const handleTouchEnd = () => {
  const swipeDistance = touchStartX.value - touchEndX.value
  
  if (Math.abs(swipeDistance) > minSwipeDistance) {
    if (swipeDistance > 0 && props.currentIndex < props.images.length - 1) {
      // Swipe left - next image
      emit('update:current-index', props.currentIndex + 1)
    } else if (swipeDistance < 0 && props.currentIndex > 0) {
      // Swipe right - previous image
      emit('update:current-index', props.currentIndex - 1)
    }
  }
}

// Auto-advance functionality
let autoAdvanceTimer: NodeJS.Timeout | null = null

const startAutoAdvance = () => {
  if (props.autoAdvance && props.images.length > 1) {
    autoAdvanceTimer = setInterval(() => {
      const nextIndex = (props.currentIndex + 1) % props.images.length
      emit('update:current-index', nextIndex)
    }, props.autoAdvanceInterval)
  }
}

const stopAutoAdvance = () => {
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer)
    autoAdvanceTimer = null
  }
}

// Watch for prop changes
watch(() => props.autoAdvance, (newValue) => {
  if (newValue) {
    startAutoAdvance()
  } else {
    stopAutoAdvance()
  }
})

watch(() => props.images, () => {
  // Reset to first image when images change
  emit('update:current-index', 0)
})

// Lifecycle
onMounted(() => {
  if (props.autoAdvance) {
    startAutoAdvance()
  }
})

onUnmounted(() => {
  stopAutoAdvance()
})

// Pause auto-advance on hover (desktop)
const pauseAutoAdvance = () => {
  stopAutoAdvance()
}

const resumeAutoAdvance = () => {
  if (props.autoAdvance) {
    startAutoAdvance()
  }
}
</script>
