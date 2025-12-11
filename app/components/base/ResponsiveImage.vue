<template>
  <div :class="['responsive-image', { 'responsive-image--loading': isLoading }]">
    <SkeletonLoader
      v-if="isLoading"
      variant="image"
      :width="width"
      :height="height"
    />
    
    <NuxtImg
      v-show="!isLoading"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="loading"
      :preset="preset"
      :class="imageClass"
      @load="handleLoad"
      @error="handleError"
    />
    
    <div v-if="hasError" class="responsive-image__error">
      <span class="responsive-image__error-icon">📷</span>
      <span class="responsive-image__error-text">Failed to load image</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SkeletonLoader from './SkeletonLoader.vue'

interface Props {
  src: string
  alt: string
  width?: string | number
  height?: string | number
  loading?: 'lazy' | 'eager'
  preset?: 'thumb' | 'dish' | 'dishLarge' | 'category' | 'hero' | 'avatar'
  imageClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: 'lazy',
  preset: 'dish',
})

const isLoading = ref(true)
const hasError = ref(false)

const handleLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const handleError = () => {
  isLoading.value = false
  hasError.value = true
}
</script>

<style scoped lang="scss">
.responsive-image {
  position: relative;
  width: 100%;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity $transition-base $ease-in-out;
  }
}

.responsive-image--loading {
  img {
    opacity: 0;
  }
}

.responsive-image__error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  color: var(--text-secondary);
  gap: $space-2;
}

.responsive-image__error-icon {
  font-size: $text-2xl;
  opacity: 0.5;
}

.responsive-image__error-text {
  font-size: $text-sm;
}
</style>
