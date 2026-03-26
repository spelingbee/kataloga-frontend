import { defineStore } from 'pinia'
import { useApiClient } from '~/utils/api'
import { safeArrayAccess } from '~/types/utils/type-guards'
import { AuthService } from '~/services/api.service'
import type { User, UpdateProfileDto, ApiError } from '~/types'

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: ApiError | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }),

  getters: {
    isLoggedIn: (state) => state.isAuthenticated && !!state.accessToken,
    currentUser: (state) => state.user,
  },

  actions: {
    setTokens(accessToken: string) {
      this.accessToken = accessToken
      this.isAuthenticated = true
      
      // Persist ONLY accessToken to localStorage
      if (import.meta.client) {
        localStorage.setItem('accessToken', accessToken)
        // Set a companion flag to know if silent refresh should be attempted
        localStorage.setItem('hasSession', 'true')
        // Ensure old refreshToken is removed if it exists
        localStorage.removeItem('refreshToken')
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
      this.isAuthenticated = false
      this.user = null
      
      // Clear from localStorage
      if (import.meta.client) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('hasSession')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    },

    async initializeAuth() {
      if (!import.meta.client) return

      this.loading = true
      
      try {
        // Restore accessToken and user from localStorage
        const accessToken = localStorage.getItem('accessToken')
        const userStr = localStorage.getItem('user')

        if (userStr) {
          this.user = JSON.parse(userStr)
        }

        if (accessToken) {
          this.accessToken = accessToken
          this.isAuthenticated = true

          // Check if token is expired
          if (this.isTokenExpired()) {
            // Try to refresh the token using the httpOnly cookie
            try {
              const apiClient = useApiClient()
              const refreshed = await apiClient.handleTokenRefresh()
              
              if (!refreshed) {
                this.clearTokens()
                return
              }
            } catch (refreshError) {
              console.error('Token refresh failed during initialization:', refreshError)
              this.clearTokens()
              return
            }
          }

          // Verify token validity by fetching user profile
          await this.fetchUserProfile()
        } else {
          // No access token, but might have a session cookie. Try silent refresh if we think a session exists.
          if (import.meta.client && localStorage.getItem('hasSession') === 'true') {
            try {
              const apiClient = useApiClient()
              const refreshed = await apiClient.handleTokenRefresh()
              if (refreshed) {
                await this.fetchUserProfile()
              }
            } catch (e) {
              // No session
            }
          }
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
      
      const loginData = {
        ...credentials,
        tenantSlug: credentials.tenantSlug || useRuntimeConfig().public.tenantSlug
      }
      
      const result = await AuthService.login(loginData)
      
      if (result.success) {
        this.setTokens(result.data.accessToken)
        this.setUser(result.data.user)
        
        // Sync favorites after successful login
        try {
          const { useFavoritesStore } = await import('./favorites')
          const favoritesStore = useFavoritesStore()
          await favoritesStore.syncFavoritesToServer()
          await favoritesStore.fetchFavoritesFromServer()
        } catch (error) {
          console.error('Failed to sync favorites after login:', error)
        }
        
        this.loading = false
        return result.data
      } else {
        this.error = result.error
        this.clearTokens()
        this.loading = false
        throw result.error
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
      
      const registrationData = {
        email: userData.email,
        password: userData.password,
        name: `${userData.firstName} ${userData.lastName}`,
        tenantSlug: userData.tenantSlug || useRuntimeConfig().public.tenantSlug
      }
      
      const result = await AuthService.register(registrationData)
      
      if (result.success) {
        this.setTokens(result.data.accessToken)
        this.setUser(result.data.user)
        
        // Sync favorites after successful registration
        try {
          const { useFavoritesStore } = await import('./favorites')
          const favoritesStore = useFavoritesStore()
          await favoritesStore.syncFavoritesToServer()
        } catch (error) {
          console.error('Failed to sync favorites after registration:', error)
        }
        
        this.loading = false
        return result.data
      } else {
        this.error = result.error
        this.clearTokens()
        this.loading = false
        throw result.error
      }
    },

    async logout() {
      this.loading = true
      
      const result = await AuthService.logout()
      if (!result.success) {
        console.error('Logout request failed:', result.error)
      }
      
      this.clearTokens()
      this.loading = false
    },

    async fetchUserProfile() {
      if (!this.isAuthenticated) return

      const result = await AuthService.getProfile()
      
      if (result.success) {
        this.setUser(result.data)
        return result.data
      } else {
        console.error('Failed to fetch user profile:', result.error)
        
        // If it's an authentication error, clear tokens
        if (result.error.code === 'AUTHENTICATION_ERROR') {
          this.clearTokens()
          // Redirect to login page
          if (import.meta.client) {
            await navigateTo('/auth/login')
          }
        }
        throw result.error
      }
    },

    async updateProfile(updates: UpdateProfileDto) {
      if (!this.isAuthenticated) return

      this.loading = true
      this.error = null
      
      const result = await AuthService.updateProfile(updates)
      
      if (result.success) {
        this.setUser(result.data)
        this.loading = false
        return result.data
      } else {
        this.error = result.error
        this.loading = false
        throw result.error
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
        const apiClient = useApiClient()
        // API client now returns unwrapped data directly
        const result = await apiClient.post<{ success: boolean; message: string }>('/auth/change-password', data)
        
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
        const apiClient = useApiClient()
        // API client now returns unwrapped data directly
        const result = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', { email })
        
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
        const apiClient = useApiClient()
        // API client now returns unwrapped data directly
        const result = await apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', data)
        
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
          const apiClient = useApiClient()
          await apiClient.handleTokenRefresh()
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
        const tokenParts = this.accessToken.split('.')
        const payloadPart = safeArrayAccess(tokenParts, 1)
        if (!payloadPart) return true
        
        const payload = JSON.parse(atob(payloadPart))
        const currentTime = Math.floor(Date.now() / 1000)
        return payload.exp < currentTime
      } catch (error) {
        console.error('Error decoding token:', error)
        return true
      }
    },
  },
})