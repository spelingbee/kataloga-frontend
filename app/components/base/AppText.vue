<template>
  <component
    :is="tag"
    :class="[
      'font-sans',
      sizeClasses[size],
      colorClasses[color],
      {
        'text-center': center || align === 'center',
        'text-left': align === 'left',
        'text-right': align === 'right',
        'truncate': truncate,
        'line-clamp-2': clamp === 2,
        'line-clamp-3': clamp === 3,
        'line-clamp-4': clamp === 4,
      }
    ]"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
interface Props {
  size?: 'body-lg' | 'body-md' | 'body-sm' | 'caption' | 'category'
  tag?: 'p' | 'span' | 'div' | 'label'
  color?: 'primary' | 'secondary' | 'muted' | 'white' | 'red' | 'green' | 'orange'
  align?: 'left' | 'center' | 'right'
  center?: boolean
  truncate?: boolean
  clamp?: 2 | 3 | 4
}

const props = withDefaults(defineProps<Props>(), {
  size: 'body-md',
  tag: 'p',
  color: 'primary',
  align: 'left',
  center: false,
  truncate: false
})

const sizeClasses = {
  'body-lg': 'text-body-lg',
  'body-md': 'text-body-md',
  'body-sm': 'text-body-sm',
  'caption': 'text-caption',
  'category': 'text-category'
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
