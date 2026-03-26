export default defineNuxtPlugin({
  name: 'websocket',
  async setup() {
    let wsService: any = null
    let notificationService: any = null

    // Only run on client side
    if (process.server) {
      return {
        provide: {
          wsService,
          notificationService
        }
      }
    }

  const { useWebSocketService } = await import('~/services/websocket.service')
  const { useNotificationService } = await import('~/services/notification.service')
  
  wsService = useWebSocketService()
  notificationService = useNotificationService()
  
  // Initialize WebSocket connection when user is authenticated
  const { useAuthStore } = await import('~/stores/auth')
  const { useTenantStore } = await import('~/stores/tenant')
  const authStore = useAuthStore()
  const tenantStore = useTenantStore()
  
  // Set tenant store reference for WebSocket service
  wsService.setTenantStore(tenantStore)
  
  // Set initial tenant if available
  if (tenantStore.tenantSlug) {
    wsService.setTenant(tenantStore.tenantSlug)
  }
  
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

  // Listen for tenant changes to update WebSocket context
  watch(() => tenantStore.tenantSlug, (newTenantSlug) => {
    if (newTenantSlug) {
      wsService.setTenant(newTenantSlug)
      console.log('WebSocket tenant context updated:', newTenantSlug)
    }
  })

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
          wsService.connect().catch((error: any) => {
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
        wsService.connect().catch((error: any) => {
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
  }
})