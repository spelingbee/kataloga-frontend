<template>
  <div class="order-status-tracker">
    <!-- Status Progress -->
    <div class="order-status-tracker__progress">
      <ProgressBar :current-status="order.status" />
    </div>

    <!-- Current Status Card -->
    <div class="order-status-tracker__current">
      <div class="order-status-tracker__icon-wrapper">
        <BaseIcon 
          :name="getStatusIcon(order.status)" 
          size="xl" 
          :class="getStatusIconColor(order.status)"
        />
      </div>
      
      <div class="order-status-tracker__content">
        <AppHeading level="h3" size="heading-md" class="order-status-tracker__title">
          {{ getStatusTitle(order.status) }}
        </AppHeading>
        <AppText size="body-md" class="order-status-tracker__description">
          {{ getStatusDescription(order.status) }}
        </AppText>
        
        <!-- Estimated Time -->
        <div v-if="order.estimatedTime && isActiveOrder" class="order-status-tracker__time">
          <BaseIcon name="clock" size="sm" class="order-status-tracker__time-icon" />
          <AppText size="body-sm" class="order-status-tracker__time-text">
            {{ formatEstimatedTime(order.estimatedTime) }}
          </AppText>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div v-if="showTimeline && timeline.length > 0" class="order-status-tracker__timeline">
      <AppHeading level="h4" size="heading-sm" class="order-status-tracker__timeline-title">
        Order Timeline
      </AppHeading>
      
      <div class="order-status-tracker__timeline-list">
        <div
          v-for="(update, index) in timeline"
          :key="index"
          class="order-status-tracker__timeline-item"
        >
          <div class="order-status-tracker__timeline-dot" />
          <div class="order-status-tracker__timeline-content">
            <AppText size="body-sm" class="order-status-tracker__timeline-message">
              {{ update.message }}
            </AppText>
            <AppText size="caption" class="order-status-tracker__timeline-time">
              {{ formatTime(update.timestamp) }}
            </AppText>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="showActions" class="order-status-tracker__actions">
      <BaseButton
        v-if="canCancelOrder"
        variant="ghost"
        class="order-status-tracker__action-btn order-status-tracker__action-btn--cancel"
        :loading="loading"
        @click="$emit('cancel-order', order.id)"
      >
        <BaseIcon name="x" size="sm" class="mr-2" />
        Cancel Order
      </BaseButton>

      <BaseButton
        v-if="canContactSupport"
        variant="ghost"
        class="order-status-tracker__action-btn"
        @click="$emit('contact-support', order.id)"
      >
        <BaseIcon name="help-circle" size="sm" class="mr-2" />
        Contact Support
      </BaseButton>

      <BaseButton
        v-if="canTrackDelivery"
        variant="primary"
        class="order-status-tracker__action-btn"
        @click="$emit('track-delivery', order.id)"
      >
        <BaseIcon name="map" size="sm" class="mr-2" />
        Track Delivery
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order, OrderStatus as OrderStatusEnum } from '~/types'
import { OrderStatus } from '~/types'
import { useTenant } from '~/composables/useTenant'

// Props & Emits
interface Props {
  order: Order
  showActions?: boolean
  showTimeline?: boolean
  loading?: boolean
  timeline?: Array<{
    status: OrderStatusEnum
    timestamp: string
    message: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  showTimeline: true,
  loading: false,
  timeline: () => []
})

defineEmits<{
  'cancel-order': [orderId: string]
  'contact-support': [orderId: string]
  'track-delivery': [orderId: string]
}>()

// Computed properties
const isActiveOrder = computed(() => {
  return [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.OUT_FOR_DELIVERY
  ].includes(props.order.status)
})

const canCancelOrder = computed(() => {
  return [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED
  ].includes(props.order.status)
})

const canContactSupport = computed(() => {
  return props.order.status === OrderStatus.CANCELLED || 
         props.order.status === OrderStatus.DELIVERED
})

const canTrackDelivery = computed(() => {
  return [
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.OUT_FOR_DELIVERY
  ].includes(props.order.status)
})

// Status helper methods
const getStatusIcon = (status: OrderStatusEnum): string => {
  const icons = {
    [OrderStatus.PENDING]: 'clock',
    [OrderStatus.CONFIRMED]: 'check-circle',
    [OrderStatus.PREPARING]: 'chef-hat',
    [OrderStatus.READY]: 'bell',
    [OrderStatus.OUT_FOR_DELIVERY]: 'truck',
    [OrderStatus.DELIVERED]: 'check-circle-2',
    [OrderStatus.CANCELLED]: 'x-circle'
  }
  return icons[status] || 'info'
}

const getStatusIconColor = (status: OrderStatusEnum): string => {
  const colors = {
    [OrderStatus.PENDING]: 'text-primary-orange',
    [OrderStatus.CONFIRMED]: 'text-primary-green',
    [OrderStatus.PREPARING]: 'text-primary-orange',
    [OrderStatus.READY]: 'text-primary-green',
    [OrderStatus.OUT_FOR_DELIVERY]: 'text-primary-green',
    [OrderStatus.DELIVERED]: 'text-primary-green',
    [OrderStatus.CANCELLED]: 'text-primary-red'
  }
  return colors[status] || 'text-neutral-20'
}

const getStatusTitle = (status: OrderStatusEnum): string => {
  const titles = {
    [OrderStatus.PENDING]: 'Order Received',
    [OrderStatus.CONFIRMED]: 'Order Confirmed',
    [OrderStatus.PREPARING]: 'Preparing Your Order',
    [OrderStatus.READY]: 'Order Ready',
    [OrderStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
    [OrderStatus.DELIVERED]: 'Order Delivered',
    [OrderStatus.CANCELLED]: 'Order Cancelled'
  }
  return titles[status] || 'Unknown Status'
}

const getStatusDescription = (status: OrderStatusEnum): string => {
  const descriptions = {
    [OrderStatus.PENDING]: 'We have received your order and are processing it.',
    [OrderStatus.CONFIRMED]: 'Your order has been confirmed and will be prepared soon.',
    [OrderStatus.PREPARING]: 'Our chefs are preparing your delicious meal.',
    [OrderStatus.READY]: 'Your order is ready for pickup or delivery.',
    [OrderStatus.OUT_FOR_DELIVERY]: 'Your order is on its way to you.',
    [OrderStatus.DELIVERED]: 'Your order has been successfully delivered. Enjoy!',
    [OrderStatus.CANCELLED]: 'This order has been cancelled.'
  }
  return descriptions[status] || 'Status information not available.'
}

// Tenant context
const { tenantSettings } = useTenant()

const locale = computed(() => {
  const language = tenantSettings.value?.language || 'en'
  const localeMap: Record<string, string> = {
    en: 'en-US',
    ru: 'ru-RU',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES'
  }
  return localeMap[language] || 'en-US'
})

// Date/time formatting
const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tenantSettings.value?.timezone || 'UTC'
  }).format(date)
}

const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minutes remaining`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m remaining`
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/abstracts/variables' as *;

.order-status-tracker {
  width: 100%;
}

.order-status-tracker__progress {
  margin-bottom: $space-8;
}

.order-status-tracker__current {
  display: flex;
  gap: $space-6;
  padding: $space-6;
  background: rgba(255, 255, 255, 0.05);
  border-radius: $radius-lg;
  margin-bottom: $space-8;
}

.order-status-tracker__icon-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $radius-md;
}

.order-status-tracker__content {
  flex: 1;
}

.order-status-tracker__title {
  color: white;
  margin-bottom: $space-2;
}

.order-status-tracker__description {
  color: $color-neutral-20;
  margin-bottom: $space-4;
}

.order-status-tracker__time {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.order-status-tracker__time-icon {
  color: var(--color-warning);
}

.order-status-tracker__time-text {
  color: var(--color-warning);
  font-weight: 500;
}

.order-status-tracker__timeline {
  margin-bottom: $space-8;
}

.order-status-tracker__timeline-title {
  color: white;
  margin-bottom: $space-4;
}

.order-status-tracker__timeline-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.order-status-tracker__timeline-item {
  display: flex;
  gap: $space-4;
  padding: $space-4;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-md;
}

.order-status-tracker__timeline-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  background: var(--color-success);
  border-radius: 50%;
}

.order-status-tracker__timeline-content {
  flex: 1;
}

.order-status-tracker__timeline-message {
  color: white;
  margin-bottom: $space-1;
}

.order-status-tracker__timeline-time {
  color: $color-neutral-20;
}

.order-status-tracker__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
}

.order-status-tracker__action-btn {
  flex: 1;
  min-width: 150px;
}

.order-status-tracker__action-btn--cancel {
  color: var(--color-error);
  
  &:hover {
    background: rgba(var(--color-error), 0.1);
  }
}

// Responsive
@media (max-width: 768px) {
  .order-status-tracker__current {
    flex-direction: column;
    text-align: center;
  }
  
  .order-status-tracker__icon-wrapper {
    margin: 0 auto;
  }
  
  .order-status-tracker__time {
    justify-content: center;
  }
  
  .order-status-tracker__actions {
    flex-direction: column;
  }
  
  .order-status-tracker__action-btn {
    width: 100%;
  }
}
</style>
