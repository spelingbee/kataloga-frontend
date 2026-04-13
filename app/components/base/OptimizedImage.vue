<template>
  <div
    ref="target"
    :class="[
      'relative overflow-hidden',
      containerClass,
      {
        'animate-pulse bg-neutral-20': !isLoaded && isVisible,
      },
    ]"
  >
    <!-- Placeholder while loading -->
    <div
      v-if="!isLoaded && isVisible"
      :class="[
        'absolute inset-0 flex items-center justify-center bg-neutral-20',
        placeholderClass,
      ]"
    >
      <BaseIcon
        v-if="!hasError"
        name="image"
        class="w-8 h-8 text-neutral-80/30"
      />
      <BaseIcon
        v-else
        name="image-broken"
        class="w-8 h-8 text-red-500/50"
      />
    </div>

    <!-- Optimized image -->
    <NuxtImg
      v-if="imageSrc"
      :src="imageSrc"
      :alt="alt"
      :preset="preset"
      :width="width"
      :height="height"
      :sizes="sizes"
      :class="[
        'transition-opacity duration-300',
        imageClass,
        {
          'opacity-0': !isLoaded,
          'opacity-100': isLoaded,
        },
      ]"
      :loading="eager ? 'eager' : 'lazy'"
      @load="onLoad"
      @error="onError"
    />

    <!-- Fallback image on error -->
    <div
      v-if="hasError && fallbackSrc"
      :class="['absolute inset-0', imageClass]"
    >
      <img
        :src="fallbackSrc"
        :alt="alt"
        class="w-full h-full object-cover"
        @load="onLoad"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  src: string
  alt: string
  preset?: 'dish' | 'dishLarge' | 'category' | string
  width?: number
  height?: number
  sizes?: string
  eager?: boolean
  fallbackSrc?: string
  containerClass?: string
  imageClass?: string
  placeholderClass?: string
  threshold?: number
  rootMargin?: string
}

const props = withDefaults(defineProps<Props>(), {
  preset: 'dish',
  eager: false,
  containerClass: '',
  imageClass: 'w-full h-full object-cover',
  placeholderClass: '',
  threshold: 0.1,
  rootMargin: '50px',
})

const { imageSrc, target, isVisible, isLoaded, hasError, onLoad, onError } = useLazyImage(
  props.src,
  {
    threshold: props.threshold,
    rootMargin: props.rootMargin,
    once: true,
  }
)
</script>
