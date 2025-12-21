import { defineStore } from 'pinia'
import type { User, UpdateProfileDto, ApiError } from '~/types'

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: ApiError | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }),

  getters: {
    isLoggedIn: (state) => state.isAuthenticated && !!state.accessToken,
    currentUser: (state) => state.user,
  },

  actions: {
    setTokens(accessToken: string, refreshToken: string) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      this.isAuthenticated = true
      
      // Persist tokens to localStorage
      if (import.meta.client) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
      }
    },

    setUser(user: User) {
      this.user = user
      
      // Persist user to localStorage
      if (import.meta.client) {
        localStorage.setItem('user', JSON.stringify(user))
      }
    },

    clearTokens() {
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false
      this.user = null
      
      // Clear from localStorage
      if (import.meta.client) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    },

    async initializeAuth() {
      if (!import.meta.client) return

      this.loading = true
      
      try {
        // Restore tokens from localStorage
        const accessToken = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')
        const userStr = localStorage.getItem('user')

        if (accessToken && refreshToken) {
          this.accessToken = accessToken
          this.refreshToken = refreshToken
          this.isAuthenticated = true

          if (userStr) {
            this.user = JSON.parse(userStr)
          }

          // Check if token is expired
          if (this.isTokenExpired()) {
            // Try to refresh the token
            try {
              const nuxtApp = useNuxtApp()
              const $apiClient = (nuxtApp as any).$apiClient
              const refreshed = await $apiClient.handleTokenRefresh()
              
              if (!refreshed) {
                throw new Error('Token refresh failed')
              }
            } catch (refreshError) {
              console.error('Token refresh failed during initialization:', refreshError)
              this.clearTokens()
              return
            }
          }

          // Verify token validity by fetching user profile
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
        const nuxtApp = useNuxtApp()
        const $apiClient = (nuxtApp as any).$apiClient
        
        // Include tenant slug in login request if provided
        const loginData = {
          ...credentials,
          tenantSlug: credentials.tenantSlug || useRuntimeConfig().public.tenantSlug
        }
        
        // API client now returns unwrapped data directly
        const loginResult = await $apiClient.post('/auth/login', loginData)
        
        this.setTokens(loginResult.accessToken, loginResult.refreshToken)
        this.setUser(loginResult.user)
        
        // Sync favorites after successful login
        try {
          const { useFavoritesStore } = require('./favorites')
          const favoritesStore = useFavoritesStore()
          await favoritesStore.syncFavoritesToServer()
          await favoritesStore.fetchFavoritesFromServer()
        } catch (error) {
          console.error('Failed to sync favorites after login:', error)
        }
        
        return loginResult
      } catch (error) {
        this.error = error as ApiError
        this.clearTokens()
        throw error
      } finally {
        this.loading = false
      }
    },

    async register(userData: { 
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
      tenantSlug?: string
    }) {
      this.loading = true
      this.error = null
      
      try {
        const nuxtApp = useNuxtApp()
        const $apiClient = (nuxtApp as any).$apiClient
        
        // Include tenant slug in registration request
        const registrationData = {
          ...userData,
          tenantSlug: userData.tenantSlug || useRuntimeConfig().public.tenantSlug
        }
        
        // API client now returns unwrapped data directly
        const registrationResult = await $apiClient.post('/auth/register', registrationData)
        
        this.setTokens(registrationResult.accessToken, registrationResult.refreshToken)
        this.setUser(registrationResult.user)
        
        // Sync favorites after successful registration
        try {
          const { useFavoritesStore } = require('./favorites')
          const favoritesStore = useFavoritesStore()
          await favoritesStore.syncFavoritesToServer()
        } catch (error) {
          console.error('Failed to sync favorites after registration:', error)
        }
        
        return registrationResult
      } catch (error) {
        this.error = error as ApiError
        this.clearTokens()
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      
      try {
        const nuxtApp = useNuxtApp()
        const $apiClient = (nuxtApp as any).$apiClient
        await $apiClient.post('/auth/logout', { refreshToken: this.refreshToken })
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
        const nuxtApp = useNuxtApp()
        const $apiClient = (nuxtApp as any).$apiClient
        // API client now returns unwrapped data directly
        const userProfile = await $apiClient.get('/auth/profile')
        
        this.setUser(userProfile)
        return userProfile
      } catch (error: any) {
        console.error('Failed to fetch user profile:', error)
        
        // If it's an authentication error, clear tokens
        if (error.status === 401 || error.name === 'AuthenticationError') {
          this.clearTokens()
          // Redirect to login page
          if (import.meta.client) {
            await navigateTo('/auth/login')
          }
        }
        throw error
      }
    },

    async updateProfile(updates: UpdateProfileDto) {
      if (!this.isAuthenticated) return

      this.loading = true
      this.error = null
      
      try {
        const nuxtApp = useNuxtApp()
        const $apiClient = (nuxtApp as any).$apiClient
        // API client now returns unwrapped data directly
        const updatedUser = await $apiClient.patch('/auth/profile', updates)
        
        this.setUser(updatedUser)
        return updatedUser
      } catch (error) {
        this.error = error as ApiError
        throw error
      } finally {
        this.loading = false
      }
    },

    async changePassword(data: { 
      currentPassword: string
      newPassword: string 
    }) {
      if (!this.isAuthenticated) return

      this.loading = true
      this.error = null
      
      try {
        const nuxtApp = useNuxtApp()
        const $apiClient = (nuxtApp as any).$apiClient
        // API client now returns unwrapped data directly
        const result = await $apiClient.post('/auth/change-password', data)
        
        return result
      } catch (error) {
        this.error = error as ApiError
        throw error
      } finally {
        this.loading = false
      }
    },

    async requestPasswordReset(email: string) {
      this.loading = true
      this.error = null
      
      try {
        const nuxtApp = useNuxtApp()
        const $apiClient = (nuxtApp as any).$apiClient
        // API client now returns unwrapped data directly
        const result = await $apiClient.post('/auth/forgot-password', { email })
        
        return result
      } catch (error) {
        this.error = error as ApiError
        throw error
      } finally {
        this.loading = false
      }
    },

    async resetPassword(data: { 
      token: string
      newPassword: string 
    }) {
      this.loading = true
      this.error = null
      
      try {
        const nuxtApp = useNuxtApp()
        const $apiClient = (nuxtApp as any).$apiClient
        // API client now returns unwrapped data directly
        const result = await $apiClient.post('/auth/reset-password', data)
        
        return result
      } catch (error) {
        this.error = error as ApiError
        throw error
      } finally {
        this.loading = false
      }
    },

    async handleAuthError(error: any) {
      // Handle different types of authentication errors
      if (error.status === 401) {
        this.clearTokens()
        if (import.meta.client) {
          await navigateTo('/auth/login')
        }
      } else if (error.status === 403) {
        // Forbidden - user doesn't have permission
        console.error('Access forbidden:', error.message)
      } else if (error.code === 'TOKEN_EXPIRED') {
        // Try to refresh token
        try {
          const nuxtApp = useNuxtApp()
          const $apiClient = (nuxtApp as any).$apiClient
          await $apiClient.handleTokenRefresh()
        } catch (refreshError) {
          this.clearTokens()
          if (import.meta.client) {
            await navigateTo('/auth/login')
          }
        }
      }
    },

    isTokenExpired(): boolean {
      if (!this.accessToken) return true
      
      try {
        // Decode JWT token to check expiration
        const payload = JSON.parse(atob(this.accessToken.split('.')[1]))
        const currentTime = Math.floor(Date.now() / 1000)
        return payload.exp < currentTime
      } catch (error) {
        console.error('Error decoding token:', error)
        return true
      }
    },
  },
})