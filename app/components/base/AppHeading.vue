<template>
  <component
    :is="actualTag"
    :class="[
      'font-sans',
      sizeClasses[size],
      colorClasses[color],
      {
        'text-center': center || align === 'center',
        'text-left': align === 'left',
        'text-right': align === 'right',
      }
    ]"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'display-lg' | 'display-md' | 'display-sm' | 'heading-xl' | 'heading-lg' | 'heading-md' | 'heading-sm'
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'
  color?: 'primary' | 'secondary' | 'muted' | 'white' | 'red' | 'green' | 'orange'
  align?: 'left' | 'center' | 'right'
  center?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'heading-lg',
  level: 'h2',
  tag: 'h2',
  color: 'primary',
  align: 'left',
  center: false
})

// Use level prop if provided, otherwise fall back to tag
const actualTag = computed(() => props.level || props.tag)

const sizeClasses = {
  'display-lg': 'text-display-lg',
  'display-md': 'text-display-md',
  'display-sm': 'text-display-sm',
  'heading-xl': 'text-heading-xl',
  'heading-lg': 'text-heading-lg',
  'heading-md': 'text-heading-md',
  'heading-sm': 'text-heading-sm'
}

const colorClasses = {
  primary: 'text-neutral-80 dark:text-white',
  secondary: 'text-gray-600 dark:text-gray-300',
  muted: 'text-gray-500 dark:text-gray-400',
  white: 'text-white',
  red: 'text-primary-red',
  green: 'text-primary-green',
  orange: 'text-primary-orange'
}
</script>