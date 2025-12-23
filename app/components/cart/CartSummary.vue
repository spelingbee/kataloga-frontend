<template>
  <div class="cart-summary-wrapper">
    <div class="cart-summary">
      <!-- Subtotal -->
      <div class="cart-summary__row">
        <AppText class="cart-summary__label">
          Subtotal
        </AppText>
        <AppPrice :price="subtotal" class="cart-summary__value" />
      </div>

      <!-- Delivery Fee -->
      <div v-if="showDeliveryFee" class="cart-summary__row">
        <AppText class="cart-summary__label">
          Delivery
        </AppText>
        <AppPrice
          v-if="deliveryFee > 0"
          :price="deliveryFee"
          class="cart-summary__value"
        />
        <AppText v-else class="cart-summary__value cart-summary__value--free">
          Free
        </AppText>
      </div>

      <!-- Divider -->
      <hr class="cart-summary__divider"/>

      <!-- Total -->
      <div class="cart-summary__total">
        <AppText size="heading-md" class="cart-summary__total-label">
          Total
        </AppText>
        <AppPrice :price="total" size="lg" class="cart-summary__total-value" />
      </div>
    </div>
    <BaseButton class="w-full">
      Place Order (${{ total.toFixed(2) }})
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTenant } from '~/composables/useTenant'

// Props
interface Props {
  subtotal: number
  total: number
  itemCount: number
  deliveryFee?: number
  serviceFee?: number
  discount?: number
  minOrderAmount?: number
  showDeliveryFee?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  deliveryFee: 0,
  serviceFee: 0,
  discount: 0,
  minOrderAmount: 0,
  showDeliveryFee: false
})

// Tenant context
const { tenantSettings } = useTenant()

// Computed properties
const showMinimumNotice = computed(() => {
  return props.minOrderAmount > 0 && props.subtotal < props.minOrderAmount
})

const remainingAmount = computed(() => {
  return Math.max(0, props.minOrderAmount - props.subtotal)
})

const currency = computed(() => tenantSettings.value?.currency || 'USD')
const locale = computed(() => {
  // Map currency to locale
  const currencyLocaleMap: Record<string, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    RUB: 'ru-RU'
  }
  return currencyLocaleMap[currency.value] || 'en-US'
})

// Helper methods
const formatPrice = (price: number) => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currency.value,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}
</script>

<style lang="scss" scoped>
@use '~/assets/scss/abstracts/variables' as *;
@use '~/assets/scss/abstracts/functions' as *;

.cart-summary-wrapper {
  padding: 16px;
  background-color: var(--bg-primary);
  border-top: 1px solid var(--border-primary);
}

.cart-summary {
  margin-bottom: 16px;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: $font-size-body-sm;
    margin-bottom: 8px;
  }

  &__label {
    color: var(--text-secondary);
  }

  &__value {
    color: var(--text-primary);
    font-weight: 500;

    &--free {
      color: var(--color-success);
    }
  }

  &__divider {
    border: none;
    border-top: 1px solid var(--border-primary);
    margin: 16px 0;
  }

  &__total {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__total-label {
    font-weight: $font-semibold;
    color: var(--text-primary);
  }

  &__total-value {
    font-weight: $font-bold;
    color: var(--color-primary);
  }
}
</style>