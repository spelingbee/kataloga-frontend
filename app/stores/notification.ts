import { defineStore } from 'pinia'
import type { Notification, Promotion } from '~/types'

interface NotificationState {
  notifications: Notification[]
  promotions: Promotion[]
  unreadCount: number
  loading: boolean
  error: string | null
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
    promotions: [],
    unreadCount: 0,
    loading: false,
    error: null,
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
    addNotification(notification: Notification) {
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
      }
    },

    markAllAsRead() {
      this.notifications.forEach(n => {
        n.isRead = true
      })
      this.unreadCount = 0
    },

    removeNotification(notificationId: string) {
      const index = this.notifications.findIndex(n => n.id === notificationId)
      if (index > -1) {
        const notification = this.notifications[index]
        if (!notification.isRead) {
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
    },
  },
})