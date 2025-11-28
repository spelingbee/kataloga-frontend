<template>
  <div class="api-integration-example p-6 space-y-6">
    <h2 class="text-2xl font-bold">API Integration Example</h2>
    
    <!-- Menu Section -->
    <section class="space-y-4">
      <h3 class="text-xl font-semibold">Menu Integration</h3>
      
      <div class="flex gap-4">
        <button 
          :disabled="menuLoading"
          class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          @click="loadMenu"
        >
          {{ menuLoading ? 'Loading...' : 'Load Menu' }}
        </button>
        
        <button 
          :disabled="menuLoading"
          class="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          @click="loadPopularItems"
        >
          Load Popular Items
        </button>
      </div>

      <div v-if="menuError" class="text-red-500">
        Error: {{ menuError }}
      </div>

      <div v-if="hasCategories" class="space-y-2">
        <h4 class="font-medium">Categories ({{ categories.length }})</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            v-for="category in categories"
            :key="category.id"
            :class="[
              'p-2 rounded text-sm',
              currentCategory === category.id 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            ]"
            @click="selectCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <div v-if="hasMenuItems" class="space-y-2">
        <h4 class="font-medium">Menu Items ({{ filteredMenuItems.length }})</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in filteredMenuItems.slice(0, 6)"
            :key="item.id"
            class="border rounded-lg p-4 space-y-2"
          >
            <h5 class="font-medium">{{ item.name }}</h5>
            <p class="text-sm text-gray-600">{{ item.description }}</p>
            <div class="flex justify-between items-center">
              <span class="font-bold">${{ item.price }}</span>
              <div class="flex gap-2">
                <button
                  :class="[
                    'px-2 py-1 rounded text-xs',
                    isFavourite(item.id) 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  ]"
                  @click="toggleFavorite(item.id)"
                >
                  {{ isFavourite(item.id) ? '♥' : '♡' }}
                </button>
                <button
                  class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                  @click="addToCart(item)"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cart Section -->
    <section class="space-y-4">
      <h3 class="text-xl font-semibold">Cart Integration</h3>
      
      <div class="flex gap-4 items-center">
        <span class="font-medium">
          Cart: {{ itemCount }} items ({{ formattedTotal }})
        </span>
        <button 
          :disabled="isEmpty"
          class="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          @click="clearCart"
        >
          Clear Cart
        </button>
      </div>

      <div v-if="hasItems" class="space-y-2">
        <div
          v-for="item in items"
          :key="`${item.menuItem.id}-${JSON.stringify(item.customizations)}`"
          class="flex justify-between items-center p-3 border rounded"
        >
          <div>
            <span class="font-medium">{{ item.menuItem.name }}</span>
            <span class="text-sm text-gray-600 ml-2">x{{ item.quantity }}</span>
          </div>
          <div class="flex gap-2 items-center">
            <span class="font-bold">${{ item.subtotal }}</span>
            <button
              class="px-2 py-1 bg-gray-200 rounded text-xs"
              @click="updateQuantity(item.menuItem.id, item.quantity - 1, item.customizations)"
            >
              -
            </button>
            <button
              class="px-2 py-1 bg-gray-200 rounded text-xs"
              @click="updateQuantity(item.menuItem.id, item.quantity + 1, item.customizations)"
            >
              +
            </button>
            <button
              class="px-2 py-1 bg-red-500 text-white rounded text-xs"
              @click="removeItem(item.menuItem.id, item.customizations)"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Order Section -->
    <section class="space-y-4">
      <h3 class="text-xl font-semibold">Order Integration</h3>
      
      <div class="flex gap-4">
        <button 
          :disabled="isEmpty || orderLoading"
          class="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
          @click="createTestOrder"
        >
          {{ orderLoading ? 'Creating...' : 'Create Test Order' }}
        </button>
        
        <button 
          :disabled="orderLoading"
          class="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
          @click="loadOrderHistory"
        >
          Load Order History
        </button>
      </div>

      <div v-if="orderError" class="text-red-500">
        Error: {{ orderError }}
      </div>

      <div v-if="currentOrder" class="p-4 border rounded bg-green-50">
        <h4 class="font-medium">Current Order</h4>
        <p>ID: {{ currentOrder.id }}</p>
        <p>Status: {{ currentOrder.status }}</p>
        <p>Total: ${{ currentOrder.total }}</p>
        <div class="mt-2 flex gap-2">
          <button
            v-if="canCancelCurrentOrder"
            class="px-3 py-1 bg-red-500 text-white rounded text-sm"
            @click="cancelCurrentOrder"
          >
            Cancel Order
          </button>
          <button
            class="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            @click="startTracking(currentOrder.id)"
          >
            Track Order
          </button>
        </div>
      </div>

      <div v-if="hasOrderHistory" class="space-y-2">
        <h4 class="font-medium">Order History ({{ orderHistory.length }})</h4>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="order in orderHistory.slice(0, 5)"
            :key="order.id"
            class="flex justify-between items-center p-3 border rounded"
          >
            <div>
              <span class="font-medium">Order #{{ order.id.slice(-6) }}</span>
              <span class="text-sm text-gray-600 ml-2">{{ order.status }}</span>
            </div>
            <div class="flex gap-2 items-center">
              <span class="font-bold">${{ order.total }}</span>
              <button
                class="px-2 py-1 bg-green-500 text-white rounded text-xs"
                @click="repeatOrder(order.id)"
              >
                Repeat
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Order Tracking Section -->
    <section v-if="isTracking" class="space-y-4">
      <h3 class="text-xl font-semibold">Order Tracking</h3>
      
      <div class="p-4 border rounded bg-blue-50">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-medium">Tracking Order</h4>
          <button
            class="px-3 py-1 bg-red-500 text-white rounded text-sm"
            @click="stopTracking"
          >
            Stop Tracking
          </button>
        </div>
        
        <div v-if="currentStatus" class="space-y-2">
          <div class="flex justify-between">
            <span>Status:</span>
            <span :class="`text-${statusColor}-600 font-medium`">
              {{ currentStatus }}
            </span>
          </div>
          
          <div v-if="estimatedDeliveryText" class="flex justify-between">
            <span>Estimated Time:</span>
            <span class="font-medium">{{ estimatedDeliveryText }}</span>
          </div>
          
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              :class="`bg-${statusColor}-500 h-2 rounded-full transition-all duration-300`"
              :style="`width: ${progressPercentage}%`"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- User Profile Section -->
    <section class="space-y-4">
      <h3 class="text-xl font-semibold">User Profile Integration</h3>
      
      <div class="flex gap-4">
        <button 
          :disabled="userLoading"
          class="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
          @click="loadNotifications"
        >
          Load Notifications
        </button>
        
        <button 
          :disabled="userLoading"
          class="px-4 py-2 bg-pink-500 text-white rounded disabled:opacity-50"
          @click="loadPromotions"
        >
          Load Promotions
        </button>
      </div>

      <div v-if="hasUnreadNotifications" class="p-3 bg-yellow-50 border rounded">
        <span class="font-medium">{{ unreadNotificationsCount }} unread notifications</span>
        <button
          class="ml-2 px-2 py-1 bg-yellow-500 text-white rounded text-xs"
          @click="markAllNotificationsRead"
        >
          Mark All Read
        </button>
      </div>

      <div v-if="hasPromotions" class="space-y-2">
        <h4 class="font-medium">Active Promotions</h4>
        <div class="space-y-2">
          <div
            v-for="promotion in getActivePromotions().slice(0, 3)"
            :key="promotion.id"
            class="p-3 border rounded bg-pink-50"
          >
            <h5 class="font-medium">{{ promotion.title }}</h5>
            <p class="text-sm text-gray-600">{{ promotion.description }}</p>
            <div class="flex justify-between items-center mt-2">
              <span class="text-sm">
                {{ promotion.discountType === 'percentage' ? `${promotion.discountValue}% off` : `$${promotion.discountValue} off` }}
              </span>
              <button
                class="px-2 py-1 bg-pink-500 text-white rounded text-xs"
                @click="claimPromotion(promotion.id)"
              >
                Claim
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem, CustomerInfo } from '~/types'
import { useCart } from '~/composables/useCart'
import { useMenu } from '~/composables/useMenu'
import { useOrders } from '~/composables/useOrders'
import { useOrderTracking } from '~/composables/useOrderTracking'
import { useUserProfile } from '~/composables/useUserProfile'

// Composables
const { 
  categories, 
  menuItems, 
  favourites,
  currentCategory,
  filteredMenuItems,
  loading: menuLoading,
  error: menuError,
  hasCategories,
  hasMenuItems,
  fetchMenu,
  fetchPopularItems,
  setCurrentCategory,
  toggleFavourite,
  isFavourite,
} = useMenu()

const {
  items,
  itemCount,
  isEmpty,
  hasItems,
  formattedTotal,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  createOrderFromCart,
} = useCart()

const {
  currentOrder,
  orderHistory,
  loading: orderLoading,
  error: orderError,
  hasOrderHistory,
  canCancelCurrentOrder,
  fetchOrderHistory,
  cancelOrder,
  repeatOrder,
} = useOrders()

const {
  isTracking,
  currentStatus,
  estimatedDeliveryText,
  progressPercentage,
  statusColor,
  startTracking,
  stopTracking,
} = useOrderTracking()

const {
  notifications,
  promotions,
  loading: userLoading,
  hasUnreadNotifications,
  hasPromotions,
  unreadNotificationsCount,
  fetchNotifications,
  fetchPromotions,
  markAllNotificationsRead,
  claimPromotion,
  getActivePromotions,
} = useUserProfile()

// Methods
const loadMenu = async () => {
  await fetchMenu()
}

const loadPopularItems = async () => {
  await fetchPopularItems()
}

const selectCategory = async (categoryId: string) => {
  setCurrentCategory(categoryId)
}

const toggleFavorite = async (itemId: string) => {
  await toggleFavourite(itemId)
}

const addToCart = (item: MenuItem) => {
  addItem(item, 1)
}

const createTestOrder = async () => {
  const customerInfo: CustomerInfo = {
    name: 'Test Customer',
    phone: '+1234567890',
    email: 'test@example.com',
    address: '123 Test Street, Test City',
  }

  try {
    await createOrderFromCart(customerInfo, 'Test order from API integration example')
  } catch (error) {
    console.error('Failed to create test order:', error)
  }
}

const loadOrderHistory = async () => {
  await fetchOrderHistory()
}

const cancelCurrentOrder = async () => {
  if (currentOrder.value) {
    await cancelOrder(currentOrder.value.id, 'Cancelled from example')
  }
}

const loadNotifications = async () => {
  await fetchNotifications()
}

const loadPromotions = async () => {
  await fetchPromotions({ active: true })
}

// Initialize data on mount
onMounted(() => {
  loadMenu()
  loadOrderHistory()
  loadNotifications()
  loadPromotions()
})
</script>

<style scoped>
.api-integration-example {
  max-width: 1200px;
  margin: 0 auto;
}
</style>