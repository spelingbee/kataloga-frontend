import { ref, computed, watch, onMounted, readonly } from 'vue'
import { useTenantStore } from '~/stores/tenant'

export function usePushNotifications() {
  const isSupported = ref(false)
  const isSubscribed = ref(false)
  const subscription = ref<PushSubscription | null>(null)
  const permission = ref<NotificationPermission>('default')
  const tenantStore = import.meta.client ? useTenantStore() : null
  const currentTenantId = computed(() => tenantStore?.tenantId || null)

  // Check if push notifications are supported
  const checkSupport = () => {
    if (import.meta.client) {
      isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      permission.value = Notification.permission
    }
  }

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported.value) {
      console.warn('Push notifications are not supported')
      return false
    }

    if (permission.value === 'granted') {
      return true
    }

    if (permission.value === 'denied') {
      console.warn('Push notifications are denied')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      permission.value = result
      return result === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  // Subscribe to push notifications
  const subscribe = async (): Promise<boolean> => {
    if (!isSupported.value) {
      console.warn('Push notifications are not supported')
      return false
    }

    try {
      // Request permission first
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        console.error('Service worker not registered')
        return false
      }

      // Check if already subscribed
      let pushSubscription = await registration.pushManager.getSubscription()

      if (!pushSubscription) {
        // Get VAPID public key from notification service
        const { useNotificationService } = await import('~/services/notification.service')
        const notificationService = useNotificationService()
        const vapidKey = await notificationService.getVapidPublicKey()

        if (!vapidKey) {
          console.error('Failed to get VAPID public key')
          return false
        }

        // Subscribe to push notifications
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        })
      }

      // Register subscription with backend
      const { useNotificationService } = await import('~/services/notification.service')
      const notificationService = useNotificationService()
      const registered = await notificationService.registerPushSubscription(pushSubscription)

      if (registered) {
        subscription.value = pushSubscription
        isSubscribed.value = true
        return true
      } else {
        // If registration failed, unsubscribe
        await pushSubscription.unsubscribe()
        return false
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return false
    }
  }

  // Unsubscribe from push notifications
  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription.value) {
      return true
    }

    try {
      // Unregister with backend first
      const { useNotificationService } = await import('~/services/notification.service')
      const notificationService = useNotificationService()
      await notificationService.unregisterPushSubscription(subscription.value)

      // Unsubscribe from browser
      const success = await subscription.value.unsubscribe()

      if (success) {
        subscription.value = null
        isSubscribed.value = false
      }

      return success
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  // Check current subscription status
  const checkSubscription = async () => {
    if (!isSupported.value) return

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) return

      const pushSubscription = await registration.pushManager.getSubscription()
      subscription.value = pushSubscription
      isSubscribed.value = !!pushSubscription
    } catch (error) {
      console.error('Failed to check subscription status:', error)
    }
  }

  // Send test notification
  const sendTestNotification = async (): Promise<boolean> => {
    if (!isSubscribed.value) {
      console.warn('Not subscribed to push notifications')
      return false
    }

    try {
      const { useNotificationService } = await import('~/services/notification.service')
      const notificationService = useNotificationService()
      return await notificationService.sendTestNotification()
    } catch (error) {
      console.error('Failed to send test notification:', error)
      return false
    }
  }

  // Update notification preferences
  const updatePreferences = async (preferences: {
    orderUpdates: boolean
    promotions: boolean
    reminders: boolean
  }): Promise<boolean> => {
    try {
      const { useNotificationService } = await import('~/services/notification.service')
      const notificationService = useNotificationService()
      return await notificationService.updateNotificationPreferences(preferences)
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      return false
    }
  }

  // Get notification preferences
  const getPreferences = async () => {
    try {
      const { useNotificationService } = await import('~/services/notification.service')
      const notificationService = useNotificationService()
      return await notificationService.getNotificationPreferences()
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      return null
    }
  }

  // Utility function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Update subscription when tenant changes
  const updateSubscriptionForTenant = async (): Promise<boolean> => {
    if (!isSubscribed.value || !subscription.value) {
      return false
    }

    try {
      const { useNotificationService } = await import('~/services/notification.service')
      const notificationService = useNotificationService()

      // Re-register subscription with new tenant context
      const success = await notificationService.updatePushSubscriptionForTenant()

      if (success) {
        console.log('Push subscription updated for tenant:', currentTenantId.value)
      }

      return success
    } catch (error) {
      console.error('Failed to update subscription for tenant:', error)
      return false
    }
  }

  // Initialize on mount
  onMounted(() => {
    checkSupport()
    checkSubscription()

    // Watch for tenant changes and update subscription
    if (tenantStore) {
      watch(
        () => tenantStore.tenantId,
        async (newTenantId, oldTenantId) => {
          // Only update if tenant actually changed and we have a subscription
          if (newTenantId && oldTenantId && newTenantId !== oldTenantId && isSubscribed.value) {
            console.log('Tenant changed, updating push notification subscription...')
            await updateSubscriptionForTenant()
          }
        }
      )
    }
  })

  return {
    isSupported: readonly(isSupported),
    isSubscribed: readonly(isSubscribed),
    permission: readonly(permission),
    subscription: readonly(subscription),
    currentTenantId: readonly(currentTenantId),
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscription,
    sendTestNotification,
    updatePreferences,
    getPreferences,
    updateSubscriptionForTenant
  }
}