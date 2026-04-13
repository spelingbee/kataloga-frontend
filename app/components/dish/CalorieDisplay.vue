<template>
  <div :class="containerClasses">
    <!-- Fire Icon -->
    <FireIcon :size="iconSize" />
    
    <!-- Calorie Text -->
    <AppText :size="textSize" class="text-primary-orange font-medium">
      {{ calories }} cal
    </AppText>
    
    <!-- Additional Info -->
    <AppText 
      v-if="showPerServing && servingSize"
      size="caption" 
      class="text-neutral-20"
    >
      per {{ servingSize }}
    </AppText>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  calories: number
  size?: 'sm' | 'md' | 'lg'
  servingSize?: string
  showPerServing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showPerServing: false
})

const containerClasses = computed(() => [
  'flex items-center space-x-2',
  {
    'text-sm': props.size === 'sm',
    'text-base': props.size === 'md',
    'text-lg': props.size === 'lg'
  }
])

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'xs'
    case 'lg': return 'md'
    default: return 'sm'
  }
})

const textSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'body-sm'
    case 'lg': return 'body-lg'
    default: return 'body-md'
  }
})
</script>
