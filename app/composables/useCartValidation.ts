import { useCartStore } from '~/stores/cart'
import { useNotification } from '~/composables/useNotification'
import type { CartItem } from '~/types'
import type { ValidationResult } from '~/services/cart-validation.service'

export function useCartValidation() {
  const { $cartValidationService } = useNuxtApp()
  const cartStore = useCartStore()
  const notification = useNotification()

  const validating = ref(false)
  const lastValidation = ref<ValidationResult | null>(null)
  const requiresAcknowledgment = ref(false)
  const acknowledged = ref(false)

  const validateBeforeCheckout = async (): Promise<{
    isValid: boolean
    requiresAcknowledgment: boolean
    result: ValidationResult
  }> => {
    validating.value = true
    requiresAcknowledgment.value = false
    acknowledged.value = false

    try {
      const result = await ($cartValidationService as any).validateBeforeCheckout(cartStore.items)
      lastValidation.value = result

      if (result.removedItems.length > 0) {
        for (const item of result.removedItems) {
          cartStore.removeItem(item.menuItem.id, item.customizations)
        }
        notification.showWarning(
          'Cart Updated',
          `${result.removedItems.length} unavailable item(s) removed from your cart`
        )
        requiresAcknowledgment.value = true
      }

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
              (sum, mod) => sum + (mod.priceAdjustment || 0),
              0
            )
            cartItem.subtotal = cartItem.quantity * (change.newPrice + modifierPrice)
          }
        }

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

      if (result.errors.length > 0 && result.removedItems.length === 0) {
        notification.showError('Validation Error', result.errors[0])
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

  const validateOnReconnection = async (): Promise<void> => {
    if (cartStore.items.length === 0) return
    validating.value = true

    try {
      const result = await ($cartValidationService as any).validateOnReconnection(cartStore.items)
      lastValidation.value = result
      let hasChanges = false

      if (result.removedItems.length > 0) {
        for (const item of result.removedItems) {
          cartStore.removeItem(item.menuItem.id, item.customizations)
        }
        hasChanges = true
      }

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
              (sum, mod) => sum + (mod.priceAdjustment || 0),
              0
            )
            cartItem.subtotal = cartItem.quantity * (change.newPrice + modifierPrice)
          }
        }
        hasChanges = true
      }

      if (hasChanges) {
        const message = ($cartValidationService as any).formatValidationMessage(result)
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

  const validateStopList = async (): Promise<void> => {
    if (cartStore.items.length === 0) return
    try {
      const result = await ($cartValidationService as any).validateStopList(cartStore.items)
      if (result.stopListItems.length > 0) {
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

  const acknowledgeValidation = () => {
    acknowledged.value = true
  }

  const canProceedToPayment = computed(() => {
    if (!lastValidation.value) return false
    if (requiresAcknowledgment.value && !acknowledged.value) return false
    return lastValidation.value.isValid && cartStore.items.length > 0
  })

  const getValidationSummary = computed(() => {
    if (!lastValidation.value) return null
    const result = lastValidation.value
    return {
      hasChanges: result.removedItems.length > 0 || result.priceChanges.length > 0,
      removedCount: result.removedItems.length,
      priceChangesCount: result.priceChanges.length,
      errors: result.errors,
      warnings: result.warnings,
      requiresAcknowledgment: requiresAcknowledgment.value,
      acknowledged: acknowledged.value,
    }
  })

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
