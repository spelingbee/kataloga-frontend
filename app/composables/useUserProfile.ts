import { storeToRefs } from 'pinia'
import { computed, ref, readonly } from 'vue'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { useUserService } from '~/services/user.service'
import { isDefined, safePropertyAccess } from '~/types/utils/type-guards'
import type { User, UserLocation, Notification, Promotion, UserAddressDto, UserPreferencesDto } from '~/types'

interface NotificationParams {
  type?: 'order' | 'promotion' | 'system'
  unread?: boolean
  page?: number
  limit?: number
}

interface PromotionParams {
  active?: boolean
  category?: string
  page?: number
  limit?: number
}

export function useUserProfile() {
  const userStore = useUserStore()
  const authStore = useAuthStore()

  const {
    user,
    notifications,
    promotions,
    location,
    loading,
    error,
    unreadNotificationsCount,
  } = storeToRefs(userStore)

  const { isAuthenticated } = storeToRefs(authStore)

  // Actions
  const updateProfile = (data: Partial<User>) => userStore.updateProfile(data)
  const updateLocation = (newLocation: UserLocation) => userStore.updateLocation(newLocation)
  const fetchNotifications = (params?: NotificationParams) => userStore.fetchNotifications(params)
  const markNotificationRead = (id: string) => userStore.markNotificationRead(id)
  const markAllNotificationsRead = () => userStore.markAllNotificationsRead()
  const fetchPromotions = (params?: PromotionParams) => userStore.fetchPromotions(params)
  const claimPromotion = (promotionId: string) => userStore.claimPromotion(promotionId)
  const fetchUserLocation = () => userStore.fetchUserLocation()

  // Computed
  const hasUser = computed(() => !!user.value)
  const hasLocation = computed(() => !!location.value)
  const hasNotifications = computed(() => notifications.value.length > 0)
  const hasUnreadNotifications = computed(() => unreadNotificationsCount.value > 0)
  const hasPromotions = computed(() => promotions.value.length > 0)

  const userDisplayName = computed(() => {
    if (!user.value) return 'Guest'
    return user.value.name || user.value.email || 'User'
  })

  const userInitials = computed(() => {
    if (!user.value?.name) return 'U'
    return user.value.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  })

  // Helper functions
  const getUnreadNotifications = () => {
    return notifications.value.filter(n => !n.isRead)
  }

  const getNotificationsByType = (type: 'order' | 'promotion' | 'system') => {
    return notifications.value.filter(n => n.type === type)
  }

  const getActivePromotions = () => {
    const now = new Date()
    return promotions.value.filter(p => {
      const validFrom = new Date(p.validFrom)
      const validTo = new Date(p.validTo)
      return p.isActive && now >= validFrom && now <= validTo
    })
  }

  const isPromotionValid = (promotion: Promotion) => {
    const now = new Date()
    const validFrom = new Date(promotion.validFrom)
    const validTo = new Date(promotion.validTo)
    return promotion.isActive && now >= validFrom && now <= validTo
  }

  const formatLocation = (loc?: UserLocation) => {
    const targetLocation = loc || location.value
    if (!targetLocation) return null

    if (targetLocation.address) {
      return targetLocation.address
    }

    return `${targetLocation.latitude.toFixed(4)}, ${targetLocation.longitude.toFixed(4)}`
  }

  // Location helpers
  const getCurrentLocation = (): Promise<UserLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          resolve(location)
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      )
    })
  }

  const updateCurrentLocation = async () => {
    try {
      const currentLocation = await getCurrentLocation()
      await updateLocation(currentLocation)
      return currentLocation
    } catch (error) {
      console.error('Failed to get current location:', error)
      throw error
    }
  }

  // Preferences helpers
  const getUserPreferences = async () => {
    try {
      const userService = useUserService()
      return await userService.getPreferences()
    } catch (error) {
      console.error('Failed to get user preferences:', error)
      throw error
    }
  }

  const updateUserPreferences = async (preferences: UserPreferencesDto) => {
    try {
      const userService = useUserService()
      return await userService.updatePreferences(preferences)
    } catch (error) {
      console.error('Failed to update user preferences:', error)
      throw error
    }
  }

  // Loyalty points
  const getLoyaltyPoints = async () => {
    try {
      const userService = useUserService()
      return await userService.getLoyaltyPoints()
    } catch (error) {
      console.error('Failed to get loyalty points:', error)
      throw error
    }
  }

  const redeemLoyaltyReward = async (rewardId: string) => {
    try {
      const userService = useUserService()
      return await userService.redeemLoyaltyReward(rewardId)
    } catch (error) {
      console.error('Failed to redeem loyalty reward:', error)
      throw error
    }
  }

  // Address management
  const getUserAddresses = async () => {
    try {
      const userService = useUserService()
      return await userService.getAddresses()
    } catch (error) {
      console.error('Failed to get user addresses:', error)
      throw error
    }
  }

  const addUserAddress = async (address: UserAddressDto) => {
    try {
      const userService = useUserService()
      return await userService.addAddress(address)
    } catch (error) {
      console.error('Failed to add user address:', error)
      throw error
    }
  }

  return {
    // State
    user: readonly(user),
    notifications: readonly(notifications),
    promotions: readonly(promotions),
    location: readonly(location),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated: readonly(isAuthenticated),

    // Computed
    hasUser,
    hasLocation,
    hasNotifications,
    hasUnreadNotifications,
    hasPromotions,
    userDisplayName,
    userInitials,
    unreadNotificationsCount,

    // Actions
    updateProfile,
    updateLocation,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    fetchPromotions,
    claimPromotion,
    fetchUserLocation,

    // Helpers
    getUnreadNotifications,
    getNotificationsByType,
    getActivePromotions,
    isPromotionValid,
    formatLocation,
    getCurrentLocation,
    updateCurrentLocation,
    getUserPreferences,
    updateUserPreferences,
    getLoyaltyPoints,
    redeemLoyaltyReward,
    getUserAddresses,
    addUserAddress,
  }
}