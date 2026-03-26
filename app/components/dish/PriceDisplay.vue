<template>
  <div :class="containerClasses">
    <!-- Currency Symbol -->
    <span :class="currencyClasses">{{ currencySymbol }}</span>
    
    <!-- Price Amount -->
    <span :class="amountClasses">{{ formattedAmount }}</span>
    
    <!-- Decimal Part -->
    <span 
      v-if="showDecimals && decimalPart"
      :class="decimalClasses"
    >
      .{{ decimalPart }}
    </span>

    <!-- Discount Badge -->
    <BaseBadge
      v-if="originalPrice && originalPrice > price"
      variant="success"
      size="sm"
      class="ml-2"
    >
      {{ discountPercentage }}% off
    </BaseBadge>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  price: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  currency?: string
  showDecimals?: boolean
  originalPrice?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  currency: 'USD',
  showDecimals: true,
  variant: 'default'
})

const currencySymbol = computed(() => {
  switch (props.currency) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'GBP': return '£'
    default: return '$'
  }
})

const formattedAmount = computed(() => {
  return Math.floor(props.price).toString()
})

const decimalPart = computed(() => {
  const decimals = (props.price % 1).toFixed(2).slice(2)
  return decimals !== '00' ? decimals : null
})

const discountPercentage = computed(() => {
  if (!props.originalPrice || props.originalPrice <= props.price) return 0
  return Math.round(((props.originalPrice - props.price) / props.originalPrice) * 100)
})

const containerClasses = computed(() => [
  'flex items-baseline font-semibold',
  {
    'text-primary-green': props.variant === 'success',
    'text-primary-orange': props.variant === 'warning',
    'text-primary-red': props.variant === 'error',
    'text-white': props.variant === 'default'
  }
])

const currencyClasses = computed(() => [
  'font-medium',
  {
    'text-xs': props.size === 'xs',
    'text-sm': props.size === 'sm',
    'text-base': props.size === 'md',
    'text-lg': props.size === 'lg',
    'text-xl': props.size === 'xl'
  }
])

const amountClasses = computed(() => [
  'font-bold',
  {
    'text-sm': props.size === 'xs',
    'text-base': props.size === 'sm',
    'text-lg': props.size === 'md',
    'text-xl': props.size === 'lg',
    'text-2xl': props.size === 'xl'
  }
])

const decimalClasses = computed(() => [
  'font-medium opacity-80',
  {
    'text-xs': props.size === 'xs',
    'text-sm': props.size === 'sm' || props.size === 'md',
    'text-base': props.size === 'lg',
    'text-lg': props.size === 'xl'
  }
])
</script>