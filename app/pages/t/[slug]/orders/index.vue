
<template>
  <div class="orders-page">
    <!-- Not Authenticated State -->
    <div v-if="!isAuthenticated" class="orders-page__auth-prompt">
      <BaseIcon name="lock" size="xl" class="orders-page__auth-icon" />
      <AppHeading level="h2" align="center" size="heading-lg" class="orders-page__auth-title">
        {{ $t('auth.loginRequired') }}
      </AppHeading>
      <AppText class="orders-page__auth-subtitle"  align="center">
        {{ $t('orders.emptyHistory') }}
      </AppText>
      <div class="orders-page__auth-actions">
        <NuxtLink :to="`/auth/login?redirect=${tPath('/orders')}`">
          <BaseButton variant="primary">{{ $t('auth.login.submit') }}</BaseButton>
        </NuxtLink>
        <NuxtLink :to="`/auth/register?redirect=${tPath('/orders')}`">
          <BaseButton variant="secondary">{{ $t('auth.register.submit') }}</BaseButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Authenticated content -->
    <template v-else>
      <!-- Header Section -->
      <div class="orders-page__header">
        <h1 class="orders-page__title">{{ $t('orders.history') }}</h1>
      </div>

      <!-- Filter and Search -->
      <div class="orders-page__filters">
        <div class="orders-page__search-row">
          <div class="orders-page__search">
            <BaseInput
              v-model="searchQuery"
              :placeholder="$t('orders.searchPlaceholder')"
            >
              <template #prefix>
                <BaseIcon name="search" size="sm" />
              </template>
            </BaseInput>
          </div>

          <div class="orders-page__filter-controls">
            <BaseSelect
              v-model="statusFilter"
              :options="statusOptions"
            />
            <BaseSelect
              v-model="timeFilter"
              :options="timeOptions"
            />
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="orders-page__stats">
          <BaseCard class="orders-page__stat-card">
            <div class="orders-page__stat-value">{{ totalOrders }}</div>
            <div class="orders-page__stat-label">{{ $t('orders.stats.totalOrders') }}</div>
          </BaseCard>
          <BaseCard class="orders-page__stat-card">
            <div class="orders-page__stat-value">{{ formatCurrency(totalSpent) }}</div>
            <div class="orders-page__stat-label">{{ $t('orders.stats.totalSpent') }}</div>
          </BaseCard>
          <BaseCard class="orders-page__stat-card">
            <div class="orders-page__stat-value">{{ favoriteItem }}</div>
            <div class="orders-page__stat-label">{{ $t('orders.stats.favorite') }}</div>
          </BaseCard>
          <BaseCard class="orders-page__stat-card">
            <div class="orders-page__stat-value">{{ formatCurrency(averageOrderValue) }}</div>
            <div class="orders-page__stat-label">{{ $t('orders.stats.avgOrder') }}</div>
          </BaseCard>
        </div>
      </div>

      <!-- Active Orders -->
      <div v-if="activeOrders.length > 0" class="orders-page__section">
        <AppHeading level="h2" size="heading-xl" class="orders-page__section-title">
          {{ $t('orders.activeOrders') }}
        </AppHeading>

        <div class="orders-page__items">
          <BaseCard
            v-for="order in activeOrders"
            :key="order.id"
            class="orders-page__order-card orders-page__order-card--active"
          >
            <div class="orders-page__order-header">
              <div class="orders-page__order-id">
                #{{ order.id.slice(-6).toUpperCase() }}
              </div>
              <StatusBadge :status="order.status" size="sm" />
            </div>

            <div class="orders-page__order-main">
              <div class="orders-page__order-price-info">
                <AppPrice :price="order.total" size="lg" color="orange" weight="bold" />
                <AppText size="body-xs" class="orders-page__order-date">
                  {{ formatDate(order.createdAt) }}
                </AppText>
              </div>

              <!-- Progress Tracker -->
              <div class="orders-page__order-progress">
                <div 
                  v-for="step in 4" 
                  :key="step" 
                  class="progress-dot"
                  :class="{ 
                    'progress-dot--active': getOrderStep(order.status) >= step,
                    'progress-dot--current': getOrderStep(order.status) === step 
                  }"
                />
              </div>
            </div>

            <div class="orders-page__order-items-minimal">
              <div v-if="(order.items || []).length > 0" class="order-items-row">
                <div 
                  v-for="item in (order.items || []).slice(0, 4)" 
                  :key="item.id" 
                  class="order-item-chip"
                >
                  <AppText size="caption" weight="bold">{{ item.quantity }}×</AppText>
                  {{ item.product?.name || item.name || item.title || $t('common.error') }}
                </div>
                <div v-if="(order.items || []).length > 4" class="order-items-more">
                  +{{ (order.items || []).length - 4 }}
                </div>
              </div>
              <AppText v-else size="body-xs" color="muted">
                {{ $t('orders.loading') }}
              </AppText>
            </div>

            <div class="orders-page__order-footer">
              <NuxtLink :to="tPath(`/orders/${order.id}`)" class="flex-1">
                <BaseButton variant="primary" size="md" class="w-full">
                  <BaseIcon name="eye" size="sm" />
                  {{ $t('orders.view') }}
                </BaseButton>
              </NuxtLink>
              <BaseButton
                v-if="['PENDING', 'CONFIRMED'].includes(order.status)"
                variant="secondary"
                size="md"
                class="orders-page__action-cancel"
                @click.stop.prevent="cancelOrder(order.id)"
              >
                {{ $t('common.cancel') }}
              </BaseButton>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- Order History -->
      <div class="orders-page__section">
        <div class="orders-page__section-header">
          <AppHeading level="h2" size="heading-xl" class="orders-page__section-title">
            {{ $t('orders.history') }}
          </AppHeading>
          <div class="orders-page__section-actions">
            <BaseButton variant="ghost" size="sm" @click="showListView = !showListView">
              <BaseIcon :name="showListView ? 'grid' : 'list'" size="sm" />
            </BaseButton>
            <BaseButton variant="secondary" size="sm" @click="exportOrders">
              <BaseIcon name="download" size="sm" class="mr-2" />
              {{ $t('orders.export') }}
            </BaseButton>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="orderStore.loading" class="orders-page__loading">
          <div class="orders-page__spinner"/>
          <AppText>{{ $t('orders.loading') }}</AppText>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredOrders.length === 0" class="orders-page__empty">
          <div class="orders-page__empty-content">
            <BaseIcon name="receipt" size="4xl" class="orders-page__empty-icon" />
            <AppHeading level="h3" size="heading-lg" class="orders-page__empty-title">
              {{ searchQuery || statusFilter || timeFilter ? $t('orders.noResults') : $t('orders.noOrders') }}
            </AppHeading>
            <AppText class="orders-page__empty-text">
              {{ searchQuery || statusFilter || timeFilter ? $t('orders.noResultsFilter') : $t('orders.emptyHistory') }}
            </AppText>
            <NuxtLink v-if="!searchQuery && !statusFilter && !timeFilter" :to="tPath('/menu')">
              <BaseButton variant="primary" class="orders-page__empty-btn">{{ $t('menu.title') }}</BaseButton>
            </NuxtLink>
            <BaseButton v-else variant="secondary" @click="clearFilters">{{ $t('common.clear') }}</BaseButton>
          </div>
        </div>

        <!-- Orders List/Grid -->
        <div v-else>
          <div :class="['orders-page__items', showListView ? 'orders-page__items--list' : 'orders-page__items--grid']">
            <BaseCard
              v-for="order in filteredOrders"
              :key="order.id"
              class="orders-page__order-card"
              @click="showListView ? null : $router.push(tPath(`/orders/${order.id}`))"
            >
              <div class="orders-page__order-header">
                <div class="orders-page__order-info">
                  <div class="orders-page__order-id">
                    #{{ order.orderNumber || order.id.slice(-6).toUpperCase() }}
                  </div>
                  <StatusBadge :status="order.status" size="sm" />
                  <AppText size="body-sm" class="orders-page__order-date">
                    {{ formatDate(order.createdAt) }}
                  </AppText>
                </div>
                <AppPrice :price="order.total" size="md" />
              </div>

              <div class="orders-page__order-items">
                <span v-for="item in (order.items || []).slice(0, showListView ? 4 : 2)" :key="item.id" class="orders-page__item-tag">
                  {{ item.quantity }}× {{ item.product?.name || item.name || item.title || $t('common.error') }}
                </span>
                <span v-if="(order.items || []).length > (showListView ? 4 : 2)" class="orders-page__item-more">
                  +{{ (order.items || []).length - (showListView ? 4 : 2) }}
                </span>
              </div>

              <div v-if="showListView" class="orders-page__order-actions">
                <NuxtLink :to="tPath(`/orders/${order.id}`)">
                  <BaseButton variant="secondary" size="sm">{{ $t('orders.view') }}</BaseButton>
                </NuxtLink>
                <BaseButton variant="ghost" size="sm" @click="reorderItems(order)">
                  <BaseIcon name="repeat" size="sm" class="mr-2" />
                  {{ $t('orders.reorder') }}
                </BaseButton>
              </div>
            </BaseCard>
          </div>

          <!-- Load More -->
          <div v-if="hasMoreOrders" class="orders-page__load-more">
            <BaseButton variant="secondary" :disabled="loadingMore" @click="loadMoreOrders">
              <BaseIcon v-if="loadingMore" name="loader" size="sm" class="mr-2 animate-spin" />
              {{ $t('orders.loadMore') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useOrders } from '~/composables/useOrders'
import { useOrderStore } from '~/stores/order'
import { useCartStore } from '~/stores/cart'
import { useUserStore } from '~/stores/user'
import { useTenantSettings, useTenant } from '~/composables/useTenant'
import type { Order } from '~/types'
import AppText from '~/components/base/AppText.vue'
import AppHeading from '~/components/base/AppHeading.vue'
import StatusBadge from '~/components/order/StatusBadge.vue'
import AppPrice from '~/components/base/AppPrice.vue'

const { t, locale } = useI18n()
const router = useRouter()
const orderStore = useOrderStore()
const cartStore = useCartStore()
const userStore = useUserStore()
const { formatCurrency } = useTenantSettings()
const { tPath } = useTenant()

// Auth check
const isAuthenticated = computed(() => userStore.isAuthenticated)

// Composables
const { orderHistory, getOrderStats } = useOrders()

// Reactive state
const searchQuery = ref('')
const statusFilter = ref('')
const timeFilter = ref('')
const showListView = ref(true)
const loadingMore = ref(false)
const hasMoreOrders = computed(() => {
  const p = orderStore.pagination
  if (!p) return false
  return p.page < p.totalPages
})

// Select Options
const statusOptions = computed(() => [
  { value: '', label: t('orders.allOrders') },
  { value: 'PENDING', label: t('orders.pending') },
  { value: 'CONFIRMED', label: t('orders.confirmed') },
  { value: 'PREPARING', label: t('orders.preparing') },
  { value: 'READY', label: t('orders.ready') },
  { value: 'DELIVERED', label: t('orders.delivered') },
  { value: 'CANCELLED', label: t('orders.cancelled') }
])

const timeOptions = computed(() => [
  { value: '', label: t('orders.filters.allTime') },
  { value: 'today', label: t('orders.filters.today') },
  { value: 'week', label: t('orders.filters.week') },
  { value: 'month', label: t('orders.filters.month') },
  { value: 'year', label: t('orders.filters.year') }
])

// Computed
const orderStats = computed(() => getOrderStats())
const totalOrders = computed(() => orderStats.value.total)
const totalSpent = computed(() => orderStats.value.totalSpent)
const favoriteItem = computed(() => orderStats.value.favoriteItems[0]?.name || '—')
const averageOrderValue = computed(() => orderStats.value.averageOrderValue)

const activeOrders = computed(() => {
  return orderHistory.value.filter(order =>
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
  )
})

const filteredOrders = computed(() => {
  let filtered = orderHistory.value.filter(order =>
    !['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
  )

  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }

  if (timeFilter.value) {
    const now = new Date()
    let fromDate: Date
    switch (timeFilter.value) {
      case 'today':
        fromDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'week':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        fromDate = new Date(now.getFullYear(), 0, 1)
        break
    }
    filtered = filtered.filter(order => new Date(order.createdAt) >= fromDate!)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(order =>
      order.id.toLowerCase().includes(q) ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(q)) ||
      (order.items || []).some(item => item.menuItem.name.toLowerCase().includes(q))
    )
  }

  return filtered
})

// Methods
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale.value, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  timeFilter.value = ''
}

const cancelOrder = async (orderId: string) => {
  if (confirm(t('orders.confirmCancel'))) {
    await orderStore.cancelOrder(orderId)
  }
}

const trackOrder = (orderId: string) => {
  router.push(tPath(`/orders/${orderId}?tab=tracking`))
}

const reorderItems = (order: Order) => {
  (order.items || []).forEach(item => {
    // Reconstruct minimal MenuItem from backend summary
    const menuItem: any = {
      id: (item as any).menuItemId || item.id,
      productId: (item as any).productId,
      name: item.product?.name || item.name || '',
      price: item.price,
      imageUrl: item.product?.imageUrl,
      isActive: true
    }
    cartStore.addItem(menuItem, item.quantity)
  })
  router.push(tPath('/checkout'))
}

const exportOrders = () => {
  console.log('Exporting...')
}

const getOrderStep = (status: string): number => {
  const steps: Record<string, number> = {
    'PENDING': 1,
    'CONFIRMED': 2,
    'PREPARING': 3,
    'READY': 3,
    'OUT_FOR_DELIVERY': 4,
    'DELIVERED': 4
  }
  return steps[status] || 1
}

const loadMoreOrders = async () => {
  if (loadingMore.value || !orderStore.pagination) return
  const nextPage = orderStore.pagination.page + 1
  loadingMore.value = true
  try {
    await orderStore.fetchOrderHistory(nextPage)
  } finally {
    loadingMore.value = false
  }
}

onMounted(() => {
  orderStore.fetchOrderHistory(1)
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/radius' as *;
@use '~/assets/scss/tokens/shadows' as *;
@use '~/assets/scss/tokens/typography' as *;
@use '~/assets/scss/tokens/transitions' as *;

.orders-page {
  max-width: 900px;
  margin: 0 auto;
  padding: $space-6 $space-4;
}

.orders-page__header {
  margin-bottom: $space-12;
  text-align: left;
}

.orders-page__title {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: $space-3;
  letter-spacing: -0.025em;
}

.orders-page__subtitle {
  color: var(--text-secondary);
  font-size: 1.125rem;
  max-width: 600px;
}

.orders-page__filters {
  margin-bottom: $space-12;
}

.orders-page__search-row {
  display: flex;
  gap: $space-4;
  margin-bottom: $space-8;
  flex-wrap: wrap;
}

.orders-page__search {
  flex: 1;
  min-width: 250px;
}

.orders-page__filter-controls {
  display: flex;
  gap: $space-2;
}

.orders-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: $space-3;
}

.orders-page__stat-card {
  padding: $space-4;
  text-align: left;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: $radius-xl;
  box-shadow: var(--shadow-sm);
  transition: all $transition-base;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 80px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
    background: var(--bg-tertiary);
  }
}

.orders-page__stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.orders-page__stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.orders-page__section {
  margin-bottom: $space-16;
}

.orders-page__section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-8;
}

.orders-page__section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01e;
}

.orders-page__section-actions {
  display: flex;
  gap: $space-2;
}

.orders-page__items {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.orders-page__items--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.orders-page__order-card {
  padding: $space-6;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  border-radius: $radius-xl;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
    box-shadow: $shadow-sm;
  }
}

.orders-page__order-card--active {
  border-left: 2px solid var(--color-primary);
  background: var(--bg-card-active, var(--bg-card));
}
.orders-page__order-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-6;
}

.orders-page__order-price-info {
  display: flex;
  flex-direction: column;
}

.orders-page__order-progress {
  display: flex;
  gap: $space-2;
  align-items: center;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  transition: all $transition-base;

  &--active {
    background: var(--color-primary);
    box-shadow: 0 0 8px rgba(var(--color-primary-rgb), 0.4);
  }

  &--current {
    transform: scale(1.3);
    border: 2px solid var(--bg-primary);
  }
}

.orders-page__order-items-minimal {
  margin-bottom: $space-6;
}

.order-items-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.order-item-chip {
  padding: $space-1 $space-3;
  background: var(--bg-secondary);
  border-radius: $radius-lg;
  font-size: 0.75rem;
  font-weight: $font-medium;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: $space-1;
}

.order-items-more {
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
}

.orders-page__order-footer {
  display: flex;
  gap: $space-3;
  margin-top: auto;
}

.orders-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-16;
  gap: $space-4;
}

.orders-page__spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 4px solid var(--bg-secondary);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.orders-page__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  padding: $space-12 $space-4;
  text-align: center;
}

.orders-page__empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
}

.orders-page__empty-icon {
  color: var(--color-primary);
  margin-bottom: $space-6;
  opacity: 0.15;
}

.orders-page__empty-btn {
  margin-top: $space-6;
}

.orders-page__empty-title {
  margin-bottom: $space-4;
  color: var(--text-primary);
}

.orders-page__empty-text {
  color: var(--text-tertiary);
  margin-bottom: $space-10;
  max-width: 420px;
  margin-inline: auto;
  line-height: $leading-relaxed;
  display: block;
}

.orders-page__load-more {
  margin-top: $space-12;
  text-align: center;
}

.orders-page__auth-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.orders-page__auth-icon {
  color: var(--text-muted);
  margin-bottom: $space-8;
  opacity: 0.4;
}

.orders-page__auth-title { margin-bottom: $space-3; font-weight: 700; }
.orders-page__auth-subtitle { margin-bottom: $space-10; color: var(--text-secondary); max-width: 320px; }
.orders-page__auth-actions { display: flex; gap: $space-4; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .orders-page { padding: $space-4; }
  .orders-page__title { font-size: 1.75rem; margin-bottom: $space-2; }
  .orders-page__header { margin-bottom: $space-6; }
  .orders-page__filters { margin-bottom: $space-6; }
  .orders-page__search-row { flex-direction: column; gap: $space-2; margin-bottom: $space-4; }
  .orders-page__filter-controls { width: 100%; }
  .orders-page__filter-controls > * { flex: 1; }
  .orders-page__order-status-row { flex-direction: column; align-items: flex-start; gap: $space-3; }
}
</style>

