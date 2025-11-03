interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export const usePWAFeatures = () => {
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const isOnline = ref(true)
  const installPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const updateAvailable = ref(false)

  // Check if app is installed
  const checkInstallStatus = () => {
    if (typeof window !== 'undefined') {
      // Check if running in standalone mode (installed PWA)
      isInstalled.value = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
    }
  }

  // Handle install prompt
  const handleInstallPrompt = (e: BeforeInstallPromptEvent) => {
    e.preventDefault()
    installPrompt.value = e
    isInstallable.value = true
  }

  // Show install prompt
  const showInstallPrompt = async (): Promise<boolean> => {
    if (!installPrompt.value) return false

    try {
      await installPrompt.value.prompt()
      const choiceResult = await installPrompt.value.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        isInstallable.value = false
        installPrompt.value = null
        return true
      }
    } catch (error) {
      console.error('Install prompt failed:', error)
    }
    
    return false
  }

  // Handle app installed
  const handleAppInstalled = () => {
    isInstalled.value = true
    isInstallable.value = false
    installPrompt.value = null
  }

  // Handle online/offline status
  const handleOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }

  // Register for push notifications
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  }

  // Show local notification
  const showNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        ...options,
      })
    }
  }

  // Handle service worker updates
  const handleServiceWorkerUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        updateAvailable.value = true
      })
    }
  }

  // Reload app to apply updates
  const reloadApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    }
    window.location.reload()
  }

  // Initialize PWA functionality
  const initializePWA = () => {
    if (typeof window === 'undefined') return

    checkInstallStatus()
    handleOnlineStatus()
    handleServiceWorkerUpdate()

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)

    // Check for updates periodically
    if ('serviceWorker' in navigator) {
      setInterval(() => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update()
          }
        })
      }, 60000) // Check every minute
    }
  }

  // Cleanup
  const cleanup = () => {
    if (typeof window === 'undefined') return

    window.removeEventListener('beforeinstallprompt', handleInstallPrompt as EventListener)
    window.removeEventListener('appinstalled', handleAppInstalled)
    window.removeEventListener('online', handleOnlineStatus)
    window.removeEventListener('offline', handleOnlineStatus)
  }

  // Share API
  const canShare = computed(() => {
    return typeof window !== 'undefined' && 'share' in navigator
  })

  const shareContent = async (data: ShareData): Promise<boolean> => {
    if (!canShare.value) return false

    try {
      await navigator.share(data)
      return true
    } catch (error) {
      console.error('Share failed:', error)
      return false
    }
  }

  onMounted(() => {
    initializePWA()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    isInstallable: readonly(isInstallable),
    isInstalled: readonly(isInstalled),
    isOnline: readonly(isOnline),
    updateAvailable: readonly(updateAvailable),
    canShare,
    showInstallPrompt,
    requestNotificationPermission,
    showNotification,
    reloadApp,
    shareContent,
  }
}