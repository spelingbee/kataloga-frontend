<template>
  <div class="order-tracking-page">
    <!-- Loading State -->
    <div v-if="loading" class="order-tracking-page__loading">
      <div class="order-tracking-page__loading-spinner" />
      <AppText class="order-tracking-page__loading-text">
        Loading order tracking...
      </AppText>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="order-tracking-page__error">
      <BaseIcon name="alert-circle" size="4xl" class="order-tracking-page__error-icon" />
      <AppHeading level="h2" size="heading-lg" class="order-tracking-page__error-title">
        Unable to Load Order
      </AppHeading>
      <AppText class="order-tracking-page__error-message">
        {{ error }}
      </AppText>
      <div class="order-tracking-page__error-actions">
        <BaseButton @click="retryLoad">
          <BaseIcon name="refresh" size="sm" class="mr-2" />
          Try Again
        </BaseButton>
        <NuxtLink to="/orders">
          <BaseButton variant="secondary">
            View All Orders
          </BaseButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Order Tracking Content -->
    <div v-else-if="order" class="order-tracking-page__content">
      <!-- Header -->
      <div class="order-tracking-page__header">
        <BaseButton 
          variant="ghost" 
          class="order-tracking-page__back-btn"
          @click="goBack"
        >
          <BaseIcon name="arrow-left" size="md" />
        </BaseButton>
        
        <div class="order-tracking-page__header-info">
          <AppHeading level="h1" size="heading-xl" class="order-tracking-page__title">
            Track Your Order
          </AppHeading>
          <AppText size="body-sm" class="order-tracking-page__subtitle">
            Order #{{ order.id }}
          </AppText>
        </div>

        <!-- Connection Status -->
        <div class="order-tracking-page__connection">
          <div 
            class="order-tracking-page__connection-indicator"
            :class="{ 'order-tracking-page__connection-indicator--connected': isTracking }"
          />
          <AppText size="caption" class="order-tracking-page__connection-text">
            {{ isTracking ? 'Обновляется' : 'Остановлено' }}
          </AppText>
        </div>
      </div>

      <!-- Status Tracker -->
      <div class="order-tracking-page__section">
        <OrderStatusTracker
          :order="order"
          :timeline="timeline"
          :show-actions="true"
          :show-timeline="true"
          :loading="cancellingOrder"
          @cancel-order="handleCancelOrder"
          @contact-support="handleContactSupport"
          @track-delivery="handleTrackDelivery"
        />
      </div>

      <!-- Delivery Information (if applicable) -->
      <div v-if="isDeliveryOrder && order.deliveryAddress" class="order-tracking-page__section">
        <AppHeading level="h3" size="heading-md" class="order-tracking-page__section-title">
          Delivery Information
        </AppHeading>
        
        <div class="order-tracking-page__delivery">
          <div class="order-tracking-page__delivery-row">
            <BaseIcon name="map-pin" size="sm" class="order-tracking-page__delivery-icon" />
            <div class="order-tracking-page__delivery-content">
              <AppText size="body-sm" class="order-tracking-page__delivery-label">
                Delivery Address
              </AppText>
              <AppText size="body-sm" class="order-tracking-page__delivery-value">
                {{ order.deliveryAddress }}
              </AppText>
            </div>
          </div>

          <div v-if="courierInfo" class="order-tracking-page__delivery-row">
            <BaseIcon name="user" size="sm" class="order-tracking-page__delivery-icon" />
            <div class="order-tracking-page__delivery-content">
              <AppText size="body-sm" class="order-tracking-page__delivery-label">
                Your Courier
              </AppText>
              <AppText size="body-sm" class="order-tracking-page__delivery-value">
                {{ courierInfo.name }}
              </AppText>
              <BaseButton
                v-if="courierInfo.phone"
                variant="ghost"
                size="sm"
                class="order-tracking-page__delivery-call"
                @click="callCourier"
              >
                <BaseIcon name="phone" size="xs" class="mr-2" />
                {{ courierInfo.phone }}
              </BaseButton>
            </div>
          </div>

          <div v-if="estimatedDeliveryText" class="order-tracking-page__delivery-row">
            <BaseIcon name="clock" size="sm" class="order-tracking-page__delivery-icon order-tracking-page__delivery-icon--orange" />
            <div class="order-tracking-page__delivery-content">
              <AppText size="body-sm" class="order-tracking-page__delivery-label">
                Estimated Delivery
              </AppText>
              <AppText size="body-sm" class="order-tracking-page__delivery-value order-tracking-page__delivery-value--orange">
                {{ estimatedDeliveryText }}
              </AppText>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Details -->
      <div class="order-tracking-page__section">
        <OrderDetails
          :order="order"
          :show-restaurant-contact="true"
          @call-restaurant="handleCallRestaurant"
        />
      </div>

      <!-- Refresh Button -->
      <div class="order-tracking-page__refresh">
        <BaseButton
          variant="secondary"
          :loading="refreshing"
          @click="refreshTracking"
        >
          <BaseIcon name="refresh" size="sm" class="mr-2" />
          Refresh Status
        </BaseButton>
      </div>
    </div>

    <!-- Cancel Order Confirmation Modal -->
    <BaseModal
      v-model="showCancelModal"
      title="Cancel Order"
      @close="showCancelModal = false"
    >
      <div class="order-tracking-page__cancel-modal">
        <AppText class="order-tracking-page__cancel-message">
          Are you sure you want to cancel this order? This action cannot be undone.
        </AppText>
        
        <div class="order-tracking-page__cancel-reason">
          <label class="order-tracking-page__cancel-label">
            Reason for cancellation (optional)
          </label>
          <textarea
            v-model="cancelReason"
            class="order-tracking-page__cancel-textarea"
            rows="3"
            placeholder="Let us know why you're cancelling..."
          />
        </div>

        <div class="order-tracking-page__cancel-actions">
          <BaseButton
            variant="secondary"
            @click="showCancelModal = false"
          >
            Keep Order
          </BaseButton>
          <BaseButton
            variant="primary"
            class="order-tracking-page__cancel-confirm"
            :loading="cancellingOrder"
            @click="confirmCancelOrder"
          >
            Cancel Order
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Order } from '~/types'
import { OrderStatus } from '~/types'
import { useOrders } from '~/composables/useOrders'
import { useOrderTracking } from '~/composables/useOrderTracking'
import { useNotification } from '~/composables/useNotification'
import AppText from '~/components/base/AppText.vue'
import AppHeading from '~/components/base/AppHeading.vue'

// Page setup
definePageMeta({
  title: 'Track Order - Menu Ordering App'
})

// Route and composables
const route = useRoute()
const router = useRouter()
const { showNotification } = useNotification()

// Get order ID from route
const orderId = computed(() => route.params.id as string)

// Order composables
const { getOrder, cancelOrder: cancelOrderAction } = useOrders()
const {
  isTracking,
  trackingData,
  currentStatus,
  estimatedTime,
  courierInfo,
  timeline,
  estimatedDeliveryText,
  startTracking,
  stopTracking,
  refreshTracking: refreshTrackingData
} = useOrderTracking(orderId.value)

// Local state
const order = ref<Order | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const refreshing = ref(false)
const cancellingOrder = ref(false)
const showCancelModal = ref(false)
const cancelReason = ref('')

// Computed
const isDeliveryOrder = computed(() => {
  return order.value?.deliveryAddress !== undefined
})

// Methods
const loadOrder = async () => {
  loading.value = true
  error.value = null

  try {
    const loadedOrder = await getOrder(orderId.value)
    if (loadedOrder) {
      order.value = loadedOrder
      
      // Start WebSocket tracking
      await startTracking(orderId.value)
    } else {
      error.value = 'Order not found'
    }
  } catch (err) {
    console.error('Error loading order:', err)
    error.value = 'Failed to load order details. Please try again.'
  } finally {
    loading.value = false
  }
}

const retryLoad = () => {
  loadOrder()
}

const goBack = () => {
  router.back()
}

const refreshTracking = async () => {
  refreshing.value = true
  try {
    await refreshTrackingData(orderId.value)
    
    // Also refresh order data
    const updatedOrder = await getOrder(orderId.value)
    if (updatedOrder) {
      order.value = updatedOrder
    }
    
    showNotification({
      type: 'success',
      title: 'Status Updated',
      message: 'Order status has been refreshed'
    })
  } catch (err) {
    console.error('Error refreshing tracking:', err)
    showNotification({
      type: 'error',
      title: 'Refresh Failed',
      message: 'Failed to refresh order status'
    })
  } finally {
    refreshing.value = false
  }
}

const handleCancelOrder = () => {
  showCancelModal.value = true
}

const confirmCancelOrder = async () => {
  if (!order.value) return

  cancellingOrder.value = true
  try {
    const success = await cancelOrderAction(order.value.id, cancelReason.value || undefined)
    
    if (success) {
      showNotification({
        type: 'success',
        title: 'Order Cancelled',
        message: 'Your order has been cancelled successfully'
      })
      
      // Update local order status
      order.value.status = OrderStatus.CANCELLED
      
      // Close modal
      showCancelModal.value = false
      cancelReason.value = ''
      
      // Redirect to orders page after a delay
      setTimeout(() => {
        router.push('/orders')
      }, 2000)
    } else {
      showNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: 'Failed to cancel order. Please try again or contact support.'
      })
    }
  } catch (err) {
    console.error('Error cancelling order:', err)
    showNotification({
      type: 'error',
      title: 'Cancellation Failed',
      message: 'An error occurred while cancelling the order'
    })
  } finally {
    cancellingOrder.value = false
  }
}

const handleContactSupport = () => {
  // Navigate to support page or open chat
  router.push(`/orders/${orderId.value}?tab=support`)
}

const handleTrackDelivery = () => {
  // Show live map tracking (if implemented)
  showNotification({
    type: 'info',
    title: 'Live Tracking',
    message: 'Live map tracking will be available soon'
  })
}

const callCourier = () => {
  if (courierInfo.value?.phone) {
    window.open(`tel:${courierInfo.value.phone}`)
  }
}

const handleCallRestaurant = () => {
  // Call restaurant phone number
  window.open('tel:+1-555-RESTAURANT')
}

// Lifecycle
onMounted(() => {
  loadOrder()
})

onUnmounted(() => {
  stopTracking()
})

// Watch for order status changes
watch(() => order.value?.status, (newStatus, oldStatus) => {
  if (newStatus && oldStatus && newStatus !== oldStatus) {
    // Show notification for status change
    showNotification({
      type: 'info',
      title: 'Order Status Updated',
      message: `Your order is now ${newStatus.toLowerCase()}`
    })
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/abstracts/variables' as *;

.order-tracking-page {
  min-height: 100vh;
  background: var(--bg-tertiary);
  padding: $space-8 $space-6;
}

.order-tracking-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.order-tracking-page__loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--color-success);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: $space-6;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.order-tracking-page__loading-text {
  color: $color-neutral-20;
}

.order-tracking-page__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
}

.order-tracking-page__error-icon {
  color: var(--color-error);
  margin-bottom: $space-8;
}

.order-tracking-page__error-title {
  color: white;
  margin-bottom: $space-4;
}

.order-tracking-page__error-message {
  color: $color-neutral-20;
  margin-bottom: $space-8;
  max-width: 400px;
}

.order-tracking-page__error-actions {
  display: flex;
  gap: $space-4;
}

.order-tracking-page__content {
  max-width: 800px;
  margin: 0 auto;
}

.order-tracking-page__header {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-8;
  padding-bottom: $space-6;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.order-tracking-page__back-btn {
  flex-shrink: 0;
}

.order-tracking-page__header-info {
  flex: 1;
}

.order-tracking-page__title {
  color: white;
  margin-bottom: $space-1;
}

.order-tracking-page__subtitle {
  color: $color-neutral-20;
}

.order-tracking-page__connection {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  background: rgba(255, 255, 255, 0.05);
  border-radius: $radius-md;
}

.order-tracking-page__connection-indicator {
  width: 8px;
  height: 8px;
  background: var(--text-primary);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.order-tracking-page__connection-indicator--connected {
  background: var(--color-success);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.order-tracking-page__connection-text {
  color: $color-neutral-20;
  font-size: 0.75rem;
}

.order-tracking-page__section {
  margin-bottom: $space-12;
}

.order-tracking-page__section-title {
  color: white;
  margin-bottom: $space-6;
}

.order-tracking-page__delivery {
  display: flex;
  flex-direction: column;
  gap: $space-6;
  padding: $space-6;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-lg;
}

.order-tracking-page__delivery-row {
  display: flex;
  gap: $space-4;
}

.order-tracking-page__delivery-icon {
  flex-shrink: 0;
  color: var(--color-success);
  margin-top: 2px;
}

.order-tracking-page__delivery-icon--orange {
  color: var(--color-warning);
}

.order-tracking-page__delivery-content {
  flex: 1;
}

.order-tracking-page__delivery-label {
  color: $color-neutral-20;
  margin-bottom: $space-1;
}

.order-tracking-page__delivery-value {
  color: white;
}

.order-tracking-page__delivery-value--orange {
  color: var(--color-warning);
  font-weight: 500;
}

.order-tracking-page__delivery-call {
  margin-top: $space-2;
  color: var(--color-success);
}

.order-tracking-page__refresh {
  display: flex;
  justify-content: center;
  margin-top: $space-8;
}

.order-tracking-page__cancel-modal {
  padding: $space-6;
}

.order-tracking-page__cancel-message {
  color: white;
  margin-bottom: $space-6;
}

.order-tracking-page__cancel-reason {
  margin-bottom: $space-8;
}

.order-tracking-page__cancel-label {
  display: block;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: $space-2;
}

.order-tracking-page__cancel-textarea {
  width: 100%;
  padding: $space-4;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $radius-md;
  color: white;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--color-success);
  }
  
  &::placeholder {
    color: var(--text-primary);
  }
}

.order-tracking-page__cancel-actions {
  display: flex;
  gap: $space-4;
  justify-content: flex-end;
}

.order-tracking-page__cancel-confirm {
  background: var(--color-error);
  
  &:hover {
    background: var(--color-error);
  }
}

// Responsive
@media (max-width: 768px) {
  .order-tracking-page {
    padding: $space-6 $space-4;
  }
  
  .order-tracking-page__header {
    flex-wrap: wrap;
  }
  
  .order-tracking-page__connection {
    width: 100%;
    justify-content: center;
  }
  
  .order-tracking-page__error-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .order-tracking-page__cancel-actions {
    flex-direction: column;
  }
}
</style>
