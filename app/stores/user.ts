import { defineStore } from 'pinia'
import type { User, UserLocation, Notification, UpdateProfileDto, Promotion, ApiError, PaginationMeta } from '~/types'
import { useTenantStore } from '~/stores/tenant'
import { Platform } from '~/types'

interface UserState {
  // Clean business data
  user: User | null
  notifications: Notification[]
  promotions: Promotion[]
  location: UserLocation | null
  notificationsPagination: PaginationMeta | null
  promotionsPagination: PaginationMeta | null
  
  // Auth state
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  
  // App state
  platform: Platform
  loading: boolean
  error: ApiError | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    // Data
    user: null,
    notifications: [],
    promotions: [],
    location: null,
    notificationsPagination: null,
    promotionsPagination: null,
    
    // Auth
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    
    // Environment
    platform: Platform.WEB,
    loading: false,
    error: null,
  }),

  getters: {
    unreadNotificationsCount: state => {
      return state.notifications.filter(n => !n.isRead).length
    },
    isLoggedIn: state => state.isAuthenticated && !!state.accessToken,
    currentUser: state => state.user,
  },

  actions: {
    // --- Auth Actions ---
    
    setTokens(accessToken: string, refreshToken: string) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      this.isAuthenticated = true
      
      if (import.meta.client) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
      }
    },

    clearTokens() {
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false
      this.user = null
      
      if (import.meta.client) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('user_location')
      }
    },

    async initializeAuth() {
      if (!import.meta.client) return
      this.loading = true
      
      try {
        const accessToken = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')
        const userStr = localStorage.getItem('user')

        if (accessToken && refreshToken) {
          this.accessToken = accessToken
          this.refreshToken = refreshToken
          this.isAuthenticated = true

          if (userStr) {
            try {
              this.user = JSON.parse(userStr)
            } catch (e) {}
          }

          if (this.isTokenExpired()) {
            try {
              const refreshed = await (this as any).$apiClient.handleTokenRefresh()
              if (!refreshed) throw new Error('Token refresh failed')
            } catch (refreshError) {
              this.clearTokens()
              return
            }
          }

          await this.fetchUserProfile()
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        this.clearTokens()
      } finally {
        this.loading = false
      }
    },

    async login(credentials: { email: string; password: string; tenantSlug?: string }) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const loginData = {
          ...credentials,
          tenantSlug: credentials.tenantSlug || config.public.tenantSlug
        }
        
        const result = await (this as any).$apiClient.post('/auth/login', loginData)
        this.setTokens(result.accessToken, result.refreshToken)
        this.user = result.user
        
        if (import.meta.client) {
          localStorage.setItem('user', JSON.stringify(result.user))
        }

        return result
      } catch (error) {
        this.error = error as ApiError
        this.clearTokens()
        throw error
      } finally {
        this.loading = false
      }
    },

    async register(userData: any) {
      this.loading = true
      this.error = null
      try {
        const tenantStore = useTenantStore()
        const config = useRuntimeConfig()
        const slug = tenantStore.tenantSlug || config.public.tenantSlug
        
        if (!slug) {
          throw new Error('Tenant context missing. Unable to register.')
        }
        
        const endpoint = `/public/${slug}/auth/register`
        const result = await (this as any).$apiClient.post(endpoint, userData)
        this.setTokens(result.accessToken, result.refreshToken)
        this.user = result.user
        return result
      } catch (error) {
        this.error = error as ApiError
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        if (this.refreshToken) {
          await (this as any).$apiClient.post('/auth/logout', { refreshToken: this.refreshToken })
        }
      } catch (error) {
        console.error('Logout request failed:', error)
      } finally {
        this.clearTokens()
        this.loading = false
      }
    },

    async fetchUserProfile() {
      if (!this.isAuthenticated) return
      try {
        const profile = await (this as any).$apiClient.get('/auth/profile')
        this.user = profile
        if (import.meta.client) {
          localStorage.setItem('user', JSON.stringify(profile))
        }
        return profile
      } catch (error: any) {
        if (error.status === 401) {
          this.clearTokens()
        }
        throw error
      }
    },

    async changePassword(data: any) {
      return await (this as any).$apiClient.post('/auth/change-password', data)
    },

    async requestPasswordReset(email: string) {
      return await (this as any).$apiClient.post('/auth/forgot-password', { email })
    },

    async resetPassword(data: any) {
      return await (this as any).$apiClient.post('/auth/reset-password', data)
    },

    isTokenExpired(): boolean {
      if (!this.accessToken) return true
      try {
        const parts = this.accessToken.split('.')
        if (parts.length < 2 || !parts[1]) return true
        const payload = JSON.parse(atob(parts[1]))
        return payload.exp < Math.floor(Date.now() / 1000)
      } catch (error) {
        return true
      }
    },

    // --- User Initialization & Platform ---

    async initializeUser() {
      this.loading = true
      try {
        this.detectPlatform()
        if (this.platform === Platform.TELEGRAM) {
          await this.initializeTelegramUser()
        } else {
          await this.initializeAuth()
        }
        
        if (this.isAuthenticated) {
          await Promise.allSettled([
            this.fetchNotifications(),
            this.fetchPromotions(),
            this.fetchUserLocation()
          ])
        }
      } catch (error) {
        console.error('User initialization error:', error)
      } finally {
        this.loading = false
      }
    },

    detectPlatform() {
      if (import.meta.client) {
        const win = window as any
        if (win.Telegram?.WebApp?.initData) {
          this.platform = Platform.TELEGRAM
        } else {
          this.platform = Platform.WEB
        }
      }
    },

    async initializeTelegramUser() {
      const win = window as any
      if (import.meta.client && win.Telegram?.WebApp) {
        const tg = win.Telegram.WebApp
        tg.ready()

        if (tg.initDataUnsafe?.user) {
          const tUser = tg.initDataUnsafe.user
          this.user = {
            id: tUser.id.toString(),
            firstName: tUser.first_name,
            lastName: tUser.last_name || '',
            name: `${tUser.first_name} ${tUser.last_name || ''}`.trim(),
            email: '',
            role: 'CUSTOMER' as any,
            tenantId: '',
            isActive: true,
            emailVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            telegramId: tUser.id.toString(),
          }
          this.isAuthenticated = true
          this.platform = Platform.TELEGRAM
        }
      }
    },

    // --- Profile, Location, Notifications ---

    async updateProfile(data: UpdateProfileDto) {
      this.loading = true
      this.error = null
      try {
        const user = await (this as any).$services.user.updateProfile(data)
        this.user = user
        if (import.meta.client) {
          localStorage.setItem('user', JSON.stringify(user))
        }
      } catch (error) {
        this.error = error as ApiError
      } finally {
        this.loading = false
      }
    },

    async updateLocation(location: UserLocation) {
      this.loading = true
      this.error = null
      try {
        await (this as any).$services.user.updateLocation(location)
        this.location = location
        if (import.meta.client) {
          localStorage.setItem('user_location', JSON.stringify(location))
        }
      } catch (error) {
        this.error = error as ApiError
      } finally {
        this.loading = false
      }
    },

    async fetchNotifications(params?: any) {
      try {
        const result = await (this as any).$services.user.getNotifications(params)
        if (params?.page && params.page > 1) {
          this.notifications.push(...result.notifications)
        } else {
          this.notifications = result.notifications
        }
        this.notificationsPagination = result.pagination
      } catch (e) {}
    },

    async markNotificationRead(id: string) {
      try {
        await (this as any).$services.user.markNotificationRead(id)
        const notification = this.notifications.find(n => n.id === id)
        if (notification) notification.isRead = true
      } catch (e) {}
    },

    async fetchPromotions(params?: any) {
      try {
        const result = await (this as any).$services.user.getPromotions(params)
        this.promotions = result.items
        this.promotionsPagination = result.pagination
      } catch (e) {}
    },

    async fetchUserLocation() {
      try {
        const location = await (this as any).$services.user.getLocation()
        this.location = location
      } catch (e) {
        if (import.meta.client) {
          const saved = localStorage.getItem('user_location')
          if (saved) this.location = JSON.parse(saved)
        }
      }
    },
  },
})
