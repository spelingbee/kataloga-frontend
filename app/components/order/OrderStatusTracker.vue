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
          {{ $t(`status.order.${order.status}`) }}
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
        {{ $t('order.timeline', 'История заказа') }}
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
        {{ $t('common.cancelOrder', 'Отменить заказ') }}
      </BaseButton>

      <BaseButton
        v-if="canContactSupport"
        variant="ghost"
        class="order-status-tracker__action-btn"
        @click="$emit('contact-support', order.id)"
      >
        <BaseIcon name="help-circle" size="sm" class="mr-2" />
        {{ $t('common.contactSupport', 'Связаться с поддержкой') }}
      </BaseButton>

      <BaseButton
        v-if="canTrackDelivery"
        variant="primary"
        class="order-status-tracker__action-btn"
        @click="$emit('track-delivery', order.id)"
      >
        <BaseIcon name="map" size="sm" class="mr-2" />
        {{ $t('order.trackDelivery', 'Отследить доставку') }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Order, OrderStatus as OrderStatusEnum } from '~/types'
import { OrderStatus } from '~/types'

const { t } = useI18n()

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

const getStatusDescription = (status: OrderStatusEnum): string => {
  // We can add localized descriptions too if needed, but for now using titles is enough
  // Or add status_description keys to locales
  return t(`status.description.${status}`, '') 
}

// Date/time formatting
const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60) {
    return t('order.timeRemaining', { count: minutes }, `${minutes} мин осталось`)
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}ч ${remainingMinutes}м осталось`
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/radius' as *;

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
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-xl;
  margin-bottom: $space-8;
}

.order-status-tracker__icon-wrapper {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: $radius-lg;
}

.order-status-tracker__content {
  flex: 1;
}

.order-status-tracker__title {
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.order-status-tracker__description {
  color: var(--text-secondary);
  margin-bottom: $space-4;
}

.order-status-tracker__time {
  display: flex;
  align-items: center;
  gap: $space-2;
  color: var(--color-warning);
}

.order-status-tracker__time-text {
  font-weight: 500;
}

.order-status-tracker__timeline {
  margin-bottom: $space-8;
}

.order-status-tracker__timeline-title {
  color: var(--text-primary);
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
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
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
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.order-status-tracker__timeline-time {
  color: var(--text-tertiary);
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

