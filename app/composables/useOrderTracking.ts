import { ref, computed, readonly, onUnmounted, watch } from 'vue'
import type { OrderStatus } from '~/types'
import type { OrderUpdateMessage } from '~/services/websocket.service'
import { useOrderStore } from '~/stores/order'
import { useWebSocket } from '~/services/websocket.service'
import { updateReadonlyObject } from '~/types/utils/readonly'

export function useOrderTracking(orderId?: string) {
  const { subscribeToOrderUpdates, trackOrder, stopTrackingOrder, isConnected } = useWebSocket()
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

      if (response) {
        trackingData.value = response
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
    const orderIndex = orderStore.orderHistory.findIndex(o => o.id === update.orderId)
    if (orderIndex >= 0) {
      const order = orderStore.orderHistory[orderIndex]
      const updatedOrder = updateReadonlyObject(order, {
        status: update.status,
        ...(update.estimatedTime && { estimatedTime: update.estimatedTime })
      })
      // Use Vue's reactivity to update the array
      orderStore.orderHistory.splice(orderIndex, 1, updatedOrder as any)
    }

    if (orderStore.currentOrder?.id === update.orderId) {
      const updatedCurrentOrder = updateReadonlyObject(orderStore.currentOrder, {
        status: update.status,
        ...(update.estimatedTime && { estimatedTime: update.estimatedTime })
      })
      orderStore.currentOrder = updatedCurrentOrder as any
    }
  }

  const refreshTracking = async (targetOrderId: string) => {
    try {
      const { useOrderService } = await import('~/services/order.service')
      const orderService = useOrderService()
      const response = await orderService.getOrderTracking(targetOrderId)

      if (response) {
        trackingData.value = response
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

    const progressMap: Record<string, number> = {
      PENDING: 20,
      CONFIRMED: 40,
      PREPARING: 60,
      READY: 80,
      OUT_FOR_DELIVERY: 90,
      DELIVERED: 100,
      CANCELLED: 0,
    }

    return progressMap[status] || 0
  })

  const statusColor = computed(() => {
    const status = currentStatus.value
    if (!status) return 'gray'

    const colorMap: Record<string, string> = {
      PENDING: 'orange',
      CONFIRMED: 'blue',
      PREPARING: 'yellow',
      READY: 'green',
      OUT_FOR_DELIVERY: 'blue',
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