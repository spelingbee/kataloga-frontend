<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-3 mb-4">
        <BaseIcon name="receipt" size="lg" class="text-primary-green" />
        <AppHeading level="h1" size="display-md" class="text-white">
          Order History
        </AppHeading>
      </div>
      <AppText size="body-lg" class="text-neutral-20">
        Track your orders and reorder your favorites
      </AppText>
    </div>

    <!-- Filter and Search -->
    <div class="px-6 mb-8">
      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <!-- Search -->
        <div class="flex-1 max-w-md">
          <BaseInput
            v-model="searchQuery"
            placeholder="Search orders..."
            class="w-full"
          >
            <template #prefix>
              <BaseIcon name="search" size="sm" class="text-neutral-80" />
            </template>
          </BaseInput>
        </div>

        <!-- Filters -->
        <div class="flex gap-2">
          <select 
            v-model="statusFilter"
            class="bg-background-card border border-neutral-80/30 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="">All Orders</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <select 
            v-model="timeFilter"
            class="bg-background-card border border-neutral-80/30 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-background-card rounded-xl p-4 text-center">
          <AppText size="body-lg" class="text-white font-semibold">{{ totalOrders }}</AppText>
          <AppText size="caption" class="text-neutral-20">Total Orders</AppText>
        </div>
        <div class="bg-background-card rounded-xl p-4 text-center">
          <AppPrice :price="totalSpent" size="md" />
          <AppText size="caption" class="text-neutral-20">Total Spent</AppText>
        </div>
        <div class="bg-background-card rounded-xl p-4 text-center">
          <AppText size="body-lg" class="text-white font-semibold">{{ favoriteRestaurant }}</AppText>
          <AppText size="caption" class="text-neutral-20">Favorite</AppText>
        </div>
        <div class="bg-background-card rounded-xl p-4 text-center">
          <AppText size="body-lg" class="text-white font-semibold">{{ averageOrderValue }}</AppText>
          <AppText size="caption" class="text-neutral-20">Avg. Order</AppText>
        </div>
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
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
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
            @click="$router.push(`/orders/${order.id}`)"
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
            @click="loadMoreOrders"
            :disabled="loadingMore"
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
import type { Order } from '~/types'
import { useOrders } from '~/composables/useOrders'
import { useCart } from '~/composables/useCart'
import { useOrderStore } from '~/stores/order'
import { useCartStore } from '~/stores/cart'

// Page setup
definePageMeta({
  title: 'Order History - Menu Ordering App'
})

// Stores
const orderStore = useOrderStore()
const cartStore = useCartStore()

// Composables
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
const orders = computed(() => orderHistory.value)
const orderStats = computed(() => getOrderStats())

const totalOrders = computed(() => orderStats.value.total)
const totalSpent = computed(() => orderStats.value.totalSpent)
const favoriteRestaurant = computed(() => orderStats.value.favoriteItems[0]?.name || 'N/A')
const averageOrderValue = computed(() => `$${orderStats.value.averageOrderValue.toFixed(2)}`)

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

const reorderItems = (order: Order) => {
  // Add all items from the order to cart
  order.items.forEach(item => {
    cartStore.addItem(item.menuItem, item.quantity)
  })
  
  router.push('/cart')
}

const shareOrder = (order: Order) => {
  if (navigator.share) {
    navigator.share({
      title: `Order #${order.id}`,
      text: `Check out my order from Menu Ordering App`,
      url: `${window.location.origin}/orders/${order.id}`
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/orders/${order.id}`)
  }
}

const exportOrders = () => {
  // Mock export functionality
  console.log('Exporting orders...')
  // In a real app, this would generate and download a CSV/PDF
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
  orderStore.fetchOrderHistory()
})
</script>