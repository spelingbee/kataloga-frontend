<template>
  <div class="order-tracker">
    <!-- Header -->
    <div class="order-tracker__header">
      <div class="order-tracker__header-info">
        <div class="order-tracker__title-row">
          <AppHeading level="h2" size="heading-sm" class="order-tracker__title">
            {{ $t('orders.trackOrder') }}
          </AppHeading>
          
          <!-- Refresh Button -->
          <BaseButton
            variant="ghost"
            size="sm"
            :loading="refreshing"
            class="order-tracker__refresh-btn"
            :aria-label="$t('common.retry')"
            @click="refreshTracking"
          >
            <BaseIcon 
              name="refresh-cw" 
              size="sm" 
              :class="{ 'animate-spin': refreshing }"
            />
          </BaseButton>
        </div>
        <AppText size="body-xs" class="order-tracker__subtitle">
          ID #{{ order.id.slice(-6).toUpperCase() }} • {{ formatDate(order.createdAt) }}
        </AppText>
      </div>
    </div>

    <!-- Order Status -->
    <div class="order-tracker__status">
      <OrderStatus :order="order" :show-actions="false" hide-header compact />
    </div>

    <!-- Delivery Information (if applicable) -->
    <div v-if="isDeliveryOrder && deliveryInfo" class="order-tracker__section">
      <AppHeading level="h3" size="heading-xs" class="order-tracker__section-title">
        {{ $t('orders.deliveryDetails') }}
      </AppHeading>

      <div class="order-tracker__info-card">
        <!-- Delivery Address -->
        <div class="order-tracker__info-item">
          <BaseIcon
            name="map-pin"
            size="sm"
            class="order-tracker__info-icon order-tracker__info-icon--green"
          />
          <div class="order-tracker__info-content">
            <AppText size="body-xs" class="order-tracker__info-label">
              {{ $t('orders.deliveryAddress') }}
            </AppText>
            <AppText size="body-sm" class="order-tracker__info-value">
              {{ deliveryAddress }}
            </AppText>
          </div>
        </div>

        <!-- Courier Information -->
        <div v-if="deliveryInfo.courierInfo" class="order-tracker__info-item">
          <BaseIcon
            name="user"
            size="sm"
            class="order-tracker__info-icon order-tracker__info-icon--green"
          />
          <div class="order-tracker__info-content">
            <AppText size="body-xs" class="order-tracker__info-label">
              {{ $t('orders.courier') }}
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
          <BaseIcon
            name="clock"
            size="sm"
            class="order-tracker__info-icon order-tracker__info-icon--orange"
          />
          <div class="order-tracker__info-content">
            <AppText size="body-xs" class="order-tracker__info-label">
              {{ $t('orders.estimatedDelivery') }}
            </AppText>
            <AppText
              size="body-sm"
              class="order-tracker__info-value order-tracker__info-value--orange"
            >
              {{ formatEstimatedTime(deliveryInfo.estimatedTime) }}
            </AppText>
          </div>
        </div>
      </div>
    </div>

    <!-- Pickup Information (if applicable) -->
    <div v-if="!isDeliveryOrder" class="order-tracker__section">
      <AppHeading level="h3" size="heading-xs" class="order-tracker__section-title">
        {{ $t('orders.pickupDetails') }}
      </AppHeading>

      <div class="order-tracker__info-card">
        <!-- Restaurant Address -->
        <div class="order-tracker__info-item">
          <BaseIcon
            name="store"
            size="sm"
            class="order-tracker__info-icon order-tracker__info-icon--green"
          />
          <div class="order-tracker__info-content">
            <AppText size="body-xs" class="order-tracker__info-label">
              {{ $t('orders.pickupLocation') }}
            </AppText>
            <AppText size="body-sm" class="order-tracker__info-value">
              {{ tenantSettings?.name || order.restaurantName || 'Main Restaurant' }}
            </AppText>
            <AppText v-if="order.deliveryAddress" size="body-xs" class="order-tracker__info-address mt-1">
              {{ order.deliveryAddress }}
            </AppText>
          </div>
        </div>

        <!-- Pickup Time -->
        <div class="order-tracker__info-item">
          <BaseIcon
            name="clock"
            size="sm"
            class="order-tracker__info-icon order-tracker__info-icon--orange"
          />
          <div class="order-tracker__info-content">
            <AppText size="body-xs" class="order-tracker__info-label">
              {{ $t('orders.readyForPickup') }}
            </AppText>
            <AppText
              size="body-sm"
              class="order-tracker__info-value order-tracker__info-value--orange"
            >
              {{ order.estimatedTime ? formatEstimatedTime(order.estimatedTime) : $t('orders.pending') }}
            </AppText>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="order-tracker__info-item">
          <BaseIcon
            name="phone"
            size="sm"
            class="order-tracker__info-icon order-tracker__info-icon--green"
          />
          <div class="order-tracker__info-content">
            <AppText size="body-xs" class="order-tracker__info-label">
              {{ $t('orders.restaurantPhone') }}
            </AppText>
            <BaseButton
              variant="ghost"
              size="sm"
              class="order-tracker__contact-btn"
              @click="callRestaurant"
            >
              {{ tenantSettings?.phone || order.restaurantPhone || '+7 (812) 123-45-67' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Tracking Map (if delivery is active) -->
    <div v-if="showLiveTracking" class="order-tracker__section">
      <AppHeading level="h3" size="heading-xs" class="order-tracker__section-title">
        {{ $t('orders.liveTracking') }}
      </AppHeading>

      <div class="order-tracker__map-placeholder">
        <!-- Placeholder for map integration -->
        <div class="order-tracker__map-content">
          <BaseIcon name="map" size="xl" class="order-tracker__map-icon" />
          <AppText class="order-tracker__map-text">
            {{ $t('orders.liveTracking') }}
          </AppText>
          <AppText size="caption" class="order-tracker__map-subtext">
            {{ $t('common.loading') }}...
          </AppText>
        </div>
      </div>
    </div>

    <!-- Order Items Summary -->
    <div class="order-tracker__section">
      <AppHeading level="h3" size="heading-xs" class="order-tracker__section-title">
        {{ $t('common.items') }}
      </AppHeading>

      <div class="order-tracker__items">
        <div v-for="item in order.items" :key="item.id" class="order-tracker__item">
          <div class="order-tracker__item-info">
            <AppText size="body-sm" class="order-tracker__item-name">
              {{ item.quantity }}× {{ getItemName(item.productId || item.menuItemId, item) }}
            </AppText>
            <AppText
              v-if="item.customizations"
              size="caption"
              class="order-tracker__item-customizations"
            >
              {{ formatCustomizations(item.customizations) }}
            </AppText>
          </div>
          <AppPrice :price="item.price * item.quantity" size="sm" />
        </div>
      </div>

      <!-- Order Total -->
      <div class="order-tracker__total">
        <AppText size="body-sm" class="order-tracker__total-label">
          {{ $t('orders.total') }}
        </AppText>
        <AppPrice :price="order.total" size="md" class="order-tracker__total-price" />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="order-tracker__actions">
      <BaseButton
        v-if="canCancelOrder"
        variant="ghost"
        size="sm"
        class="order-tracker__action-btn order-tracker__action-btn--cancel"
        :loading="loading"
        @click="$emit('cancel-order', order.id)"
      >
        {{ $t('orders.cancelOrder') }}
      </BaseButton>

      <BaseButton
        v-if="needsSupport"
        variant="ghost"
        class="order-tracker__action-btn order-tracker__action-btn--support"
        @click="$emit('contact-support', order.id)"
      >
        {{ $t('orders.support') }}
      </BaseButton>

      <BaseButton
        variant="primary"
        class="order-tracker__action-btn order-tracker__action-btn--primary"
        @click="$emit('share-tracking', order.id)"
      >
        {{ $t('orders.shareOrder') }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { type Order, type Delivery, OrderStatus } from '~/types'
import { useTenant } from '~/composables/useTenant'
import { useOrderStore } from '~/stores/order'
import AppHeading from '../base/AppHeading.vue'
import AppText from '../base/AppText.vue'
import AppPrice from '../base/AppPrice.vue'

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
  loading: false,
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
  // Determine if this is a delivery order based on orderType
  return props.order.orderType === 'delivery'
})

const { tenantSettings } = useTenant()

const deliveryAddress = computed(() => {
  return props.order.deliveryAddress || props.order.customerInfo?.address || props.order.customerAddress || t('common.error')
})

const showLiveTracking = computed(() => {
  return (
    isDeliveryOrder.value &&
    [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.READY].includes(props.order.status)
  )
})

const canCancelOrder = computed(() => {
  return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(props.order.status)
})

const needsSupport = computed(() => {
  return props.order.status === OrderStatus.CANCELLED
})

// Methods
const refreshTracking = async () => {
  refreshing.value = true
  try {
    emit('refresh-tracking', props.order.id)

    const { getOrder } = useOrderStore()
    await getOrder(props.order.id)
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
  const phone = tenantSettings.value?.phone || props.order.restaurantPhone || '+78121234567'
  window.open(`tel:${phone.replace(/\D/g, '')}`)
}

const getItemName = (menuId: string | undefined, item?: any): string => {
  const target =
    item ||
    props.order.items.find(
      i => i.menuItemId === menuId || i.productId === menuId || i.id === menuId
    )
  return target?.product?.name || target?.name || target?.title || useI18n().t('common.error')
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
    minute: '2-digit',
  }).format(date)
}

const formatEstimatedTime = (minutes: number): string => {
  const now = new Date()
  const estimatedTime = new Date(now.getTime() + minutes * 60000)

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
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
watch(
  () => props.order.status,
  newStatus => {
    const activeStatuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.OUT_FOR_DELIVERY,
    ]

    if (activeStatuses.includes(newStatus)) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }
)
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/typography' as *;

.order-tracker {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-2;

  &__header {
    display: flex;
    flex-direction: column;
    padding: 0 $space-2;
  }

  &__title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  &__title {
    color: var(--text-primary);
    margin-bottom: $space-1;
  }

  &__subtitle {
    color: var(--text-secondary);
  }

  &__section {
    margin-bottom: $space-2;
  }

  &__section-title {
    color: var(--text-secondary);
    margin: 0 $space-2 $space-3;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__info-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    padding: $space-4;
    display: flex;
    flex-direction: column;
    gap: $space-4;
    box-shadow: var(--shadow-sm);
  }

  &__info-item {
    display: flex;
    gap: $space-3;
    align-items: flex-start;
  }

  &__info-icon {
    margin-top: 2px;
    color: var(--text-tertiary);

    &--green {
      color: var(--color-success);
    }
    &--orange {
      color: var(--color-primary);
    }
  }

  &__info-label {
    color: var(--text-secondary);
    margin-bottom: 2px;
  }

  &__info-value {
    color: var(--text-primary);
    font-weight: $font-medium;

    &--orange {
      color: var(--color-primary);
    }
  }

  &__items {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    padding: $space-4;
    display: flex;
    flex-direction: column;
    gap: $space-3;
    box-shadow: var(--shadow-sm);
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  &__item-name {
    color: var(--text-primary);
  }

  &__total {
    margin-top: $space-3;
    padding: $space-3 $space-4;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed var(--border-color);
  }

  &__total-label {
    color: var(--text-primary);
    font-weight: $font-semibold;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    margin-top: $space-4;
  }

  &__action-btn {
    width: 100%;

    &--cancel {
      color: var(--color-error) !important;
    }
  }

  &__contact-btn {
    padding: 0;
    height: auto;
    font-size: inherit;
    font-weight: inherit;
    color: var(--color-primary);

    &:hover {
      background: transparent;
      text-decoration: underline;
    }
  }
}
</style>
