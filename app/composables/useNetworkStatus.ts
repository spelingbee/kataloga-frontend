import { useOfflineCart } from './useOfflineCart'
import { usePWAFeatures } from './usePWA'

export interface NetworkStatus {
  isOnline: boolean
  connectionType: string
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

export const useNetworkStatus = () => {
  const isOnline = ref(navigator.onLine)
  const connectionType = ref('unknown')
  const effectiveType = ref('4g')
  const downlink = ref(10)
  const rtt = ref(100)
  const saveData = ref(false)
  const isSlowConnection = ref(false)
  const showOfflineNotification = ref(false)
  const lastOnlineTime = ref<Date | null>(null)
  const lastOfflineTime = ref<Date | null>(null)

  const { showNotification } = usePWAFeatures()
  const { hasPendingOrders, syncInProgress } = useOfflineCart()

  // Get network information if available
  const updateNetworkInfo = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connectionType.value = connection.type || 'unknown'
      effectiveType.value = connection.effectiveType || '4g'
      downlink.value = connection.downlink || 10
      rtt.value = connection.rtt || 100
      saveData.value = connection.saveData || false
      
      // Determine if connection is slow
      isSlowConnection.value = 
        effectiveType.value === 'slow-2g' || 
        effectiveType.value === '2g' || 
        downlink.value < 1.5
    }
  }

  // Handle online status change
  const handleOnline = () => {
    isOnline.value = true
    lastOnlineTime.value = new Date()
    showOfflineNotification.value = false
    updateNetworkInfo()

    // Show notification when coming back online
    showNotification('Back Online', {
      body: hasPendingOrders.value 
        ? 'Connection restored. Syncing your data...' 
        : 'Connection restored.',
      tag: 'network-status',
      icon: '/icon-192x192.png',
      actions: [
        {
          action: 'dismiss',
          title: 'OK'
        }
      ]
    })
  }

  // Handle offline status change
  const handleOffline = () => {
    isOnline.value = false
    lastOfflineTime.value = new Date()
    showOfflineNotification.value = true

    // Show notification when going offline
    showNotification('You\'re Offline', {
      body: 'Some features may be limited. Your data will sync when connection is restored.',
      tag: 'network-status',
      icon: '/icon-192x192.png',
      requireInteraction: true,
      actions: [
        {
          action: 'dismiss',
          title: 'OK'
        }
      ]
    })
  }

  // Handle connection change
  const handleConnectionChange = () => {
    updateNetworkInfo()
    
    // Warn about slow connection
    if (isSlowConnection.value && isOnline.value) {
      showNotification('Slow Connection', {
        body: 'Your connection is slow. Some features may take longer to load.',
        tag: 'slow-connection',
        icon: '/icon-192x192.png',
        actions: [
          {
            action: 'dismiss',
            title: 'OK'
          }
        ]
      })
    }
  }

  // Get connection quality description
  const getConnectionQuality = (): 'excellent' | 'good' | 'fair' | 'poor' | 'offline' => {
    if (!isOnline.value) return 'offline'
    
    if (effectiveType.value === '4g' && downlink.value > 5) return 'excellent'
    if (effectiveType.value === '4g' || (effectiveType.value === '3g' && downlink.value > 2)) return 'good'
    if (effectiveType.value === '3g' || effectiveType.value === '2g') return 'fair'
    return 'poor'
  }

  // Get status message
  const getStatusMessage = (): string => {
    if (!isOnline.value) {
      return 'You\'re offline. Some features are limited.'
    }
    
    if (syncInProgress.value) {
      return 'Syncing your data...'
    }
    
    if (hasPendingOrders.value) {
      return 'You have pending orders that will sync when online.'
    }
    
    const quality = getConnectionQuality()
    switch (quality) {
      case 'excellent':
        return 'Excellent connection'
      case 'good':
        return 'Good connection'
      case 'fair':
        return 'Fair connection - some features may be slower'
      case 'poor':
        return 'Poor connection - limited functionality'
      default:
        return 'Connected'
    }
  }

  // Get status color for UI
  const getStatusColor = (): string => {
    if (!isOnline.value) return 'red'
    if (syncInProgress.value) return 'yellow'
    if (hasPendingOrders.value) return 'orange'
    
    const quality = getConnectionQuality()
    switch (quality) {
      case 'excellent':
      case 'good':
        return 'green'
      case 'fair':
        return 'yellow'
      case 'poor':
        return 'orange'
      default:
        return 'gray'
    }
  }

  // Initialize network status monitoring
  const initializeNetworkStatus = () => {
    if (typeof window === 'undefined') return

    updateNetworkInfo()

    // Event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Connection change listener
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', handleConnectionChange)
    }

    // Cleanup on unmount
    onUnmounted(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        connection.removeEventListener('change', handleConnectionChange)
      }
    })
  }

  // Dismiss offline notification
  const dismissOfflineNotification = () => {
    showOfflineNotification.value = false
  }

  // Force network check
  const checkNetworkStatus = async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to verify connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      
      const online = response.ok
      if (online !== isOnline.value) {
        if (online) {
          handleOnline()
        } else {
          handleOffline()
        }
      }
      
      return online
    } catch (error) {
      if (isOnline.value) {
        handleOffline()
      }
      return false
    }
  }

  onMounted(() => {
    initializeNetworkStatus()
  })

  return {
    // State
    isOnline: readonly(isOnline),
    connectionType: readonly(connectionType),
    effectiveType: readonly(effectiveType),
    downlink: readonly(downlink),
    rtt: readonly(rtt),
    saveData: readonly(saveData),
    isSlowConnection: readonly(isSlowConnection),
    showOfflineNotification: readonly(showOfflineNotification),
    lastOnlineTime: readonly(lastOnlineTime),
    lastOfflineTime: readonly(lastOfflineTime),
    
    // Methods
    getConnectionQuality,
    getStatusMessage,
    getStatusColor,
    dismissOfflineNotification,
    checkNetworkStatus,
    
    // Network info
    networkStatus: computed((): NetworkStatus => ({
      isOnline: isOnline.value,
      connectionType: connectionType.value,
      effectiveType: effectiveType.value,
      downlink: downlink.value,
      rtt: rtt.value,
      saveData: saveData.value,
    }))
  }
}