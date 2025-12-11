/**
 * Notification Service
 * Handles push notification subscriptions, WebSocket notifications, and in-app notifications
 */

import type { Notification } from '~/types'

interface InAppNotification {
  id: string
  type: 'order' | 'promotion' | 'system'
  title: string
  message: string
  isRead: boolean
  timestamp: string
  data?: any
}

interface NotificationPreferences {
  orderUpdates: boolean
  promotions: boolean
  reminders: boolean
}

class NotificationService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Array<(notification: InAppNotification) => void> = []
  private inAppNotifications: InAppNotification[] = []
  private unreadCount = 0

  constructor() {
    if (import.meta.client) {
      this.loadNotificationsFromStorage()
    }
  }

  /**
   * Connect to WebSocket for real-time notifications
   */
  connect(orderId?: string): void {
    if (!import.meta.client) return
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return

    const config = useRuntimeConfig()
    const wsUrl = config.public.wsUrl || 'ws://localhost:3000'
    const url = orderId ? `${wsUrl}/notifications?orderId=${orderId}` : `${wsUrl}/notifications`

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('WebSocket connected for notifications')
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleNotification(data)
        } catch (error) {
          console.error('Failed to parse notification:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.attemptReconnect(orderId)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(orderId?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      this.connect(orderId)
    }, delay)
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(data: any): void {
    const notification: InAppNotification = {
      id: data.id || Date.now().toString(),
      type: data.type || 'system',
      title: data.title || 'Notification',
      message: data.message || '',
      isRead: false,
      timestamp: data.timestamp || new Date().toISOString(),
      data: data.data
    }

    // Add to in-app notifications
    this.inAppNotifications.unshift(notification)
    this.unreadCount++

    // Save to storage
    this.saveNotificationsToStorage()

    // Notify listeners
    this.listeners.forEach(listener => listener(notification))

    // Show browser notification if permitted
    this.showBrowserNotification(notification)
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: InAppNotification): void {
    if (!import.meta.client) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: notification.id,
        data: notification.data,
        requireInteraction: notification.type === 'order'
      })

      browserNotification.onclick = () => {
        window.focus()
        browserNotification.close()
        
        // Navigate based on notification type
        if (notification.type === 'order' && notification.data?.orderId) {
          window.location.href = `/orders/track/${notification.data.orderId}`
        }
      }
    } catch (error) {
      console.error('Failed to show browser notification:', error)
    }
  }

  /**
   * Subscribe to notifications
   */
  onNotification(callback: (notification: InAppNotification) => void): void {
    this.listeners.push(callback)
  }

  /**
   * Get all in-app notifications
   */
  getInAppNotifications(): InAppNotification[] {
    return this.inAppNotifications
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.unreadCount
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.inAppNotifications.find(n => n.id === notificationId)
    if (notification && !notification.isRead) {
      notification.isRead = true
      this.unreadCount = Math.max(0, this.unreadCount - 1)
      this.saveNotificationsToStorage()
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.inAppNotifications.forEach(n => {
      n.isRead = true
    })
    this.unreadCount = 0
    this.saveNotificationsToStorage()
  }

  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    this.inAppNotifications = []
    this.unreadCount = 0
    this.saveNotificationsToStorage()
  }

  /**
   * Save notifications to local storage
   */
  private saveNotificationsToStorage(): void {
    if (!import.meta.client) return
    
    try {
      localStorage.setItem('notifications', JSON.stringify(this.inAppNotifications))
      localStorage.setItem('unreadCount', this.unreadCount.toString())
    } catch (error) {
      console.error('Failed to save notifications to storage:', error)
    }
  }

  /**
   * Load notifications from local storage
   */
  private loadNotificationsFromStorage(): void {
    if (!import.meta.client) return

    try {
      const stored = localStorage.getItem('notifications')
      if (stored) {
        this.inAppNotifications = JSON.parse(stored)
      }

      const unreadCount = localStorage.getItem('unreadCount')
      if (unreadCount) {
        this.unreadCount = parseInt(unreadCount, 10)
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error)
    }
  }

  /**
   * Get VAPID public key for push notifications
   */
  async getVapidPublicKey(): Promise<string | null> {
    try {
      const config = useRuntimeConfig()
      const response = await fetch(`${config.public.apiUrl}/notifications/vapid-public-key`)
      
      if (!response.ok) {
        throw new Error('Failed to get VAPID public key')
      }

      const data = await response.json()
      return data.publicKey
    } catch (error) {
      console.error('Failed to get VAPID public key:', error)
      return null
    }
  }

  /**
   * Register push subscription with backend
   */
  async registerPushSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
      const config = useRuntimeConfig()
      const { useTenantStore } = await import('~/stores/tenant')
      const tenantStore = useTenantStore()
      
      const response = await fetch(`${config.public.apiUrl}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantStore.tenantId || ''
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to register push subscription:', error)
      return false
    }
  }

  /**
   * Unregister push subscription from backend
   */
  async unregisterPushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const config = useRuntimeConfig()
      const { useTenantStore } = await import('~/stores/tenant')
      const tenantStore = useTenantStore()
      
      await fetch(`${config.public.apiUrl}/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantStore.tenantId || ''
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })
    } catch (error) {
      console.error('Failed to unregister push subscription:', error)
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      const config = useRuntimeConfig()
      const { useTenantStore } = await import('~/stores/tenant')
      const tenantStore = useTenantStore()
      
      const response = await fetch(`${config.public.apiUrl}/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantStore.tenantId || ''
        }
      })

      return response.ok
    } catch (error) {
      console.error('Failed to send test notification:', error)
      return false
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<boolean> {
    try {
      const config = useRuntimeConfig()
      const { useTenantStore } = await import('~/stores/tenant')
      const tenantStore = useTenantStore()
      
      const response = await fetch(`${config.public.apiUrl}/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantStore.tenantId || ''
        },
        body: JSON.stringify(preferences)
      })

      return response.ok
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      return false
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences | null> {
    try {
      const config = useRuntimeConfig()
      const { useTenantStore } = await import('~/stores/tenant')
      const tenantStore = useTenantStore()
      
      const response = await fetch(`${config.public.apiUrl}/notifications/preferences`, {
        headers: {
          'X-Tenant-ID': tenantStore.tenantId || ''
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get notification preferences')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      return null
    }
  }

  /**
   * Update push subscription for tenant
   */
  async updatePushSubscriptionForTenant(): Promise<boolean> {
    try {
      const config = useRuntimeConfig()
      const { useTenantStore } = await import('~/stores/tenant')
      const tenantStore = useTenantStore()
      
      const response = await fetch(`${config.public.apiUrl}/notifications/update-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantStore.tenantId || ''
        }
      })

      return response.ok
    } catch (error) {
      console.error('Failed to update push subscription for tenant:', error)
      return false
    }
  }
}

// Singleton instance
let notificationServiceInstance: NotificationService | null = null

export const useNotificationService = (): NotificationService => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService()
  }
  return notificationServiceInstance
}
