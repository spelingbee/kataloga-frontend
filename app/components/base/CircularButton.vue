<template>
  <BaseButton
    :variant="variant"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    circular
    :class="[
      'flex-shrink-0',
      {
        'bg-primary-green hover:bg-green-600': type === 'add',
        'bg-gray-600 hover:bg-gray-500': type === 'subtract',
        'bg-primary-red hover:bg-red-600': type === 'remove',
      }
    ]"
    @click="handleClick"
  >
    <BaseIcon
      :name="iconName"
      :size="iconSize"
      color="white"
    />
  </BaseButton>
</template>

<script setup lang="ts">
interface Props {
  type?: 'add' | 'subtract' | 'remove'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  size: 'md',
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const variant = computed(() => 'circular')

const iconName = computed(() => {
  switch (props.type) {
    case 'add':
      return 'plus'
    case 'subtract':
      return 'minus'
    case 'remove':
      return 'x'
    default:
      return 'plus'
  }
})

const iconSize = computed(() => {
  const sizes = { sm: 'sm', md: 'md', lg: 'lg' }
  return sizes[props.size]
})

const handleClick = (event: Event) => {
  emit('click', event)
}
</script>