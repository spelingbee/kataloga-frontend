import { computed, readonly } from 'vue'
import { storeToRefs } from 'pinia'
import type { CartItem, MenuItem, CreateOrderDto, CustomerInfo } from '~/types'
import { useCartStore } from '~/stores/cart'
import { useOrderStore } from '~/stores/order'

export function useCart() {
  const cartStore = useCartStore()
  const orderStore = useOrderStore()
  
  const {
    items,
    loading,
    total,
    itemCount,
    isEmpty,
    syncing,
    lastSyncAt,
  } = storeToRefs(cartStore)

  // Actions
  const addItem = (menuItem: MenuItem, quantity: number = 1, customizations?: Record<string, any>) => {
    cartStore.addItem(menuItem, quantity, customizations)
  }

  const removeItem = (menuItemId: string, customizations?: Record<string, any>) => {
    cartStore.removeItem(menuItemId, customizations)
  }

  const updateQuantity = (menuItemId: string, quantity: number, customizations?: Record<string, any>) => {
    cartStore.updateQuantity(menuItemId, quantity, customizations)
  }

  const clearCart = () => {
    cartStore.clearCart()
  }

  const restoreCart = () => {
    cartStore.restoreCart()
  }

  // Computed
  const hasItems = computed(() => !isEmpty.value)
  const formattedTotal = computed(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(total.value)
  })

  // Helper functions
  const getItemQuantity = (menuItemId: string, customizations?: Record<string, any>) => {
    const item = items.value.find(
      item =>
        item.menuItem.id === menuItemId &&
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
    )
    return item?.quantity || 0
  }

  const hasItem = (menuItemId: string, customizations?: Record<string, any>) => {
    return getItemQuantity(menuItemId, customizations) > 0
  }

  const getItemSubtotal = (menuItemId: string, customizations?: Record<string, any>) => {
    const item = items.value.find(
      item =>
        item.menuItem.id === menuItemId &&
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
    )
    return item?.subtotal || 0
  }

  // Checkout functionality
  const createOrderFromCart = async (customerInfo: CustomerInfo, notes?: string) => {
    if (isEmpty.value) {
      throw new Error('Cart is empty')
    }

    const orderData: CreateOrderDto = {
      items: items.value.map(item => ({
        productId: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price,
        customizations: item.customizations,
      })),
      customerInfo,
      notes,
    }

    try {
      const order = await orderStore.createOrder(orderData)
      if (order) {
        clearCart() // Clear cart after successful order
      }
      return order
    } catch (error) {
      console.error('Failed to create order:', error)
      throw error
    }
  }

  const validateCart = () => {
    const errors: string[] = []

    if (isEmpty.value) {
      errors.push('Cart is empty')
    }

    // Use store validation method
    const storeValidation = cartStore.validateCartItems()
    errors.push(...storeValidation.errors)

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Server synchronization methods
  const syncWithServer = async () => {
    await cartStore.syncCartWithServer()
  }

  const loadFromServer = async () => {
    await cartStore.loadCartFromServer()
  }

  const initializeCart = async () => {
    await cartStore.initializeCart()
  }

  const estimateDeliveryTime = async (deliveryAddress: {
    latitude: number
    longitude: number
    address: string
  }) => {
    if (isEmpty.value) {
      throw new Error('Cart is empty')
    }

    try {
      const { useOrderService } = await import('~/services/order.service')
      const orderService = useOrderService()
      const response = await orderService.estimateDeliveryTime({
        items: items.value.map(item => ({
          itemId: item.menuItem.id,
          quantity: item.quantity,
        })),
        deliveryAddress,
      })

      if (response.success && response.data) {
        return response.data
      }

      throw new Error(response.message || 'Failed to estimate delivery time')
    } catch (error) {
      console.error('Failed to estimate delivery time:', error)
      throw error
    }
  }

  return {
    // State
    items: readonly(items),
    loading: readonly(loading),
    total: readonly(total),
    itemCount: readonly(itemCount),
    isEmpty: readonly(isEmpty),
    syncing: readonly(syncing),
    lastSyncAt: readonly(lastSyncAt),

    // Computed
    hasItems,
    formattedTotal,

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    restoreCart,

    // Helpers
    getItemQuantity,
    hasItem,
    getItemSubtotal,

    // Checkout
    createOrderFromCart,
    validateCart,
    estimateDeliveryTime,

    // Server sync
    syncWithServer,
    loadFromServer,
    initializeCart,
  }
}