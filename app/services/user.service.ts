import type { ApiResponse, User, UserLocation, Notification, Promotion, UpdateProfileDto } from '~/types'

export class UserService {
  private getApiClient(): any {
    const nuxtApp = useNuxtApp()
    return (nuxtApp as any).$apiClient
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.getApiClient().get('/users/profile')
  }

  async updateProfile(updates: UpdateProfileDto): Promise<ApiResponse<User>> {
    return this.getApiClient().patch('/users/profile', updates)
  }

  async updateLocation(location: UserLocation): Promise<ApiResponse<void>> {
    return this.getApiClient().post('/users/location', location)
  }

  async getLocation(): Promise<ApiResponse<UserLocation>> {
    return this.getApiClient().get('/users/location')
  }

  async getNotifications(params?: {
    type?: 'order' | 'promotion' | 'system'
    unread?: boolean
    page?: number
    limit?: number
  }): Promise<ApiResponse<{
    notifications: Notification[]
    total: number
    unreadCount: number
    page: number
    limit: number
  }>> {
    const searchParams = new URLSearchParams()

    if (params?.type) searchParams.set('type', params.type)
    if (params?.unread !== undefined) searchParams.set('unread', params.unread.toString())
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/users/notifications?${queryString}` : '/users/notifications'

    return this.getApiClient().get(endpoint)
  }

  async markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
    return this.getApiClient().patch(`/users/notifications/${notificationId}/read`)
  }

  async markAllNotificationsRead(): Promise<ApiResponse<void>> {
    return this.getApiClient().patch('/users/notifications/read-all')
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    return this.getApiClient().delete(`/users/notifications/${notificationId}`)
  }

  async getPromotions(params?: {
    active?: boolean
    category?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<{
    promotions: Promotion[]
    total: number
    page: number
    limit: number
  }>> {
    const searchParams = new URLSearchParams()

    if (params?.active !== undefined) searchParams.set('active', params.active.toString())
    if (params?.category) searchParams.set('category', params.category)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/users/promotions?${queryString}` : '/users/promotions'

    return this.getApiClient().get(endpoint)
  }

  async claimPromotion(promotionId: string): Promise<ApiResponse<{
    success: boolean
    discount: number
    expiresAt: string
  }>> {
    return this.getApiClient().post(`/users/promotions/${promotionId}/claim`)
  }

  async getPreferences(): Promise<ApiResponse<{
    dietary: string[]
    allergies: string[]
    spiceLevel: number
    notifications: {
      orderUpdates: boolean
      promotions: boolean
      newsletter: boolean
    }
    delivery: {
      defaultAddress?: string
      preferredTimeSlots: string[]
    }
  }>> {
    return this.getApiClient().get('/users/preferences')
  }

  async updatePreferences(preferences: {
    dietary?: string[]
    allergies?: string[]
    spiceLevel?: number
    notifications?: {
      orderUpdates?: boolean
      promotions?: boolean
      newsletter?: boolean
    }
    delivery?: {
      defaultAddress?: string
      preferredTimeSlots?: string[]
    }
  }): Promise<ApiResponse<void>> {
    return this.getApiClient().patch('/users/preferences', preferences)
  }

  async getLoyaltyPoints(): Promise<ApiResponse<{
    currentPoints: number
    totalEarned: number
    pointsToNextReward: number
    tier: string
    rewards: Array<{
      id: string
      name: string
      pointsCost: number
      description: string
      available: boolean
    }>
  }>> {
    return this.getApiClient().get('/users/loyalty')
  }

  async redeemLoyaltyReward(rewardId: string): Promise<ApiResponse<{
    success: boolean
    pointsUsed: number
    remainingPoints: number
    reward: {
      id: string
      name: string
      code?: string
      expiresAt: string
    }
  }>> {
    return this.getApiClient().post(`/users/loyalty/redeem/${rewardId}`)
  }

  async getAddresses(): Promise<ApiResponse<Array<{
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
    isDefault: boolean
    type: 'home' | 'work' | 'other'
  }>>> {
    return this.getApiClient().get('/users/addresses')
  }

  async addAddress(address: {
    name: string
    address: string
    latitude: number
    longitude: number
    type: 'home' | 'work' | 'other'
    isDefault?: boolean
  }): Promise<ApiResponse<{ id: string }>> {
    return this.getApiClient().post('/users/addresses', address)
  }

  async updateAddress(addressId: string, updates: {
    name?: string
    address?: string
    latitude?: number
    longitude?: number
    type?: 'home' | 'work' | 'other'
    isDefault?: boolean
  }): Promise<ApiResponse<void>> {
    return this.getApiClient().patch(`/users/addresses/${addressId}`, updates)
  }

  async deleteAddress(addressId: string): Promise<ApiResponse<void>> {
    return this.getApiClient().delete(`/users/addresses/${addressId}`)
  }

  async setDefaultAddress(addressId: string): Promise<ApiResponse<void>> {
    return this.getApiClient().patch(`/users/addresses/${addressId}/default`)
  }

  async deleteAccount(password: string): Promise<ApiResponse<void>> {
    return this.getApiClient().delete('/users/account', {
      body: { password }
    })
  }

  async exportData(): Promise<ApiResponse<{
    downloadUrl: string
    expiresAt: string
  }>> {
    return this.getApiClient().post('/users/export-data')
  }
}

// Create singleton instance
let userService: UserService | null = null

export function useUserService(): UserService {
  if (!userService) {
    userService = new UserService()
  }
  return userService
}