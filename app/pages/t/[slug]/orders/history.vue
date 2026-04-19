<template>
  <div class="order-history-page">
    <!-- Header -->
    <div class="order-history-page__header">
      <h1 class="order-history-page__title">{{ t('orders.history') }}</h1>
      <p class="order-history-page__subtitle">
        {{ t('orders.history_subtitle') }}
      </p>
    </div>

    <!-- Filters -->
    <div class="order-history-page__filters">
      <div class="order-history-page__search">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('orders.search_orders')"
          class="order-history-page__search-input"
        />
      </div>
      
      <div class="order-history-page__filter-group">
        <select v-model="statusFilter" class="order-history-page__select">
          <option value="">{{ t('orders.all_statuses') }}</option>
          <option value="PENDING">{{ t('orders.pending') }}</option>
          <option value="CONFIRMED">{{ t('orders.confirmed') }}</option>
          <option value="PREPARING">{{ t('orders.preparing') }}</option>
          <option value="READY">{{ t('orders.ready') }}</option>
          <option value="OUT_FOR_DELIVERY">{{ t('orders.inTransit') }}</option>
          <option value="DELIVERED">{{ t('orders.delivered') }}</option>
          <option value="CANCELLED">{{ t('orders.cancelled') }}</option>
        </select>

        <select v-model="timeFilter" class="order-history-page__select">
          <option value="">{{ t('orders.all_time') }}</option>
          <option value="today">{{ t('date.today') }}</option>
          <option value="week">{{ t('orders.filters.week') }}</option>
          <option value="month">{{ t('orders.filters.month') }}</option>
          <option value="year">{{ t('orders.filters.year') }}</option>
        </select>

        <button
          v-if="hasActiveFilters"
          class="order-history-page__clear-filters"
          @click="clearFilters"
        >
          {{ t('orders.clear_filters') }}
        </button>
      </div>
    </div>

    <!-- Order History Component -->
    <OrderHistory
      :orders="filteredOrders"
      :loading="loading"
      :current-page="currentPage"
      :total-pages="totalPages"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import type { Order, OrderStatus } from '~/types'
import { useOrderStore } from '~/stores/order'
import { useUserStore } from '~/stores/user'
import OrderHistory from '~/components/order/OrderHistory.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Page metadata
definePageMeta({
  middleware: 'auth',
})

// Stores
const orderStore = useOrderStore()
const authStore = useUserStore()
const router = useRouter()
const route = useRoute()
const { isTelegram } = useTelegram()

// State
const searchQuery = ref('')
const statusFilter = ref<OrderStatus | ''>('')
const timeFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Computed
const loading = computed(() => orderStore.loading)

const orders = computed(() => orderStore.orderHistory)

const filteredOrders = computed(() => {
  let filtered = [...orders.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(order =>
      order.id.toLowerCase().includes(query) ||
      order.customerInfo?.name?.toLowerCase().includes(query) ||
      order.items.some(item => (item.menuItem?.name || item.product?.name || '').toLowerCase().includes(query))
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }

  // Time filter
  if (timeFilter.value) {
    const now = new Date()
    let dateFrom: Date

    switch (timeFilter.value) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1)
        break
      default:
        dateFrom = new Date(0)
    }

    filtered = filtered.filter(order => new Date(order.createdAt) >= dateFrom)
  }

  // Pagination
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  let filtered = [...orders.value]

  // Apply same filters for total count
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(order =>
      order.id.toLowerCase().includes(query) ||
      order.customerInfo?.name?.toLowerCase().includes(query) ||
      order.items.some(item => (item.menuItem?.name || item.product?.name || '').toLowerCase().includes(query))
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }

  if (timeFilter.value) {
    const now = new Date()
    let dateFrom: Date

    switch (timeFilter.value) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1)
        break
      default:
        dateFrom = new Date(0)
    }

    filtered = filtered.filter(order => new Date(order.createdAt) >= dateFrom)
  }

  return Math.ceil(filtered.length / itemsPerPage)
})

const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' || statusFilter.value !== '' || timeFilter.value !== ''
})

// Methods
const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  timeFilter.value = ''
  currentPage.value = 1
}

const fetchHistory = async () => {
  if (authStore.isAuthenticated) {
    await orderStore.fetchOrderHistory(1, 100) // Fetch more for client-side pagination
  }
}

// Lifecycle
onMounted(async () => {
  // Check authentication
  if (!authStore.isAuthenticated) {
    if (isTelegram.value) {
      // In TG, we expect auto-auth to happen. Just wait.
      return
    }
    router.push(`/auth/login?redirect=${route.fullPath}`)
    return
  }

  // Fetch order history
  await fetchHistory()
})

// Watch for authentication status (especially for Telegram auto-login)
watch(() => authStore.isAuthenticated, async (newVal) => {
  if (newVal) {
    await fetchHistory()
  }
})

// Watch filters to reset page
watch([searchQuery, statusFilter, timeFilter], () => {
  currentPage.value = 1
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/abstracts/variables' as *;

.order-history-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: $space-8 $space-6;
}

.order-history-page__header {
  margin-bottom: $space-8;
}

.order-history-page__title {
  font-size: $text-2xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.order-history-page__subtitle {
  font-size: $text-base;
  color: var(--text-secondary);
}

.order-history-page__filters {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  margin-bottom: $space-8;
  padding: $space-6;
  background: var(--bg-secondary);
  border-radius: $radius-lg;
}

.order-history-page__search {
  flex: 1;
}

.order-history-page__search-input {
  width: 100%;
  padding: $space-2 $space-4;
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  font-size: $text-base;
  transition: border-color $transition-base;

  &:focus {
    outline: none;
    border-color: var(--color-success);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
}

.order-history-page__filter-group {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

.order-history-page__select {
  padding: $space-2 $space-4;
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  font-size: $text-sm;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color $transition-base;

  &:focus {
    outline: none;
    border-color: var(--color-success);
  }
}

.order-history-page__clear-filters {
  padding: $space-2 $space-4;
  background: var(--color-error);
  color: white;
  border: none;
  border-radius: $radius-md;
  font-size: $text-sm;
  font-weight: $font-medium;
  cursor: pointer;
  transition: background $transition-base;

  &:hover {
    background: var(--color-error);
  }
}

@media (min-width: 768px) {
  .order-history-page__filters {
    flex-direction: row;
    align-items: center;
  }

  .order-history-page__filter-group {
    flex-wrap: nowrap;
  }
}
</style>
