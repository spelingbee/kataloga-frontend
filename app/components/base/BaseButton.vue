<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <BaseIcon
      v-if="loading"
      name="spinner"
      :size="iconSize"
      class="btn__icon btn__icon--loading"
    />
    <BaseIcon
      v-else-if="icon && iconPosition === 'left'"
      :name="icon"
      :size="iconSize"
      :class="['btn__icon', { 'btn__icon--left': $slots.default }]"
    />
    
    <slot />
    
    <BaseIcon
      v-if="icon && iconPosition === 'right' && !loading"
      :name="icon"
      :size="iconSize"
      :class="['btn__icon', { 'btn__icon--right': $slots.default }]"
    />
  </component>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'circular'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  tag?: 'button' | 'a' | 'router-link' | 'nuxt-link'
  disabled?: boolean
  loading?: boolean
  circular?: boolean
  fullWidth?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  tag: 'button',
  disabled: false,
  loading: false,
  circular: false,
  fullWidth: false,
  iconPosition: 'left'
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const buttonClasses = computed(() => {
  const classes = ['btn']
  
  // Add size modifier
  classes.push(`btn--${props.size}`)
  
  // Add variant modifier
  classes.push(`btn--${props.variant}`)
  
  // Add state modifiers
  if (props.fullWidth) classes.push('btn--full-width')
  if (props.loading) classes.push('btn--loading')
  
  return classes
})

const iconSize = computed((): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
  const sizes: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = { sm: 'sm', md: 'md', lg: 'lg' }
  return sizes[props.size]
})

const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>