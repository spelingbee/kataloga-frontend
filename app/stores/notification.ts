import { defineStore } from 'pinia'
import type { Notification, Promotion } from '~/types'
import { isDefined } from '~/types/utils/type-guards'

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
      return state.promotions.filter(p => p.isActive && new Date(p.validTo) > now)
    },
  },

  actions: {
    /**
     * Initialize notification store with WebSocket service
     */
    async initialize() {
      if (this.initialized) return

      try {
        // Import notification service dynamically
        const { useNotificationService } = await import('~/services/notification.service')
        const notificationService = useNotificationService()

        // Subscribe to new notifications
        notificationService.onNotification((notification) => {
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
        existingNotifications.forEach(notification => {
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

    /**
     * Fetch notifications from API
     */
    async fetchNotifications() {
      this.loading = true
      this.error = null

      try {
        // In a real app, this would fetch from API
        // For now, we rely on WebSocket notifications
        await this.initialize()
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch notifications'
        console.error('Fetch notifications error:', error)
      } finally {
        this.loading = false
      }
    },

    addNotification(notification: Notification) {
      // Check if notification already exists
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

        // Also mark as read in notification service
        if (import.meta.client) {
          import('~/services/notification.service').then(({ useNotificationService }) => {
            const notificationService = useNotificationService()
            notificationService.markAsRead(notificationId)
          })
        }
      }
    },

    markAllAsRead() {
      this.notifications.forEach(n => {
        n.isRead = true
      })
      this.unreadCount = 0

      // Also mark all as read in notification service
      if (import.meta.client) {
        import('~/services/notification.service').then(({ useNotificationService }) => {
          const notificationService = useNotificationService()
          notificationService.markAllAsRead()
        })
      }
    },

    removeNotification(notificationId: string) {
      const index = this.notifications.findIndex(n => n.id === notificationId)
      if (index > -1) {
        const notification = this.notifications[index]
        if (isDefined(notification) && !notification.isRead) {
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

      // Also clear in notification service
      if (import.meta.client) {
        import('~/services/notification.service').then(({ useNotificationService }) => {
          const notificationService = useNotificationService()
          notificationService.clearNotifications()
        })
      }
    },
  },
})