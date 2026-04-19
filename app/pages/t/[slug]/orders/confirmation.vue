<template>
  <div class="order-confirmation">
    <div class="order-confirmation__container">
      <!-- Success Icon -->
      <div class="order-confirmation__icon">
        <BaseIcon name="check-circle" size="xl" />
      </div>

      <!-- Success Message -->
      <h1 class="order-confirmation__title">Order Placed Successfully!</h1>
      <p class="order-confirmation__subtitle">
        Thank you for your order. We've received it and will start preparing it soon.
      </p>

      <!-- Order Number -->
      <div v-if="order" class="order-confirmation__order-number">
        <span class="order-confirmation__order-number-label">Order Number</span>
        <span class="order-confirmation__order-number-value">#{{ order.orderNumber || order.id }}</span>
      </div>

      <!-- Order Summary -->
      <div v-if="order" class="order-confirmation__summary">
        <h2 class="order-confirmation__summary-title">Order Summary</h2>
        
        <!-- Order Items -->
        <div class="order-confirmation__items">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="order-confirmation__item"
          >
            <div class="order-confirmation__item-info">
              <span class="order-confirmation__item-name">{{ item.menuItem.name }}</span>
              <span class="order-confirmation__item-quantity">x{{ item.quantity }}</span>
            </div>
            <span class="order-confirmation__item-price"><AppPrice :amount="item.subtotal" /></span>
          </div>
        </div>

        <!-- Order Totals -->
        <div class="order-confirmation__totals">
          <div class="order-confirmation__total-row">
            <span>Subtotal</span>
            <span><AppPrice :amount="order.subtotal || calculateSubtotal(order)" /></span>
          </div>
          <div v-if="order.deliveryFee" class="order-confirmation__total-row">
            <span>Delivery Fee</span>
            <span><AppPrice :amount="order.deliveryFee" /></span>
          </div>
          <div v-if="order.discount" class="order-confirmation__total-row">
            <span>Discount</span>
            <span class="order-confirmation__discount">-<AppPrice :amount="order.discount" /></span>
          </div>
          <div class="order-confirmation__total-row order-confirmation__total-row--final">
            <span>Total</span>
            <span><AppPrice :amount="order.total" size="lg" /></span>
          </div>
        </div>

        <!-- Delivery/Pickup Details -->
        <div v-if="order.deliveryDetails" class="order-confirmation__details">
          <h3 class="order-confirmation__details-title">Delivery Details</h3>
          <p class="order-confirmation__details-text">
            <BaseIcon name="map-pin" size="sm" />
            {{ order.deliveryDetails.address }}
          </p>
          <p v-if="order.deliveryDetails.phone" class="order-confirmation__details-text">
            <BaseIcon name="phone" size="sm" />
            {{ order.deliveryDetails.phone }}
          </p>
          <p v-if="order.deliveryDetails.instructions" class="order-confirmation__details-text">
            <BaseIcon name="message" size="sm" />
            {{ order.deliveryDetails.instructions }}
          </p>
        </div>

        <div v-if="order.pickupDetails" class="order-confirmation__details">
          <h3 class="order-confirmation__details-title">Pickup Details</h3>
          <p class="order-confirmation__details-text">
            <BaseIcon name="clock" size="sm" />
            Pickup Time: {{ formatPickupTime(order.pickupDetails.pickupTime) }}
          </p>
          <p v-if="order.pickupDetails.phone" class="order-confirmation__details-text">
            <BaseIcon name="phone" size="sm" />
            {{ order.pickupDetails.phone }}
          </p>
        </div>

        <div v-if="order.dineInDetails" class="order-confirmation__details">
          <h3 class="order-confirmation__details-title">Dine-in Details</h3>
          <p class="order-confirmation__details-text">
            <BaseIcon name="table" size="sm" />
            Table Number: {{ order.dineInDetails.tableNumber }}
          </p>
        </div>

        <!-- Estimated Time -->
        <div v-if="order.estimatedTime" class="order-confirmation__estimated-time">
          <BaseIcon name="clock" size="sm" />
          <span>Estimated {{ order.orderType === 'delivery' ? 'Delivery' : 'Preparation' }} Time: {{ formatEstimatedTime(order.estimatedTime) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="order-confirmation__actions">
        <BaseButton
          variant="primary"
          @click="goToOrderTracking"
        >
          <BaseIcon name="eye" size="sm" />
          Track Order
        </BaseButton>
        
        <BaseButton
          variant="secondary"
          @click="goToMenu"
        >
          <BaseIcon name="home" size="sm" />
          Back to Menu
        </BaseButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="order-confirmation__loading">
        <BaseSkeleton variant="card" />
      </div>

      <!-- Error State -->
      <div v-if="error" class="order-confirmation__error">
        <BaseIcon name="alert" size="lg" />
        <p>{{ error }}</p>
        <BaseButton variant="primary" @click="retryLoadOrder">
          Retry
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Order } from '~/types'
import { useTenant } from '~/composables/useTenant'

const route = useRoute()
const router = useRouter()
const { getOrder, currentOrder, setCurrentOrder } = useOrders()
const { tPath } = useTenant()

// Telegram integration
const telegram = useTelegram()
const telegramNotifications = useTelegramNotifications()

const order = ref<Order | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Get order ID from route query or current order
const orderId = computed(() => {
  return route.query.orderId as string || currentOrder.value?.id
})

// Load order details
const loadOrder = async () => {
  if (!orderId.value) {
    error.value = 'No order ID provided'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const fetchedOrder = await getOrder(orderId.value)
    if (fetchedOrder) {
      order.value = fetchedOrder
      setCurrentOrder(fetchedOrder)
    } else {
      error.value = 'Order not found'
    }
  } catch (err: any) {
    console.error('Failed to load order:', err)
    error.value = err.message || 'Failed to load order details'
  } finally {
    loading.value = false
  }
}

const retryLoadOrder = () => {
  loadOrder()
}

// Helper functions
const calculateSubtotal = (order: Order) => {
  return order.items.reduce((sum, item) => sum + item.subtotal, 0)
}

const formatPickupTime = (time: string | Date) => {
  const date = new Date(time)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatEstimatedTime = (time: string | Date | number) => {
  if (typeof time === 'number') {
    // If it's minutes
    return `${time} minutes`
  }
  const date = new Date(time)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Navigation
const goToOrderTracking = () => {
  if (order.value) {
    router.push(tPath(`/orders/${order.value.id}`))
  }
}

const goToMenu = () => {
  router.push(tPath('/'))
}

// Send Telegram notification
const sendTelegramNotification = async (orderData: Order) => {
  if (!telegram.isTelegram.value) return

  try {
    // Send order confirmation via Telegram
    await telegramNotifications.sendOrderConfirmation(orderData)
    
    // Also show popup in Telegram
    await telegramNotifications.showOrderConfirmationPopup(orderData)
  } catch (err) {
    console.error('Failed to send Telegram notification:', err)
    // Don't block the UI if notification fails
  }
}

// Load order on mount
onMounted(async () => {
  // If we have current order from checkout, use it
  if (currentOrder.value && !orderId.value) {
    order.value = currentOrder.value
    loading.value = false
    
    // Send Telegram notification for new order
    await sendTelegramNotification(currentOrder.value)
  } else {
    await loadOrder()
    
    // Send Telegram notification if order was loaded
    if (order.value) {
      await sendTelegramNotification(order.value)
    }
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
@use '~/assets/scss/abstracts/variables' as *;

.order-confirmation {
  min-height: 100vh;
  padding: $space-8 $space-4;
  background: var(--bg-secondary);
}

.order-confirmation__container {
  max-width: 600px;
  margin: 0 auto;
  background: var(--bg-primary);
  border-radius: $radius-lg;
  padding: $space-12;
  box-shadow: $shadow-md;
}

.order-confirmation__icon {
  display: flex;
  justify-content: center;
  margin-bottom: $space-6;
  color: var(--color-success);
  font-size: 4rem;
}

.order-confirmation__title {
  text-align: center;
  font-size: $text-2xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.order-confirmation__subtitle {
  text-align: center;
  font-size: $text-base;
  color: var(--text-secondary);
  margin-bottom: $space-8;
}

.order-confirmation__order-number {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-6;
  background: var(--bg-secondary);
  border-radius: $radius-md;
  margin-bottom: $space-8;
}

.order-confirmation__order-number-label {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin-bottom: $space-1;
}

.order-confirmation__order-number-value {
  font-size: $text-xl;
  font-weight: $font-bold;
  color: var(--color-error);
}

.order-confirmation__summary {
  margin-bottom: $space-8;
}

.order-confirmation__summary-title {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-4;
}

.order-confirmation__items {
  border-top: 1px solid var(--border-primary);
  border-bottom: 1px solid var(--border-primary);
  padding: $space-4 0;
  margin-bottom: $space-4;
}

.order-confirmation__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-2 0;
}

.order-confirmation__item-info {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.order-confirmation__item-name {
  font-size: $text-base;
  color: var(--text-primary);
}

.order-confirmation__item-quantity {
  font-size: $text-sm;
  color: var(--text-secondary);
}

.order-confirmation__item-price {
  font-size: $text-base;
  font-weight: $font-medium;
  color: var(--text-primary);
}

.order-confirmation__totals {
  padding: $space-4 0;
}

.order-confirmation__total-row {
  display: flex;
  justify-content: space-between;
  padding: $space-1 0;
  font-size: $text-base;
  color: var(--text-primary);
}

.order-confirmation__total-row--final {
  border-top: 2px solid var(--border-primary);
  margin-top: $space-2;
  padding-top: $space-4;
  font-size: $text-lg;
  font-weight: $font-bold;
  color: var(--text-primary);
}

.order-confirmation__discount {
  color: var(--color-success);
}

.order-confirmation__details {
  margin-top: $space-6;
  padding: $space-4;
  background: var(--bg-secondary);
  border-radius: $radius-md;
}

.order-confirmation__details-title {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.order-confirmation__details-text {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-sm;
  color: var(--text-primary);
  margin-bottom: $space-1;

  &:last-child {
    margin-bottom: 0;
  }
}

.order-confirmation__estimated-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  margin-top: $space-6;
  padding: $space-4;
  background: var(--color-warning);
  color: white;
  border-radius: $radius-md;
  font-weight: $font-medium;
}

.order-confirmation__actions {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  margin-top: $space-8;
}

.order-confirmation__loading {
  padding: $space-8;
}

.order-confirmation__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  padding: $space-8;
  text-align: center;
  color: var(--color-error);
}

@media (max-width: 768px) {
  .order-confirmation {
    padding: $space-4;
  }

  .order-confirmation__container {
    padding: $space-6;
  }

  .order-confirmation__title {
    font-size: $text-xl;
  }
}
</style>
