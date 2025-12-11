/**
 * Telegram Notifications Composable
 * Provides notification functionality via Telegram
 */

import { useTelegramNotificationsService } from '~/services/telegram-notifications.service'
import type { Order } from '~/types'

export const useTelegramNotifications = () => {
  const telegram = useTelegram()
  const notificationsService = useTelegramNotificationsService()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Check if Telegram notifications are available
   */
  const isAvailable = computed(() => {
    return telegram.isTelegram.value
  })

  /**
   * Send order confirmation via Telegram
   */
  const sendOrderConfirmation = async (order: Order): Promise<boolean> => {
    if (!isAvailable.value) {
      console.log('Telegram notifications not available, skipping')
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const success = await notificationsService.sendOrderConfirmation(order)
      
      if (success) {
        telegram.notificationFeedback('success')
      }

      return success
    } catch (err: any) {
      error.value = err.message || 'Failed to send order confirmation'
      console.error('Send order confirmation error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Send order status update via Telegram
   */
  const sendOrderStatusUpdate = async (orderId: string, status: string, message?: string): Promise<boolean> => {
    if (!isAvailable.value) {
      console.log('Telegram notifications not available, skipping')
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const success = await notificationsService.sendOrderStatusUpdate(orderId, status, message)
      
      if (success) {
        telegram.notificationFeedback('success')
      }

      return success
    } catch (err: any) {
      error.value = err.message || 'Failed to send status update'
      console.error('Send status update error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Show order confirmation in Telegram popup
   */
  const showOrderConfirmationPopup = async (order: Order): Promise<void> => {
    if (!telegram.isTelegram.value) return

    const message = notificationsService.formatOrderMessage(order)

    await telegram.showPopup({
      title: 'Order Confirmed!',
      message: `Order #${order.orderNumber}\n\nTotal: $${order.total.toFixed(2)}\n\nYou will receive updates about your order.`,
      buttons: [
        { id: 'ok', type: 'ok', text: 'OK' }
      ]
    })

    telegram.notificationFeedback('success')
  }

  /**
   * Request write access for sending messages
   */
  const requestWriteAccess = async (): Promise<boolean> => {
    if (!telegram.isTelegram.value) {
      return false
    }

    try {
      const granted = await telegram.requestWriteAccess()
      
      if (granted) {
        telegram.notificationFeedback('success')
      }

      return granted
    } catch (err: any) {
      error.value = err.message || 'Failed to request write access'
      console.error('Request write access error:', err)
      return false
    }
  }

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

    // Actions
    sendOrderConfirmation,
    sendOrderStatusUpdate,
    showOrderConfirmationPopup,
    requestWriteAccess,
    clearError
  }
}
