import { useNotificationStore } from '~/stores/notification'

export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

export function useNotification() {
  const notificationStore = useNotificationStore()

  const showNotification = (options: NotificationOptions) => {
    notificationStore.addNotification({
      id: Date.now().toString(),
      type: options.type === 'success' ? 'order' : 'system',
      title: options.title,
      message: options.message,
      isRead: false,
      createdAt: new Date().toISOString()
    })

    // Auto-dismiss after duration
    if (options.duration !== 0) {
      setTimeout(() => {
        notificationStore.removeNotification(Date.now().toString())
      }, options.duration || 5000)
    }
  }

  const showSuccess = (title: string, message: string) => {
    showNotification({ type: 'success', title, message })
  }

  const showError = (title: string, message: string) => {
    showNotification({ type: 'error', title, message })
  }

  const showWarning = (title: string, message: string) => {
    showNotification({ type: 'warning', title, message })
  }

  const showInfo = (title: string, message: string) => {
    showNotification({ type: 'info', title, message })
  }

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
