<template>
  <div class="relative">
    <!-- Image Slider Container -->
    <div class="relative w-32 h-32 mx-auto overflow-hidden rounded-full border-4 border-white shadow-lg">
      <ImageSlider
        :images="images"
        :current-index="currentIndex"
        :alt="alt"
        class="w-full h-full"
        @update:current-index="currentIndex = $event"
      />
    </div>

    <!-- Navigation Dots -->
    <SliderDots
      v-if="images.length > 1"
      :total="images.length"
      :current="currentIndex"
      class="mt-4"
      @select="currentIndex = $event"
    />

    <!-- Navigation Arrows (for larger screens) -->
    <div 
      v-if="images.length > 1" 
      class="hidden md:block"
    >
      <!-- Previous Button -->
      <BaseButton
        variant="ghost"
        size="sm"
        class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-background-card/80 hover:bg-background-card"
        :disabled="currentIndex === 0"
        @click="previousImage"
      >
        <BaseIcon name="chevron-left" size="sm" />
      </BaseButton>

      <!-- Next Button -->
      <BaseButton
        variant="ghost"
        size="sm"
        class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-background-card/80 hover:bg-background-card"
        :disabled="currentIndex === images.length - 1"
        @click="nextImage"
      >
        <BaseIcon name="chevron-right" size="sm" />
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  images: string[]
  alt: string
}

defineProps<Props>()

const currentIndex = ref(0)

const nextImage = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
  }
}

const previousImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// Auto-advance slides (optional)
const autoAdvance = ref(false)
let autoAdvanceInterval: NodeJS.Timeout | null = null

const startAutoAdvance = () => {
  if (autoAdvance.value && props.images.length > 1) {
    autoAdvanceInterval = setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % props.images.length
    }, 3000)
  }
}

const stopAutoAdvance = () => {
  if (autoAdvanceInterval) {
    clearInterval(autoAdvanceInterval)
    autoAdvanceInterval = null
  }
}

onMounted(() => {
  if (autoAdvance.value) {
    startAutoAdvance()
  }
})

onUnmounted(() => {
  stopAutoAdvance()
})
</script>