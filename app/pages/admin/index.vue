<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-600">
        Overview of your restaurant's performance
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <BaseIcon name="shopping-bag" class="h-8 w-8 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Total Orders Today
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.todayOrders }}
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
              <BaseIcon name="currency-dollar" class="h-8 w-8 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Revenue Today
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  ${{ stats.todayRevenue.toFixed(2) }}
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
              <BaseIcon name="clock" class="h-8 w-8 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Pending Orders
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.pendingOrders }}
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
              <BaseIcon name="users" class="h-8 w-8 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Active Customers
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {{ stats.activeCustomers }}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="bg-white shadow rounded-lg mb-8">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Recent Orders
          </h3>
          <NuxtLink
            to="/admin/orders"
            class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all
          </NuxtLink>
        </div>

        <div class="overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="order in recentOrders" :key="order.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{{ order.id.slice(-6) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ order.customerInfo.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    :class="getStatusColor(order.status)"
                  >
                    {{ order.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${{ order.total.toFixed(2) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatTime(order.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Menu Items</h3>
              <p class="text-sm text-gray-500">Manage your menu</p>
            </div>
            <BaseIcon name="clipboard-list" class="h-8 w-8 text-gray-400" />
          </div>
          <div class="mt-4">
            <NuxtLink
              to="/admin/menu"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Manage Menu
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Orders</h3>
              <p class="text-sm text-gray-500">Process orders</p>
            </div>
            <BaseIcon name="shopping-bag" class="h-8 w-8 text-gray-400" />
          </div>
          <div class="mt-4">
            <NuxtLink
              to="/admin/orders"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              View Orders
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Analytics</h3>
              <p class="text-sm text-gray-500">View reports</p>
            </div>
            <BaseIcon name="chart-pie" class="h-8 w-8 text-gray-400" />
          </div>
          <div class="mt-4">
            <NuxtLink
              to="/admin/analytics"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              View Analytics
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Order, OrderStatus } from '~/types'

// Define page meta
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Reactive state
const stats = ref({
  todayOrders: 0,
  todayRevenue: 0,
  pendingOrders: 0,
  activeCustomers: 0
})

const recentOrders = ref<Order[]>([])
const loading = ref(true)

// Methods
const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // Load dashboard stats
    const { $apiClient } = useNuxtApp()
    const [statsResponse, ordersResponse] = await Promise.all([
      $apiClient.get('/admin/dashboard/stats'),
      $apiClient.get('/admin/orders', { params: { limit: 5, sort: 'createdAt:desc' } })
    ])

    if (statsResponse.success) {
      stats.value = statsResponse.data
    }

    if (ordersResponse.success) {
      recentOrders.value = ordersResponse.data.items || []
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    // Use mock data for development
    stats.value = {
      todayOrders: 24,
      todayRevenue: 1250.50,
      pendingOrders: 3,
      activeCustomers: 156
    }
    
    recentOrders.value = [
      {
        id: '1',
        status: 'PENDING' as OrderStatus,
        total: 45.99,
        customerInfo: { name: 'John Doe', phone: '+1234567890' },
        createdAt: new Date().toISOString(),
        items: []
      },
      {
        id: '2',
        status: 'PREPARING' as OrderStatus,
        total: 32.50,
        customerInfo: { name: 'Jane Smith', phone: '+1234567891' },
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        items: []
      }
    ]
  } finally {
    loading.value = false
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
  loadDashboardData()
})
</script>