<template>
  <div class="order-history">
    <!-- Loading State -->
    <div v-if="loading && !orders.length" class="order-history__loading">
      <div class="order-history__spinner" />
      <p class="order-history__loading-text">{{ t('orders.loading_orders') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!orders.length" class="order-history__empty">
      <div class="order-history__empty-icon">?</div>
      <h3 class="order-history__empty-title">{{ t('orders.no_orders') }}</h3>
      <p class="order-history__empty-text">
        {{ t('orders.no_orders_text') }}
      </p>
      <NuxtLink to="/" class="order-history__empty-button">
        {{ t('orders.browse_menu') }}
      </NuxtLink>
    </div>

    <!-- Orders List -->
    <div v-else class="order-history__list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-history__item"
      >
        <!-- Order Header -->
        <div class="order-history__header">
          <div class="order-history__header-left">
            <h4 class="order-history__order-number">{{ t('orders.order_number', { number: order.id.slice(-8).toUpperCase() }) }}</h4>
            <span class="order-history__date">{{ formatDate(order.createdAt) }}</span>
          </div>
          <div class="order-history__header-right">
            <span :class="['order-history__status', `order-history__status--${order.status.toLowerCase()}`]">
              {{ getStatusText(order.status) }}
            </span>
            <span class="order-history__total">{{ order.total.toFixed(2) }} {{ t('currency.som') }}</span>
          </div>
        </div>

        <!-- Order Items -->
        <div class="order-history__items">
          <div
            v-for="item in order.items.slice(0, 3)"
            :key="item.id"
            class="order-history__item-row"
          >
            <span class="order-history__item-quantity">{{ item.quantity }}x</span>
            <span class="order-history__item-name">{{ item.menuItem?.name || item.product?.name }}</span>
            <span class="order-history__item-price">{{ item.price.toFixed(2) }} {{ t('currency.som') }}</span>
          </div>
          <div v-if="order.items.length > 3" class="order-history__item-more">
            {{ t('orders.items_more', { count: order.items.length - 3 }) }}
          </div>
        </div>

        <!-- Order Actions -->
        <div class="order-history__actions">
          <NuxtLink
            :to="`/orders/${order.id}`"
            class="order-history__action order-history__action--view"
          >
            {{ t('orders.view_details') }}
          </NuxtLink>
          <button
            class="order-history__action order-history__action--reorder"
            :disabled="reorderingOrderId === order.id"
            @click="handleReorder(order)"
          >
            <span v-if="reorderingOrderId === order.id">{{ t('orders.reordering') }}</span>
            <span v-else>{{ t('orders.reorder') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="order-history__pagination">
      <button
        class="order-history__pagination-button"
        :disabled="currentPage === 1 || loading"
        @click="goToPage(currentPage - 1)"
      >
        {{ t('common.previous') }}
      </button>
      
      <div class="order-history__pagination-pages">
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'order-history__pagination-page',
            { 'order-history__pagination-page--active': page === currentPage }
          ]"
          :disabled="loading"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>

      <button
        class="order-history__pagination-button"
        :disabled="currentPage === totalPages || loading"
        @click="goToPage(currentPage + 1)"
      >
        {{ t('common.next') }}
      </button>
    </div>

    <!-- Reorder Notification Modal -->
    <div v-if="showReorderNotification" class="order-history__modal-overlay" @click="closeReorderNotification">
      <div class="order-history__modal" @click.stop>
        <div class="order-history__modal-header">
          <h3 class="order-history__modal-title">{{ reorderNotification.title }}</h3>
          <button class="order-history__modal-close" @click="closeReorderNotification">?</button>
        </div>
        <div class="order-history__modal-body">
          <p class="order-history__modal-message">{{ reorderNotification.message }}</p>
          
          <!-- Price Changes -->
          <div v-if="reorderNotification.priceChanges.length > 0" class="order-history__modal-section">
            <h4 class="order-history__modal-subtitle">{{ t('orders.price_changes') }}:</h4>
            <ul class="order-history__modal-list">
              <li
                v-for="change in reorderNotification.priceChanges"
                :key="change.itemName"
                class="order-history__modal-list-item"
              >
                <span>{{ change.itemName }}</span>
                <span class="order-history__modal-price-change">
                  {{ change.oldPrice.toFixed(2) }} > {{ change.newPrice.toFixed(2) }} {{ t('currency.som') }}
                </span>
              </li>
            </ul>
          </div>

          <!-- Unavailable Items -->
          <div v-if="reorderNotification.unavailableItems.length > 0" class="order-history__modal-section">
            <h4 class="order-history__modal-subtitle">{{ t('orders.unavailable_items') }}:</h4>
            <ul class="order-history__modal-list">
              <li
                v-for="itemName in reorderNotification.unavailableItems"
                :key="itemName"
                class="order-history__modal-list-item order-history__modal-list-item--unavailable"
              >
                {{ itemName }}
              </li>
            </ul>
          </div>
        </div>
        <div class="order-history__modal-footer">
          <button class="order-history__modal-button order-history__modal-button--secondary" @click="closeReorderNotification">
            {{ t('common.cancel') }}
          </button>
          <button class="order-history__modal-button order-history__modal-button--primary" @click="confirmReorder">
            {{ t('orders.continue_to_cart') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '~/types'
import { useCartStore } from '~/stores/cart'
import { useMenuStore } from '~/stores/menu'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

interface Props {
  orders: Order[]
  loading?: boolean
  currentPage?: number
  totalPages?: number
}

interface Emits {
  (e: 'page-change', page: number): void
  (e: 'reorder', orderId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  currentPage: 1,
  totalPages: 1,
})

const emit = defineEmits<Emits>()

const cartStore = useCartStore()
const menuStore = useMenuStore()
const router = useRouter()

// State
const reorderingOrderId = ref<string | null>(null)
const showReorderNotification = ref(false)
const reorderNotification = ref({
  title: '',
  message: '',
  priceChanges: [] as Array<{ itemName: string; oldPrice: number; newPrice: number }>,
  unavailableItems: [] as string[],
  orderId: '',
})

// Computed
const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  const halfVisible = Math.floor(maxVisible / 2)
  
  let start = Math.max(1, props.currentPage - halfVisible)
  const end = Math.min(props.totalPages, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  
  // Calculate differences
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return t('orders.today')
  if (diffDays === 1) return t('orders.yesterday')
  if (diffDays <= 7) return t('orders.days_ago', { count: diffDays })
  
  return date.toLocaleDateString(locale.value, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: t('orders.pending'),
    CONFIRMED: t('orders.confirmed'),
    PREPARING: t('orders.preparing'),
    READY: t('orders.ready'),
    OUT_FOR_DELIVERY: t('orders.inTransit'),
    DELIVERED: t('orders.delivered'),
    CANCELLED: t('orders.cancelled'),
  }
  return statusMap[status] || status
}

const goToPage = (page: number): void => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}

const handleReorder = async (order: Order): Promise<void> => {
  reorderingOrderId.value = order.id
  
  try {
    // Validate items against current menu
    const validation = await validateOrderItems(order)
    
    if (validation.hasChanges) {
      // Show notification modal
      reorderNotification.value = {
        title: validation.unavailableItems.length > 0 ? t('orders.unavailable_items') : t('orders.price_changes'),
        message: validation.unavailableItems.length > 0
          ? t('orders.unavailable_items_desc')
          : t('orders.price_changes_desc'),
        priceChanges: validation.priceChanges,
        unavailableItems: validation.unavailableItems,
        orderId: order.id,
      }
      showReorderNotification.value = true
    } else {
      // No changes, add directly to cart
      await addOrderToCart(order)
      router.push('/checkout')
    }
  } catch (error) {
    console.error('Error reordering:', error)
    // alert('Failed to reorder. Please try again.')
  } finally {
    reorderingOrderId.value = null
  }
}

const validateOrderItems = async (order: Order) => {
  const priceChanges: Array<{ itemName: string; oldPrice: number; newPrice: number }> = []
  const unavailableItems: string[] = []
  
  for (const orderItem of order.items) {
    // Get current menu item
    const menuItemId = (orderItem as any).menuItemId || orderItem.productId
    const currentMenuItem = await menuStore.getMenuItemById(menuItemId)
    
    if (!currentMenuItem || !currentMenuItem.isActive) {
      unavailableItems.push(orderItem.menuItem?.name || orderItem.product?.name || 'Unknown')
      continue
    }
    
    // Check for price changes
    if (currentMenuItem.price !== orderItem.price) {
      priceChanges.push({
        itemName: currentMenuItem.name,
        oldPrice: orderItem.price,
        newPrice: currentMenuItem.price,
      })
    }
  }
  
  return {
    hasChanges: priceChanges.length > 0 || unavailableItems.length > 0,
    priceChanges,
    unavailableItems,
  }
}

const addOrderToCart = async (order: Order): Promise<void> => {
  for (const orderItem of order.items) {
    // Get current menu item to ensure we have latest data
    const menuItemId = (orderItem as any).menuItemId || orderItem.productId
    const currentMenuItem = await menuStore.getMenuItemById(menuItemId)
    
    if (currentMenuItem && currentMenuItem.isActive) {
      // Use current menu item with updated price
      cartStore.addItem(currentMenuItem, orderItem.quantity, (orderItem as any).customizations?.selectedModifiers || [])
    }
  }
}

const confirmReorder = async (): Promise<void> => {
  const orderId = reorderNotification.value.orderId
  const order = props.orders.find(o => o.id === orderId)
  
  if (order) {
    await addOrderToCart(order)
    closeReorderNotification()
    router.push('/checkout')
  }
}

const closeReorderNotification = (): void => {
  showReorderNotification.value = false
  reorderNotification.value = {
    title: '',
    message: '',
    priceChanges: [],
    unavailableItems: [],
    orderId: '',
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/transitions' as *;

.order-history {
  width: 100%;
}

.order-history__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-12;
  text-align: center;
}

.order-history__spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-neutral-300);
  border-top-color: var(--color-success);
  border-radius: $radius-full;
  animation: spin 1s linear infinite;
  margin-bottom: $space-6;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.order-history__loading-text {
  color: var(--text-secondary);
  font-size: $text-base;
}

.order-history__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-12;
  text-align: center;
}

.order-history__empty-icon {
  font-size: 4rem;
  margin-bottom: $space-6;
}

.order-history__empty-title {
  font-size: $text-2xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-4;
}

.order-history__empty-text {
  color: var(--text-secondary);
  font-size: $text-base;
  margin-bottom: $space-8;
  max-width: 400px;
}

.order-history__empty-button {
  display: inline-block;
  padding: $space-2 $space-6;
  background: var(--color-success);
  color: white;
  border-radius: $radius-md;
  text-decoration: none;
  font-weight: $font-medium;
  transition: background $transition-base;

  &:hover {
    background: var(--color-primary);
  }
}

.order-history__list {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.order-history__item {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
  padding: $space-6;
  transition: box-shadow $transition-base;

  &:hover {
    box-shadow: $shadow-md;
  }
}

.order-history__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $space-4;
  padding-bottom: $space-4;
  border-bottom: 1px solid var(--border-primary);
}

.order-history__header-left {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.order-history__order-number {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin: 0;
}

.order-history__date {
  font-size: $text-sm;
  color: var(--text-secondary);
}

.order-history__header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: $space-1;
}

.order-history__status {
  padding: $space-1 $space-2;
  border-radius: $radius-sm;
  font-size: $text-xs;
  font-weight: $font-medium;
  text-transform: uppercase;

  &--pending {
    background: rgba(255, 107, 53, 0.1);
    color: var(--color-warning);
  }

  &--confirmed {
    background: rgba(59, 130, 246, 0.1);
    color: var(--color-info);
  }

  &--preparing {
    background: rgba(255, 107, 53, 0.1);
    color: var(--color-warning);
  }

  &--ready {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-success);
  }

  &--out_for_delivery {
    background: rgba(59, 130, 246, 0.1);
    color: var(--color-info);
  }

  &--delivered {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-success);
  }

  &--cancelled {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
  }
}

.order-history__total {
  font-size: $text-xl;
  font-weight: $font-bold;
  color: var(--text-primary);
}

.order-history__items {
  margin-bottom: $space-4;
}

.order-history__item-row {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-1 0;
  font-size: $text-sm;
}

.order-history__item-quantity {
  color: var(--text-secondary);
  font-weight: $font-medium;
  min-width: 30px;
}

.order-history__item-name {
  flex: 1;
  color: var(--text-primary);
}

.order-history__item-price {
  color: var(--text-primary);
  font-weight: $font-medium;
}

.order-history__item-more {
  padding: $space-1 0;
  font-size: $text-sm;
  color: var(--text-secondary);
  font-style: italic;
}

.order-history__actions {
  display: flex;
  gap: $space-2;
  padding-top: $space-4;
  border-top: 1px solid var(--border-primary);
}

.order-history__action {
  flex: 1;
  padding: $space-2 $space-4;
  border-radius: $radius-md;
  font-size: $text-sm;
  font-weight: $font-medium;
  text-align: center;
  text-decoration: none;
  transition: all $transition-base;
  cursor: pointer;
  border: none;

  &--view {
    background: var(--bg-secondary);
    color: var(--text-primary);

    &:hover {
      background: var(--bg-tertiary);
    }
  }

  &--reorder {
    background: var(--color-success);
    color: white;

    &:hover:not(:disabled) {
      background: var(--color-primary);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.order-history__pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $space-2;
  margin-top: $space-8;
  padding-top: $space-8;
  border-top: 1px solid var(--border-primary);
}

.order-history__pagination-button {
  padding: $space-2 $space-4;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  font-size: $text-sm;
  font-weight: $font-medium;
  cursor: pointer;
  transition: all $transition-base;

  &:hover:not(:disabled) {
    background: var(--bg-tertiary);
    border-color: var(--border-secondary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.order-history__pagination-pages {
  display: flex;
  gap: $space-1;
}

.order-history__pagination-page {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  font-size: $text-sm;
  font-weight: $font-medium;
  cursor: pointer;
  transition: all $transition-base;

  &:hover:not(:disabled) {
    background: var(--bg-tertiary);
    border-color: var(--border-secondary);
  }

  &--active {
    background: var(--color-success);
    color: white;
    border-color: var(--color-success);

    &:hover {
      background: var(--color-primary);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.order-history__modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $space-6;
}

.order-history__modal {
  background: var(--bg-primary);
  border-radius: $radius-lg;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: $shadow-xl;
}

.order-history__modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-6;
  border-bottom: 1px solid var(--border-primary);
}

.order-history__modal-title {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin: 0;
}

.order-history__modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: $text-3xl;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color $transition-base;

  &:hover {
    color: var(--text-primary);
  }
}

.order-history__modal-body {
  padding: $space-6;
}

.order-history__modal-message {
  color: var(--text-primary);
  font-size: $text-base;
  margin-bottom: $space-6;
}

.order-history__modal-section {
  margin-bottom: $space-6;

  &:last-child {
    margin-bottom: 0;
  }
}

.order-history__modal-subtitle {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.order-history__modal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.order-history__modal-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-2;
  background: var(--bg-secondary);
  border-radius: $radius-sm;
  margin-bottom: $space-1;
  font-size: $text-sm;
  color: var(--text-primary);

  &:last-child {
    margin-bottom: 0;
  }

  &--unavailable {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
  }
}

.order-history__modal-price-change {
  font-weight: $font-medium;
  color: var(--color-warning);
}

.order-history__modal-footer {
  display: flex;
  gap: $space-2;
  padding: $space-6;
  border-top: 1px solid var(--border-primary);
}

.order-history__modal-button {
  flex: 1;
  padding: $space-2 $space-6;
  border-radius: $radius-md;
  font-size: $text-base;
  font-weight: $font-medium;
  cursor: pointer;
  transition: all $transition-base;
  border: none;

  &--secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);

    &:hover {
      background: var(--bg-tertiary);
    }
  }

  &--primary {
    background: var(--color-success);
    color: white;

    &:hover {
      background: var(--color-primary);
    }
  }
}

@media (max-width: 768px) {
  .order-history__header {
    flex-direction: column;
    gap: $space-2;
  }

  .order-history__header-right {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }

  .order-history__actions {
    flex-direction: column;
  }

  .order-history__pagination {
    flex-wrap: wrap;
  }
}
</style>

