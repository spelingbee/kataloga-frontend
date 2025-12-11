/**
 * Platform-specific Notifications Composable
 * Handles notifications for both Web and Telegram platforms
 */

import type { Order } from '~/types'

export const usePlatformNotifications = () => {
  const telegram = useTelegram()
  const telegramNotifications = useTelegramNotifications()
  const pushNotifications = usePushNotifications()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Check if platform-specific notifications are available
   */
  const isAvailable = computed(() => {
    if (telegram.isTelegram.value) {
      return telegramNotifications.isAvailable.value
    }
    return pushNotifications.isSupported.value
  })

  /**
   * Check if user is subscribed to notifications
   */
  const isSubscribed = computed(() => {
    if (telegram.isTelegram.value) {
      // Telegram notifications are always "subscribed" if available
      return telegramNotifications.isAvailable.value
    }
    return pushNotifications.isSubscribed.value
  })

  /**
   * Subscribe to platform-specific notifications
   */
  const subscribe = async (): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      if (telegram.isTelegram.value) {
        // For Telegram, request write access
        const granted = await telegramNotifications.requestWriteAccess()
        return granted
      } else {
        // For web, subscribe to push notifications
        const success = await pushNotifications.subscribe()
        return success
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to subscribe to notifications'
      console.error('Subscribe error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Unsubscribe from platform-specific notifications
   */
  const unsubscribe = async (): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      if (telegram.isTelegram.value) {
        // Telegram doesn't have unsubscribe, just return true
        return true
      } else {
        // For web, unsubscribe from push notifications
        const success = await pushNotifications.unsubscribe()
        return success
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to unsubscribe from notifications'
      console.error('Unsubscribe error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Send order confirmation notification
   */
  const sendOrderConfirmation = async (order: Order): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      if (telegram.isTelegram.value) {
        // Send via Telegram
        const success = await telegramNotifications.sendOrderConfirmation(order)
        
        // Also show popup in Telegram
        if (success) {
          await telegramNotifications.showOrderConfirmationPopup(order)
        }
        
        return success
      } else {
        // For web, notification is handled by WebSocket service
        // Just show a browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Order Confirmed!', {
            body: `Order #${order.orderNumber} has been placed successfully. Total: $${order.total.toFixed(2)}`,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            tag: 'order-confirmation',
            requireInteraction: true
          })
        }
        return true
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to send order confirmation'
      console.error('Send order confirmation error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Send order status update notification
   */
  const sendOrderStatusUpdate = async (orderId: string, status: string, message?: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      if (telegram.isTelegram.value) {
        // Send via Telegram
        return await telegramNotifications.sendOrderStatusUpdate(orderId, status, message)
      } else {
        // For web, notification is handled by WebSocket service
        // Just show a browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Order Status Update', {
            body: message || `Your order status has been updated to ${status}`,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            tag: `order-${orderId}`,
            data: { orderId, status }
          })
        }
        return true
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to send status update'
      console.error('Send status update error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Request notification permission
   */
  const requestPermission = async (): Promise<boolean> => {
    if (telegram.isTelegram.value) {
      return await telegramNotifications.requestWriteAccess()
    } else {
      return await pushNotifications.requestPermission()
    }
  }

  /**
   * Get platform name
   */
  const platformName = computed(() => {
    return telegram.isTelegram.value ? 'Telegram' : 'Web'
  })

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAvailable,
    isSubscribed,
    platformName,

    // Actions
    subscribe,
    unsubscribe,
    sendOrderConfirmation,
    sendOrderStatusUpdate,
    requestPermission,
    clearError
  }
}
