<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Order Management</h1>
      <p class="mt-1 text-sm text-gray-600">
        Manage and track customer orders
      </p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <BaseIcon name="clock" class="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Pending
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ orderStats.pending }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BaseIcon name="check-circle" class="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Confirmed
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ orderStats.confirmed }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <BaseIcon name="fire" class="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Preparing
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ orderStats.preparing }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <BaseIcon name="truck" class="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Ready/Delivery
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ orderStats.ready + orderStats.outForDelivery }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <BaseInput
              v-model="filters.search"
              placeholder="Order ID or customer name..."
              @input="debouncedSearch"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              v-model="filters.status"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              @change="loadOrders"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <BaseInput
              v-model="filters.dateFrom"
              type="date"
              @change="loadOrders"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <BaseInput
              v-model="filters.dateTo"
              type="date"
              @change="loadOrders"
            />
          </div>
          <div class="flex items-end">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              @click="resetFilters"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <LoadingWrapper :loading="loading">
          <div v-if="orders.length === 0" class="text-center py-12">
            <BaseIcon name="shopping-bag" class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p class="mt-1 text-sm text-gray-500">
              Orders will appear here when customers place them.
            </p>
          </div>

          <div v-else class="overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      #{{ order.id.slice(-6) }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ formatDate(order.createdAt) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {{ order.customerInfo.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ order.customerInfo.phone }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                      {{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ getOrderItemsSummary(order.items) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${{ order.total.toFixed(2) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <select
                      :value="order.status"
                      :class="[
                        'text-xs font-semibold rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-indigo-500',
                        getStatusColor(order.status)
                      ]"
                      @change="updateOrderStatus(order, ($event.target as HTMLSelectElement).value)"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PREPARING">Preparing</option>
                      <option value="READY">Ready</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatTime(order.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <button
                        class="text-indigo-600 hover:text-indigo-900"
                        @click="viewOrderDetails(order)"
                      >
                        View
                      </button>
                      <button
                        v-if="order.status !== 'DELIVERED' && order.status !== 'CANCELLED'"
                        class="text-red-600 hover:text-red-900"
                        @click="confirmCancelOrder(order)"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ (pagination.currentPage - 1) * pagination.limit + 1 }} to 
              {{ Math.min(pagination.currentPage * pagination.limit, pagination.total) }} of 
              {{ pagination.total }} results
            </div>
            <div class="flex space-x-2">
              <button
                :disabled="pagination.currentPage === 1"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="changePage(pagination.currentPage - 1)"
              >
                Previous
              </button>
              <button
                v-for="page in visiblePages"
                :key="page"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  page === pagination.currentPage
                    ? 'text-white bg-indigo-600'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                ]"
                @click="changePage(page)"
              >
                {{ page }}
              </button>
              <button
                :disabled="pagination.currentPage === pagination.totalPages"
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="changePage(pagination.currentPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </LoadingWrapper>
      </div>
    </div>

    <!-- Order Details Modal -->
    <BaseModal v-if="selectedOrder" @close="selectedOrder = null">
      <div class="p-6 max-w-2xl">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Order Details - #{{ selectedOrder.id.slice(-6) }}
        </h3>
        
        <div class="space-y-6">
          <!-- Customer Info -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-2">Customer Information</h4>
            <div class="bg-gray-50 p-3 rounded-md">
              <p class="text-sm"><strong>Name:</strong> {{ selectedOrder.customerInfo.name }}</p>
              <p class="text-sm"><strong>Phone:</strong> {{ selectedOrder.customerInfo.phone }}</p>
              <p v-if="selectedOrder.customerInfo.email" class="text-sm">
                <strong>Email:</strong> {{ selectedOrder.customerInfo.email }}
              </p>
              <p v-if="selectedOrder.deliveryAddress" class="text-sm">
                <strong>Address:</strong> {{ selectedOrder.deliveryAddress }}
              </p>
            </div>
          </div>

          <!-- Order Items -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-2">Order Items</h4>
            <div class="space-y-2">
              <div
                v-for="item in selectedOrder.items"
                :key="item.id"
                class="flex justify-between items-center bg-gray-50 p-3 rounded-md"
              >
                <div>
                  <p class="text-sm font-medium">{{ item.menuItem.name }}</p>
                  <p class="text-xs text-gray-500">Quantity: {{ item.quantity }}</p>
                </div>
                <p class="text-sm font-medium">${{ item.subtotal.toFixed(2) }}</p>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-gray-200">
              <div class="flex justify-between items-center">
                <p class="text-base font-medium">Total</p>
                <p class="text-base font-medium">${{ selectedOrder.total.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <!-- Order Status -->
          <div>
            <h4 class="text-sm font-medium text-gray-900 mb-2">Status</h4>
            <span
              :class="[
                'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                getStatusColor(selectedOrder.status)
              ]"
            >
              {{ selectedOrder.status }}
            </span>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            @click="selectedOrder = null"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>

    <!-- Cancel Order Confirmation Modal -->
    <BaseModal v-if="showCancelModal" @close="showCancelModal = false">
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Cancel Order
        </h3>
        <p class="text-sm text-gray-500 mb-6">
          Are you sure you want to cancel order #{{ orderToCancel?.id.slice(-6) }}? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            @click="showCancelModal = false"
          >
            Keep Order
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            @click="cancelOrder"
          >
            Cancel Order
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { debounce } from '~/utils/debounce'
import type { Order, OrderStatus, OrderItem } from '~/types'

// Define page meta
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Reactive state
const orders = ref<Order[]>([])
const loading = ref(true)
const selectedOrder = ref<Order | null>(null)
const showCancelModal = ref(false)
const orderToCancel = ref<Order | null>(null)

const orderStats = ref({
  pending: 0,
  confirmed: 0,
  preparing: 0,
  ready: 0,
  outForDelivery: 0,
  delivered: 0,
  cancelled: 0
})

const filters = ref({
  search: '',
  status: '',
  dateFrom: '',
  dateTo: ''
})

const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  limit: 10
})

// Computed
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, pagination.value.currentPage - 2)
  const end = Math.min(pagination.value.totalPages, pagination.value.currentPage + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const loadOrders = async () => {
  try {
    loading.value = true
    const { $apiClient } = useNuxtApp()
    
    const params: any = {
      page: pagination.value.currentPage,
      limit: pagination.value.limit
    }
    
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.dateFrom) params.dateFrom = filters.value.dateFrom
    if (filters.value.dateTo) params.dateTo = filters.value.dateTo
    
    const response = await $apiClient.get('/admin/orders', { params })
    
    if (response.success) {
      orders.value = response.data.items || []
      pagination.value = {
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0,
        limit: response.data.limit || 10
      }
    }
  } catch (error) {
    console.error('Failed to load orders:', error)
    // Use mock data for development
    orders.value = [
      {
        id: '1',
        status: 'PENDING' as OrderStatus,
        total: 45.99,
        customerInfo: { 
          name: 'John Doe', 
          phone: '+1234567890',
          email: 'john@example.com'
        },
        deliveryAddress: '123 Main St, City, State 12345',
        createdAt: new Date().toISOString(),
        items: [
          {
            id: '1',
            menuItemId: '1',
            menuItem: {
              id: '1',
              name: 'Margherita Pizza',
              description: 'Classic pizza',
              price: 18.99,
              isActive: true
            },
            quantity: 2,
            price: 18.99,
            subtotal: 37.98
          },
          {
            id: '2',
            menuItemId: '2',
            menuItem: {
              id: '2',
              name: 'Caesar Salad',
              description: 'Fresh salad',
              price: 8.01,
              isActive: true
            },
            quantity: 1,
            price: 8.01,
            subtotal: 8.01
          }
        ]
      },
      {
        id: '2',
        status: 'PREPARING' as OrderStatus,
        total: 32.50,
        customerInfo: { 
          name: 'Jane Smith', 
          phone: '+1234567891'
        },
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        items: [
          {
            id: '3',
            menuItemId: '1',
            menuItem: {
              id: '1',
              name: 'Margherita Pizza',
              description: 'Classic pizza',
              price: 18.99,
              isActive: true
            },
            quantity: 1,
            price: 18.99,
            subtotal: 18.99
          }
        ]
      }
    ]
    
    pagination.value = {
      currentPage: 1,
      totalPages: 1,
      total: 2,
      limit: 10
    }
  } finally {
    loading.value = false
  }
}

const loadOrderStats = async () => {
  try {
    const { $apiClient } = useNuxtApp()
    const response = await $apiClient.get('/admin/orders/stats')
    
    if (response.success) {
      orderStats.value = response.data
    }
  } catch (error) {
    console.error('Failed to load order stats:', error)
    // Use mock data for development
    orderStats.value = {
      pending: 3,
      confirmed: 5,
      preparing: 2,
      ready: 1,
      outForDelivery: 2,
      delivered: 45,
      cancelled: 1
    }
  }
}

const debouncedSearch = debounce(() => {
  pagination.value.currentPage = 1
  loadOrders()
}, 300)

const resetFilters = () => {
  filters.value = {
    search: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  }
  pagination.value.currentPage = 1
  loadOrders()
}

const changePage = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.currentPage = page
    loadOrders()
  }
}

const updateOrderStatus = async (order: Order, newStatus: string) => {
  try {
    const { $apiClient } = useNuxtApp()
    const response = await $apiClient.patch(`/admin/orders/${order.id}/status`, {
      status: newStatus
    })
    
    if (response.success) {
      order.status = newStatus as OrderStatus
      // Reload stats to reflect changes
      loadOrderStats()
    }
  } catch (error) {
    console.error('Failed to update order status:', error)
    // For development, just update locally
    order.status = newStatus as OrderStatus
  }
}

const viewOrderDetails = (order: Order) => {
  selectedOrder.value = order
}

const confirmCancelOrder = (order: Order) => {
  orderToCancel.value = order
  showCancelModal.value = true
}

const cancelOrder = async () => {
  if (!orderToCancel.value) return
  
  try {
    const { $apiClient } = useNuxtApp()
    const response = await $apiClient.patch(`/admin/orders/${orderToCancel.value.id}/status`, {
      status: 'CANCELLED'
    })
    
    if (response.success) {
      orderToCancel.value.status = 'CANCELLED'
      loadOrderStats()
    }
  } catch (error) {
    console.error('Failed to cancel order:', error)
    // For development, just update locally
    if (orderToCancel.value) {
      orderToCancel.value.status = 'CANCELLED'
    }
  } finally {
    showCancelModal.value = false
    orderToCancel.value = null
  }
}

const getStatusColor = (status: OrderStatus) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PREPARING: 'bg-orange-100 text-orange-800',
    READY: 'bg-green-100 text-green-800',
    OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getOrderItemsSummary = (items: OrderItem[]) => {
  if (items.length <= 2) {
    return items.map(item => `${item.quantity}x ${item.menuItem.name}`).join(', ')
  }
  return `${items[0].quantity}x ${items[0].menuItem.name} +${items.length - 1} more`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Lifecycle
onMounted(() => {
  Promise.all([loadOrders(), loadOrderStats()])
})
</script>