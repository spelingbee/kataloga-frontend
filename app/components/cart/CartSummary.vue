<template>
  <div class="cart-summary">
    <!-- Subtotal -->
    <div class="cart-summary__row">
      <AppText class="cart-summary__label">
        Subtotal ({{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }})
      </AppText>
      <AppPrice :price="subtotal" class="cart-summary__value" />
    </div>

    <!-- Delivery Fee -->
    <div v-if="showDeliveryFee" class="cart-summary__row">
      <AppText class="cart-summary__label">
        Delivery Fee
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

    <!-- Service Fee -->
    <div v-if="serviceFee > 0" class="cart-summary__row">
      <AppText class="cart-summary__label">
        Service Fee
      </AppText>
      <AppPrice :price="serviceFee" class="cart-summary__value" />
    </div>

    <!-- Discount -->
    <div v-if="discount > 0" class="cart-summary__row">
      <AppText class="cart-summary__label cart-summary__label--discount">
        Discount
      </AppText>
      <AppPrice :price="-discount" class="cart-summary__value cart-summary__value--discount" />
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

    <!-- Minimum Order Notice -->
    <div v-if="showMinimumNotice" class="cart-summary__notice">
      <BaseIcon name="alert-circle" size="sm" class="cart-summary__notice-icon" />
      <AppText size="caption" class="cart-summary__notice-text">
        Minimum order: {{ formatPrice(minOrderAmount) }}. Add {{ formatPrice(remainingAmount) }} more.
      </AppText>
    </div>
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

.cart-summary {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-6;
  background-color: rgba(var(--bg-primary), 0.3);
  border-radius: 0.5rem;
  border: 1px solid $color-border-subtle;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: $font-size-body-sm;
  }

  &__label {
    color: $color-neutral-20;

    &--discount {
      color: var(--color-success);
    }
  }

  &__value {
    color: white;

    &--free {
      color: var(--color-success);
      font-weight: $font-medium;
    }

    &--discount {
      color: var(--color-success);
    }
  }

  &__divider {
    border: none;
    border-top: 1px solid $color-border-subtle;
    margin: $space-4 0;
  }

  &__total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $space-2;
  }

  &__total-label {
    font-weight: $font-semibold;
    color: white;
  }

  &__total-value {
    font-weight: $font-semibold;
    color: white;
  }

  &__notice {
    display: flex;
    align-items: flex-start;
    gap: $space-2;
    margin-top: $space-4;
    padding: $space-2;
    background-color: rgba(var(--color-warning), 0.2);
    border-radius: 0.25rem;
    border: 1px solid rgba(var(--color-warning), 0.3);
  }

  &__notice-icon {
    color: var(--color-warning);
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__notice-text {
    color: var(--color-warning);
    flex: 1;
  }
}
</style>