<template>
  <div class="flex items-center justify-center space-x-2">
    <button
      v-for="(_, index) in total"
      :key="index"
      :class="[
        'transition-all duration-200 rounded-full',
        index === current
          ? 'w-3 h-3 bg-primary-red'
          : 'w-2 h-2 bg-neutral-20/40 hover:bg-neutral-20/60'
      ]"
      @click="$emit('select', index)"
      :aria-label="`Go to slide ${index + 1}`"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  total: number
  current: number
}

interface Emits {
  (e: 'select', index: number): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>