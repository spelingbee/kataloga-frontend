<template>
  <BaseButton
    :size="size"
    :disabled="disabled || loading"
    :loading="loading"
    :full-width="fullWidth"
    class="bg-primary-green hover:bg-green-600 focus:ring-primary-green text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
    @click="handleClick"
  >
    <BaseIcon
      v-if="!loading"
      name="cart"
      :size="iconSize"
      class="mr-2"
      color="white"
    />
    
    <span v-if="$slots.default">
      <slot />
    </span>
    <span v-else-if="price">
      Добавить за {{ formattedPrice }}
    </span>
    <span v-else>
      Добавить в корзину
    </span>
  </BaseButton>
</template>

<script setup lang="ts">
import { useTelegramHaptic } from '~/composables/useTelegramHaptic'

interface Props {
  price?: number
  currency?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currency: '₽',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const iconSize = computed(() => {
  const sizes: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = { sm: 'sm', md: 'md', lg: 'lg' }
  return sizes[props.size] || 'md'
})

const formattedPrice = computed(() => {
  if (!props.price) return ''
  
  const price = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(props.price)
  
  return `${price} ${props.currency}`
})

const handleClick = (event: Event) => {
  // Trigger haptic feedback on button click
  try {
    const { cartActions } = useTelegramHaptic()
    cartActions.addToCart()
  } catch (error) {
    // Silently fail if haptic feedback is not available
  }
  
  emit('click', event)
}
</script>