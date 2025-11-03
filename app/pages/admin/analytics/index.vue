<template>
  <div>
    <!-- Page Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Analytics</h1>
        <p class="mt-1 text-sm text-gray-600">
          Track your restaurant's performance and insights
        </p>
      </div>
      <div class="flex space-x-3">
        <select
          v-model="selectedPeriod"
          @change="loadAnalytics"
          class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
        <button
          @click="exportReport"
          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <BaseIcon name="download" class="mr-2 h-4 w-4" />
          Export Report
        </button>
      </div>
    </div>

    <LoadingWrapper :loading="loading">
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <BaseIcon name="currency-dollar" class="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    ${{ analytics.totalRevenue.toFixed(2) }}
                  </dd>
                  <dd class="text-sm text-gray-500">
                    {{ getChangeText(analytics.revenueChange) }}
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
                  <BaseIcon name="shopping-bag" class="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Total Orders
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ analytics.totalOrders }}
                  </dd>
                  <dd class="text-sm text-gray-500">
                    {{ getChangeText(analytics.ordersChange) }}
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
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <BaseIcon name="calculator" class="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Average Order Value
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    ${{ analytics.averageOrderValue.toFixed(2) }}
                  </dd>
                  <dd class="text-sm text-gray-500">
                    {{ getChangeText(analytics.aovChange) }}
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
                  <BaseIcon name="users" class="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    New Customers
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ analytics.newCustomers }}
                  </dd>
                  <dd class="text-sm text-gray-500">
                    {{ getChangeText(analytics.customersChange) }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>      <!-- 
Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Revenue Chart -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              Revenue Trend
            </h3>
            <div class="h-64 flex items-center justify-center bg-gray-50 rounded-md">
              <div class="text-center">
                <BaseIcon name="chart-bar" class="mx-auto h-12 w-12 text-gray-400" />
                <p class="mt-2 text-sm text-gray-500">Revenue chart would go here</p>
                <p class="text-xs text-gray-400">Integration with Chart.js or similar</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Orders Chart -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              Orders by Status
            </h3>
            <div class="h-64 flex items-center justify-center bg-gray-50 rounded-md">
              <div class="text-center">
                <BaseIcon name="chart-pie" class="mx-auto h-12 w-12 text-gray-400" />
                <p class="mt-2 text-sm text-gray-500">Orders pie chart would go here</p>
                <p class="text-xs text-gray-400">Integration with Chart.js or similar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Popular Items -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              Popular Menu Items
            </h3>
            <div class="space-y-3">
              <div
                v-for="(item, index) in analytics.popularItems"
                :key="item.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    <span class="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">
                      {{ index + 1 }}
                    </span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ item.name }}</p>
                    <p class="text-xs text-gray-500">{{ item.orders }} orders</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">${{ item.revenue.toFixed(2) }}</p>
                  <p class="text-xs text-gray-500">revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div> 
       <!-- Recent Activity -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div class="space-y-3">
              <div
                v-for="activity in analytics.recentActivity"
                :key="activity.id"
                class="flex items-start space-x-3"
              >
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'w-2 h-2 rounded-full mt-2',
                      getActivityColor(activity.type)
                    ]"
                  ></div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900">{{ activity.description }}</p>
                  <p class="text-xs text-gray-500">{{ formatTime(activity.timestamp) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Performance Metrics
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {{ analytics.averagePreparationTime }}min
              </div>
              <div class="text-sm text-gray-500">Average Preparation Time</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {{ (analytics.customerSatisfaction * 100).toFixed(1) }}%
              </div>
              <div class="text-sm text-gray-500">Customer Satisfaction</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {{ analytics.repeatCustomerRate.toFixed(1) }}%
              </div>
              <div class="text-sm text-gray-500">Repeat Customer Rate</div>
            </div>
          </div>
        </div>
      </div>
    </LoadingWrapper>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Define page meta
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Types
interface PopularItem {
  id: string
  name: string
  orders: number
  revenue: number
}

interface Activity {
  id: string
  type: 'order' | 'customer' | 'menu' | 'system'
  description: string
  timestamp: string
}

interface Analytics {
  totalRevenue: number
  revenueChange: number
  totalOrders: number
  ordersChange: number
  averageOrderValue: number
  aovChange: number
  newCustomers: number
  customersChange: number
  popularItems: PopularItem[]
  recentActivity: Activity[]
  averagePreparationTime: number
  customerSatisfaction: number
  repeatCustomerRate: number
}

// Reactive state
const loading = ref(true)
const selectedPeriod = ref('week')
const analytics = ref<Analytics>({
  totalRevenue: 0,
  revenueChange: 0,
  totalOrders: 0,
  ordersChange: 0,
  averageOrderValue: 0,
  aovChange: 0,
  newCustomers: 0,
  customersChange: 0,
  popularItems: [],
  recentActivity: [],
  averagePreparationTime: 0,
  customerSatisfaction: 0,
  repeatCustomerRate: 0
})

// Methods
const loadAnalytics = async () => {
  try {
    loading.value = true
    const { $apiClient } = useNuxtApp()
    
    const response = await $apiClient.get('/admin/analytics', {
      params: { period: selectedPeriod.value }
    })
    
    if (response.success) {
      analytics.value = response.data
    }
  } catch (error) {
    console.error('Failed to load analytics:', error)
    // Use mock data for development
    analytics.value = {
      totalRevenue: 12450.75,
      revenueChange: 15.3,
      totalOrders: 234,
      ordersChange: 8.7,
      averageOrderValue: 53.21,
      aovChange: 6.2,
      newCustomers: 45,
      customersChange: 12.1,
      popularItems: [
        { id: '1', name: 'Margherita Pizza', orders: 45, revenue: 854.55 },
        { id: '2', name: 'Caesar Salad', orders: 32, revenue: 415.68 },
        { id: '3', name: 'Chicken Burger', orders: 28, revenue: 532.44 },
        { id: '4', name: 'Pasta Carbonara', orders: 25, revenue: 487.50 },
        { id: '5', name: 'Fish & Chips', orders: 22, revenue: 418.00 }
      ],
      recentActivity: [
        {
          id: '1',
          type: 'order',
          description: 'New order #1234 placed by John Doe',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          type: 'customer',
          description: 'New customer registered: Jane Smith',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'menu',
          description: 'Menu item "Spicy Wings" was updated',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          type: 'order',
          description: 'Order #1233 was delivered successfully',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        }
      ],
      averagePreparationTime: 18,
      customerSatisfaction: 0.94,
      repeatCustomerRate: 67.8
    }
  } finally {
    loading.value = false
  }
}

const exportReport = async () => {
  try {
    const { $apiClient } = useNuxtApp()
    const response = await $apiClient.get('/admin/analytics/export', {
      params: { 
        period: selectedPeriod.value,
        format: 'csv'
      },
      responseType: 'blob'
    })
    
    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-report-${selectedPeriod.value}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export report:', error)
    alert('Failed to export report. Please try again.')
  }
}

const getChangeText = (change: number) => {
  if (change > 0) {
    return `+${change.toFixed(1)}% from last period`
  } else if (change < 0) {
    return `${change.toFixed(1)}% from last period`
  }
  return 'No change from last period'
}

const getActivityColor = (type: string) => {
  const colors = {
    order: 'bg-blue-400',
    customer: 'bg-green-400',
    menu: 'bg-yellow-400',
    system: 'bg-gray-400'
  }
  return colors[type as keyof typeof colors] || 'bg-gray-400'
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
  loadAnalytics()
})
</script>