<template>
  <div :class="['loading-spinner', sizeClass, colorClass]" :aria-label="label">
    <div class="loading-spinner__circle"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white'
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  label: 'Loading...',
})

const sizeClass = computed(() => `loading-spinner--${props.size}`)
const colorClass = computed(() => `loading-spinner--${props.color}`)
</script>

<style scoped lang="scss">
.loading-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner__circle {
  border-radius: 50%;
  border-style: solid;
  animation: spin 1s linear infinite;
}

// Sizes
.loading-spinner--sm {
  .loading-spinner__circle {
    width: 1rem;
    height: 1rem;
    border-width: 2px;
  }
}

.loading-spinner--md {
  .loading-spinner__circle {
    width: 1.5rem;
    height: 1.5rem;
    border-width: 2px;
  }
}

.loading-spinner--lg {
  .loading-spinner__circle {
    width: 2rem;
    height: 2rem;
    border-width: 3px;
  }
}

.loading-spinner--xl {
  .loading-spinner__circle {
    width: 3rem;
    height: 3rem;
    border-width: 4px;
  }
}

// Colors
.loading-spinner--primary {
  .loading-spinner__circle {
    border-color: var(--color-success);
    border-top-color: transparent;
  }
}

.loading-spinner--secondary {
  .loading-spinner__circle {
    border-color: var(--text-secondary);
    border-top-color: transparent;
  }
}

.loading-spinner--white {
  .loading-spinner__circle {
    border-color: white;
    border-top-color: transparent;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
