<template>
  <div class="cart-summary">
    <!-- Items count indicator (optional) -->
    
    <div class="summary-rows">
      <!-- Subtotal -->
      <div class="summary-row">
        <span class="summary-label">{{ $t('cart.subtotal') }}</span>
        <span class="summary-value">{{ formatPrice(subtotal) }}</span>
      </div>

      <!-- Delivery Fee -->
      <div v-if="showDeliveryFee || deliveryFee > 0" class="summary-row">
        <span class="summary-label">{{ $t('cart.deliveryFee') }}</span>
        <span v-if="deliveryFee > 0" class="summary-value">{{ formatPrice(deliveryFee) }}</span>
        <span v-else class="summary-value free">{{ $t('checkout.free') }}</span>
      </div>

      <!-- Discount -->
      <div v-if="discount > 0" class="summary-row discount">
        <span class="summary-label">{{ $t('cart.discount') }}</span>
        <span class="summary-value">-{{ formatPrice(discount) }}</span>
      </div>
    </div>

    <!-- Divider -->
    <div class="summary-divider"></div>

    <!-- Total -->
    <div class="summary-total">
      <span class="total-label">{{ $t('cart.total') }}</span>
      <span class="total-value">{{ formatPrice(total) }}</span>
    </div>

    <!-- Minimum Order Notice -->
    <div v-if="showMinimumNotice" class="min-order-notice">
      <BaseIcon name="info" size="xs" class="mr-1" />
      <span>{{ $t('checkout.minOrderNotice', { amount: formatPrice(remainingAmount) }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
  showDeliveryFee: true
})

// Computed properties
const showMinimumNotice = computed(() => {
  return props.minOrderAmount > 0 && props.subtotal < props.minOrderAmount
})

const remainingAmount = computed(() => {
  return Math.max(0, props.minOrderAmount - props.subtotal)
})

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-KG', {
    style: 'currency',
    currency: 'KGS',
    minimumFractionDigits: 0
  }).format(price)
}
</script>

<style lang="scss" scoped>
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/radius' as *;

.cart-summary {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.summary-rows {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9375rem;

  .summary-label {
    color: var(--text-secondary);
  }

  .summary-value {
    font-weight: 500;
    color: var(--text-primary);

    &.free {
      color: var(--color-success);
    }
  }

  &.discount {
    .summary-value {
      color: var(--color-error);
    }
  }
}

.summary-divider {
  height: 1px;
  background: var(--border-primary);
  margin: $space-1 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .total-label {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .total-value {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-success);
  }
}

.min-order-notice {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: $radius-md;
  color: #f59e0b;
  font-size: 0.75rem;
}

.mr-1 {
  margin-right: $space-1;
}
</style>

