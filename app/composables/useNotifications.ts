/**
 * Notifications Composable
 * Provides reactive access to notification service
 */

export interface NotificationItem {
  id: string
  type: 'order' | 'promotion' | 'system'
  title: string
  message: string
  isRead: boolean
  timestamp: string
  data?: any
}

export const useNotifications = () => {
  const { $notificationService } = useNuxtApp()
  const notifications = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  const isConnected = ref(false)

  /**
   * Initialize notification service
   */
  const initialize = async () => {
    if (!import.meta.client || !$notificationService) return

    try {
      // Load existing notifications
      const existing = ($notificationService as any).getInAppNotifications()
      notifications.value = existing
      unreadCount.value = ($notificationService as any).getUnreadCount()

      // Subscribe to new notifications
      ($notificationService as any).onNotification((notification: NotificationItem) => {
        notifications.value.unshift(notification)
        unreadCount.value++
      })

      // Connect to WebSocket
      ($notificationService as any).connect()
      isConnected.value = true
    } catch (error) {
      console.error('Failed to initialize notifications:', error)
    }
  }

  /**
   * Connect to WebSocket for specific order
   */
  const connectForOrder = async (orderId: string) => {
    if (!import.meta.client || !$notificationService) return

    try {
      // Load existing notifications
      const existing = ($notificationService as any).getInAppNotifications()
      notifications.value = existing
      unreadCount.value = ($notificationService as any).getUnreadCount()

      // Subscribe to new notifications
      ($notificationService as any).onNotification((notification: NotificationItem) => {
        notifications.value.unshift(notification)
        unreadCount.value++
      })

      // Connect to WebSocket for specific order
      ($notificationService as any).connect(orderId)
      isConnected.value = true
    } catch (error) {
      console.error('Failed to connect for order:', error)
    }
  }

  /**
   * Disconnect from WebSocket
   */
  const disconnect = () => {
    if ($notificationService) {
      ($notificationService as any).disconnect()
      isConnected.value = false
    }
  }

  /**
   * Mark notification as read
   */
  const markAsRead = (notificationId: string) => {
    if (!$notificationService) return

    ($notificationService as any).markAsRead(notificationId)
    
    // Update local state
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.isRead) {
      notification.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = () => {
    if (!$notificationService) return

    ($notificationService as any).markAllAsRead()
    
    // Update local state
    notifications.value.forEach(n => {
      n.isRead = true
    })
    unreadCount.value = 0
  }

  /**
   * Clear all notifications
   */
  const clearAll = () => {
    if (!$notificationService) return

    ($notificationService as any).clearNotifications()
    
    // Update local state
    notifications.value = []
    unreadCount.value = 0
  }

  /**
   * Get notifications by type
   */
  const getByType = (type: 'order' | 'promotion' | 'system') => {
    return computed(() => notifications.value.filter(n => n.type === type))
  }

  /**
   * Get unread notifications
   */
  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.isRead)
  })

  // Initialize on mount
  onMounted(() => {
    initialize()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    unreadNotifications,
    isConnected: readonly(isConnected),

    // Actions
    initialize,
    connectForOrder,
    disconnect,
    markAsRead,
    markAllAsRead,
    clearAll,
    getByType
  }
}
