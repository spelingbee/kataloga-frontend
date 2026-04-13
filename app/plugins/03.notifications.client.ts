/**
 * Notifications Plugin
 * Initializes notification system on app startup
 */
import { useNotificationStore } from '~/stores/notification'
export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('[NotificationsPlugin] Initializing...')
  
  // Initialize notification store
  const notificationStore = useNotificationStore()
  
  // Initialize the store — non-blocking with a safety timeout
  try {
    await Promise.race([
      notificationStore.initialize(),
      new Promise<void>((resolve) => setTimeout(() => {
        console.warn('[NotificationsPlugin] Initialization timed out after 5s')
        resolve()
      }, 5000))
    ])
    console.log('[NotificationsPlugin] Initialized successfully')
  } catch (error) {
    console.error('[NotificationsPlugin] Initialization failed:', error)
  }

  // Check if we should request notification permission
  if (import.meta.client && 'Notification' in window) {
    // Check if permission was previously requested
    const permissionRequested = localStorage.getItem('notification-permission-requested')
    
    if (!permissionRequested && Notification.permission === 'default') {
      // Don't auto-request on first visit, let user trigger it
      // Just log that notifications are available
      console.log('[NotificationsPlugin] Push notifications are available')
    }
  }

  // Provide notification service globally
  return {
    provide: {
      notifications: notificationStore
    }
  }
})
