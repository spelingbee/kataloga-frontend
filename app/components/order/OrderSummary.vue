<template>
  <BaseCard class="order-summary" variant="outlined" padding="lg">
    <div class="order-summary__header">
      <h3 class="order-summary__title">Order Summary</h3>
      <BaseBadge 
        :variant="statusVariant" 
        size="sm"
      >
        {{ order.status }}
      </BaseBadge>
    </div>

    <!-- Order Details -->
    <div class="order-summary__details">
      <div class="order-summary__info-row">
        <span class="order-summary__label">Order #</span>
        <span class="order-summary__value">{{ order.id }}</span>
      </div>
      <div class="order-summary__info-row">
        <span class="order-summary__label">Date</span>
        <span class="order-summary__value">{{ formattedDate }}</span>
      </div>
      <div class="order-summary__info-row">
        <span class="order-summary__label">Type</span>
        <span class="order-summary__value">{{ order.type }}</span>
      </div>
    </div>

    <!-- Items List -->
    <div class="order-summary__items">
      <h4 class="order-summary__section-title">Items</h4>
      <div class="order-summary__items-list">
        <div 
          v-for="item in order.items" 
          :key="item.id"
          class="order-summary__item"
        >
          <div class="order-summary__item-info">
            <span class="order-summary__item-name">{{ item.name }}</span>
            <span class="order-summary__item-quantity">×{{ item.quantity }}</span>
          </div>
          <span class="order-summary__item-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Pricing Breakdown -->
    <div class="order-summary__pricing">
      <div class="order-summary__price-row">
        <span class="order-summary__price-label">Subtotal</span>
        <span class="order-summary__price-value">${{ order.subtotal.toFixed(2) }}</span>
      </div>
      <div v-if="order.tax > 0" class="order-summary__price-row">
        <span class="order-summary__price-label">Tax</span>
        <span class="order-summary__price-value">${{ order.tax.toFixed(2) }}</span>
      </div>
      <div v-if="order.deliveryFee > 0" class="order-summary__price-row">
        <span class="order-summary__price-label">Delivery Fee</span>
        <span class="order-summary__price-value">${{ order.deliveryFee.toFixed(2) }}</span>
      </div>
      <div v-if="order.discount > 0" class="order-summary__price-row order-summary__price-row--discount">
        <span class="order-summary__price-label">Discount</span>
        <span class="order-summary__price-value">-${{ order.discount.toFixed(2) }}</span>
      </div>
      <div class="order-summary__price-row order-summary__price-row--total">
        <span class="order-summary__price-label">Total</span>
        <span class="order-summary__price-value">${{ order.total.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Customer Info -->
    <div v-if="order.customerInfo" class="order-summary__customer">
      <h4 class="order-summary__section-title">Customer Information</h4>
      <div class="order-summary__customer-details">
        <div class="order-summary__info-row">
          <span class="order-summary__label">Name</span>
          <span class="order-summary__value">{{ order.customerInfo.name }}</span>
        </div>
        <div class="order-summary__info-row">
          <span class="order-summary__label">Phone</span>
          <span class="order-summary__value">{{ order.customerInfo.phone }}</span>
        </div>
        <div v-if="order.customerInfo.address" class="order-summary__info-row">
          <span class="order-summary__label">Address</span>
          <span class="order-summary__value">{{ order.customerInfo.address }}</span>
        </div>
      </div>
    </div>

    <!-- Payment Info -->
    <div v-if="order.paymentMethod" class="order-summary__payment">
      <h4 class="order-summary__section-title">Payment</h4>
      <div class="order-summary__info-row">
        <span class="order-summary__label">Method</span>
        <span class="order-summary__value">{{ order.paymentMethod }}</span>
      </div>
    </div>

    <!-- Special Instructions -->
    <div v-if="order.notes" class="order-summary__notes">
      <h4 class="order-summary__section-title">Special Instructions</h4>
      <p class="order-summary__notes-text">{{ order.notes }}</p>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface CustomerInfo {
  name: string
  phone: string
  address?: string
}

interface Order {
  id: string
  status: string
  type: string
  date: string
  items: OrderItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  discount: number
  total: number
  customerInfo?: CustomerInfo
  paymentMethod?: string
  notes?: string
}

interface Props {
  order: Order
}

const props = defineProps<Props>()

// Computed properties
const statusVariant = computed(() => {
  const statusMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
    'pending': 'warning',
    'confirmed': 'info',
    'preparing': 'warning',
    'ready': 'success',
    'delivered': 'success',
    'cancelled': 'error'
  }
  return statusMap[props.order.status.toLowerCase()] || 'secondary'
})

const formattedDate = computed(() => {
  return new Date(props.order.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/radius' as *;

.order-summary {
  max-width: 500px;
}

.order-summary__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-6;
}

.order-summary__title {
  font-family: $font-primary;
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin: 0;
}

.order-summary__details,
.order-summary__items,
.order-summary__pricing,
.order-summary__customer,
.order-summary__payment,
.order-summary__notes {
  margin-bottom: $space-6;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.order-summary__section-title {
  font-family: $font-primary;
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin: 0 0 $space-3 0;
}

.order-summary__info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.order-summary__label {
  font-family: $font-primary;
  font-size: $text-sm;
  color: var(--text-secondary);
}

.order-summary__value {
  font-family: $font-primary;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
}

.order-summary__items-list {
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  padding: $space-3;
}

.order-summary__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.order-summary__item-info {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.order-summary__item-name {
  font-family: $font-primary;
  font-size: $text-sm;
  color: var(--text-primary);
}

.order-summary__item-quantity {
  font-family: $font-primary;
  font-size: $text-xs;
  color: var(--text-secondary);
}

.order-summary__item-price {
  font-family: $font-primary;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
}

.order-summary__pricing {
  border-top: 1px solid var(--border-primary);
  padding-top: $space-4;
}

.order-summary__price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &--discount {
    .order-summary__price-value {
      color: var(--color-success);
    }
  }
  
  &--total {
    border-top: 1px solid var(--border-primary);
    padding-top: $space-2;
    margin-top: $space-2;
    
    .order-summary__price-label,
    .order-summary__price-value {
      font-size: $text-lg;
      font-weight: $font-semibold;
    }
  }
}

.order-summary__price-label {
  font-family: $font-primary;
  font-size: $text-sm;
  color: var(--text-secondary);
}

.order-summary__price-value {
  font-family: $font-primary;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
}

.order-summary__customer-details {
  background-color: var(--bg-secondary);
  border-radius: $radius-md;
  padding: $space-3;
}

.order-summary__notes-text {
  font-family: $font-primary;
  font-size: $text-sm;
  color: var(--text-secondary);
  line-height: $leading-relaxed;
  margin: 0;
  padding: $space-3;
  background-color: var(--bg-secondary);
  border-radius: $radius-md;
  font-style: italic;
}
</style>
