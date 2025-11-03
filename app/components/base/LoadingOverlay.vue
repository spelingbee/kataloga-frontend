<template>
  <Teleport to="body">
    <Transition
      name="loading-overlay"
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="loading-overlay" :class="overlayClasses">
        <div class="loading-content">
          <BaseLoader
            :variant="variant"
            :size="size"
            :color="color"
            :text="text"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  variant?: 'spinner' | 'dots' | 'pulse' | 'bar'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'accent' | 'neutral'
  text?: string
  blur?: boolean
  dark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'spinner',
  size: 'lg',
  color: 'primary',
  blur: true,
  dark: false,
})

const overlayClasses = computed(() => [
  {
    'loading-overlay--blur': props.blur,
    'loading-overlay--dark': props.dark,
  }
])

// Prevent body scroll when overlay is shown
watch(() => props.show, (show) => {
  if (import.meta.client) {
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
}

.loading-overlay--blur {
  backdrop-filter: blur(4px);
}

.loading-overlay--dark {
  background-color: rgba(128, 128, 128, 0.8);
}

.loading-content {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  border: 1px solid var(--color-border-subtle);
}

.loading-overlay--dark .loading-content {
  background-color: var(--color-neutral-80);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Dark theme support */
.dark .loading-overlay {
  background-color: rgba(128, 128, 128, 0.8);
}

.dark .loading-content {
  background-color: var(--color-background-card);
  border-color: var(--color-border-subtle);
}
</style>