<template>
  <div class="order-tracker">
    <!-- Header -->
    <div class="order-tracker__header">
      <div class="order-tracker__header-info">
        <AppHeading level="h2" size="heading-lg" class="order-tracker__title">
          Track Your Order
        </AppHeading>
        <AppText size="body-sm" class="order-tracker__subtitle">
          Order #{{ order.id }} • {{ formatDate(order.createdAt) }}
        </AppText>
      </div>
      
      <!-- Refresh Button -->
      <BaseButton
        variant="ghost"
        size="sm"
        :loading="refreshing"
        class="order-tracker__refresh-btn"
        aria-label="Refresh tracking"
        @click="refreshTracking"
      >
        <BaseIcon name="refresh" size="sm" />
      </BaseButton>
    </div>

    <!-- Order Status -->
    <div class="order-tracker__status">
      <OrderStatus
        :order="order"
        :show-actions="false"
      />
    </div>

    <!-- Delivery Information (if applicable) -->
    <div v-if="isDeliveryOrder && deliveryInfo" class="order-tracker__section">
      <AppHeading level="h3" size="heading-md" class="order-tracker__section-title">
        Delivery Information
      </AppHeading>
      
      <div class="order-tracker__info-card">
        <!-- Delivery Address -->
        <div class="order-tracker__info-item">
          <BaseIcon name="map-pin" size="sm" class="order-tracker__info-icon order-tracker__info-icon--green" />
          <div class="order-tracker__info-content">
            <AppText size="body-sm" class="order-tracker__info-label">
              Delivery Address
            </AppText>
            <AppText size="body-sm" class="order-tracker__info-value">
              {{ deliveryAddress }}
            </AppText>
          </div>
        </div>

        <!-- Courier Information -->
        <div v-if="deliveryInfo.courierInfo" class="order-tracker__info-item">
          <BaseIcon name="user" size="sm" class="order-tracker__info-icon order-tracker__info-icon--green" />
          <div class="order-tracker__info-content">
            <AppText size="body-sm" class="order-tracker__info-label">
              Your Courier
            </AppText>
            <AppText size="body-sm" class="order-tracker__info-value">
              {{ deliveryInfo.courierInfo.name }}
            </AppText>
            <div v-if="deliveryInfo.courierInfo.phone" class="order-tracker__courier-contact">
              <BaseButton
                variant="ghost"
                size="sm"
                class="order-tracker__contact-btn"
                @click="callCourier"
              >
                <BaseIcon name="phone" size="xs" class="order-tracker__contact-icon" />
                {{ deliveryInfo.courierInfo.phone }}
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Estimated Delivery Time -->
        <div v-if="deliveryInfo.estimatedTime" class="order-tracker__info-item">
          <BaseIcon name="clock" size="sm" class="order-tracker__info-icon order-tracker__info-icon--orange" />
          <div class="order-tracker__info-content">
            <AppText size="body-sm" class="order-tracker__info-label">
              Estimated Delivery
            </AppText>
            <AppText size="body-sm" class="order-tracker__info-value order-tracker__info-value--orange">
              {{ formatEstimatedTime(deliveryInfo.estimatedTime) }}
            </AppText>
          </div>
        </div>
      </div>
    </div>

    <!-- Pickup Information (if applicable) -->
    <div v-if="!isDeliveryOrder" class="order-tracker__section">
      <AppHeading level="h3" size="heading-md" class="order-tracker__section-title">
        Pickup Information
      </AppHeading>
      
      <div class="order-tracker__info-card">
        <!-- Restaurant Address -->
        <div class="order-tracker__info-item">
          <BaseIcon name="store" size="sm" class="order-tracker__info-icon order-tracker__info-icon--green" />
          <div class="order-tracker__info-content">
            <AppText size="body-sm" class="order-tracker__info-label">
              Pickup Location
            </AppText>
            <AppText size="body-sm" class="order-tracker__info-value">
              Main Restaurant - Nevsky Prospect 123
            </AppText>
          </div>
        </div>

        <!-- Pickup Time -->
        <div class="order-tracker__info-item">
          <BaseIcon name="clock" size="sm" class="order-tracker__info-icon order-tracker__info-icon--orange" />
          <div class="order-tracker__info-content">
            <AppText size="body-sm" class="order-tracker__info-label">
              Ready for Pickup
            </AppText>
            <AppText size="body-sm" class="order-tracker__info-value order-tracker__info-value--orange">
              {{ order.estimatedTime ? formatEstimatedTime(order.estimatedTime) : 'Soon' }}
            </AppText>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="order-tracker__info-item">
          <BaseIcon name="phone" size="sm" class="order-tracker__info-icon order-tracker__info-icon--green" />
          <div class="order-tracker__info-content">
            <AppText size="body-sm" class="order-tracker__info-label">
              Restaurant Phone
            </AppText>
            <BaseButton
              variant="ghost"
              size="sm"
              class="order-tracker__contact-btn"
              @click="callRestaurant"
            >
              +7 (812) 123-45-67
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Tracking Map (if delivery is active) -->
    <div v-if="showLiveTracking" class="order-tracker__section">
      <AppHeading level="h3" size="heading-md" class="order-tracker__section-title">
        Live Tracking
      </AppHeading>
      
      <div class="order-tracker__map-placeholder">
        <!-- Placeholder for map integration -->
        <div class="order-tracker__map-content">
          <BaseIcon name="map" size="xl" class="order-tracker__map-icon" />
          <AppText class="order-tracker__map-text">
            Live tracking map will be displayed here
          </AppText>
          <AppText size="caption" class="order-tracker__map-subtext">
            Integration with mapping service required
          </AppText>
        </div>
      </div>
    </div>

    <!-- Order Items Summary -->
    <div class="order-tracker__section">
      <AppHeading level="h3" size="heading-md" class="order-tracker__section-title">
        Order Items
      </AppHeading>
      
      <div class="order-tracker__items">
        <div
          v-for="item in order.items"
          :key="item.id"
          class="order-tracker__item"
        >
          <div class="order-tracker__item-info">
            <AppText size="body-sm" class="order-tracker__item-name">
              {{ item.quantity }}× {{ getItemName(item.menuItemId) }}
            </AppText>
            <AppText v-if="item.customizations" size="caption" class="order-tracker__item-customizations">
              {{ formatCustomizations(item.customizations) }}
            </AppText>
          </div>
          <AppPrice :price="item.subtotal" size="sm" />
        </div>
      </div>
      
      <!-- Order Total -->
      <div class="order-tracker__total">
        <AppText size="body-md" class="order-tracker__total-label">
          Total
        </AppText>
        <AppPrice :price="order.total" size="md" class="order-tracker__total-price" />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="order-tracker__actions">
      <BaseButton
        v-if="canCancelOrder"
        variant="ghost"
        class="order-tracker__action-btn order-tracker__action-btn--cancel"
        :loading="loading"
        @click="$emit('cancel-order', order.id)"
      >
        Cancel Order
      </BaseButton>
      
      <BaseButton
        v-if="needsSupport"
        variant="ghost"
        class="order-tracker__action-btn order-tracker__action-btn--support"
        @click="$emit('contact-support', order.id)"
      >
        Contact Support
      </BaseButton>
      
      <BaseButton
        variant="primary"
        class="order-tracker__action-btn order-tracker__action-btn--primary"
        @click="$emit('share-tracking', order.id)"
      >
        Share Tracking
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Order, Delivery } from '~/types'
import { OrderStatus } from '~/types'
import { useOrders } from '~/composables/useOrders'

// Props & Emits
interface Props {
  order: Order
  deliveryInfo?: Delivery
  autoRefresh?: boolean
  refreshInterval?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  loading: false
})

const emit = defineEmits<{
  'cancel-order': [orderId: string]
  'contact-support': [orderId: string]
  'share-tracking': [orderId: string]
  'refresh-tracking': [orderId: string]
}>()

// Local state
const refreshing = ref(false)
let refreshTimer: NodeJS.Timeout | null = null

// Computed properties
const isDeliveryOrder = computed(() => {
  // Determine if this is a delivery order based on order data
  return props.order.customerInfo?.address !== undefined
})

const deliveryAddress = computed(() => {
  return props.order.customerInfo?.address || 'Address not available'
})

const showLiveTracking = computed(() => {
  return isDeliveryOrder.value && [
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.READY
  ].includes(props.order.status)
})

const canCancelOrder = computed(() => {
  return [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED
  ].includes(props.order.status)
})

const needsSupport = computed(() => {
  return props.order.status === OrderStatus.CANCELLED
})

// Methods
const refreshTracking = async () => {
  refreshing.value = true
  try {
    emit('refresh-tracking', props.order.id)
    
    // Use the orders composable to track the order
    const { trackOrder } = useOrders()
    await trackOrder(props.order.id)
  } catch (error) {
    console.error('Failed to refresh tracking:', error)
  } finally {
    refreshing.value = false
  }
}

const callCourier = () => {
  if (props.deliveryInfo?.courierInfo?.phone) {
    window.open(`tel:${props.deliveryInfo.courierInfo.phone}`)
  }
}

const callRestaurant = () => {
  window.open('tel:+78121234567')
}

const getItemName = (menuItemId: string): string => {
  // Look up the item name from the order items
  const orderItem = props.order.items.find(item => item.menuItemId === menuItemId)
  return orderItem?.menuItem?.name || `Item ${menuItemId}`
}

const formatCustomizations = (customizations: Record<string, any>): string => {
  return Object.entries(customizations)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatEstimatedTime = (minutes: number): string => {
  const now = new Date()
  const estimatedTime = new Date(now.getTime() + minutes * 60000)
  
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(estimatedTime)
}

// Auto-refresh functionality
const startAutoRefresh = () => {
  if (props.autoRefresh && !refreshTimer) {
    refreshTimer = setInterval(() => {
      if (!refreshing.value) {
        refreshTracking()
      }
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Lifecycle
onMounted(() => {
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Watch for order status changes to control auto-refresh
watch(() => props.order.status, (newStatus) => {
  const activeStatuses = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.OUT_FOR_DELIVERY
  ]
  
  if (activeStatuses.includes(newStatus)) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})
</script>

