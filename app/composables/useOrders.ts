import type { Order, CreateOrderDto, OrderStatus } from '~/types'

import { useOrderStore } from '~/stores/order'

export function useOrders() {
  const orderStore = useOrderStore()
  
  const {
    currentOrder,
    orderHistory,
    loading,
    error,
    hasActiveOrder,
  } = storeToRefs(orderStore)

  // Real-time tracking state
  const trackingInterval = ref<NodeJS.Timeout | null>(null)
  const isTracking = ref(false)

  // Actions
  const createOrder = async (orderData: CreateOrderDto) => {
    const order = await orderStore.createOrder(orderData)
    if (!order) return null
    return {
      ...order,
      success: true,
      data: order
    }
  }
  const fetchOrderHistory = (page?: number, limit?: number) => orderStore.fetchOrderHistory(page, limit)
  const trackOrder = (orderId: string) => orderStore.trackOrder(orderId)
  const cancelOrder = (orderId: string, reason?: string) => orderStore.cancelOrder(orderId, reason)
  const getOrder = (orderId: string) => orderStore.getOrder(orderId)
  const repeatOrder = (orderId: string) => orderStore.repeatOrder(orderId)
  const getActiveOrders = () => orderStore.getActiveOrders()
  const setCurrentOrder = (order: Order | null) => orderStore.setCurrentOrder(order)
  const clearCurrentOrder = () => orderStore.clearCurrentOrder()

  // Computed
  const hasOrderHistory = computed(() => orderHistory.value.length > 0)
  const canCancelCurrentOrder = computed(() => {
    if (!currentOrder.value) return false
    return ['PENDING', 'CONFIRMED'].includes(currentOrder.value.status)
  })

  // Helper functions
  const getOrderById = (orderId: string) => {
    return orderHistory.value.find(order => order.id === orderId)
  }

  const getOrdersByStatus = (status: OrderStatus) => {
    return orderHistory.value.filter(order => order.status === status)
  }

  const isOrderActive = (order: Order) => {
    return ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)
  }

  const isOrderCompleted = (order: Order) => {
    return ['DELIVERED', 'CANCELLED'].includes(order.status)
  }

  const getOrderStatusText = (status: OrderStatus) => {
    const statusMap = {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      PREPARING: 'Preparing',
      READY: 'Ready',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
    }
    return statusMap[status] || status
  }

  const getOrderStatusColor = (status: OrderStatus) => {
    const colorMap = {
      PENDING: 'orange',
      CONFIRMED: 'blue',
      PREPARING: 'yellow',
      READY: 'green',
      DELIVERED: 'green',
      CANCELLED: 'red',
    }
    return colorMap[status] || 'gray'
  }

  // Real-time tracking methods
  const startTracking = (orderId: string, intervalMs: number = 30000) => {
    if (isTracking.value) {
      stopTracking()
    }

    isTracking.value = true
    trackingInterval.value = setInterval(async () => {
      try {
        const order = await trackOrder(orderId)
        if (order && ['DELIVERED', 'CANCELLED'].includes(order.status)) {
          stopTracking() // Stop tracking completed orders
        }
      } catch (error) {
        console.error('Error during order tracking:', error)
      }
    }, intervalMs)
  }

  const stopTracking = () => {
    if (trackingInterval.value) {
      clearInterval(trackingInterval.value)
      trackingInterval.value = null
    }
    isTracking.value = false
  }

  // Order analytics and insights
  const getOrderStats = () => {
    const stats = {
      total: orderHistory.value.length,
      completed: 0,
      active: 0,
      cancelled: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      favoriteItems: new Map<string, number>(),
    }

    orderHistory.value.forEach(order => {
      const isCancelled = order.status === 'CANCELLED'
      
      if (!isCancelled) {
        stats.totalSpent += Number(order.total) || 0
        if (order.status === 'DELIVERED') {
          stats.completed++
        } else {
          stats.active++
        }
      } else {
        stats.cancelled++
      }

      // Track favorite items for all non-cancelled orders
      if (!isCancelled) {
        (order.items || []).forEach(item => {
          const itemName = item.product?.name || item.name || item.menuItem?.name || 'Unknown Item'
          const currentCount = stats.favoriteItems.get(itemName) || 0
          stats.favoriteItems.set(itemName, currentCount + item.quantity)
        })
      }
    })

    const countForAverage = stats.total - stats.cancelled
    stats.averageOrderValue = countForAverage > 0 ? stats.totalSpent / countForAverage : 0

    return {
      ...stats,
      favoriteItems: Array.from(stats.favoriteItems.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))
    }
  }

  // Order filtering and search
  const filterOrders = (filters: {
    status?: OrderStatus[]
    dateFrom?: Date
    dateTo?: Date
    minAmount?: number
    maxAmount?: number
    searchTerm?: string
  }) => {
    return orderHistory.value.filter(order => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(order.status)) return false
      }

      // Date range filter
      const orderDate = new Date(order.createdAt)
      if (filters.dateFrom && orderDate < filters.dateFrom) return false
      if (filters.dateTo && orderDate > filters.dateTo) return false

      // Amount filter
      if (filters.minAmount && order.total < filters.minAmount) return false
      if (filters.maxAmount && order.total > filters.maxAmount) return false

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const matchesId = order.id.toLowerCase().includes(searchLower)
        const matchesItems = (order.items || []).some(item => 
          item.menuItem?.name?.toLowerCase()?.includes(searchLower)
        )
        const matchesCustomer = order.customerInfo?.name?.toLowerCase()?.includes(searchLower)
        
        if (!matchesId && !matchesItems && !matchesCustomer) return false
      }

      return true
    })
  }

  // Reorder functionality
  const reorderItems = async (orderId: string) => {
    const order = getOrderById(orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    // Add items to cart
    const { useCart } = await import('./useCart')
    const { addItem } = useCart()
    
    for (const orderItem of (order.items || [])) {
      addItem(orderItem.menuItem, orderItem.quantity, orderItem.customizations)
    }

    return true
  }

  // Order validation
  const validateOrderForReorder = (orderId: string) => {
    const order = getOrderById(orderId)
    if (!order) {
      return { isValid: false, errors: ['Order not found'] }
    }

    const errors: string[] = []
    
    // Check if items are still available
    const unavailableItems = order.items.filter(item => !item.menuItem.isActive)
    if (unavailableItems.length > 0) {
      errors.push(`${unavailableItems.length} item(s) from this order are no longer available`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      unavailableItems: unavailableItems.map(item => item.menuItem.name)
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopTracking()
  })

  return {
    // State
    currentOrder: readonly(currentOrder),
    orderHistory: readonly(orderHistory),
    loading: readonly(loading),
    error: readonly(error),
    hasActiveOrder: readonly(hasActiveOrder),
    isTracking: readonly(isTracking),

    // Computed
    hasOrderHistory,
    canCancelCurrentOrder,

    // Actions
    createOrder,
    fetchOrderHistory,
    trackOrder,
    cancelOrder,
    getOrder,
    repeatOrder,
    getActiveOrders,
    setCurrentOrder,
    clearCurrentOrder,

    // Helpers
    getOrderById,
    getOrdersByStatus,
    isOrderActive,
    isOrderCompleted,
    getOrderStatusText,
    getOrderStatusColor,

    // Real-time tracking
    startTracking,
    stopTracking,

    // Analytics and insights
    getOrderStats,
    filterOrders,

    // Reorder functionality
    reorderItems,
    validateOrderForReorder,
  }
}
