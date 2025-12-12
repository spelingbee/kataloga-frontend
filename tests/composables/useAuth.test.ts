import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuth } from '~/composables/useAuth'
import { ref, computed } from 'vue'

// Mock stores and dependencies
vi.mock('~/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('vue', () => ({
  ref: (val: any) => ({ value: val }),
  computed: (fn: any) => ({
    get value() {
      return fn()
    },
  }),
}))

vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      tenantSlug: 'test-tenant',
    },
  }),
  useNuxtApp: () => ({
    $apiClient: {
      handleTokenRefresh: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    },
  }),
}))

describe('useAuth', () => {
  let mockAuthStore: any

  beforeEach(async () => {
    mockAuthStore = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      fetchUserProfile: vi.fn(),
      initializeAuth: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    }

    // Mock the store import
    vi.mocked(await import('~/stores/auth')).useAuthStore.mockReturnValue(mockAuthStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should login successfully', async () => {
      mockAuthStore.login.mockResolvedValue(undefined)
      
      const { login } = useAuth()
      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toBe(true)
      expect(mockAuthStore.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        tenantSlug: 'test-tenant',
      })
    })

    it('should handle login failure', async () => {
      mockAuthStore.login.mockRejectedValue(new Error('Invalid credentials'))
      
      const { login, error } = useAuth()
      const result = await login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(result).toBe(false)
      expect(error.value).toBe('Invalid credentials')
    })

    it('should use provided tenant slug', async () => {
      mockAuthStore.login.mockResolvedValue(undefined)
      
      const { login } = useAuth()
      await login({
        email: 'test@example.com',
        password: 'password123',
        tenantSlug: 'custom-tenant',
      })

      expect(mockAuthStore.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        tenantSlug: 'custom-tenant',
      })
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      mockAuthStore.register.mockResolvedValue(undefined)
      
      const { register } = useAuth()
      const result = await register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      })

      expect(result).toBe(true)
      expect(mockAuthStore.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        tenantSlug: 'test-tenant',
      })
    })

    it('should handle registration failure', async () => {
      mockAuthStore.register.mockRejectedValue(new Error('Email already exists'))
      
      const { register, error } = useAuth()
      const result = await register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      })

      expect(result).toBe(false)
      expect(error.value).toBe('Email already exists')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockAuthStore.logout.mockResolvedValue(undefined)
      
      const { logout } = useAuth()
      await logout()

      expect(mockAuthStore.logout).toHaveBeenCalled()
    })

    it('should handle logout errors gracefully', async () => {
      mockAuthStore.logout.mockRejectedValue(new Error('Logout failed'))
      
      const { logout } = useAuth()
      
      // Should not throw
      await expect(logout()).resolves.toBeUndefined()
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      mockAuthStore.updateProfile.mockResolvedValue(undefined)
      
      const { updateProfile } = useAuth()
      const result = await updateProfile({
        firstName: 'Jane',
        lastName: 'Smith',
      })

      expect(result).toBe(true)
      expect(mockAuthStore.updateProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
      })
    })

    it('should handle profile update failure', async () => {
      mockAuthStore.updateProfile.mockRejectedValue(new Error('Update failed'))
      
      const { updateProfile, error } = useAuth()
      const result = await updateProfile({
        firstName: 'Jane',
      })

      expect(result).toBe(false)
      expect(error.value).toBe('Update failed')
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockAuthStore.changePassword.mockResolvedValue(undefined)
      
      const { changePassword } = useAuth()
      const result = await changePassword('oldpassword', 'newpassword')

      expect(result).toBe(true)
      expect(mockAuthStore.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      })
    })

    it('should handle password change failure', async () => {
      mockAuthStore.changePassword.mockRejectedValue(new Error('Current password is incorrect'))
      
      const { changePassword, error } = useAuth()
      const result = await changePassword('wrongpassword', 'newpassword')

      expect(result).toBe(false)
      expect(error.value).toBe('Current password is incorrect')
    })
  })

  describe('verifySession', () => {
    it('should verify session successfully', async () => {
      mockAuthStore.fetchUserProfile.mockResolvedValue(undefined)
      
      const { verifySession } = useAuth()
      const result = await verifySession()

      expect(result).toBe(true)
      expect(mockAuthStore.fetchUserProfile).toHaveBeenCalled()
    })

    it('should handle session verification failure', async () => {
      mockAuthStore.fetchUserProfile.mockRejectedValue(new Error('Session expired'))
      
      const { verifySession } = useAuth()
      const result = await verifySession()

      expect(result).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockAuthStore.login.mockRejectedValue(new Error('Test error'))
      
      const { login, error, clearError } = useAuth()
      
      // Trigger an error
      await login({ email: 'test@example.com', password: 'wrong' })
      expect(error.value).toBe('Test error')
      
      // Clear the error
      clearError()
      expect(error.value).toBe(null)
    })
  })

  describe('loading state', () => {
    it('should set loading state during login', async () => {
      let resolveLogin: () => void
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve
      })
      mockAuthStore.login.mockReturnValue(loginPromise)
      
      const { login, isLoading } = useAuth()
      
      expect(isLoading.value).toBe(false)
      
      const loginCall = login({ email: 'test@example.com', password: 'password' })
      
      // Should be loading during the call
      expect(isLoading.value).toBe(true)
      
      resolveLogin!()
      await loginCall
      
      // Should not be loading after completion
      expect(isLoading.value).toBe(false)
    })
  })
})