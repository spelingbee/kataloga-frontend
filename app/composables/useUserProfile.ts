import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { useUserService } from '~/services/user.service'
import type { User, UserLocation, Notification, Promotion } from '~/types'

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
  const fetchNotifications = (params?: any) => userStore.fetchNotifications(params)
  const markNotificationRead = (id: string) => userStore.markNotificationRead(id)
  const markAllNotificationsRead = () => userStore.markAllNotificationsRead()
  const fetchPromotions = (params?: any) => userStore.fetchPromotions(params)
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
      const response = await userService.getPreferences()
      
      if (response.success && response.data) {
        return response.data
      }
      
      throw new Error(response.message || 'Failed to get preferences')
    } catch (error) {
      console.error('Failed to get user preferences:', error)
      throw error
    }
  }

  const updateUserPreferences = async (preferences: any) => {
    try {
      const userService = useUserService()
      const response = await userService.updatePreferences(preferences)
      
      if (response.success) {
        return response.data
      }
      
      throw new Error(response.message || 'Failed to update preferences')
    } catch (error) {
      console.error('Failed to update user preferences:', error)
      throw error
    }
  }

  // Loyalty points
  const getLoyaltyPoints = async () => {
    try {
      const userService = useUserService()
      const response = await userService.getLoyaltyPoints()
      
      if (response.success && response.data) {
        return response.data
      }
      
      throw new Error(response.message || 'Failed to get loyalty points')
    } catch (error) {
      console.error('Failed to get loyalty points:', error)
      throw error
    }
  }

  const redeemLoyaltyReward = async (rewardId: string) => {
    try {
      const userService = useUserService()
      const response = await userService.redeemLoyaltyReward(rewardId)
      
      if (response.success && response.data) {
        return response.data
      }
      
      throw new Error(response.message || 'Failed to redeem reward')
    } catch (error) {
      console.error('Failed to redeem loyalty reward:', error)
      throw error
    }
  }

  // Address management
  const getUserAddresses = async () => {
    try {
      const userService = useUserService()
      const response = await userService.getAddresses()
      
      if (response.success && response.data) {
        return response.data
      }
      
      throw new Error(response.message || 'Failed to get addresses')
    } catch (error) {
      console.error('Failed to get user addresses:', error)
      throw error
    }
  }

  const addUserAddress = async (address: any) => {
    try {
      const userService = useUserService()
      const response = await userService.addAddress(address)
      
      if (response.success && response.data) {
        return response.data
      }
      
      throw new Error(response.message || 'Failed to add address')
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