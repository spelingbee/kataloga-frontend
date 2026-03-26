import { useNotificationStore } from '~/stores/notification'

export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

export function useNotification() {
  const notificationStore = useNotificationStore()

  // Function overloads for backward compatibility
  function showNotification(options: NotificationOptions): void
  function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void
  function showNotification(
    optionsOrMessage: NotificationOptions | string, 
    type?: 'success' | 'error' | 'warning' | 'info'
  ): void {
    let options: NotificationOptions

    // Handle both signatures
    if (typeof optionsOrMessage === 'string') {
      options = {
        type: type || 'info',
        title: type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : 'Info',
        message: optionsOrMessage
      }
    } else {
      options = optionsOrMessage
    }

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
