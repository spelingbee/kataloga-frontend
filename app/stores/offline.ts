import { defineStore } from 'pinia'

export const useOfflineStore = defineStore('offline', () => {
  const isOffline = ref(false)
  const lastOnlineTime = ref<Date | null>(null)
  const offlineQueueSize = ref(0)

  /**
   * Set offline mode
   */
  const setOfflineMode = (offline: boolean) => {
    isOffline.value = offline
    
    if (!offline) {
      lastOnlineTime.value = new Date()
    }
  }

  /**
   * Check if currently offline
   */
  const checkOnlineStatus = () => {
    // Check if we're in a browser environment
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      const online = navigator.onLine
      setOfflineMode(!online)
      return online
    } else {
      // Assume online in SSR environment
      setOfflineMode(false)
      return true
    }
  }

  /**
   * Add item to offline queue
   */
  const addToQueue = () => {
    offlineQueueSize.value++
  }

  /**
   * Remove item from offline queue
   */
  const removeFromQueue = () => {
    if (offlineQueueSize.value > 0) {
      offlineQueueSize.value--
    }
  }

  /**
   * Clear offline queue
   */
  const clearQueue = () => {
    offlineQueueSize.value = 0
  }

  // Listen for online/offline events
  if (import.meta.client) {
    window.addEventListener('online', () => {
      setOfflineMode(false)
    })

    window.addEventListener('offline', () => {
      setOfflineMode(true)
    })

    // Initial check
    checkOnlineStatus()
  }

  return {
    isOffline: readonly(isOffline),
    lastOnlineTime: readonly(lastOnlineTime),
    offlineQueueSize: readonly(offlineQueueSize),
    setOfflineMode,
    checkOnlineStatus,
    addToQueue,
    removeFromQueue,
    clearQueue,
  }
})
