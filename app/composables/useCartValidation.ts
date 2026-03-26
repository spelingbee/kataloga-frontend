import { useCartValidationService, type ValidationResult } from '~/services/cart-validation.service'
import { useCartStore } from '~/stores/cart'
import { useNotification } from '~/composables/useNotification'
import type { CartItem } from '~/types'

export function useCartValidation() {
  const cartStore = useCartStore()
  const validationService = useCartValidationService()
  const notification = useNotification()

  const validating = ref(false)
  const lastValidation = ref<ValidationResult | null>(null)
  const requiresAcknowledgment = ref(false)
  const acknowledged = ref(false)

  /**
   * Validate cart before checkout
   * Returns validation result and updates cart if needed
   */
  const validateBeforeCheckout = async (): Promise<{
    isValid: boolean
    requiresAcknowledgment: boolean
    result: ValidationResult
  }> => {
    validating.value = true
    requiresAcknowledgment.value = false
    acknowledged.value = false

    try {
      const result = await validationService.validateBeforeCheckout(cartStore.items)
      lastValidation.value = result

      // Handle removed items (stop list or unavailable)
      if (result.removedItems.length > 0) {
        // Remove items from cart
        for (const item of result.removedItems) {
          cartStore.removeItem(item.menuItem.id, item.customizations)
        }

        // Show notification
        notification.showWarning(
          'Cart Updated',
          `${result.removedItems.length} unavailable item(s) removed from your cart`
        )

        requiresAcknowledgment.value = true
      }

      // Handle price changes
      if (result.priceChanges.length > 0) {
        // Update cart with new prices
        for (const change of result.priceChanges) {
          const cartItem = cartStore.items.find(
            item =>
              item.menuItem.id === change.item.menuItem.id &&
              JSON.stringify(item.customizations) === JSON.stringify(change.item.customizations)
          )

          if (cartItem) {
            // Update menu item data and recalculate subtotal
            cartItem.menuItem = change.item.menuItem
            const modifierPrice = cartItem.selectedModifiers.reduce(
              (sum: number, mod: any) => sum + (mod.priceAdjustment || 0),
              0
            )
            cartItem.subtotal = cartItem.quantity * (change.newPrice + modifierPrice)
          }
        }

        // Persist updated cart
        cartStore._persistToStorage()

        // Show notification
        const priceIncreases = result.priceChanges.filter(c => c.newPrice > c.oldPrice).length
        const priceDecreases = result.priceChanges.filter(c => c.newPrice < c.oldPrice).length

        let message = ''
        if (priceIncreases > 0 && priceDecreases > 0) {
          message = `Prices changed for ${result.priceChanges.length} item(s)`
        } else if (priceIncreases > 0) {
          message = `Prices increased for ${priceIncreases} item(s)`
        } else {
          message = `Prices decreased for ${priceDecreases} item(s)`
        }

        notification.showWarning('Price Changes', message)
        requiresAcknowledgment.value = true
      }

      // Show general errors if any
      if (result.errors.length > 0 && result.removedItems.length === 0) {
        notification.showError('Validation Error', result.errors[0] || 'Unknown error')
      }

      return {
        isValid: result.isValid && cartStore.items.length > 0,
        requiresAcknowledgment: requiresAcknowledgment.value,
        result,
      }
    } catch (error) {
      console.error('Cart validation failed:', error)
      notification.showError(
        'Validation Failed',
        'Unable to validate cart. Please try again.'
      )

      return {
        isValid: false,
        requiresAcknowledgment: false,
        result: {
          isValid: false,
          errors: ['Validation failed'],
          warnings: [],
          removedItems: [],
          priceChanges: [],
          stopListItems: [],
        },
      }
    } finally {
      validating.value = false
    }
  }

  /**
   * Validate cart on reconnection (after being offline)
   */
  const validateOnReconnection = async (): Promise<void> => {
    if (cartStore.items.length === 0) {
      return
    }

    validating.value = true

    try {
      const result = await validationService.validateOnReconnection(cartStore.items)
      lastValidation.value = result

      let hasChanges = false

      // Handle removed items
      if (result.removedItems.length > 0) {
        for (const item of result.removedItems) {
          cartStore.removeItem(item.menuItem.id, item.customizations)
        }
        hasChanges = true
      }

      // Handle price changes
      if (result.priceChanges.length > 0) {
        for (const change of result.priceChanges) {
          const cartItem = cartStore.items.find(
            item =>
              item.menuItem.id === change.item.menuItem.id &&
              JSON.stringify(item.customizations) === JSON.stringify(change.item.customizations)
          )

          if (cartItem) {
            cartItem.menuItem = change.item.menuItem
            const modifierPrice = cartItem.selectedModifiers.reduce(
              (sum: number, mod: any) => sum + (mod.priceAdjustment || 0),
              0
            )
            cartItem.subtotal = cartItem.quantity * (change.newPrice + modifierPrice)
          }
        }
        cartStore._persistToStorage()
        hasChanges = true
      }

      // Show notification if there were changes
      if (hasChanges) {
        const message = validationService.formatValidationMessage(result)
        if (message.type === 'error') {
          notification.showError(message.title, message.message)
        } else if (message.type === 'warning') {
          notification.showWarning(message.title, message.message)
        } else {
          notification.showInfo(message.title, message.message)
        }
      }
    } catch (error) {
      console.error('Cart validation on reconnection failed:', error)
    } finally {
      validating.value = false
    }
  }

  /**
   * Quick validation for stop list only
   */
  const validateStopList = async (): Promise<void> => {
    if (cartStore.items.length === 0) {
      return
    }

    try {
      const result = await validationService.validateStopList(cartStore.items)

      if (result.stopListItems.length > 0) {
        // Remove stop list items from cart
        for (const item of result.stopListItems) {
          cartStore.removeItem(item.menuItem.id, item.customizations)
        }

        notification.showWarning(
          'Items Unavailable',
          `${result.stopListItems.length} item(s) are temporarily unavailable and have been removed`
        )
      }
    } catch (error) {
      console.error('Stop list validation failed:', error)
    }
  }

  /**
   * Acknowledge validation warnings
   * User must acknowledge before proceeding to payment
   */
  const acknowledgeValidation = () => {
    acknowledged.value = true
  }

  /**
   * Check if user can proceed to payment
   */
  const canProceedToPayment = computed(() => {
    if (!lastValidation.value) {
      return false
    }

    // If validation requires acknowledgment, user must acknowledge
    if (requiresAcknowledgment.value && !acknowledged.value) {
      return false
    }

    // Cart must be valid and not empty
    return lastValidation.value.isValid && cartStore.items.length > 0
  })

  /**
   * Get validation summary for display
   */
  const getValidationSummary = computed(() => {
    if (!lastValidation.value) {
      return null
    }

    const result = lastValidation.value
    const summary = {
      hasChanges: result.removedItems.length > 0 || result.priceChanges.length > 0,
      removedCount: result.removedItems.length,
      priceChangesCount: result.priceChanges.length,
      errors: result.errors,
      warnings: result.warnings,
      requiresAcknowledgment: requiresAcknowledgment.value,
      acknowledged: acknowledged.value,
    }

    return summary
  })

  /**
   * Reset validation state
   */
  const resetValidation = () => {
    lastValidation.value = null
    requiresAcknowledgment.value = false
    acknowledged.value = false
  }

  return {
    validating: readonly(validating),
    lastValidation: readonly(lastValidation),
    requiresAcknowledgment: readonly(requiresAcknowledgment),
    acknowledged: readonly(acknowledged),
    canProceedToPayment,
    getValidationSummary,
    validateBeforeCheckout,
    validateOnReconnection,
    validateStopList,
    acknowledgeValidation,
    resetValidation,
  }
}
