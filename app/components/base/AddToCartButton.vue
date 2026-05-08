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
      {{ $t('common.add_for', { price: formattedPrice }) }}
    </span>
    <span v-else>
      {{ $t('common.add_to_cart') }}
    </span>
  </BaseButton>
</template>

<script setup lang="ts">
import { useTelegramHaptic } from '~/composables/useTelegramHaptic'
import { useTenantSettings } from '~/composables/useTenant'

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
  const sizes = { sm: 'sm', md: 'md', lg: 'lg' } as const
  return sizes[props.size || 'md'] || 'md'
})

const { formatCurrency } = useTenantSettings()

const formattedPrice = computed(() => {
  if (!props.price) return ''
  return formatCurrency(props.price)
  
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
