<template>
  <span
    :class="[
      'inline-flex items-center justify-center font-medium transition-all duration-200',
      sizeClasses[size],
      variantClasses[variant],
      shapeClasses[shape],
      {
        'animate-pulse': pulse,
      }
    ]"
  >
    <BaseIcon
      v-if="icon"
      :name="icon"
      :size="iconSize"
      :class="{ 'mr-1': $slots.default }"
    />
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  shape?: 'rounded' | 'circular' | 'square'
  icon?: string
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  shape: 'rounded',
  pulse: false
})

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs min-h-[1.25rem]',
  md: 'px-2.5 py-1 text-sm min-h-[1.5rem]',
  lg: 'px-3 py-1.5 text-base min-h-[2rem]'
}

const variantClasses = {
  primary: 'bg-primary-red text-white',
  secondary: 'bg-background-card text-white border border-border-subtle',
  success: 'bg-primary-green text-white',
  warning: 'bg-primary-orange text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white'
}

const shapeClasses = {
  rounded: 'rounded-full',
  circular: 'rounded-full aspect-square',
  square: 'rounded-md'
}

const iconSize = computed(() => {
  const sizes = { sm: 'xs', md: 'sm', lg: 'md' }
  return sizes[props.size]
})
</script>