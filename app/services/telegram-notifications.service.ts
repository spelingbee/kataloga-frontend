/**
 * Telegram Notifications Service
 * Handles sending notifications and order confirmations via Telegram
 */

import type { Order } from '~/types'

export interface TelegramNotificationOptions {
  orderId: string
  orderNumber: string
  message: string
  parseMode?: 'Markdown' | 'HTML'
  disableNotification?: boolean
}

export class TelegramNotificationsService {
  private apiBaseUrl: string

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl
  }

  /**
   * Send order confirmation via Telegram
   */
  async sendOrderConfirmation(order: Order): Promise<boolean> {
    try {
      await $fetch(`${this.apiBaseUrl}/notifications/telegram/order-confirmation`, {
        method: 'POST',
        body: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          items: order.items,
          total: order.total,
          orderType: order.orderType,
          deliveryDetails: order.deliveryDetails,
          pickupDetails: order.pickupDetails,
          dineInDetails: order.dineInDetails
        }
      })

      return true
    } catch (error: any) {
      console.error('Failed to send order confirmation via Telegram:', error)
      return false
    }
  }

  /**
   * Send order status update via Telegram
   */
  async sendOrderStatusUpdate(orderId: string, status: string, message?: string): Promise<boolean> {
    try {
      await $fetch(`${this.apiBaseUrl}/notifications/telegram/order-status`, {
        method: 'POST',
        body: {
          orderId,
          status,
          message
        }
      })

      return true
    } catch (error: any) {
      console.error('Failed to send order status update via Telegram:', error)
      return false
    }
  }

  /**
   * Send custom notification via Telegram
   */
  async sendNotification(options: TelegramNotificationOptions): Promise<boolean> {
    try {
      await $fetch(`${this.apiBaseUrl}/notifications/telegram/send`, {
        method: 'POST',
        body: {
          orderId: options.orderId,
          orderNumber: options.orderNumber,
          message: options.message,
          parseMode: options.parseMode || 'Markdown',
          disableNotification: options.disableNotification || false
        }
      })

      return true
    } catch (error: any) {
      console.error('Failed to send Telegram notification:', error)
      return false
    }
  }

  /**
   * Format order details for Telegram message
   */
  formatOrderMessage(order: Order): string {
    const lines: string[] = []

    lines.push(`🎉 *Order Confirmed!*`)
    lines.push(``)
    lines.push(`Order #${order.orderNumber}`)
    lines.push(``)
    lines.push(`📦 *Items:*`)
    
    order.items.forEach((item) => {
      lines.push(`• ${item.quantity}x ${item.menuItem.name} - $${item.subtotal.toFixed(2)}`)
      if (item.selectedModifiers && item.selectedModifiers.length > 0) {
        item.selectedModifiers.forEach((mod) => {
          lines.push(`  + ${mod.name}`)
        })
      }
    })

    lines.push(``)
    lines.push(`💰 *Total:* $${order.total.toFixed(2)}`)
    lines.push(``)

    if (order.orderType === 'delivery' && order.deliveryDetails) {
      lines.push(`🚚 *Delivery to:*`)
      lines.push(order.deliveryDetails.address)
      if (order.deliveryDetails.instructions) {
        lines.push(`Note: ${order.deliveryDetails.instructions}`)
      }
    } else if (order.orderType === 'pickup' && order.pickupDetails) {
      lines.push(`🏪 *Pickup*`)
      lines.push(`Time: ${new Date(order.pickupDetails.pickupTime).toLocaleString()}`)
    } else if (order.orderType === 'dine-in' && order.dineInDetails) {
      lines.push(`🍽️ *Dine-in*`)
      lines.push(`Table: ${order.dineInDetails.tableNumber}`)
    }

    lines.push(``)
    lines.push(`Status: ${this.formatStatus(order.status)}`)
    
    if (order.estimatedTime) {
      lines.push(`Estimated time: ${new Date(order.estimatedTime).toLocaleTimeString()}`)
    }

    return lines.join('\n')
  }

  /**
   * Format order status with emoji
   */
  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: '⏳ Pending',
      confirmed: '✅ Confirmed',
      preparing: '👨‍🍳 Preparing',
      ready: '✅ Ready',
      'in-transit': '🚚 On the way',
      delivered: '✅ Delivered',
      cancelled: '❌ Cancelled'
    }

    return statusMap[status] || status
  }
}

// Create singleton instance
let telegramNotificationsService: TelegramNotificationsService | null = null

export const useTelegramNotificationsService = () => {
  if (!telegramNotificationsService) {
    const config = useRuntimeConfig()
    telegramNotificationsService = new TelegramNotificationsService(config.public.apiBaseUrl as string)
  }
  return telegramNotificationsService
}
