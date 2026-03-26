/**
 * Composable for Telegram WebApp Haptic Feedback
 * Provides safe access to Telegram's haptic feedback API with fallbacks
 */

export const useTelegramHaptic = () => {
  /**
   * Check if Telegram WebApp is available
   */
  const isTelegramAvailable = computed(() => {
    return typeof window !== 'undefined' && 
           window.Telegram?.WebApp?.HapticFeedback !== undefined
  })

  /**
   * Trigger impact haptic feedback
   * @param style - The intensity of the haptic feedback
   */
  const impactOccurred = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    try {
      if (isTelegramAvailable.value) {
        window.Telegram!.WebApp.HapticFeedback.impactOccurred(style)
      }
    } catch (error) {
      console.warn('Failed to trigger Telegram haptic feedback:', error)
    }
  }

  /**
   * Trigger notification haptic feedback
   * @param type - The type of notification
   */
  const notificationOccurred = (type: 'error' | 'success' | 'warning') => {
    try {
      if (isTelegramAvailable.value) {
        window.Telegram!.WebApp.HapticFeedback.notificationOccurred(type)
      }
    } catch (error) {
      console.warn('Failed to trigger Telegram notification haptic:', error)
    }
  }

  /**
   * Trigger selection changed haptic feedback
   */
  const selectionChanged = () => {
    try {
      if (isTelegramAvailable.value) {
        window.Telegram!.WebApp.HapticFeedback.selectionChanged()
      }
    } catch (error) {
      console.warn('Failed to trigger Telegram selection haptic:', error)
    }
  }

  /**
   * Convenience methods for common cart actions
   */
  const cartActions = {
    /** Haptic feedback when adding item to cart */
    addToCart: () => impactOccurred('medium'),
    
    /** Haptic feedback when removing item from cart */
    removeFromCart: () => impactOccurred('light'),
    
    /** Haptic feedback when updating quantity */
    updateQuantity: () => selectionChanged(),
    
    /** Haptic feedback for successful checkout */
    checkoutSuccess: () => notificationOccurred('success'),
    
    /** Haptic feedback for checkout error */
    checkoutError: () => notificationOccurred('error'),
    
    /** Haptic feedback when clearing cart */
    clearCart: () => impactOccurred('heavy')
  }

  return {
    isTelegramAvailable,
    impactOccurred,
    notificationOccurred,
    selectionChanged,
    cartActions
  }
}