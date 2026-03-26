<template>
  <span
    :class="[
      'font-sans font-semibold',
      sizeClasses[size],
      colorClasses[color],
      {
        'line-through opacity-60': strikethrough,
      }
    ]"
  >
    {{ formattedPrice }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePriceFormatter } from '~/composables/usePriceFormatter'

interface Props {
  amount?: number
  value?: number
  price?: number
  currency?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'green' | 'red' | 'orange' | 'white' | 'muted'
  strikethrough?: boolean
  showCurrency?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  strikethrough: false,
  showCurrency: true
})

const { formatPrice } = usePriceFormatter()

const sizeClasses = {
  sm: 'text-body-sm',
  md: 'text-body-md',
  lg: 'text-heading-sm',
  xl: 'text-heading-md'
}

const colorClasses = {
  primary: 'text-neutral-80 dark:text-white',
  green: 'text-primary-green',
  red: 'text-primary-red',
  orange: 'text-primary-orange',
  white: 'text-white',
  muted: 'text-gray-500 dark:text-gray-400'
}

const formattedPrice = computed(() => {
  const priceValue = props.price ?? props.amount ?? props.value ?? 0
  
  if (props.showCurrency) {
    return formatPrice(priceValue)
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(priceValue)
})
</script>