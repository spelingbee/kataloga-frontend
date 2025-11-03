import { useNetworkStatus } from './useNetworkStatus'
import { useOfflineCart } from './useOfflineCart'

export interface FeatureAvailability {
  isAvailable: boolean
  reason?: string
  fallbackAction?: () => void
  fallbackMessage?: string
}

export const useGracefulDegradation = () => {
  const { isOnline, isSlowConnection } = useNetworkStatus()
  const { loadOfflineData } = useOfflineCart()

  // Check if a feature is available based on network conditions
  const checkFeatureAvailability = (feature: string): FeatureAvailability => {
    switch (feature) {
      case 'order-submission':
        return {
          isAvailable: isOnline.value,
          reason: !isOnline.value ? 'offline' : undefined,
          fallbackMessage: 'Your order will be saved and submitted when you\'re back online.',
          fallbackAction: () => {
            // Order will be queued automatically by the offline cart system
          }
        }

      case 'real-time-tracking':
        return {
          isAvailable: isOnline.value,
          reason: !isOnline.value ? 'offline' : undefined,
          fallbackMessage: 'Order tracking is not available offline. Check back when connected.',
        }

      case 'push-notifications':
        return {
          isAvailable: isOnline.value && 'Notification' in window,
          reason: !isOnline.value ? 'offline' : !('Notification' in window) ? 'unsupported' : undefined,
          fallbackMessage: 'Notifications are not available offline.',
        }

      case 'menu-updates':
        return {
          isAvailable: isOnline.value,
          reason: !isOnline.value ? 'offline' : undefined,
          fallbackMessage: 'Showing cached menu. Updates will be available when connected.',
          fallbackAction: async () => {
            // Load cached menu data
            return await loadOfflineData('menus')
          }
        }

      case 'search':
        return {
          isAvailable: true, // Search works offline with cached data
          reason: !isOnline.value ? 'limited' : undefined,
          fallbackMessage: !isOnline.value ? 'Searching cached menu items only.' : undefined,
        }

      case 'user-profile':
        return {
          isAvailable: isOnline.value,
          reason: !isOnline.value ? 'offline' : undefined,
          fallbackMessage: 'Profile updates are not available offline.',
        }

      case 'payment':
        return {
          isAvailable: isOnline.value,
          reason: !isOnline.value ? 'offline' : undefined,
          fallbackMessage: 'Payment processing requires an internet connection.',
        }

      case 'reviews':
        return {
          isAvailable: isOnline.value,
          reason: !isOnline.value ? 'offline' : undefined,
          fallbackMessage: 'Reviews are not available offline.',
        }

      case 'social-sharing':
        return {
          isAvailable: isOnline.value,
          reason: !isOnline.value ? 'offline' : undefined,
          fallbackMessage: 'Sharing requires an internet connection.',
        }

      case 'high-quality-images':
        return {
          isAvailable: isOnline.value && !isSlowConnection.value,
          reason: !isOnline.value ? 'offline' : isSlowConnection.value ? 'slow-connection' : undefined,
          fallbackMessage: isSlowConnection.value 
            ? 'Using lower quality images due to slow connection.' 
            : 'Images not available offline.',
        }

      default:
        return {
          isAvailable: isOnline.value,
          reason: !isOnline.value ? 'offline' : undefined,
        }
    }
  }

  // Get appropriate image quality based on connection
  const getImageQuality = (): 'high' | 'medium' | 'low' => {
    if (!isOnline.value) return 'low'
    if (isSlowConnection.value) return 'medium'
    return 'high'
  }

  // Get image URL with appropriate quality
  const getOptimizedImageUrl = (baseUrl: string, quality?: 'high' | 'medium' | 'low'): string => {
    const targetQuality = quality || getImageQuality()
    
    // Add quality parameter to URL
    const url = new URL(baseUrl, window.location.origin)
    url.searchParams.set('quality', targetQuality)
    
    return url.toString()
  }

  // Check if feature should be disabled
  const isFeatureDisabled = (feature: string): boolean => {
    const availability = checkFeatureAvailability(feature)
    return !availability.isAvailable
  }

  // Get fallback message for disabled feature
  const getFeatureFallbackMessage = (feature: string): string | undefined => {
    const availability = checkFeatureAvailability(feature)
    return availability.fallbackMessage
  }

  // Execute fallback action for disabled feature
  const executeFeatureFallback = async (feature: string): Promise<any> => {
    const availability = checkFeatureAvailability(feature)
    if (availability.fallbackAction) {
      return await availability.fallbackAction()
    }
    return null
  }

  // Show appropriate message for feature limitation
  const showFeatureLimitationMessage = (feature: string): void => {
    const availability = checkFeatureAvailability(feature)
    
    if (!availability.isAvailable && availability.fallbackMessage) {
      // You could integrate with a toast/notification system here
      console.info(`Feature limitation: ${availability.fallbackMessage}`)
      
      // Emit event for UI components to handle
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('feature-limitation', {
          detail: {
            feature,
            reason: availability.reason,
            message: availability.fallbackMessage
          }
        }))
      }
    }
  }

  // Wrapper for API calls with offline handling
  const withOfflineHandling = async <T>(
    apiCall: () => Promise<T>,
    fallbackData?: T,
    feature?: string
  ): Promise<T> => {
    if (!isOnline.value) {
      if (feature) {
        showFeatureLimitationMessage(feature)
      }
      
      if (fallbackData !== undefined) {
        return fallbackData
      }
      
      throw new Error('This feature is not available offline')
    }

    try {
      return await apiCall()
    } catch (error) {
      // If API call fails and we have fallback data, use it
      if (fallbackData !== undefined) {
        return fallbackData
      }
      
      throw error
    }
  }

  // Get loading strategy based on connection
  const getLoadingStrategy = (): 'eager' | 'lazy' | 'minimal' => {
    if (!isOnline.value) return 'minimal'
    if (isSlowConnection.value) return 'lazy'
    return 'eager'
  }

  // Check if we should preload resources
  const shouldPreloadResources = (): boolean => {
    return isOnline.value && !isSlowConnection.value
  }

  // Get appropriate timeout for requests
  const getRequestTimeout = (): number => {
    if (!isOnline.value) return 1000 // Quick timeout for offline detection
    if (isSlowConnection.value) return 30000 // Longer timeout for slow connections
    return 10000 // Standard timeout
  }

  return {
    // Feature availability
    checkFeatureAvailability,
    isFeatureDisabled,
    getFeatureFallbackMessage,
    executeFeatureFallback,
    showFeatureLimitationMessage,
    
    // Image optimization
    getImageQuality,
    getOptimizedImageUrl,
    
    // API handling
    withOfflineHandling,
    
    // Performance optimization
    getLoadingStrategy,
    shouldPreloadResources,
    getRequestTimeout,
    
    // Computed properties
    canSubmitOrders: computed(() => checkFeatureAvailability('order-submission').isAvailable),
    canTrackOrders: computed(() => checkFeatureAvailability('real-time-tracking').isAvailable),
    canReceiveNotifications: computed(() => checkFeatureAvailability('push-notifications').isAvailable),
    canUpdateProfile: computed(() => checkFeatureAvailability('user-profile').isAvailable),
    canMakePayments: computed(() => checkFeatureAvailability('payment').isAvailable),
    canViewReviews: computed(() => checkFeatureAvailability('reviews').isAvailable),
    canShare: computed(() => checkFeatureAvailability('social-sharing').isAvailable),
    
    // Connection-based computed properties
    imageQuality: computed(() => getImageQuality()),
    loadingStrategy: computed(() => getLoadingStrategy()),
    shouldPreload: computed(() => shouldPreloadResources()),
    requestTimeout: computed(() => getRequestTimeout()),
  }
}