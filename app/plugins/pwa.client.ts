import { safeArrayAccess } from '~/types/utils/type-guards'

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (import.meta.server) return

  // PWA functionality
  const initializePWA = () => {
    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone ||
                  document.referrer.includes('android-app://')

    if (isPWA) {
      console.log('Running as PWA')
      
      // Add PWA-specific styling
      document.documentElement.classList.add('pwa-mode')
      
      // Handle PWA-specific behaviors
      handlePWABehaviors()
    }

    // Handle offline/online status
    handleNetworkStatus()
  }

  const handlePWABehaviors = () => {
    // Prevent pull-to-refresh on iOS PWA
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return
      
      const touch = safeArrayAccess(Array.from(e.touches), 0)
      if (touch && touch.clientY <= 0) {
        e.preventDefault()
      }
    }, { passive: false })

    // Handle safe area insets for notched devices
    const updateSafeAreaInsets = () => {
      const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')
      const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')
      
      if (safeAreaTop) {
        document.documentElement.style.setProperty('--app-safe-area-top', safeAreaTop)
      }
      if (safeAreaBottom) {
        document.documentElement.style.setProperty('--app-safe-area-bottom', safeAreaBottom)
      }
    }

    updateSafeAreaInsets()
    window.addEventListener('resize', updateSafeAreaInsets)
  }



  const handleNetworkStatus = () => {
    const updateNetworkStatus = () => {
      const isOnline = typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true
      document.documentElement.classList.toggle('offline', !isOnline)
      
      if (!isOnline) {
        showOfflineNotification()
      } else {
        hideOfflineNotification()
      }
    }

    // Initial check
    updateNetworkStatus()

    // Listen for network changes
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
  }

  const showOfflineNotification = () => {
    if (document.getElementById('offline-banner')) return

    const offlineBanner = document.createElement('div')
    offlineBanner.id = 'offline-banner'
    offlineBanner.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm z-50'
    offlineBanner.textContent = 'You are offline. Some features may not be available.'

    document.body.appendChild(offlineBanner)
  }

  const hideOfflineNotification = () => {
    const banner = document.getElementById('offline-banner')
    if (banner) {
      banner.remove()
    }
  }

  // Initialize PWA functionality
  initializePWA()
})