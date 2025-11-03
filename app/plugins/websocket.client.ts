export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (import.meta.server) return

  const { useWebSocketService } = await import('~/services/websocket.service')
  const { useNotificationService } = await import('~/services/notification.service')
  
  const wsService = useWebSocketService()
  const notificationService = useNotificationService()
  
  // Initialize WebSocket connection when user is authenticated
  const { useAuthStore } = await import('~/stores/auth')
  const authStore = useAuthStore()
  
  if (authStore.isAuthenticated) {
    // Set auth store reference for WebSocket service
    wsService.setAuthStore(authStore)
    
    // Connect to WebSocket
    try {
      await wsService.connect()
      console.log('WebSocket connected successfully')
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
    }
  }

  // Listen for auth state changes to connect/disconnect WebSocket
  watch(() => authStore.isAuthenticated, async (isAuthenticated) => {
    if (isAuthenticated) {
      wsService.setAuthStore(authStore)
      try {
        await wsService.connect()
        console.log('WebSocket connected after authentication')
      } catch (error) {
        console.error('Failed to connect to WebSocket after authentication:', error)
      }
    } else {
      wsService.disconnect()
      console.log('WebSocket disconnected after logout')
    }
  })

  // Handle page visibility changes to manage connection
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && authStore.isAuthenticated) {
        // Reconnect when page becomes visible
        if (!wsService.isConnected()) {
          wsService.connect().catch(error => {
            console.error('Failed to reconnect WebSocket:', error)
          })
        }
      }
    })
  }

  // Handle online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      if (authStore.isAuthenticated && !wsService.isConnected()) {
        wsService.connect().catch(error => {
          console.error('Failed to reconnect WebSocket when online:', error)
        })
      }
    })

    window.addEventListener('offline', () => {
      // WebSocket will automatically disconnect, no need to manually disconnect
      console.log('Device went offline, WebSocket will disconnect automatically')
    })
  }

  // Provide services globally
  return {
    provide: {
      wsService,
      notificationService
    }
  }
})