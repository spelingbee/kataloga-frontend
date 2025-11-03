interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  tag?: string
  requireInteraction?: boolean
}

interface InAppNotification {
  id: string
  type: 'order' | 'promotion' | 'system'
  title: string
  message: string
  data?: any
  timestamp: string
  isRead: boolean
}

export class NotificationService {
  private wsService: any = null
  private inAppNotifications: InAppNotification[] = []
  private notificationListeners: Set<(notification: InAppNotification) => void> = new Set()

  constructor() {
    this.initializeWebSocketIntegration()
  }

  private getApiClient(): any {
    const nuxtApp = useNuxtApp()
    return (nuxtApp as any).$apiClient
  }

  private async initializeWebSocketIntegration() {
    // Import WebSocket service dynamically to avoid circular dependencies
    const { useWebSocketService } = await import('./websocket.service')
    this.wsService = useWebSocketService()
    
    // Subscribe to WebSocket notifications
    this.wsService.subscribeToNotifications((data: any) => {
      this.handleWebSocketNotification(data)
    })

    this.wsService.subscribeToOrderUpdates((data: any) => {
      this.handleOrderUpdateNotification(data)
    })

    this.wsService.subscribeToPromotions((data: any) => {
      this.handlePromotionNotification(data)
    })

    this.wsService.subscribeToSystemMessages((data: any) => {
      this.handleSystemNotification(data)
    })
  }

  // Register push subscription with backend
  async registerPushSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      }

      const response = await this.getApiClient().post('/notifications/subscribe', subscriptionData)
      return response.success
    } catch (error) {
      console.error('Failed to register push subscription:', error)
      return false
    }
  }

  // Unregister push subscription
  async unregisterPushSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
      const response = await this.getApiClient().post('/notifications/unsubscribe', {
        endpoint: subscription.endpoint,
      })
      return response.success
    } catch (error) {
      console.error('Failed to unregister push subscription:', error)
      return false
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        console.error('Service worker not registered')
        return null
      }

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Subscribe to push notifications
        const vapidPublicKey = await this.getVapidPublicKey()
        if (!vapidPublicKey) return null

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        })
      }

      // Register with backend
      const registered = await this.registerPushSubscription(subscription)
      if (!registered) {
        await subscription.unsubscribe()
        return null
      }

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) return false

      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) return true

      await this.unregisterPushSubscription(subscription)
      return await subscription.unsubscribe()
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  // Get VAPID public key from backend
  async getVapidPublicKey(): Promise<string | null> {
    try {
      const response = await this.getApiClient().get('/notifications/vapid-key')
      return response.success ? response.data.publicKey : null
    } catch (error) {
      console.error('Failed to get VAPID public key:', error)
      return null
    }
  }

  // Send test notification
  async sendTestNotification(): Promise<boolean> {
    try {
      const response = await this.getApiClient().post('/notifications/test')
      return response.success
    } catch (error) {
      console.error('Failed to send test notification:', error)
      return false
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences: {
    orderUpdates: boolean
    promotions: boolean
    reminders: boolean
  }): Promise<boolean> {
    try {
      const response = await this.getApiClient().put('/notifications/preferences', preferences)
      return response.success
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      return false
    }
  }

  // Get notification preferences
  async getNotificationPreferences(): Promise<{
    orderUpdates: boolean
    promotions: boolean
    reminders: boolean
  } | null> {
    try {
      const response = await this.getApiClient().get('/notifications/preferences')
      return response.success ? response.data : null
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      return null
    }
  }

  // Utility functions
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // WebSocket notification handlers
  private handleWebSocketNotification(data: any) {
    const notification: InAppNotification = {
      id: data.id || this.generateNotificationId(),
      type: data.type || 'system',
      title: data.title,
      message: data.message || data.body,
      data: data.data,
      timestamp: data.timestamp || new Date().toISOString(),
      isRead: false
    }

    this.addInAppNotification(notification)
    this.showBrowserNotification(notification)
  }

  private handleOrderUpdateNotification(data: any) {
    const notification: InAppNotification = {
      id: this.generateNotificationId(),
      type: 'order',
      title: 'Order Update',
      message: data.message || `Your order status has been updated to ${data.status}`,
      data: { orderId: data.orderId, status: data.status },
      timestamp: new Date().toISOString(),
      isRead: false
    }

    this.addInAppNotification(notification)
    this.showBrowserNotification(notification)
  }

  private handlePromotionNotification(data: any) {
    const notification: InAppNotification = {
      id: this.generateNotificationId(),
      type: 'promotion',
      title: data.title || 'New Promotion',
      message: data.message || data.description,
      data: data,
      timestamp: new Date().toISOString(),
      isRead: false
    }

    this.addInAppNotification(notification)
    this.showBrowserNotification(notification)
  }

  private handleSystemNotification(data: any) {
    const notification: InAppNotification = {
      id: this.generateNotificationId(),
      type: 'system',
      title: data.title || 'System Notification',
      message: data.message,
      data: data,
      timestamp: new Date().toISOString(),
      isRead: false
    }

    this.addInAppNotification(notification)
    this.showBrowserNotification(notification)
  }

  // In-app notification management
  private addInAppNotification(notification: InAppNotification) {
    this.inAppNotifications.unshift(notification)
    
    // Keep only last 50 notifications
    if (this.inAppNotifications.length > 50) {
      this.inAppNotifications = this.inAppNotifications.slice(0, 50)
    }

    // Notify listeners
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification)
      } catch (error) {
        console.error('Error in notification listener:', error)
      }
    })
  }

  private async showBrowserNotification(notification: InAppNotification) {
    // Check if browser notifications are supported and permitted
    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: notification.type,
        data: notification.data,
        requireInteraction: notification.type === 'order'
      })

      browserNotification.onclick = () => {
        this.handleNotificationClick(notification)
        browserNotification.close()
      }

      // Auto close after 5 seconds for non-order notifications
      if (notification.type !== 'order') {
        setTimeout(() => browserNotification.close(), 5000)
      }
    }
  }

  private handleNotificationClick(notification: InAppNotification) {
    // Mark as read
    notification.isRead = true

    // Navigate based on notification type
    if (import.meta.client) {
      const router = useRouter()
      
      switch (notification.type) {
        case 'order':
          if (notification.data?.orderId) {
            router.push(`/orders/${notification.data.orderId}`)
          } else {
            router.push('/orders')
          }
          break
        case 'promotion':
          router.push('/promotions')
          break
        default:
          router.push('/notifications')
      }
    }
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API for in-app notifications
  getInAppNotifications(): InAppNotification[] {
    return [...this.inAppNotifications]
  }

  getUnreadCount(): number {
    return this.inAppNotifications.filter(n => !n.isRead).length
  }

  markAsRead(notificationId: string): void {
    const notification = this.inAppNotifications.find(n => n.id === notificationId)
    if (notification) {
      notification.isRead = true
    }
  }

  markAllAsRead(): void {
    this.inAppNotifications.forEach(n => n.isRead = true)
  }

  clearNotifications(): void {
    this.inAppNotifications = []
  }

  onNotification(callback: (notification: InAppNotification) => void): () => void {
    this.notificationListeners.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.notificationListeners.delete(callback)
    }
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
}

// Create singleton instance
let notificationService: NotificationService | null = null

export function useNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService()
  }
  return notificationService
}

// Composable for easier usage in components
export function useNotifications() {
  const notificationService = useNotificationService()
  const notifications = ref<InAppNotification[]>([])
  const unreadCount = ref(0)

  const updateNotifications = () => {
    notifications.value = notificationService.getInAppNotifications()
    unreadCount.value = notificationService.getUnreadCount()
  }

  onMounted(() => {
    updateNotifications()
    
    // Subscribe to new notifications
    const unsubscribe = notificationService.onNotification(() => {
      updateNotifications()
    })

    onUnmounted(() => {
      unsubscribe()
    })
  })

  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId)
    updateNotifications()
  }

  const markAllAsRead = () => {
    notificationService.markAllAsRead()
    updateNotifications()
  }

  const clearAll = () => {
    notificationService.clearNotifications()
    updateNotifications()
  }

  const requestPermission = () => {
    return notificationService.requestNotificationPermission()
  }

  return {
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPermission
  }
}