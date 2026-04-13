/**
 * Telegram Authentication Service
 * Handles authentication using Telegram Web App init data
 */

export interface TelegramAuthData {
  initData: string
  initDataUnsafe: any
}

export interface TelegramAuthResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName?: string
    phone?: string
    telegramId: number
  }
  accessToken: string
  refreshToken: string
}

export class TelegramAuthService {
  constructor(private apiBaseUrl: string) {}

  /**
   * Authenticate user with Telegram init data
   */
  async authenticateWithTelegram(authData: TelegramAuthData): Promise<TelegramAuthResponse> {
    try {
      const response = await $fetch<TelegramAuthResponse>(`${this.apiBaseUrl}/auth/telegram`, {
        method: 'POST',
        body: {
          initData: authData.initData,
          initDataUnsafe: authData.initDataUnsafe
        }
      })

      return response
    } catch (error: any) {
      console.error('Telegram authentication failed:', error)
      throw new Error(error.data?.message || 'Failed to authenticate with Telegram')
    }
  }

  /**
   * Link Telegram account to existing user
   */
  async linkTelegramAccount(userId: string, authData: TelegramAuthData): Promise<boolean> {
    try {
      await $fetch(`${this.apiBaseUrl}/users/${userId}/link-telegram`, {
        method: 'POST',
        body: {
          initData: authData.initData,
          initDataUnsafe: authData.initDataUnsafe
        }
      })

      return true
    } catch (error: any) {
      console.error('Failed to link Telegram account:', error)
      throw new Error(error.data?.message || 'Failed to link Telegram account')
    }
  }

  /**
   * Unlink Telegram account from user
   */
  async unlinkTelegramAccount(userId: string): Promise<boolean> {
    try {
      await $fetch(`${this.apiBaseUrl}/users/${userId}/unlink-telegram`, {
        method: 'POST'
      })

      return true
    } catch (error: any) {
      console.error('Failed to unlink Telegram account:', error)
      throw new Error(error.data?.message || 'Failed to unlink Telegram account')
    }
  }

  /**
   * Validate Telegram init data
   */
  validateInitData(initData: string): boolean {
    // Basic validation - actual validation happens on server
    return !!initData && initData.length > 0
  }
}
