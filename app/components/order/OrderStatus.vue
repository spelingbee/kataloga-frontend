<template>
  <div class="bg-background-card/50 rounded-lg p-4 border border-border-subtle">
    <!-- Order Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <AppHeading level="h3" size="heading-md" class="text-white">
          Order #{{ order.id }}
        </AppHeading>
        <AppText size="body-sm" class="text-neutral-20">
          {{ formatDate(order.createdAt) }}
        </AppText>
      </div>
      
      <StatusBadge :status="order.status" />
    </div>

    <!-- Status Progress -->
    <div class="mb-4">
      <ProgressBar :current-status="order.status" />
    </div>

    <!-- Status Details -->
    <div class="space-y-3">
      <!-- Current Status Info -->
      <div class="flex items-start space-x-3 p-3 bg-background-dark/50 rounded-lg">
        <div class="flex-shrink-0 mt-1">
          <BaseIcon 
            :name="getStatusIcon(order.status)" 
            size="md" 
            :class="getStatusIconColor(order.status)"
          />
        </div>
        <div class="flex-1">
          <AppText size="body-md" class="text-white font-medium">
            {{ getStatusTitle(order.status) }}
          </AppText>
          <AppText size="body-sm" class="text-neutral-20">
            {{ getStatusDescription(order.status) }}
          </AppText>
          
          <!-- Estimated Time -->
          <div v-if="order.estimatedTime && isActiveOrder" class="mt-2 flex items-center space-x-2">
            <BaseIcon name="clock" size="sm" class="text-primary-orange" />
            <AppText size="body-sm" class="text-primary-orange font-medium">
              {{ formatEstimatedTime(order.estimatedTime) }}
            </AppText>
          </div>
        </div>
      </div>

      <!-- Tracking Updates -->
      <div v-if="order.trackingInfo?.updates?.length" class="space-y-2">
        <AppText size="body-sm" class="text-neutral-20 font-medium">
          Order Updates
        </AppText>
        <div class="space-y-2 max-h-32 overflow-y-auto">
          <div
            v-for="update in order.trackingInfo.updates"
            :key="update.timestamp"
            class="flex items-start space-x-3 p-2 bg-background-dark/30 rounded text-sm"
          >
            <div class="flex-shrink-0 mt-1">
              <div class="w-2 h-2 bg-primary-green rounded-full"/>
            </div>
            <div class="flex-1">
              <AppText size="caption" class="text-white">
                {{ update.message }}
              </AppText>
              <AppText size="caption" class="text-neutral-20">
                {{ formatTime(update.timestamp) }}
              </AppText>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Actions -->
      <div v-if="showActions" class="flex space-x-3 pt-2">
        <!-- Cancel Order -->
        <BaseButton
          v-if="canCancelOrder"
          variant="ghost"
          size="sm"
          class="text-primary-red hover:bg-primary-red/10"
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
          class="text-primary-green hover:bg-primary-green/10"
          @click="$emit('repeat-order', order.id)"
        >
          Order Again
        </BaseButton>

        <!-- Contact Support -->
        <BaseButton
          v-if="needsSupport"
          variant="ghost"
          size="sm"
          class="text-primary-orange hover:bg-primary-orange/10"
          @click="$emit('contact-support', order.id)"
        >
          Contact Support
        </BaseButton>

        <!-- Track Delivery -->
        <BaseButton
          v-if="canTrackDelivery"
          variant="primary"
          size="sm"
          class="bg-primary-green hover:bg-green-600"
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
import type { Order, OrderStatus as OrderStatusEnum } from '~/types'

// Props & Emits
interface Props {
  order: Order
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

// Date/time formatting
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
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

<style scoped>
/* Spacing utilities */
.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-x-3 > * + * {
  margin-left: 0.75rem;
}

.space-x-2 > * + * {
  margin-left: 0.5rem;
}

/* Scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

/* Smooth transitions */
.transition-colors {
  transition: color 0.2s ease-in-out;
}
</style>