import { defineStore } from 'pinia'
import type { Notification, Promotion } from '~/types'

interface NotificationState {
  notifications: Notification[]
  promotions: Promotion[]
  unreadCount: number
  loading: boolean
  error: string | null
  initialized: boolean
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
    promotions: [],
    unreadCount: 0,
    loading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    unreadNotifications: (state) => {
      return state.notifications.filter(n => !n.isRead)
    },

    notificationsByType: (state) => {
      return (type: string) => state.notifications.filter(n => n.type === type)
    },

    activePromotions: (state) => {
      const now = new Date()
      return state.promotions.filter(p => !p.isActive || new Date(p.validTo) > now)
    },
  },

  actions: {
    async initialize() {
      if (this.initialized) return

      try {
        const notificationService = (this as any).$services.notification

        // Subscribe to new notifications
        notificationService.onNotification((notification: any) => {
          this.addNotification({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            isRead: notification.isRead,
            createdAt: notification.timestamp
          })
        })

        // Load existing notifications
        const existingNotifications = notificationService.getInAppNotifications()
        existingNotifications.forEach((notification: any) => {
          this.notifications.push({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            isRead: notification.isRead,
            createdAt: notification.timestamp
          })
        })

        this.unreadCount = notificationService.getUnreadCount()
        this.initialized = true
      } catch (error) {
        console.error('Failed to initialize notification store:', error)
        this.error = 'Failed to initialize notifications'
      }
    },

    async fetchNotifications() {
      this.loading = true
      this.error = null
      try {
        await this.initialize()
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch notifications'
      } finally {
        this.loading = false
      }
    },

    addNotification(notification: Notification) {
      const exists = this.notifications.some(n => n.id === notification.id)
      if (exists) return

      this.notifications.unshift(notification)
      if (!notification.isRead) {
        this.unreadCount++
      }
    },

    markAsRead(notificationId: string) {
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification && !notification.isRead) {
        notification.isRead = true
        this.unreadCount = Math.max(0, this.unreadCount - 1)
        
        if (import.meta.client) {
          (this as any).$services.notification.markAsRead(notificationId)
        }
      }
    },

    markAllAsRead() {
      this.notifications.forEach(n => {
        n.isRead = true
      })
      this.unreadCount = 0

      if (import.meta.client) {
        (this as any).$services.notification.markAllAsRead()
      }
    },

    removeNotification(notificationId: string) {
      const index = this.notifications.findIndex(n => n.id === notificationId)
      if (index > -1) {
        const notification = this.notifications[index]
        if (notification && !notification.isRead) {
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
        this.notifications.splice(index, 1)
      }
    },

    addPromotion(promotion: Promotion) {
      this.promotions.unshift(promotion)
    },

    clearAll() {
      this.notifications = []
      this.promotions = []
      this.unreadCount = 0

      if (import.meta.client) {
        (this as any).$services.notification.clearNotifications()
      }
    },
  },
})
