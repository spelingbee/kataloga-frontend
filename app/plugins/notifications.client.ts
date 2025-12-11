/**
 * Notifications Plugin
 * Initializes notification system on app startup
 */
import { useNotificationStore } from '~/stores/notification'
export default defineNuxtPlugin(async (nuxtApp) => {
  // Initialize notification store
  const notificationStore = useNotificationStore()
  
  // Initialize the store with WebSocket integration
  await notificationStore.initialize()

  // Check if we should request notification permission
  if (import.meta.client && 'Notification' in window) {
    // Check if permission was previously requested
    const permissionRequested = localStorage.getItem('notification-permission-requested')
    
    if (!permissionRequested && Notification.permission === 'default') {
      // Don't auto-request on first visit, let user trigger it
      // Just log that notifications are available
      console.log('Push notifications are available')
    }
  }

  // Provide notification service globally
  return {
    provide: {
      notifications: notificationStore
    }
  }
})
