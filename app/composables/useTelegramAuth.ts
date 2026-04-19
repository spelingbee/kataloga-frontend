/**
 * Telegram Authentication Composable
 * Provides authentication functionality using Telegram Web App
 */

import { useUserStore } from '~/stores/user'

export const useTelegramAuth = () => {
  const { $telegramAuthService } = useNuxtApp()
  const telegram = useTelegram()
  const authStore = useUserStore()

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Check if Telegram authentication is available
   */
  const isAvailable = computed(() => {
    return telegram.isTelegram.value && !!telegram.user.value
  })

  /**
   * Authenticate user with Telegram
   */
  const loginWithTelegram = async (): Promise<boolean> => {
    if (!isAvailable.value || !$telegramAuthService) {
      error.value = 'Telegram authentication is not available'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const initData = telegram.getInitData()
      const initDataUnsafe = telegram.getInitDataUnsafe()

      if (!initData) {
        throw new Error('Failed to get Telegram init data')
      }

      // Authenticate with backend (signature verified server-side via HMAC-SHA256)
      const response = await ($telegramAuthService as any).authenticateWithTelegram({
        initData,
        initDataUnsafe
      })

      // Store authentication data
      authStore.setUser(response.user)
      authStore.setTokens(response.accessToken, response.refreshToken)

      // Show success feedback
      telegram.notificationFeedback('success')

      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to authenticate with Telegram'
      console.error('Telegram authentication error:', err)
      telegram.notificationFeedback('error')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Link Telegram account to current user
   */
  const linkAccount = async (): Promise<boolean> => {
    if (!isAvailable.value || !$telegramAuthService) {
      error.value = 'Telegram is not available'
      return false
    }

    if (!authStore.user?.id) {
      error.value = 'User must be logged in to link Telegram account'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      const initData = telegram.getInitData()
      const initDataUnsafe = telegram.getInitDataUnsafe()

      if (!initData) {
        throw new Error('Failed to get Telegram init data')
      }

      await ($telegramAuthService as any).linkTelegramAccount(authStore.user.id, {
        initData,
        initDataUnsafe
      })

      // Refresh user profile
      await authStore.fetchUserProfile()

      telegram.notificationFeedback('success')
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to link Telegram account'
      console.error('Link Telegram account error:', err)
      telegram.notificationFeedback('error')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Unlink Telegram account from current user
   */
  const unlinkAccount = async (): Promise<boolean> => {
    if (!authStore.user?.id || !$telegramAuthService) {
      error.value = 'User must be logged in'
      return false
    }

    isLoading.value = true
    error.value = null

    try {
      await ($telegramAuthService as any).unlinkTelegramAccount(authStore.user.id)

      // Refresh user profile
      await authStore.fetchUserProfile()

      telegram.notificationFeedback('success')
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to unlink Telegram account'
      console.error('Unlink Telegram account error:', err)
      telegram.notificationFeedback('error')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Request user's phone number
   */
  const requestPhoneNumber = async (): Promise<string | null> => {
    if (!telegram.isTelegram.value) {
      error.value = 'Telegram is not available'
      return null
    }

    try {
      const contact = await telegram.requestContact()
      
      if (contact) {
        telegram.notificationFeedback('success')
        return contact.phone
      }

      return null
    } catch (err: any) {
      error.value = err.message || 'Failed to request phone number'
      console.error('Request phone number error:', err)
      telegram.notificationFeedback('error')
      return null
    }
  }

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    isAvailable,

    // Actions
    loginWithTelegram,
    linkAccount,
    unlinkAccount,
    requestPhoneNumber,
    clearError
  }
}
