import type { User, UserLocation, Notification, Promotion, UpdateProfileDto, PaginatedResult } from '~/types'
import { useApiClient } from '~/utils/api'

export class UserService {
  constructor(private apiClient: any) {}

  /**
   * Get user profile (unwrapped data)
   * Returns: User | null
   * Requirements: 2.1, 2.3
   */
  async getProfile(): Promise<User | null> {
    try {
      return await this.apiClient.get<User>('/users/profile')
    } catch (error) {
      // Return null for not found cases
      if ((error as any)?.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  /**
   * Update user profile (unwrapped data)
   * Returns: User
   * Requirements: 2.1
   */
  async updateProfile(updates: UpdateProfileDto): Promise<User> {
    return this.apiClient.patch<User>('/users/profile', updates)
  }

  /**
   * Update user location (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async updateLocation(location: UserLocation): Promise<void> {
    return this.apiClient.post<void>('/users/location', location)
  }

  /**
   * Get user location (unwrapped data)
   * Returns: UserLocation | null
   * Requirements: 2.1, 2.3
   */
  async getLocation(): Promise<UserLocation | null> {
    try {
      return await this.apiClient.get<UserLocation>('/users/location')
    } catch (error) {
      // Return null for not found cases
      if ((error as any)?.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  /**
   * Get notifications (unwrapped data)
   * Returns: notification data with pagination
   * Requirements: 2.1, 2.2
   */
  async getNotifications(params?: {
    type?: 'order' | 'promotion' | 'system'
    unread?: boolean
    page?: number
    limit?: number
  }): Promise<{
    notifications: Notification[]
    total: number
    unreadCount: number
    pagination: {
      page: number
      limit: number
      totalItems: number
      totalPages: number
    }
  }> {
    const searchParams = new URLSearchParams()

    if (params?.type) searchParams.set('type', params.type)
    if (params?.unread !== undefined) searchParams.set('unread', params.unread.toString())
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/users/notifications?${queryString}` : '/users/notifications'

    // Get full response to access pagination metadata
    const response = await this.apiClient.getRaw<{
      notifications: Notification[]
      total: number
      unreadCount: number
    }>(endpoint)
    
    if (response.success && response.data) {
      return {
        notifications: response.data.notifications,
        total: response.data.total,
        unreadCount: response.data.unreadCount,
        pagination: response.meta.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 20,
          totalItems: response.data.total,
          totalPages: Math.ceil(response.data.total / (params?.limit || 20))
        }
      }
    } else {
      throw new Error(response.error?.message || 'Failed to fetch notifications')
    }
  }

  /**
   * Mark notification as read (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    return this.apiClient.patch<void>(`/users/notifications/${notificationId}/read`)
  }

  /**
   * Mark all notifications as read (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async markAllNotificationsRead(): Promise<void> {
    return this.apiClient.patch<void>('/users/notifications/read-all')
  }

  /**
   * Delete notification (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async deleteNotification(notificationId: string): Promise<void> {
    return this.apiClient.delete<void>(`/users/notifications/${notificationId}`)
  }

  /**
   * Get promotions (unwrapped data)
   * Returns: PaginatedResult<Promotion>
   * Requirements: 2.1, 2.2
   */
  async getPromotions(params?: {
    active?: boolean
    category?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResult<Promotion>> {
    const searchParams = new URLSearchParams()

    if (params?.active !== undefined) searchParams.set('active', params.active.toString())
    if (params?.category) searchParams.set('category', params.category)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/users/promotions?${queryString}` : '/users/promotions'

    // Get full response to access pagination metadata
    const response = await this.apiClient.getRaw<Promotion[]>(endpoint)
    
    if (response.success && response.data) {
      return {
        items: response.data,
        pagination: response.meta.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 20,
          totalItems: response.data.length,
          totalPages: 1
        }
      }
    } else {
      throw new Error(response.error?.message || 'Failed to fetch promotions')
    }
  }

  /**
   * Claim promotion (unwrapped data)
   * Returns: promotion claim data
   * Requirements: 2.1
   */
  async claimPromotion(promotionId: string): Promise<{
    success: boolean
    discount: number
    expiresAt: string
  }> {
    return this.apiClient.post<{
      success: boolean
      discount: number
      expiresAt: string
    }>(`/users/promotions/${promotionId}/claim`)
  }

  /**
   * Get user preferences (unwrapped data)
   * Returns: preferences data | null
   * Requirements: 2.1, 2.3
   */
  async getPreferences(): Promise<{
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
  } | null> {
    try {
      return await this.apiClient.get<{
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
      }>('/users/preferences')
    } catch (error) {
      // Return null for not found cases
      if ((error as any)?.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  /**
   * Update user preferences (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
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
  }): Promise<void> {
    return this.apiClient.patch<void>('/users/preferences', preferences)
  }

  /**
   * Get loyalty points (unwrapped data)
   * Returns: loyalty data
   * Requirements: 2.1
   */
  async getLoyaltyPoints(): Promise<{
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
  }> {
    return this.apiClient.get<{
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
    }>('/users/loyalty')
  }

  /**
   * Redeem loyalty reward (unwrapped data)
   * Returns: redemption data
   * Requirements: 2.1
   */
  async redeemLoyaltyReward(rewardId: string): Promise<{
    success: boolean
    pointsUsed: number
    remainingPoints: number
    reward: {
      id: string
      name: string
      code?: string
      expiresAt: string
    }
  }> {
    return this.apiClient.post<{
      success: boolean
      pointsUsed: number
      remainingPoints: number
      reward: {
        id: string
        name: string
        code?: string
        expiresAt: string
      }
    }>(`/users/loyalty/redeem/${rewardId}`)
  }

  /**
   * Get user addresses (unwrapped data)
   * Returns: address array
   * Requirements: 2.1
   */
  async getAddresses(): Promise<Array<{
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
    isDefault: boolean
    type: 'home' | 'work' | 'other'
  }>> {
    return this.apiClient.get<Array<{
      id: string
      name: string
      address: string
      latitude: number
      longitude: number
      isDefault: boolean
      type: 'home' | 'work' | 'other'
    }>>('/users/addresses')
  }

  /**
   * Add user address (unwrapped data)
   * Returns: address ID
   * Requirements: 2.1
   */
  async addAddress(address: {
    name: string
    address: string
    latitude: number
    longitude: number
    type: 'home' | 'work' | 'other'
    isDefault?: boolean
  }): Promise<{ id: string }> {
    return this.apiClient.post<{ id: string }>('/users/addresses', address)
  }

  /**
   * Update user address (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async updateAddress(addressId: string, updates: {
    name?: string
    address?: string
    latitude?: number
    longitude?: number
    type?: 'home' | 'work' | 'other'
    isDefault?: boolean
  }): Promise<void> {
    return this.apiClient.patch<void>(`/users/addresses/${addressId}`, updates)
  }

  /**
   * Delete user address (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async deleteAddress(addressId: string): Promise<void> {
    return this.apiClient.delete<void>(`/users/addresses/${addressId}`)
  }

  /**
   * Set default address (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async setDefaultAddress(addressId: string): Promise<void> {
    return this.apiClient.patch<void>(`/users/addresses/${addressId}/default`)
  }

  /**
   * Delete user account (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async deleteAccount(password: string): Promise<void> {
    return this.apiClient.delete<void>('/users/account', {
      body: { password }
    })
  }

  /**
   * Export user data (unwrapped data)
   * Returns: export data
   * Requirements: 2.1
   */
  async exportData(): Promise<{
    downloadUrl: string
    expiresAt: string
  }> {
    return this.apiClient.post<{
      downloadUrl: string
      expiresAt: string
    }>('/users/export-data')
  }
}
