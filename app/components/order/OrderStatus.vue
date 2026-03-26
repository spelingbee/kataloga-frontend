<template>
  <div class="order-status">
    <!-- Order Header -->
    <div class="order-status__header">
      <div class="order-status__header-info">
        <AppHeading level="h3" size="heading-md" class="order-status__title">
          Order #{{ order.id }}
        </AppHeading>
        <AppText size="body-sm" class="order-status__date">
          {{ formatDate(order.createdAt) }}
        </AppText>
      </div>
      
      <StatusBadge :status="order.status" />
    </div>

    <!-- Status Progress -->
    <div class="order-status__progress">
      <ProgressBar :current-status="order.status" />
    </div>

    <!-- Status Details -->
    <div class="order-status__details">
      <!-- Current Status Info -->
      <div class="order-status__current">
        <div class="order-status__current-icon">
          <BaseIcon 
            :name="getStatusIcon(order.status)" 
            size="md" 
            :class="getStatusIconColor(order.status)"
          />
        </div>
        <div class="order-status__current-content">
          <AppText size="body-md" class="order-status__current-title">
            {{ getStatusTitle(order.status) }}
          </AppText>
          <AppText size="body-sm" class="order-status__current-description">
            {{ getStatusDescription(order.status) }}
          </AppText>
          
          <!-- Estimated Time -->
          <div v-if="order.estimatedTime && isActiveOrder" class="order-status__estimated">
            <BaseIcon name="clock" size="sm" class="order-status__estimated-icon" />
            <AppText size="body-sm" class="order-status__estimated-text">
              {{ formatEstimatedTime(order.estimatedTime) }}
            </AppText>
          </div>
        </div>
      </div>

      <!-- Tracking Updates -->
      <div v-if="order.trackingInfo?.updates?.length" class="order-status__updates">
        <AppText size="body-sm" class="order-status__updates-title">
          Order Updates
        </AppText>
        <div class="order-status__updates-list">
          <div
            v-for="update in order.trackingInfo.updates"
            :key="update.timestamp"
            class="order-status__update"
          >
            <div class="order-status__update-indicator">
              <div class="order-status__update-dot"/>
            </div>
            <div class="order-status__update-content">
              <AppText size="caption" class="order-status__update-message">
                {{ update.message }}
              </AppText>
              <AppText size="caption" class="order-status__update-time">
                {{ formatTime(update.timestamp) }}
              </AppText>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Actions -->
      <div v-if="showActions" class="order-status__actions">
        <!-- Cancel Order -->
        <BaseButton
          v-if="canCancelOrder"
          variant="ghost"
          size="sm"
          class="order-status__action order-status__action--cancel"
          :loading="loading"
          @click="$emit('cancel-order', order.id)"
        >
          Cancel Order
        </BaseButton>

        <!-- Repeat Order -->
        <BaseButton
          v-if="canRepeatOrder"
          variant="ghost"
          size="sm"
          class="order-status__action order-status__action--repeat"
          @click="$emit('repeat-order', order.id)"
        >
          Order Again
        </BaseButton>

        <!-- Contact Support -->
        <BaseButton
          v-if="needsSupport"
          variant="ghost"
          size="sm"
          class="order-status__action order-status__action--support"
          @click="$emit('contact-support', order.id)"
        >
          Contact Support
        </BaseButton>

        <!-- Track Delivery -->
        <BaseButton
          v-if="canTrackDelivery"
          variant="primary"
          size="sm"
          class="order-status__action order-status__action--track"
          @click="$emit('track-delivery', order.id)"
        >
          Track Delivery
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OrderUI } from '~/types'
import { OrderStatus as OrderStatusEnum } from '~/types'
import { useTenant } from '~/composables/useTenant'

// Props & Emits
interface Props {
  order: OrderUI
  showActions?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  loading: false
})

defineEmits<{
  'cancel-order': [orderId: string]
  'repeat-order': [orderId: string]
  'contact-support': [orderId: string]
  'track-delivery': [orderId: string]
}>()

// Computed properties
const isActiveOrder = computed(() => {
  return [
    OrderStatusEnum.PENDING,
    OrderStatusEnum.CONFIRMED,
    OrderStatusEnum.PREPARING,
    OrderStatusEnum.READY,
    OrderStatusEnum.OUT_FOR_DELIVERY
  ].includes(props.order.status)
})

const canCancelOrder = computed(() => {
  return [
    OrderStatusEnum.PENDING,
    OrderStatusEnum.CONFIRMED
  ].includes(props.order.status)
})

const canRepeatOrder = computed(() => {
  return [
    OrderStatusEnum.DELIVERED,
    OrderStatusEnum.CANCELLED
  ].includes(props.order.status)
})

const needsSupport = computed(() => {
  return props.order.status === OrderStatusEnum.CANCELLED
})

const canTrackDelivery = computed(() => {
  return [
    OrderStatusEnum.PREPARING,
    OrderStatusEnum.READY,
    OrderStatusEnum.OUT_FOR_DELIVERY
  ].includes(props.order.status)
})

// Status helper methods
const getStatusIcon = (status: OrderStatusEnum): string => {
  const icons = {
    [OrderStatusEnum.PENDING]: 'clock',
    [OrderStatusEnum.CONFIRMED]: 'check-circle',
    [OrderStatusEnum.PREPARING]: 'chef-hat',
    [OrderStatusEnum.READY]: 'bell',
    [OrderStatusEnum.OUT_FOR_DELIVERY]: 'truck',
    [OrderStatusEnum.DELIVERED]: 'check-circle-2',
    [OrderStatusEnum.CANCELLED]: 'x-circle'
  }
  return icons[status] || 'info'
}

const getStatusIconColor = (status: OrderStatusEnum): string => {
  const colors = {
    [OrderStatusEnum.PENDING]: 'text-primary-orange',
    [OrderStatusEnum.CONFIRMED]: 'text-primary-green',
    [OrderStatusEnum.PREPARING]: 'text-primary-orange',
    [OrderStatusEnum.READY]: 'text-primary-green',
    [OrderStatusEnum.OUT_FOR_DELIVERY]: 'text-primary-green',
    [OrderStatusEnum.DELIVERED]: 'text-primary-green',
    [OrderStatusEnum.CANCELLED]: 'text-primary-red'
  }
  return colors[status] || 'text-neutral-20'
}

const getStatusTitle = (status: OrderStatusEnum): string => {
  const titles = {
    [OrderStatusEnum.PENDING]: 'Order Received',
    [OrderStatusEnum.CONFIRMED]: 'Order Confirmed',
    [OrderStatusEnum.PREPARING]: 'Preparing Your Order',
    [OrderStatusEnum.READY]: 'Order Ready',
    [OrderStatusEnum.OUT_FOR_DELIVERY]: 'Out for Delivery',
    [OrderStatusEnum.DELIVERED]: 'Order Delivered',
    [OrderStatusEnum.CANCELLED]: 'Order Cancelled'
  }
  return titles[status] || 'Unknown Status'
}

const getStatusDescription = (status: OrderStatusEnum): string => {
  const descriptions = {
    [OrderStatusEnum.PENDING]: 'We have received your order and are processing it.',
    [OrderStatusEnum.CONFIRMED]: 'Your order has been confirmed and will be prepared soon.',
    [OrderStatusEnum.PREPARING]: 'Our chefs are preparing your delicious meal.',
    [OrderStatusEnum.READY]: 'Your order is ready for pickup or delivery.',
    [OrderStatusEnum.OUT_FOR_DELIVERY]: 'Your order is on its way to you.',
    [OrderStatusEnum.DELIVERED]: 'Your order has been successfully delivered. Enjoy!',
    [OrderStatusEnum.CANCELLED]: 'This order has been cancelled.'
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
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tenantSettings.value?.timezone || 'UTC'
  }).format(date)
}

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

<style lang="scss" scoped>
@use '../../assets/scss/abstracts/variables' as *;

.order-status {
  background: rgba(var(--bg-primary), 0.5);
  border-radius: $radius-lg;
  padding: $space-6;
  border: 1px solid $color-border-subtle;
}

.order-status__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-6;
}

.order-status__header-info {
  // Container for title and date
}

.order-status__title {
  color: white;
}

.order-status__date {
  color: $color-neutral-20;
}

.order-status__progress {
  margin-bottom: $space-6;
}

.order-status__details {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.order-status__current {
  display: flex;
  align-items: flex-start;
  gap: $space-4;
  padding: $space-4;
  background: rgba(var(--bg-tertiary), 0.5);
  border-radius: $radius-lg;
}

.order-status__current-icon {
  flex-shrink: 0;
  margin-top: $space-1;
}

.order-status__current-content {
  flex: 1;
}

.order-status__current-title {
  color: white;
  font-weight: $font-medium;
}

.order-status__current-description {
  color: $color-neutral-20;
}

.order-status__estimated {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-top: $space-2;
}

.order-status__estimated-icon {
  color: var(--color-warning);
}

.order-status__estimated-text {
  color: var(--color-warning);
  font-weight: $font-medium;
}

.order-status__updates {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.order-status__updates-title {
  color: $color-neutral-20;
  font-weight: $font-medium;
}

.order-status__updates-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  max-height: 8rem;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
}

.order-status__update {
  display: flex;
  align-items: flex-start;
  gap: $space-4;
  padding: $space-2;
  background: rgba(var(--bg-tertiary), 0.3);
  border-radius: $radius-sm;
  font-size: $text-sm;
}

.order-status__update-indicator {
  flex-shrink: 0;
  margin-top: $space-1;
}

.order-status__update-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--color-success);
  border-radius: $radius-full;
}

.order-status__update-content {
  flex: 1;
}

.order-status__update-message {
  color: white;
}

.order-status__update-time {
  color: $color-neutral-20;
}

.order-status__actions {
  display: flex;
  gap: $space-4;
  padding-top: $space-2;
}

.order-status__action {
  &--cancel {
    color: var(--color-error);
    
    &:hover {
      background: rgba(var(--color-error), 0.1);
    }
  }

  &--repeat {
    color: var(--color-success);
    
    &:hover {
      background: rgba(var(--color-success), 0.1);
    }
  }

  &--support {
    color: var(--color-warning);
    
    &:hover {
      background: rgba(var(--color-warning), 0.1);
    }
  }

  &--track {
    background: var(--color-success);
    
    &:hover {
      background: $color-success-dark;
    }
  }
}
</style>
