import { defineStore } from 'pinia'
import { useUserService } from '~/services/user.service'
import type { User, UserLocation, Notification, UpdateProfileDto, Promotion } from '~/types'
import { Platform } from '~/types'

interface UserState {
  user: User | null
  isAuthenticated: boolean
  platform: Platform
  notifications: Notification[]
  promotions: Promotion[]
  location: UserLocation | null
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    isAuthenticated: false,
    platform: Platform.WEB,
    notifications: [],
    promotions: [],
    location: null,
    loading: false,
    error: null,
  }),

  getters: {
    unreadNotificationsCount: state => {
      return state.notifications.filter(n => !n.isRead).length
    },
  },

  actions: {
    async initializeUser() {
      this.loading = true

      try {
        // Detect platform
        this.detectPlatform()

        // Initialize user based on platform
        if (this.platform === Platform.TELEGRAM) {
          await this.initializeTelegramUser()
        } else {
          await this.initializeWebUser()
        }
      } catch (error) {
        console.error('User initialization error:', error)
      } finally {
        this.loading = false
      }
    },

    detectPlatform() {
      if (import.meta.client) {
        // Check if running in Telegram Web App
        if (window.Telegram?.WebApp) {
          this.platform = Platform.TELEGRAM
        } else {
          this.platform = Platform.WEB
        }
      }
    },

    async initializeTelegramUser() {
      // This will be implemented in Telegram integration task
      if (import.meta.client && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.ready()

        // Extract user data from Telegram
        if (tg.initDataUnsafe?.user) {
          const telegramUser = tg.initDataUnsafe.user
          this.user = {
            id: telegramUser.id.toString(),
            name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
            telegramId: telegramUser.id.toString(),
          }
          this.isAuthenticated = true
        }
      }
    },

    initializeFromTelegram(telegramUser: any) {
      this.user = {
        id: telegramUser.id.toString(),
        name: telegramUser.firstName + (telegramUser.lastName ? ` ${telegramUser.lastName}` : ''),
        telegramId: telegramUser.id.toString(),
        preferences: {
          favoriteItems: [],
          dietaryRestrictions: []
        }
      }
      this.isAuthenticated = true
      this.platform = Platform.TELEGRAM
    },

    async initializeWebUser() {
      // This will be implemented in web authentication task
      // Check for stored authentication token
      if (import.meta.client) {
        const token = localStorage.getItem('auth_token')
        if (token) {
          // Validate token and fetch user data
          // This will be implemented in API integration task
        }
      }
    },

    async updateProfile(data: UpdateProfileDto) {
      this.loading = true
      this.error = null

      try {
        const userService = useUserService()
        const response = await userService.updateProfile(data)

        if (response.success && response.data) {
          this.user = response.data
        } else {
          throw new Error(response.message || 'Failed to update profile')
        }
      } catch (error) {
        this.error = 'Failed to update profile'
        console.error('Profile update error:', error)
      } finally {
        this.loading = false
      }
    },

    async updateLocation(location: UserLocation) {
      this.loading = true
      this.error = null

      try {
        const userService = useUserService()
        await userService.updateLocation(location)
        
        this.location = location

        // Persist location
        if (import.meta.client) {
          localStorage.setItem('user_location', JSON.stringify(location))
        }
      } catch (error) {
        this.error = 'Failed to update location'
        console.error('Location update error:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchNotifications(params?: {
      type?: 'order' | 'promotion' | 'system'
      unread?: boolean
      page?: number
      limit?: number
    }) {
      this.loading = true
      this.error = null

      try {
        const userService = useUserService()
        const response = await userService.getNotifications(params)

        if (response.success && response.data) {
          if (params?.page && params.page > 1) {
            // Append for pagination
            this.notifications.push(...response.data.notifications)
          } else {
            this.notifications = response.data.notifications
          }
        }
      } catch (error) {
        this.error = 'Failed to fetch notifications'
        console.error('Notifications fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async markNotificationRead(id: string) {
      try {
        const userService = useUserService()
        await userService.markNotificationRead(id)
        
        const notification = this.notifications.find(n => n.id === id)
        if (notification) {
          notification.isRead = true
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    },

    async markAllNotificationsRead() {
      try {
        const userService = useUserService()
        await userService.markAllNotificationsRead()
        
        this.notifications.forEach(notification => {
          notification.isRead = true
        })
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error)
      }
    },

    async fetchPromotions(params?: {
      active?: boolean
      category?: string
      page?: number
      limit?: number
    }) {
      this.loading = true
      this.error = null

      try {
        const userService = useUserService()
        const response = await userService.getPromotions(params)

        if (response.success && response.data) {
          if (params?.page && params.page > 1) {
            // Append for pagination
            this.promotions.push(...response.data.promotions)
          } else {
            this.promotions = response.data.promotions
          }
        }
      } catch (error) {
        this.error = 'Failed to fetch promotions'
        console.error('Promotions fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async claimPromotion(promotionId: string) {
      this.loading = true
      this.error = null

      try {
        const userService = useUserService()
        const response = await userService.claimPromotion(promotionId)

        if (response.success && response.data) {
          return response.data
        } else {
          throw new Error(response.message || 'Failed to claim promotion')
        }
      } catch (error) {
        this.error = 'Failed to claim promotion'
        console.error('Promotion claim error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async fetchUserLocation() {
      this.loading = true
      this.error = null

      try {
        const userService = useUserService()
        const response = await userService.getLocation()

        if (response.success && response.data) {
          this.location = response.data
          
          // Persist location
          if (import.meta.client) {
            localStorage.setItem('user_location', JSON.stringify(response.data))
          }
        }
      } catch (error) {
        this.error = 'Failed to fetch user location'
        console.error('User location fetch error:', error)
        
        // Fall back to localStorage
        if (import.meta.client) {
          const savedLocation = localStorage.getItem('user_location')
          if (savedLocation) {
            try {
              this.location = JSON.parse(savedLocation)
            } catch (parseError) {
              console.error('Failed to parse saved location:', parseError)
            }
          }
        }
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
      this.notifications = []

      if (import.meta.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_location')
      }
    },
  },
})

// Extend window interface for TypeScript
declare global {
  interface Window {
    Telegram?: {
      WebApp: any
    }
  }
}
