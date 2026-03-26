import { useAuthStore } from '~/stores/auth'
import { useApiClient } from '~/utils/api'
import type { User, UpdateProfileDto } from '~/types'

export interface LoginCredentials {
  email: string
  password: string
  tenantSlug?: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  tenantSlug?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export const useAuth = () => {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  // Reactive state
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)

  // Clear error when starting new operations
  const clearError = () => {
    error.value = null
  }

  // Get stored token
  const getToken = (): string | null => {
    return authStore.accessToken
  }

  // Login with email and password
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    clearError()
    isLoading.value = true

    try {
      const loginData = {
        ...credentials,
        tenantSlug: credentials.tenantSlug || config.public.tenantSlug
      }

      await authStore.login(loginData)
      return true
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      console.error('Login error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Register new user
  const register = async (data: RegisterData): Promise<boolean> => {
    clearError()
    isLoading.value = true

    try {
      const registrationData = {
        ...data,
        tenantSlug: data.tenantSlug || config.public.tenantSlug
      }

      await authStore.register(registrationData)
      return true
    } catch (err: any) {
      error.value = err.message || 'Registration failed'
      console.error('Registration error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Logout user
  const logout = async (): Promise<void> => {
    clearError()
    isLoading.value = true

    try {
      await authStore.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Refresh authentication token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const apiClient = useApiClient()
      return await apiClient.handleTokenRefresh()
    } catch (err) {
      console.error('Token refresh error:', err)
      return false
    }
  }

  // Verify current session
  const verifySession = async (): Promise<boolean> => {
    try {
      await authStore.fetchUserProfile()
      return true
    } catch (err: any) {
      console.error('Session verification error:', err)
      return false
    }
  }

  // Initialize authentication state
  const initializeAuth = async (): Promise<void> => {
    if (import.meta.server) return

    await authStore.initializeAuth()
  }

  // Update user profile
  const updateProfile = async (data: UpdateProfileDto): Promise<boolean> => {
    clearError()
    isLoading.value = true

    try {
      await authStore.updateProfile(data)
      return true
    } catch (err: any) {
      error.value = err.message || 'Profile update failed'
      console.error('Profile update error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    clearError()
    isLoading.value = true

    try {
      await authStore.changePassword({
        currentPassword,
        newPassword
      })
      return true
    } catch (err: any) {
      error.value = err.message || 'Password change failed'
      console.error('Password change error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Request password reset
  const requestPasswordReset = async (email: string): Promise<boolean> => {
    clearError()
    isLoading.value = true

    try {
      await authStore.requestPasswordReset(email)
      return true
    } catch (err: any) {
      error.value = err.message || 'Password reset request failed'
      console.error('Password reset error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Reset password with token
  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    clearError()
    isLoading.value = true

    try {
      await authStore.resetPassword({
        token,
        newPassword
      })
      return true
    } catch (err: any) {
      error.value = err.message || 'Password reset failed'
      console.error('Password reset error:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Create authenticated fetch function
  const authenticatedFetch = async (url: string, options: any = {}) => {
    try {
      const apiClient = useApiClient()
      
      if (options.method && options.method.toUpperCase() === 'GET') {
        return await apiClient.get(url, options)
      } else if (options.method && options.method.toUpperCase() === 'POST') {
        return await apiClient.post(url, options.body, options)
      } else if (options.method && options.method.toUpperCase() === 'PUT') {
        return await apiClient.put(url, options.body, options)
      } else if (options.method && options.method.toUpperCase() === 'PATCH') {
        return await apiClient.patch(url, options.body, options)
      } else if (options.method && options.method.toUpperCase() === 'DELETE') {
        return await apiClient.delete(url, options)
      } else {
        return await apiClient.get(url, options)
      }
    } catch (err: any) {
      throw err
    }
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAuthenticated,
    user,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    verifySession,
    initializeAuth,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    clearError,

    // Utilities
    getToken,
    authenticatedFetch
  }
}