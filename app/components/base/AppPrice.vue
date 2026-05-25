<template>
  <span
    class="app-price"
    :class="[
      `app-price--${size}`,
      `app-price--${color}`,
      { 'app-price--strikethrough': strikethrough }
    ]"
  >
    {{ formattedPrice }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTenantSettings } from '~/composables/useTenant'

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
  currency: 'сом',
  size: 'md',
  color: 'primary',
  strikethrough: false,
  showCurrency: true
})

const { formatCurrency, language } = useTenantSettings()

const formattedPrice = computed(() => {
  const priceValue = props.price ?? props.amount ?? props.value ?? 0
  
  if (!props.showCurrency) {
    return new Intl.NumberFormat(language.value, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(priceValue)
  }
  
  return formatCurrency(priceValue, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    currency: props.currency !== 'сом' ? props.currency : undefined
  })
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/typography' as *;

.app-price {
  font-family: var(--font-primary, sans-serif);
  font-weight: var(--font-bold, 700);
  display: inline-block;
  font-variant-numeric: tabular-nums;
  -moz-font-feature-settings: "tnum";
  -webkit-font-feature-settings: "tnum";
  font-feature-settings: "tnum";

  &--sm { font-size: var(--text-sm); }
  &--md { font-size: var(--text-base); }
  &--lg { font-size: var(--text-lg); }
  &--xl { font-size: var(--text-xl); }

  &--primary { color: var(--text-primary); }
  &--green { color: var(--color-success); }
  &--red { color: var(--color-error); }
  &--orange { color: var(--color-primary); }
  &--white { color: #FFFFFF; }
  &--muted { color: var(--text-tertiary); }

  &--strikethrough {
    text-decoration: line-through;
    opacity: 0.6;
  }
}
</style>
