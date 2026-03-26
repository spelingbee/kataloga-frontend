import { defineStore } from 'pinia'
import { useUserService } from '~/services/user.service'
import { updateReadonlyObject } from '~/types/utils/readonly'
import type { User, UserLocation, Notification, UpdateProfileDto, Promotion, ApiError, PaginationMeta } from '~/types'
import { Platform, UserRole } from '~/types'

export interface UserState {
  // Clean business data only
  user: User | null
  notifications: Notification[]
  promotions: Promotion[]
  location: UserLocation | null
  notificationsPagination: PaginationMeta | null
  promotionsPagination: PaginationMeta | null

  // State management
  isAuthenticated: boolean
  platform: Platform
  loading: boolean
  error: ApiError | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    // Clean business data only
    user: null,
    notifications: [],
    promotions: [],
    location: null,
    notificationsPagination: null,
    promotionsPagination: null,

    // State management
    isAuthenticated: false,
    platform: Platform.WEB,
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
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name || '',
            name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
            email: '',
            role: UserRole.CUSTOMER,
            tenantId: '',
            isActive: true,
            emailVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            telegramId: telegramUser.id.toString(),
          }
          this.isAuthenticated = true
        }
      }
    },

    initializeFromTelegram(telegramUser: any) {
      this.user = {
        id: telegramUser.id.toString(),
        firstName: telegramUser.firstName,
        lastName: telegramUser.lastName || '',
        name: telegramUser.firstName + (telegramUser.lastName ? ` ${telegramUser.lastName}` : ''),
        email: '',
        role: UserRole.CUSTOMER,
        tenantId: '',
        isActive: true,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        const user = await userService.updateProfile(data)

        // Store clean data directly
        this.user = user

      } catch (error) {
        this.error = error as ApiError
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

        // Store clean data directly
        this.location = location

        // Persist location
        if (import.meta.client) {
          localStorage.setItem('user_location', JSON.stringify(location))
        }
      } catch (error) {
        this.error = error as ApiError
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
        const result = await userService.getNotifications(params)

        // Store clean data directly
        if (params?.page && params.page > 1) {
          // Append for pagination
          this.notifications.push(...result.notifications)
        } else {
          this.notifications = result.notifications
        }
        this.notificationsPagination = result.pagination

      } catch (error) {
        this.error = error as ApiError
        console.error('Notifications fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async markNotificationRead(id: string) {
      try {
        const userService = useUserService()
        await userService.markNotificationRead(id)

        const notificationIndex = this.notifications.findIndex(n => n.id === id)
        if (notificationIndex >= 0) {
          const notification = this.notifications[notificationIndex]
          if (!notification) return

          const updatedNotification = updateReadonlyObject(notification, {
            isRead: true
          })
          this.notifications[notificationIndex] = updatedNotification
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    },

    async markAllNotificationsRead() {
      try {
        const userService = useUserService()
        await userService.markAllNotificationsRead()

        this.notifications = this.notifications.map(notification =>
          updateReadonlyObject(notification, {
            isRead: true
          })
        )
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
        const result = await userService.getPromotions(params)

        // Store clean data directly
        if (params?.page && params.page > 1) {
          // Append for pagination
          this.promotions.push(...result.items)
        } else {
          this.promotions = result.items
        }
        this.promotionsPagination = result.pagination

      } catch (error) {
        this.error = error as ApiError
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
        const result = await userService.claimPromotion(promotionId)
        return result
      } catch (error) {
        this.error = error as ApiError
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
        const location = await userService.getLocation()

        // Store clean data directly
        this.location = location

        // Persist location
        if (import.meta.client) {
          localStorage.setItem('user_location', JSON.stringify(location))
        }
      } catch (error) {
        this.error = error as ApiError
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

