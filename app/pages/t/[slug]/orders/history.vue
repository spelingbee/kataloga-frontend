<template>
  <div class="order-history-page">
    <!-- Header -->
    <div class="order-history-page__header">
      <h1 class="order-history-page__title">Order History</h1>
      <p class="order-history-page__subtitle">
        Track your orders and reorder your favorites
      </p>
    </div>

    <!-- Filters -->
    <div class="order-history-page__filters">
      <div class="order-history-page__search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search orders..."
          class="order-history-page__search-input"
        />
      </div>
      
      <div class="order-history-page__filter-group">
        <select v-model="statusFilter" class="order-history-page__select">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PREPARING">Preparing</option>
          <option value="READY">Ready</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select v-model="timeFilter" class="order-history-page__select">
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        <button
          v-if="hasActiveFilters"
          class="order-history-page__clear-filters"
          @click="clearFilters"
        >
          Clear Filters
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

// Page metadata
definePageMeta({
  middleware: 'auth',
  title: 'Order History',
})

// Stores
const orderStore = useOrderStore()
const authStore = useUserStore()
const router = useRouter()

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
      order.items.some(item => item.menuItem.name.toLowerCase().includes(query))
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
      order.items.some(item => item.menuItem.name.toLowerCase().includes(query))
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

// Lifecycle
onMounted(async () => {
  // Check authentication
  if (!authStore.isAuthenticated) {
    router.push('/login?redirect=/orders/history')
    return
  }

  // Fetch order history
  await orderStore.fetchOrderHistory(1, 100) // Fetch more for client-side pagination
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
