<template>
  <div class="order-confirmation">
    <div class="order-confirmation__header">
      <div class="order-confirmation__icon">
        <BaseIcon name="check-circle" size="xl" />
      </div>
      <h2 class="order-confirmation__title">{{ $t('checkout.confirmation.title', 'Заказ оформлен!') }}</h2>
      <p class="order-confirmation__subtitle">
        {{ $t('checkout.confirmation.subtitle', 'Ваш заказ успешно размещен') }}
      </p>
    </div>

    <div class="order-confirmation__details">
      <!-- Order Number -->
      <div class="order-confirmation__section">
        <h3 class="order-confirmation__section-title">{{ $t('checkout.confirmation.details', 'Детали заказа') }}</h3>
        <div class="order-confirmation__info-grid">
          <div class="order-confirmation__info-item">
            <span class="order-confirmation__info-label">{{ $t('checkout.confirmation.order_number', 'Номер заказа') }}</span>
            <span class="order-confirmation__info-value">#{{ orderNumber }}</span>
          </div>
          <div class="order-confirmation__info-item">
            <span class="order-confirmation__info-label">{{ $t('checkout.confirmation.order_type', 'Тип заказа') }}</span>
            <span class="order-confirmation__info-value">{{ formatOrderType(orderType) }}</span>
          </div>
          <div class="order-confirmation__info-item">
            <span class="order-confirmation__info-label">{{ $t('checkout.confirmation.estimated_time', 'Ожидаемое время') }}</span>
            <span class="order-confirmation__info-value">{{ estimatedTime }}</span>
          </div>
          <div class="order-confirmation__info-item">
            <span class="order-confirmation__info-label">{{ $t('checkout.confirmation.total', 'Итоговая сумма') }}</span>
            <span class="order-confirmation__info-value order-confirmation__total">
              {{ formatCurrency(totalAmount) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="order-confirmation__section">
        <h3 class="order-confirmation__section-title">{{ $t('checkout.confirmation.summary', 'Состав заказа') }}</h3>
        <div class="order-confirmation__items">
          <div
            v-for="item in orderItems"
            :key="item.id"
            class="order-confirmation__item"
          >
            <div class="order-confirmation__item-info">
              <span class="order-confirmation__item-name">{{ item.name }}</span>
              <span class="order-confirmation__item-quantity">× {{ item.quantity }}</span>
            </div>
            <span class="order-confirmation__item-price">
              {{ formatCurrency(item.price * item.quantity) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Delivery/Pickup Information -->
      <div v-if="deliveryInfo" class="order-confirmation__section">
        <h3 class="order-confirmation__section-title">
          {{ orderType === 'delivery' ? $t('common.delivery', 'Доставка') : orderType === 'pickup' ? $t('common.pickup', 'Самовывоз') : $t('common.dine_in', 'В заведении') }} - {{ $t('common.information', 'информация') }}
        </h3>
        <div class="order-confirmation__delivery-info">
          <p v-if="deliveryInfo.address" class="order-confirmation__delivery-text">
            <strong>{{ $t('common.address', 'Адрес') }}:</strong> {{ deliveryInfo.address }}
          </p>
          <p v-if="deliveryInfo.location" class="order-confirmation__delivery-text">
            <strong>{{ $t('common.location', 'Место') }}:</strong> {{ deliveryInfo.location }}
          </p>
          <p v-if="deliveryInfo.tableNumber" class="order-confirmation__delivery-text">
            <strong>{{ $t('common.table', 'Стол') }}:</strong> {{ deliveryInfo.tableNumber }}
          </p>
          <p v-if="deliveryInfo.phone" class="order-confirmation__delivery-text">
            <strong>{{ $t('common.phone', 'Телефон') }}:</strong> {{ deliveryInfo.phone }}
          </p>
          <p v-if="deliveryInfo.instructions" class="order-confirmation__delivery-text">
            <strong>{{ $t('common.instructions', 'Инструкции') }}:</strong> {{ deliveryInfo.instructions }}
          </p>
        </div>
      </div>
    </div>

    <!-- Next Steps -->
    <div class="order-confirmation__next-steps">
      <h3 class="order-confirmation__section-title">{{ $t('checkout.confirmation.next_steps', 'Что дальше?') }}</h3>
      <div class="order-confirmation__steps">
        <div class="order-confirmation__step">
          <div class="order-confirmation__step-number">1</div>
          <div class="order-confirmation__step-content">
            <h4 class="order-confirmation__step-title">{{ $t('checkout.confirmation.preparation_title', 'Приготовление заказа') }}</h4>
            <p class="order-confirmation__step-description">
              {{ $t('checkout.confirmation.preparation_desc', 'Ваш заказ уже готовится нашими поварами') }}
            </p>
          </div>
        </div>
        
        <div v-if="orderType === 'delivery'" class="order-confirmation__step">
          <div class="order-confirmation__step-number">2</div>
          <div class="order-confirmation__step-content">
            <h4 class="order-confirmation__step-title">{{ $t('checkout.confirmation.delivery_title', 'Передача курьеру') }}</h4>
            <p class="order-confirmation__step-description">
              {{ $t('checkout.confirmation.delivery_desc', 'Скоро курьер заберет ваш заказ и доставит его по адресу') }}
            </p>
          </div>
        </div>
        
        <div v-else-if="orderType === 'pickup'" class="order-confirmation__step">
          <div class="order-confirmation__step-number">2</div>
          <div class="order-confirmation__step-content">
            <h4 class="order-confirmation__step-title">{{ $t('checkout.confirmation.pickup_ready_title', 'Готовность к выдаче') }}</h4>
            <p class="order-confirmation__step-description">
              {{ $t('checkout.confirmation.pickup_ready_desc', 'Мы сообщим вам, когда заказ можно будет забрать') }}
            </p>
          </div>
        </div>
        
        <div v-else class="order-confirmation__step">
          <div class="order-confirmation__step-number">2</div>
          <div class="order-confirmation__step-content">
            <h4 class="order-confirmation__step-title">{{ $t('checkout.confirmation.dinein_title', 'Подача на стол') }}</h4>
            <p class="order-confirmation__step-description">
              {{ $t('checkout.confirmation.dinein_desc', 'Ваш заказ будет подан прямо к вашему столику') }}
            </p>
          </div>
        </div>
        
        <div class="order-confirmation__step">
          <div class="order-confirmation__step-number">3</div>
          <div class="order-confirmation__step-content">
            <h4 class="order-confirmation__step-title">{{ $t('checkout.confirmation.enjoy_title', 'Приятного аппетита!') }}</h4>
            <p class="order-confirmation__step-description">
              {{ $t('checkout.confirmation.enjoy_desc', 'Спасибо, что выбрали нас. Наслаждайтесь вашим заказом!') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="order-confirmation__actions">
      <!-- Track Order button hidden as requested -->
      <!-- <BaseButton
        variant="outline"
        @click="$emit('track-order')"
      >
        <BaseIcon name="map-pin" size="sm" />
        {{ $t('checkout.confirmation.track', 'Отследить заказ') }}
      </BaseButton> -->
      
      <BaseButton
        variant="secondary"
        @click="$emit('continue-shopping')"
      >
        {{ $t('checkout.confirmation.continue', 'За покупками') }}
      </BaseButton>
      
      <BaseButton
        variant="primary"
        @click="$emit('view-orders')"
      >
        {{ $t('checkout.confirmation.view_all', 'Все заказы') }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTenantSettings } from '~/composables/useTenant'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface DeliveryInfo {
  address?: string
  location?: string
  tableNumber?: string
  phone?: string
  instructions?: string
}

interface Props {
  orderNumber: string
  orderType: 'delivery' | 'pickup' | 'dine-in'
  orderItems: OrderItem[]
  totalAmount: number
  estimatedTime: string
  deliveryInfo?: DeliveryInfo
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'track-order': []
  'continue-shopping': []
  'view-orders': []
}>()

const formatOrderType = (type: string): string => {
  const types: Record<string, string> = {
    'delivery': 'Доставка',
    'pickup': 'Самовывоз',
    'dine-in': 'В заведении'
  }
  return types[type] || type
}

const { formatCurrency } = useTenantSettings()
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.order-confirmation {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.order-confirmation__header {
  text-align: center;
  margin-bottom: $space-12;
}

.order-confirmation__icon {
  color: var(--color-success);
  margin-bottom: $space-4;
}

.order-confirmation__title {
  font-size: $text-3xl;
  font-weight: $font-bold;
  font-family: $font-secondary;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.order-confirmation__subtitle {
  font-size: $text-lg;
  color: var(--text-secondary);
  margin: 0;
}

.order-confirmation__details {
  margin-bottom: $space-12;
}

.order-confirmation__section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-card;
  padding: $card-padding;
  margin-bottom: $space-6;
  box-shadow: $shadow-card;
}

.order-confirmation__section-title {
  font-size: $text-xl;
  font-weight: $font-semibold;
  font-family: $font-secondary;
  color: var(--text-primary);
  margin-bottom: $space-6;
}

.order-confirmation__info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $space-4;
}

.order-confirmation__info-item {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.order-confirmation__info-label {
  font-size: $text-sm;
  color: var(--text-secondary);
  font-weight: $font-medium;
}

.order-confirmation__info-value {
  font-size: $text-base;
  color: var(--text-primary);
  font-weight: $font-semibold;
}

.order-confirmation__total {
  color: var(--color-primary);
  font-size: $text-lg;
}

.order-confirmation__items {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.order-confirmation__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-4;
  background: var(--bg-primary);
  border-radius: $radius-md;
  border: 1px solid var(--border-primary);
}

.order-confirmation__item-info {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.order-confirmation__item-name {
  font-size: $text-base;
  font-weight: $font-medium;
  color: var(--text-primary);
}

.order-confirmation__item-quantity {
  font-size: $text-sm;
  color: var(--text-secondary);
}

.order-confirmation__item-price {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--text-primary);
}

.order-confirmation__delivery-info {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.order-confirmation__delivery-text {
  font-size: $text-base;
  color: var(--text-primary);
  margin: 0;
  line-height: $leading-relaxed;
}

.order-confirmation__next-steps {
  margin-bottom: $space-12;
}

.order-confirmation__steps {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.order-confirmation__step {
  display: flex;
  gap: $space-4;
  align-items: flex-start;
}

.order-confirmation__step-number {
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: white;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $text-sm;
  font-weight: $font-semibold;
  flex-shrink: 0;
}

.order-confirmation__step-content {
  flex: 1;
}

.order-confirmation__step-title {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.order-confirmation__step-description {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin: 0;
  line-height: $leading-relaxed;
}

.order-confirmation__actions {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding-top: $space-6;
  border-top: 1px solid var(--border-primary);
}

@media (min-width: 640px) {
  .order-confirmation__actions {
    flex-direction: row;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .order-confirmation__info-grid {
    grid-template-columns: 1fr;
  }
  
  .order-confirmation__item {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-2;
  }
  
  .order-confirmation__item-price {
    align-self: flex-end;
  }
}

// Animation for the confirmation icon
.order-confirmation__icon {
  animation: confirmationPulse 2s ease-in-out;
}

@keyframes confirmationPulse {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .order-confirmation__icon {
    animation: none;
  }
}
</style>
