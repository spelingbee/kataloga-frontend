import { useOrderStore } from '~/stores/order'
import type { OrderStatus } from '~/types'

export function useOrderTracking(orderId?: string) {
  const { $orderService } = useNuxtApp()
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

  let pollingInterval: any = null

  const startTracking = async (targetOrderId: string) => {
    if (isTracking.value) {
      stopTracking()
    }

    isTracking.value = true

    // Fetch initial tracking data
    await refreshTracking(targetOrderId)

    // Start polling every 10 seconds
    pollingInterval = setInterval(() => {
      refreshTracking(targetOrderId)
    }, 10000)
  }

  const stopTracking = () => {
    if (!isTracking.value) return

    isTracking.value = false
    
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }

    trackingData.value = null
  }

  // Not used anymore with polling
  const handleOrderUpdate = (update: any) => {}

  const refreshTracking = async (targetOrderId: string) => {
    if (!$orderService) return

    try {
      const data = await ($orderService as any).getOrderTracking(targetOrderId)
      
      if (data) {
        // Only update if status changed or it's the first load
        if (!trackingData.value || trackingData.value.status !== data.status) {
          trackingData.value = data
          
          // Update order in store
          const order = orderStore.orderHistory.find(o => o.id === targetOrderId)
          if (order) {
            order.status = data.status
            order.estimatedTime = data.estimatedTime
          }

          if (orderStore.currentOrder?.id === targetOrderId) {
            orderStore.currentOrder.status = data.status
            orderStore.currentOrder.estimatedTime = data.estimatedTime
          }
        } else {
          // Update courier location even if status is same
          trackingData.value.currentLocation = data.currentLocation
        }
      }
    } catch (error) {
      console.error('Failed to refresh tracking data:', error)
    }
  }

  // Auto-start tracking if orderId is provided
  if (orderId) {
    onMounted(() => {
      startTracking(orderId)
    })
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
