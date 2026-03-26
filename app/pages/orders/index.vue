<template>
  <div class="orders-page">
    <!-- Header Section -->
    <div class="orders-page__header">
      <h1 class="orders-page__title">Order History</h1>
      <p class="orders-page__subtitle">
        Track your orders and reorder your favorites
      </p>
    </div>

    <!-- Filter and Search -->
    <div class="orders-page__filters">
      <div class="orders-page__search-row">
        <!-- Search -->
        <div class="orders-page__search">
          <BaseInput
            v-model="searchQuery"
            placeholder="Search orders..."
          >
            <template #prefix>
              <BaseIcon name="search" size="sm" />
            </template>
          </BaseInput>
        </div>

        <!-- Filters -->
        <div class="orders-page__filter-controls">
          <BaseSelect 
            v-model="statusFilter"
            :options="[
              { value: '', label: 'All Orders' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'PREPARING', label: 'Preparing' },
              { value: 'READY', label: 'Ready' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'CANCELLED', label: 'Cancelled' }
            ]"
          />
          
          <BaseSelect 
            v-model="timeFilter"
            :options="[
              { value: '', label: 'All Time' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'year', label: 'This Year' }
            ]"
          />
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="orders-page__stats">
        <BaseCard class="orders-page__stat-card">
          <div class="orders-page__stat-value">{{ totalOrders }}</div>
          <div class="orders-page__stat-label">Total Orders</div>
        </BaseCard>
        <BaseCard class="orders-page__stat-card">
          <div class="orders-page__stat-value">{{ formatPrice(totalSpent) }}</div>
          <div class="orders-page__stat-label">Total Spent</div>
        </BaseCard>
        <BaseCard class="orders-page__stat-card">
          <div class="orders-page__stat-value">{{ favoriteRestaurant }}</div>
          <div class="orders-page__stat-label">Favorite</div>
        </BaseCard>
        <BaseCard class="orders-page__stat-card">
          <div class="orders-page__stat-value">{{ formattedAverageOrderValue }}</div>
          <div class="orders-page__stat-label">Avg. Order</div>
        </BaseCard>
      </div>
    </div>

    <!-- Active Orders -->
    <div v-if="activeOrders.length > 0" class="px-6 mb-8">
      <AppHeading level="h2" size="heading-xl" class="text-white mb-6">
        Active Orders
      </AppHeading>
      
      <div class="space-y-4">
        <div
          v-for="order in activeOrders"
          :key="order.id"
          class="bg-background-card rounded-xl p-6 border border-primary-green/30"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <AppHeading level="h3" size="heading-md" class="text-white">
                  Order #{{ order.id }}
                </AppHeading>
                <StatusBadge :status="order.status" />
              </div>
              <AppText size="body-sm" class="text-neutral-20">
                {{ formatDate(order.createdAt) }}
              </AppText>
            </div>
            <AppPrice :price="order.total" size="lg" />
          </div>

          <!-- Order Progress -->
          <div class="mb-4">
            <OrderTracker :order="order" :compact="true" />
          </div>

          <!-- Order Items Preview -->
          <div class="mb-4">
            <AppText size="body-sm" class="text-neutral-20 mb-2">Items:</AppText>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="item in order.items.slice(0, 3)"
                :key="item.id"
                class="text-white text-sm"
              >
                {{ item.quantity }}× {{ item.menuItem.name }}
              </span>
              <span v-if="order.items.length > 3" class="text-neutral-20 text-sm">
                +{{ order.items.length - 3 }} more
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <NuxtLink :to="`/orders/${order.id}`">
              <BaseButton variant="primary" size="sm">
                <BaseIcon name="eye" size="sm" class="mr-2" />
                View Details
              </BaseButton>
            </NuxtLink>
            <BaseButton 
              v-if="order.status === 'PENDING'"
              variant="secondary" 
              size="sm"
              @click="cancelOrder(order.id)"
            >
              <BaseIcon name="x" size="sm" class="mr-2" />
              Cancel
            </BaseButton>
            <BaseButton 
              variant="ghost" 
              size="sm"
              @click="trackOrder(order.id)"
            >
              <BaseIcon name="map" size="sm" class="mr-2" />
              Track
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Order History -->
    <div class="px-6">
      <div class="flex items-center justify-between mb-6">
        <AppHeading level="h2" size="heading-xl" class="text-white">
          Order History
        </AppHeading>
        <div class="flex items-center gap-2">
          <BaseButton 
            variant="ghost" 
            size="sm"
            @click="showListView = !showListView"
          >
            <BaseIcon :name="showListView ? 'grid' : 'list'" size="sm" />
          </BaseButton>
          <BaseButton 
            variant="secondary" 
            size="sm"
            @click="exportOrders"
          >
            <BaseIcon name="download" size="sm" class="mr-2" />
            Export
          </BaseButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="orderStore.loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"/>
        <AppText class="text-neutral-20">Loading orders...</AppText>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredOrders.length === 0" class="text-center py-16">
        <BaseIcon name="receipt" size="4xl" class="text-neutral-80 mx-auto mb-6" />
        <AppHeading level="h3" size="heading-lg" class="text-white mb-4">
          {{ searchQuery || statusFilter || timeFilter ? 'No orders found' : 'No orders yet' }}
        </AppHeading>
        <AppText class="text-neutral-20 mb-8 max-w-md mx-auto">
          {{ searchQuery || statusFilter || timeFilter ? 
            'Try adjusting your search or filters to find orders.' : 
            'Start exploring our menu and place your first order!' 
          }}
        </AppText>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/menu">
            <BaseButton variant="primary">
              <BaseIcon name="utensils" size="sm" class="mr-2" />
              Browse Menu
            </BaseButton>
          </NuxtLink>
          <BaseButton 
            v-if="searchQuery || statusFilter || timeFilter"
            variant="secondary"
            @click="clearFilters"
          >
            Clear Filters
          </BaseButton>
        </div>
      </div>

      <!-- Orders List/Grid -->
      <div v-else>
        <!-- List View -->
        <div v-if="showListView" class="space-y-4">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="bg-background-card rounded-xl p-6 hover:bg-background-card/80 transition-colors"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="flex items-center gap-3 mb-2">
                  <AppHeading level="h4" size="heading-sm" class="text-white">
                    Order #{{ order.id }}
                  </AppHeading>
                  <StatusBadge :status="order.status" size="sm" />
                </div>
                <AppText size="body-sm" class="text-neutral-20">
                  {{ formatDate(order.createdAt) }}
                </AppText>
              </div>
              <AppPrice :price="order.total" size="md" />
            </div>

            <!-- Order Items -->
            <div class="mb-4">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="item in order.items.slice(0, 4)"
                  :key="item.id"
                  class="text-white text-sm bg-neutral-80/20 px-2 py-1 rounded"
                >
                  {{ item.quantity }}× {{ item.menuItem.name }}
                </span>
                <span v-if="order.items.length > 4" class="text-neutral-20 text-sm px-2 py-1">
                  +{{ order.items.length - 4 }} more
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <NuxtLink :to="`/orders/${order.id}`">
                <BaseButton variant="secondary" size="sm">
                  <BaseIcon name="eye" size="sm" class="mr-2" />
                  View
                </BaseButton>
              </NuxtLink>
              <BaseButton 
                variant="ghost" 
                size="sm"
                @click="reorderItems(order)"
              >
                <BaseIcon name="repeat" size="sm" class="mr-2" />
                Reorder
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                size="sm"
                @click="shareOrder(order)"
              >
                <BaseIcon name="share" size="sm" />
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Grid View -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="bg-background-card rounded-xl p-6 hover:bg-background-card/80 transition-colors cursor-pointer"
            @click="router.push(`/orders/${order.id}`)"
          >
            <div class="flex items-center justify-between mb-4">
              <StatusBadge :status="order.status" />
              <AppText size="caption" class="text-neutral-20">
                #{{ order.id }}
              </AppText>
            </div>

            <AppPrice :price="order.total" size="lg" class="mb-2" />
            <AppText size="body-sm" class="text-neutral-20 mb-4">
              {{ formatDate(order.createdAt) }}
            </AppText>

            <AppText size="body-sm" class="text-white mb-4">
              {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}
            </AppText>

            <div class="flex gap-2">
              <BaseButton 
                variant="secondary" 
                size="sm"
                class="flex-1"
                @click.stop="reorderItems(order)"
              >
                <BaseIcon name="repeat" size="sm" class="mr-2" />
                Reorder
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMoreOrders" class="text-center mt-8">
          <BaseButton 
            variant="secondary"
            :disabled="loadingMore"
            @click="loadMoreOrders"
          >
            <BaseIcon 
              v-if="loadingMore"
              name="loader" 
              size="sm" 
              class="mr-2 animate-spin" 
            />
            Load More Orders
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrderUI, OrderItemUI } from '~/types'
import { useOrders } from '~/composables/useOrders'
import { useCart } from '~/composables/useCart'
import { useOrderStore } from '~/stores/order'
import { useCartStore } from '~/stores/cart'
import { usePriceFormatter } from '~/composables/usePriceFormatter'

// Page setup
definePageMeta({
  title: 'Order History - Menu Ordering App',
  middleware: ['auth']
})

// Stores
const orderStore = useOrderStore()
const cartStore = useCartStore()

// Composables
const { formatPrice } = usePriceFormatter()
const { 
  orderHistory, 
  loading, 
  error,
  fetchOrderHistory,
  getOrderStats,
  filterOrders,
  reorderItems: reorderOrderItems,
  validateOrderForReorder
} = useOrders()

const { addItem } = useCart()
const router = useRouter()

// Reactive state
const searchQuery = ref('')
const statusFilter = ref('')
const timeFilter = ref('')
const showListView = ref(true)
const loadingMore = ref(false)
const hasMoreOrders = ref(true)

// Computed
const orders = computed<OrderUI[]>(() => {
  return orderHistory.value.map(order => ({
    ...order,
    items: order.items.slice() as OrderItemUI[],
    trackingInfo: order.trackingInfo ? {
      ...order.trackingInfo,
      updates: order.trackingInfo.updates.slice() as any[]
    } : undefined
  }))
})

const orderStats = computed(() => getOrderStats())

const totalOrders = computed(() => orderStats.value.total)
const totalSpent = computed(() => orderStats.value.totalSpent)
const favoriteRestaurant = computed(() => orderStats.value.favoriteItems[0]?.name || 'N/A')
const formattedAverageOrderValue = computed(() => formatPrice(orderStats.value.averageOrderValue))

const activeOrders = computed(() => {
  return orders.value.filter(order => 
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
  )
})

const filteredOrders = computed(() => {
  let filtered = orders.value.filter(order => 
    !['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
  )

  // Use the composable's filter method
  const filters: any = {}
  
  if (statusFilter.value) {
    filters.status = [statusFilter.value]
  }
  
  if (timeFilter.value) {
    const now = new Date()
    switch (timeFilter.value) {
      case 'today':
        filters.dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        filters.dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        break
      case 'week':
        filters.dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        filters.dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        filters.dateFrom = new Date(now.getFullYear(), 0, 1)
        break
    }
  }
  
  if (searchQuery.value) {
    filtered = filtered.filter(order => 
      order.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      order.customerInfo?.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered
})

// Methods
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  timeFilter.value = ''
}

const cancelOrder = async (orderId: string) => {
  if (confirm('Are you sure you want to cancel this order?')) {
    try {
      await orderStore.cancelOrder(orderId)
    } catch (error) {
      console.error('Failed to cancel order:', error)
    }
  }
}

const trackOrder = (orderId: string) => {
  router.push(`/orders/${orderId}?tab=tracking`)
}

const reorderItems = (order: OrderUI) => {
  // Add all items from the order to cart
  const orderCopy = JSON.parse(JSON.stringify(order))
  orderCopy.items.forEach((item: any) => {
    cartStore.addItem(item.menuItem, item.quantity)
  })
  
  router.push('/cart')
}

const shareOrder = (order: OrderUI) => {
  const orderCopy = JSON.parse(JSON.stringify(order))
  if (navigator.share) {
    navigator.share({
      title: `Order #${orderCopy.id}`,
      text: `Check out my order from Menu Ordering App`,
      url: `${window.location.origin}/orders/${orderCopy.id}`
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/orders/${orderCopy.id}`)
  }
}

const exportOrders = () => {
  // Mock export functionality
  // console.log('Exporting orders...') - REMOVED
  // In a real app, this would generate and download a CSV/PDF
  // Use a toast notification instead:
  // useToast().success('Export functionality coming soon')
  alert('Export functionality coming soon')
}

const loadMoreOrders = async () => {
  loadingMore.value = true
  try {
    // Mock loading more orders
    await new Promise(resolve => setTimeout(resolve, 1000))
    hasMoreOrders.value = false // No more orders for demo
  } catch (error) {
    console.error('Failed to load more orders:', error)
  } finally {
    loadingMore.value = false
  }
}

// Initialize
onMounted(() => {
  // Only fetch if we don't have orders (or if they are stale - optional logic)
  // This prevents resetting the view when navigating back from details
  if (orderStore.orderHistory.length === 0) {
    orderStore.fetchOrderHistory()
  } else {
    // Optional: Background refresh without setting loading state
    // orderStore.defaults.fetchOrderHistory({ background: true })
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/transitions' as *;

.orders-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: $space-8 $space-4;
}

.orders-page__header {
  text-align: center;
  margin-bottom: $space-12;
}

.orders-page__title {
  font-family: $font-secondary;
  font-size: $text-3xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-4;
}

.orders-page__subtitle {
  font-size: $text-lg;
  color: var(--text-secondary);
  line-height: $leading-relaxed;
}

.orders-page__filters {
  margin-bottom: $space-8;
}

.orders-page__search-row {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  margin-bottom: $space-6;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
  }
}

.orders-page__search {
  flex: 1;
  max-width: 400px;
}

.orders-page__filter-controls {
  display: flex;
  gap: $space-3;
}

.orders-page__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.orders-page__stat-card {
  text-align: center;
  padding: $space-6;
}

.orders-page__stat-value {
  font-size: $text-2xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.orders-page__stat-label {
  font-size: $text-sm;
  color: var(--text-secondary);
}

// Responsive design
@media (max-width: 768px) {
  .orders-page {
    padding: $space-4;
  }

  .orders-page__title {
    font-size: $text-2xl;
  }

  .orders-page__filter-controls {
    flex-direction: column;
  }
}
</style>