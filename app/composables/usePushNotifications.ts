import { useTenantStore } from '~/stores/tenant'

export function usePushNotifications() {
  const { $notificationService } = useNuxtApp()
  const isSupported = ref(false)
  const isSubscribed = ref(false)
  const subscription = ref<PushSubscription | null>(null)
  const permission = ref<NotificationPermission>('default')
  const tenantStore = import.meta.client ? useTenantStore() : null
  const currentTenantId = computed(() => tenantStore?.tenantId || null)

  const checkSupport = () => {
    if (import.meta.client) {
      isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      permission.value = Notification.permission
    }
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported.value) return false
    if (permission.value === 'granted') return true
    if (permission.value === 'denied') return false

    try {
      const result = await Notification.requestPermission()
      permission.value = result
      return result === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported.value || !$notificationService) return false

    try {
      const hasPermission = await requestPermission()
      if (!hasPermission) return false

      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) return false

      let pushSubscription = await registration.pushManager.getSubscription()
      
      if (!pushSubscription) {
        const vapidKey = await ($notificationService as any).getVapidPublicKey()
        if (!vapidKey) return false

        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        })
      }

      const registered = await ($notificationService as any).registerPushSubscription(pushSubscription)
      
      if (registered) {
        subscription.value = pushSubscription
        isSubscribed.value = true
        return true
      } else {
        await pushSubscription.unsubscribe()
        return false
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return false
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription.value || !$notificationService) return true

    try {
      await ($notificationService as any).unregisterPushSubscription(subscription.value)
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

  const sendTestNotification = async (): Promise<boolean> => {
    if (!isSubscribed.value || !$notificationService) return false
    try {
      return await ($notificationService as any).sendTestNotification()
    } catch (error) {
      console.error('Failed to send test notification:', error)
      return false
    }
  }

  const updatePreferences = async (preferences: {
    orderUpdates: boolean
    promotions: boolean
    reminders: boolean
  }): Promise<boolean> => {
    if (!$notificationService) return false
    try {
      return await ($notificationService as any).updateNotificationPreferences(preferences)
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      return false
    }
  }

  const getPreferences = async () => {
    if (!$notificationService) return null
    try {
      return await ($notificationService as any).getNotificationPreferences()
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      return null
    }
  }

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

  const updateSubscriptionForTenant = async (): Promise<boolean> => {
    if (!isSubscribed.value || !subscription.value || !$notificationService) return false
    try {
      const success = await ($notificationService as any).updatePushSubscriptionForTenant()
      if (success) {
        console.log('Push subscription updated for tenant:', currentTenantId.value)
      }
      return success
    } catch (error) {
      console.error('Failed to update subscription for tenant:', error)
      return false
    }
  }

  onMounted(() => {
    checkSupport()
    checkSubscription()

    if (tenantStore) {
      watch(
        () => tenantStore.tenantId,
        async (newTenantId, oldTenantId) => {
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
