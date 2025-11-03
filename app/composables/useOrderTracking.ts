import type { Order, OrderStatus } from '~/types'
import type { OrderUpdateMessage } from '~/services/websocket.service'
import { useOrderStore } from '~/stores/order'
import { useWebSocketService } from '~/services/websocket.service'

export function useOrderTracking(orderId?: string) {
  const { subscribeToOrderUpdates, trackOrder, stopTrackingOrder, isConnected } = useWebSocketService()
  const orderStore = useOrderStore()
  
  const isTracking = ref(false)
  const trackingData = ref<{
    status: OrderStatus
    estimatedTime?: number
    currentLocation?: {
      latitude: number
      longitude: number
    }
    courierInfo?: {
      name: string
      phone: string
      photo?: string
    }
    timeline: Array<{
      status: OrderStatus
      timestamp: string
      message: string
    }>
  } | null>(null)

  let unsubscribe: (() => void) | null = null

  const startTracking = async (targetOrderId: string) => {
    if (isTracking.value) {
      stopTracking()
    }

    isTracking.value = true

    // Subscribe to WebSocket updates
    unsubscribe = subscribeToOrderUpdates((update: OrderUpdateMessage) => {
      if (update.orderId === targetOrderId) {
        handleOrderUpdate(update)
      }
    })

    // Start tracking via WebSocket
    if (isConnected.value) {
      trackOrder(targetOrderId)
    }

    // Fetch initial tracking data
    try {
      const { useOrderService } = await import('~/services/order.service')
      const orderService = useOrderService()
      const response = await orderService.getOrderTracking(targetOrderId)
      
      if (response.success && response.data) {
        trackingData.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch initial tracking data:', error)
    }
  }

  const stopTracking = () => {
    if (!isTracking.value) return

    isTracking.value = false
    
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    if (orderId && isConnected.value) {
      stopTrackingOrder(orderId)
    }

    trackingData.value = null
  }

  const handleOrderUpdate = (update: OrderUpdateMessage) => {
    // Update tracking data
    if (trackingData.value) {
      trackingData.value.status = update.status
      
      if (update.estimatedTime) {
        trackingData.value.estimatedTime = update.estimatedTime
      }
      
      if (update.courierLocation) {
        trackingData.value.currentLocation = update.courierLocation
      }

      // Add to timeline
      trackingData.value.timeline.unshift({
        status: update.status,
        timestamp: new Date().toISOString(),
        message: update.message || `Order status updated to ${update.status}`,
      })
    }

    // Update order in store
    const order = orderStore.orderHistory.find(o => o.id === update.orderId)
    if (order) {
      order.status = update.status
      if (update.estimatedTime) {
        order.estimatedTime = update.estimatedTime
      }
    }

    if (orderStore.currentOrder?.id === update.orderId) {
      orderStore.currentOrder.status = update.status
      if (update.estimatedTime) {
        orderStore.currentOrder.estimatedTime = update.estimatedTime
      }
    }
  }

  const refreshTracking = async (targetOrderId: string) => {
    try {
      const { useOrderService } = await import('~/services/order.service')
      const orderService = useOrderService()
      const response = await orderService.getOrderTracking(targetOrderId)
      
      if (response.success && response.data) {
        trackingData.value = response.data
      }
    } catch (error) {
      console.error('Failed to refresh tracking data:', error)
    }
  }

  // Auto-start tracking if orderId is provided
  if (orderId) {
    watch(
      isConnected,
      (connected) => {
        if (connected && !isTracking.value) {
          startTracking(orderId)
        }
      },
      { immediate: true }
    )
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopTracking()
  })

  // Computed
  const currentStatus = computed(() => trackingData.value?.status)
  const estimatedTime = computed(() => trackingData.value?.estimatedTime)
  const courierLocation = computed(() => trackingData.value?.currentLocation)
  const courierInfo = computed(() => trackingData.value?.courierInfo)
  const timeline = computed(() => trackingData.value?.timeline || [])
  
  const isOrderActive = computed(() => {
    const status = currentStatus.value
    return status && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(status)
  })

  const isOrderCompleted = computed(() => {
    const status = currentStatus.value
    return status && ['DELIVERED', 'CANCELLED'].includes(status)
  })

  const progressPercentage = computed(() => {
    const status = currentStatus.value
    if (!status) return 0

    const progressMap = {
      PENDING: 20,
      CONFIRMED: 40,
      PREPARING: 60,
      READY: 80,
      DELIVERED: 100,
      CANCELLED: 0,
    }

    return progressMap[status] || 0
  })

  const statusColor = computed(() => {
    const status = currentStatus.value
    if (!status) return 'gray'

    const colorMap = {
      PENDING: 'orange',
      CONFIRMED: 'blue',
      PREPARING: 'yellow',
      READY: 'green',
      DELIVERED: 'green',
      CANCELLED: 'red',
    }

    return colorMap[status] || 'gray'
  })

  const estimatedDeliveryText = computed(() => {
    const time = estimatedTime.value
    if (!time) return null

    const minutes = Math.ceil(time / 60)
    if (minutes < 60) {
      return `${minutes} min`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }
  })

  return {
    // State
    isTracking: readonly(isTracking),
    trackingData: readonly(trackingData),
    isConnected,

    // Computed
    currentStatus,
    estimatedTime,
    courierLocation,
    courierInfo,
    timeline,
    isOrderActive,
    isOrderCompleted,
    progressPercentage,
    statusColor,
    estimatedDeliveryText,

    // Actions
    startTracking,
    stopTracking,
    refreshTracking,
  }
}