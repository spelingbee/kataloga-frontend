<template>
  <div class="order-details">
    <!-- Order Header -->
    <div class="order-details__header">
      <div class="order-details__header-info">
        <AppHeading level="h2" size="heading-xl" class="order-details__order-number">
          Order #{{ order.id }}
        </AppHeading>
        <AppText size="body-sm" class="order-details__date">
          {{ formatDate(order.createdAt) }}
        </AppText>
      </div>
      <StatusBadge :status="order.status" size="lg" />
    </div>

    <!-- Order Items -->
    <div class="order-details__section">
      <AppHeading level="h3" size="heading-md" class="order-details__section-title">
        Order Items
      </AppHeading>
      
      <div class="order-details__items">
        <div
          v-for="item in order.items"
          :key="item.id"
          class="order-details__item"
        >
          <!-- Item Image -->
          <div class="order-details__item-image">
            <img 
              v-if="item.menuItem.imageUrl" 
              :src="item.menuItem.imageUrl" 
              :alt="item.menuItem.name"
              class="order-details__item-img"
            />
            <BaseIcon v-else name="utensils" size="lg" class="order-details__item-icon" />
          </div>

          <!-- Item Info -->
          <div class="order-details__item-info">
            <AppHeading level="h4" size="heading-sm" class="order-details__item-name">
              {{ item.menuItem.name }}
            </AppHeading>
            <AppText v-if="item.menuItem.description" size="body-sm" class="order-details__item-description">
              {{ item.menuItem.description }}
            </AppText>
            
            <!-- Customizations -->
            <div v-if="item.customizations && Object.keys(item.customizations).length > 0" class="order-details__item-customizations">
              <AppText size="caption" class="order-details__item-customizations-label">
                Customizations:
              </AppText>
              <AppText size="caption" class="order-details__item-customizations-text">
                {{ formatCustomizations(item.customizations) }}
              </AppText>
            </div>
            
            <div class="order-details__item-meta">
              <AppText size="body-sm" class="order-details__item-quantity">
                Qty: {{ item.quantity }}
              </AppText>
              <AppText size="body-sm" class="order-details__item-price">
                {{ formatPrice(item.price) }} each
              </AppText>
            </div>
          </div>

          <!-- Item Total -->
          <div class="order-details__item-total">
            <AppPrice :price="item.subtotal" size="md" />
          </div>
        </div>
      </div>
    </div>

    <!-- Order Summary -->
    <div class="order-details__section">
      <AppHeading level="h3" size="heading-md" class="order-details__section-title">
        Order Summary
      </AppHeading>
      
      <div class="order-details__summary">
        <div class="order-details__summary-row">
          <AppText class="order-details__summary-label">Subtotal</AppText>
          <AppText class="order-details__summary-value">{{ formatPrice(subtotal) }}</AppText>
        </div>
        
        <div v-if="deliveryFee > 0" class="order-details__summary-row">
          <AppText class="order-details__summary-label">Delivery Fee</AppText>
          <AppText class="order-details__summary-value">{{ formatPrice(deliveryFee) }}</AppText>
        </div>
        
        <div v-if="tax > 0" class="order-details__summary-row">
          <AppText class="order-details__summary-label">Tax</AppText>
          <AppText class="order-details__summary-value">{{ formatPrice(tax) }}</AppText>
        </div>
        
        <div v-if="discount > 0" class="order-details__summary-row order-details__summary-row--discount">
          <AppText class="order-details__summary-label">Discount</AppText>
          <AppText class="order-details__summary-value">-{{ formatPrice(discount) }}</AppText>
        </div>
        
        <div class="order-details__summary-row order-details__summary-row--total">
          <AppText size="body-lg" class="order-details__summary-label order-details__summary-label--total">
            Total
          </AppText>
          <AppPrice :price="order.total" size="lg" />
        </div>
      </div>
    </div>

    <!-- Customer Information -->
    <div class="order-details__section">
      <AppHeading level="h3" size="heading-md" class="order-details__section-title">
        Customer Information
      </AppHeading>
      
      <div class="order-details__customer">
        <div class="order-details__customer-row">
          <BaseIcon name="user" size="sm" class="order-details__customer-icon" />
          <AppText class="order-details__customer-text">{{ order.customerInfo.name }}</AppText>
        </div>
        
        <div class="order-details__customer-row">
          <BaseIcon name="phone" size="sm" class="order-details__customer-icon" />
          <AppText class="order-details__customer-text">{{ order.customerInfo.phone }}</AppText>
        </div>
        
        <div v-if="order.customerInfo.email" class="order-details__customer-row">
          <BaseIcon name="mail" size="sm" class="order-details__customer-icon" />
          <AppText class="order-details__customer-text">{{ order.customerInfo.email }}</AppText>
        </div>
        
        <div v-if="order.deliveryAddress" class="order-details__customer-row">
          <BaseIcon name="map-pin" size="sm" class="order-details__customer-icon" />
          <AppText class="order-details__customer-text">{{ order.deliveryAddress }}</AppText>
        </div>
        
        <div v-if="order.customerInfo.notes" class="order-details__customer-row order-details__customer-row--notes">
          <BaseIcon name="message-square" size="sm" class="order-details__customer-icon" />
          <div class="order-details__customer-notes">
            <AppText size="body-sm" class="order-details__customer-notes-label">
              Special Instructions:
            </AppText>
            <AppText size="body-sm" class="order-details__customer-text">
              {{ order.customerInfo.notes }}
            </AppText>
          </div>
        </div>
      </div>
    </div>

    <!-- Restaurant Contact (if needed) -->
    <div v-if="showRestaurantContact" class="order-details__section">
      <AppHeading level="h3" size="heading-md" class="order-details__section-title">
        Restaurant Contact
      </AppHeading>
      
      <div class="order-details__contact">
        <BaseButton
          variant="secondary"
          @click="$emit('call-restaurant')"
        >
          <BaseIcon name="phone" size="sm" class="mr-2" />
          Call Restaurant
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '~/types'
import { useTenant } from '~/composables/useTenant'

// Props & Emits
interface Props {
  order: Order
  showRestaurantContact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRestaurantContact: true
})

defineEmits<{
  'call-restaurant': []
}>()

// Computed
const subtotal = computed(() => {
  return props.order.items.reduce((sum, item) => sum + item.subtotal, 0)
})

const deliveryFee = computed(() => {
  // Extract from order total or use default
  return 2.99
})

const tax = computed(() => {
  // Calculate tax (8%)
  return subtotal.value * 0.08
})

const discount = computed(() => {
  // Calculate discount if any
  return 0
})

// Tenant context
const { tenantSettings } = useTenant()

const locale = computed(() => {
  const language = tenantSettings.value?.language || 'en'
  const localeMap: Record<string, string> = {
    en: 'en-US',
    ru: 'ru-RU',
    de: 'DE',
    fr: 'fr-FR',
    es: 'es-ES'
  }
  return localeMap[language] || 'en-US'
})

const currency = computed(() => {
  return tenantSettings.value?.currency || 'USD'
})

// Methods
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

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currency.value
  }).format(price)
}

const formatCustomizations = (customizations: Record<string, any>): string => {
  return Object.entries(customizations)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/abstracts/variables' as *;

.order-details {
  width: 100%;
}

.order-details__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: $space-8;
  padding-bottom: $space-6;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.order-details__header-info {
  flex: 1;
}

.order-details__order-number {
  color: white;
  margin-bottom: $space-1;
}

.order-details__date {
  color: $color-neutral-20;
}

.order-details__section {
  margin-bottom: $space-8;
}

.order-details__section-title {
  color: white;
  margin-bottom: $space-6;
}

.order-details__items {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.order-details__item {
  display: flex;
  gap: $space-4;
  padding: $space-4;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-md;
}

.order-details__item-image {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.order-details__item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-details__item-icon {
  color: var(--text-primary);
}

.order-details__item-info {
  flex: 1;
  min-width: 0;
}

.order-details__item-name {
  color: white;
  margin-bottom: $space-1;
}

.order-details__item-description {
  color: $color-neutral-20;
  margin-bottom: $space-2;
}

.order-details__item-customizations {
  margin-bottom: $space-2;
}

.order-details__item-customizations-label {
  color: $color-neutral-20;
  font-weight: 500;
}

.order-details__item-customizations-text {
  color: $color-neutral-20;
}

.order-details__item-meta {
  display: flex;
  gap: $space-4;
}

.order-details__item-quantity {
  color: $color-neutral-20;
}

.order-details__item-price {
  color: $color-neutral-20;
}

.order-details__item-total {
  flex-shrink: 0;
  text-align: right;
}

.order-details__summary {
  padding: $space-6;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-md;
}

.order-details__summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-2 0;
}

.order-details__summary-row--discount {
  color: var(--color-success);
}

.order-details__summary-row--total {
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.order-details__summary-label {
  color: $color-neutral-20;
}

.order-details__summary-label--total {
  color: white;
  font-weight: 600;
}

.order-details__summary-value {
  color: white;
}

.order-details__customer {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-6;
  background: rgba(255, 255, 255, 0.03);
  border-radius: $radius-md;
}

.order-details__customer-row {
  display: flex;
  align-items: flex-start;
  gap: $space-4;
}

.order-details__customer-row--notes {
  align-items: flex-start;
}

.order-details__customer-icon {
  flex-shrink: 0;
  color: var(--text-primary);
  margin-top: 2px;
}

.order-details__customer-text {
  color: white;
}

.order-details__customer-notes {
  flex: 1;
}

.order-details__customer-notes-label {
  color: $color-neutral-20;
  margin-bottom: $space-1;
}

.order-details__contact {
  display: flex;
  gap: $space-4;
}

// Responsive
@media (max-width: 768px) {
  .order-details__header {
    flex-direction: column;
    gap: $space-4;
  }
  
  .order-details__item {
    flex-direction: column;
  }
  
  .order-details__item-image {
    width: 100%;
    height: 200px;
  }
  
  .order-details__item-total {
    text-align: left;
  }
}
</style>
