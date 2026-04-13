<template>
  <div ref="target" :class="containerClass">
    <!-- Loading placeholder -->
    <div
      v-if="!isVisible"
      :class="[
        'flex items-center justify-center',
        placeholderClass,
        { 'animate-pulse bg-neutral-20': showPlaceholder },
      ]"
      :style="{ height: placeholderHeight }"
    >
      <BaseLoader v-if="showPlaceholder" size="sm" />
    </div>

    <!-- Lazy loaded content -->
    <div
      v-else
      :class="[
        'transition-opacity duration-300',
        {
          'opacity-0': isLoading,
          'opacity-100': !isLoading,
        },
      ]"
    >
      <slot :is-visible="isVisible" :is-loading="isLoading" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  threshold?: number
  rootMargin?: string
  once?: boolean
  showPlaceholder?: boolean
  placeholderHeight?: string
  containerClass?: string
  placeholderClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 0.1,
  rootMargin: '50px',
  once: true,
  showPlaceholder: true,
  placeholderHeight: '200px',
  containerClass: '',
  placeholderClass: '',
})

const { isVisible, target } = useLazyLoading({
  threshold: props.threshold,
  rootMargin: props.rootMargin,
  once: props.once,
})

const isLoading = ref(false)

// Emit events for parent components
const emit = defineEmits<{
  visible: [boolean]
  loading: [boolean]
}>()

watch(isVisible, (visible) => {
  emit('visible', visible)
})

watch(isLoading, (loading) => {
  emit('loading', loading)
})

// Expose loading state control for child components
const setLoading = (loading: boolean) => {
  isLoading.value = loading
}

defineExpose({
  setLoading,
  isVisible,
  isLoading,
})
</script>
