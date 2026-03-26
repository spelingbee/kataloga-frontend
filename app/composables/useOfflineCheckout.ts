import { useNetworkStatus } from './useNetworkStatus'
import { useNotification } from './useNotification'

export const useOfflineCheckout = () => {
  const { isOnline } = useNetworkStatus()
  const { showNotification } = useNotification()

  // Check if checkout is allowed
  const canCheckout = computed(() => isOnline.value)

  // Prevent checkout when offline
  const preventOfflineCheckout = (): boolean => {
    if (!isOnline.value) {
      showNotification({
        type: 'warning',
        title: 'Internet Connection Required',
        message: 'You need an internet connection to complete checkout. Your cart will be saved and you can checkout when you\'re back online.',
        duration: 5000,
      })
      return false
    }
    return true
  }

  // Show offline checkout message
  const showOfflineCheckoutMessage = () => {
    showNotification({
      type: 'info',
      title: 'Offline Mode',
      message: 'You\'re currently offline. You can browse the menu and add items to your cart, but you\'ll need an internet connection to complete your order.',
      duration: 7000,
    })
  }

  // Validate network before proceeding to checkout
  const validateNetworkForCheckout = async (): Promise<boolean> => {
    if (!isOnline.value) {
      preventOfflineCheckout()
      return false
    }

    // Double-check with a network request
    try {
      const response = await fetch('/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) {
        preventOfflineCheckout()
        return false
      }
      
      return true
    } catch (error) {
      preventOfflineCheckout()
      return false
    }
  }

  return {
    canCheckout: readonly(canCheckout),
    preventOfflineCheckout,
    showOfflineCheckoutMessage,
    validateNetworkForCheckout,
  }
}
