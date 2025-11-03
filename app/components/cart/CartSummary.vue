<template>
  <div class="cart-summary">
    <!-- Item Count -->
    <div class="cart-summary__row">
      <AppText class="cart-summary__label">
        Items ({{ itemCount }})
      </AppText>
      <AppPrice :price="calculatedSubtotal" class="cart-summary__value" />
    </div>

    <!-- Delivery Fee -->
    <div class="cart-summary__row">
      <AppText class="cart-summary__label">
        Delivery Fee
      </AppText>
      <AppPrice 
        :price="deliveryFee" 
        class="cart-summary__value"
        :free-text="deliveryFee === 0 ? 'Free' : undefined"
      />
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
    <hr class="cart-summary__divider">

    <!-- Total -->
    <div class="cart-summary__total">
      <AppText size="heading-md" class="cart-summary__total-label">
        Total
      </AppText>
      <AppPrice :price="total" size="lg" class="cart-summary__total-value" />
    </div>

    <!-- Minimum Order Notice -->
    <div v-if="minOrderAmount && total < minOrderAmount" class="cart-summary__notice">
      <AppText size="caption" class="cart-summary__notice-text">
        Minimum order: {{ formatPrice(minOrderAmount) }}. Add {{ formatPrice(minOrderAmount - total) }} more.
      </AppText>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  total: number
  itemCount: number
  subtotal?: number
  deliveryFee?: number
  serviceFee?: number
  discount?: number
  minOrderAmount?: number
}

const props = withDefaults(defineProps<Props>(), {
  subtotal: 0,
  deliveryFee: 0,
  serviceFee: 0,
  discount: 0,
  minOrderAmount: 0
})

// Computed properties
const calculatedSubtotal = computed(() => {
  return props.subtotal || (props.total - props.deliveryFee - props.serviceFee + props.discount)
})

// Helper methods
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}
</script>

<style lang="scss" scoped>
.cart-summary {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  padding: $spacing-lg;
  background-color: rgba($color-background-card, 0.3);
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
      color: $color-primary-green;
    }
  }

  &__value {
    color: white;

    &--discount {
      color: $color-primary-green;
    }
  }

  &__divider {
    border: none;
    border-top: 1px solid $color-border-subtle;
    margin: $spacing-md 0;
  }

  &__total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $spacing-sm;
  }

  &__total-label {
    font-weight: $font-weight-semibold;
    color: white;
  }

  &__total-value {
    font-weight: $font-weight-semibold;
    color: white;
  }

  &__notice {
    margin-top: $spacing-md;
    padding: $spacing-sm;
    background-color: rgba($color-primary-orange, 0.2);
    border-radius: 0.25rem;
    border: 1px solid rgba($color-primary-orange, 0.3);
  }

  &__notice-text {
    color: $color-primary-orange;
  }
}
</style>