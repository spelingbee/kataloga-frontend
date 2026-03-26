import { defineStore } from 'pinia'
import { useOrderService } from '~/services/order.service'
import { useOfflineCart } from '~/composables/useOfflineCart'
import { useTelegramHaptic } from '~/composables/useTelegramHaptic'
import { useTenantStorage } from '~/composables/useStorage'
import { isDefined } from '~/types/utils/type-guards'
import { updateReadonlyObject } from '~/types/utils/readonly'
import { CartService } from '~/services/api.service'
import { useAuthStore } from '~/stores/auth'
import type { CartItem, MenuItemUI, ApiError } from '~/types'
import { debounce } from 'lodash-es'

// Helper function to get tenant store (to avoid circular dependency)


interface CartState {
  // Clean business data only
  items: CartItem[]
  promoCode: string | null
  discount: number
  deliveryFee: number
  minimumOrderAmount: number

  // State management
  loading: boolean
  syncing: boolean
  lastSyncAt: Date | null
  error: ApiError | null
}

interface CartStorageData {
  items: CartItem[]
  promoCode: string | null
  discount: number
  deliveryFee: number
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    // Clean business data only
    items: [],
    promoCode: null,
    discount: 0,
    deliveryFee: 0,
    minimumOrderAmount: 0,

    // State management
    loading: false,
    syncing: false,
    lastSyncAt: null,
    error: null,
  }),

  getters: {
    subtotal: state => {
      return state.items.reduce((sum, item) => sum + item.subtotal, 0)
    },

    total: state => {
      const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0)
      return subtotal + state.deliveryFee - state.discount
    },

    itemCount: state => {
      return state.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    isEmpty: state => {
      return state.items.length === 0
    },

    canCheckout: state => {
      const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0)
      return state.items.length > 0 && subtotal >= state.minimumOrderAmount
    },

    remainingForMinimum: state => {
      const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0)
      return Math.max(0, state.minimumOrderAmount - subtotal)
    },
  },

  actions: {
    /**
     * Get storage instance for cart data
     */
    _getStorage() {
      return useTenantStorage('cart', {
        items: [],
        promoCode: null,
        discount: 0,
        deliveryFee: 0
      } as CartStorageData)
    },

    /**
     * Persist cart data to storage
     */
    _persistToStorage() {
      const { setValue } = this._getStorage()

      try {
        const cartData: CartStorageData = {
          items: this.items,
          promoCode: this.promoCode,
          discount: this.discount,
          deliveryFee: this.deliveryFee
        }
        setValue(cartData)

        // Also save to offline cart for PWA functionality
        const { saveCartOffline } = useOfflineCart()
        saveCartOffline(this.items)

        // Sync with server for authenticated users
        this.syncCartWithServer()
      } catch (error) {
        console.error('Failed to persist cart to storage:', error)
      }
    },

    /**
     * Restore cart data from storage
     */
    _restoreFromStorage() {
      const { value: cartData } = this._getStorage()

      try {
        const data = cartData.value
        this.items = data.items || []
        this.promoCode = data.promoCode || null
        this.discount = typeof data.discount === 'number' ? data.discount : 0
        this.deliveryFee = typeof data.deliveryFee === 'number' ? data.deliveryFee : 0
      } catch (error) {
        console.error('Failed to restore cart from storage:', error)

        // Fallback to offline cart - skip for now since it's async
        // TODO: Implement proper async cart restoration
        console.warn('Offline cart loading skipped - requires async handling')
        // Reset to empty cart
        this.items = []
        this.promoCode = null
        this.discount = 0
        this.deliveryFee = 0
      }
    },

    addItem(menuItem: MenuItemUI, quantity: number = 1, selectedModifiers: import('~/types').Modifier[] = [], customizations?: Record<string, any>) {
      // Calculate price including modifiers
      const modifierPrice = selectedModifiers?.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0) || 0
      const itemPrice = menuItem.price + modifierPrice

      const existingItemIndex = this.items.findIndex(
        item =>
          item.menuItem.id === menuItem.id &&
          JSON.stringify(item.selectedModifiers) === JSON.stringify(selectedModifiers) &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      )

      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = this.items[existingItemIndex]
        if (existingItem) {
          existingItem.quantity += quantity
          existingItem.subtotal = Math.round((existingItem.quantity * itemPrice) * 100) / 100
        }
      } else {
        // Add new item
        const cartItem: CartItem = {
          menuItem,
          quantity,
          selectedModifiers: selectedModifiers || [],
          subtotal: Math.round((quantity * itemPrice) * 100) / 100,
          customizations,
        }
        this.items.push(cartItem)
      }

      // Trigger haptic feedback for add to cart action
      try {
        const { cartActions } = useTelegramHaptic()
        cartActions.addToCart()
      } catch (error) {
        // Silently fail if haptic feedback is not available
      }

      this._persistToStorage()
    },

    removeItem(menuItemId: string, customizations?: Record<string, any>) {
      const itemIndex = this.items.findIndex(
        item =>
          item.menuItem.id === menuItemId &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      )

      if (itemIndex >= 0) {
        this.items.splice(itemIndex, 1)

        // Trigger haptic feedback for remove from cart action
        try {
          const { cartActions } = useTelegramHaptic()
          cartActions.removeFromCart()
        } catch (error) {
          // Silently fail if haptic feedback is not available
        }

        this._persistToStorage()
      }
    },

    updateQuantity(menuItemId: string, quantity: number, customizations?: Record<string, any>) {
      const itemIndex = this.items.findIndex(
        item =>
          item.menuItem.id === menuItemId &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      )

      if (itemIndex >= 0) {
        const item = this.items[itemIndex]
        if (!isDefined(item)) return

        if (quantity <= 0) {
          this.removeItem(menuItemId, customizations)
        } else {
          // Calculate price including modifiers
          const modifierPrice = item.selectedModifiers?.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0) || 0
          const itemPrice = item.menuItem.price + modifierPrice
          // Allow negative subtotals (e.g., from large discounts)
          const newSubtotal = Math.round((quantity * itemPrice) * 100) / 100

          // Create updated item using immutable operation
          const updatedItem = updateReadonlyObject(item, {
            quantity,
            subtotal: newSubtotal
          })

          // Replace the item in the array
          this.items[itemIndex] = updatedItem

          // Trigger haptic feedback for quantity update
          try {
            const { cartActions } = useTelegramHaptic()
            cartActions.updateQuantity()
          } catch (error) {
            // Silently fail if haptic feedback is not available
          }

          this._persistToStorage()
        }
      }
    },

    clearCart() {
      // Clear in-memory state
      this.items = []
      this.promoCode = null
      this.discount = 0
      this.deliveryFee = 0

      // Trigger haptic feedback for clear cart action
      try {
        const { cartActions } = useTelegramHaptic()
        cartActions.clearCart()
      } catch (error) {
        // Silently fail if haptic feedback is not available
      }

      // Clear storage using new utilities
      const { removeValue } = this._getStorage()
      try {
        removeValue()

        // Also clear offline cart
        const { saveCartOffline } = useOfflineCart()
        saveCartOffline([])
      } catch (error) {
        console.error('Failed to clear cart from storage:', error)
      }
    },

    async applyPromoCode(code: string): Promise<{ success: boolean; message: string }> {
      if (!code || code.trim() === '') {
        return { success: false, message: 'Please enter a promo code' }
      }

      this.loading = true
      this.error = null

      const result = await CartService.validatePromoCode(code, this.subtotal)

      if (result.success) {
        // Store clean data directly
        this.promoCode = code.trim()
        this.discount = result.data.discount
        this._persistToStorage()

        this.loading = false
        return { success: true, message: result.data.message || 'Promo code applied successfully' }
      } else {
        console.error('Failed to apply promo code:', result.error)

        // Store typed error
        this.error = result.error

        this.loading = false
        return { success: false, message: result.error.message || 'Failed to apply promo code' }
      }
    },

    removePromoCode() {
      this.promoCode = null
      this.discount = 0
      this._persistToStorage()
    },

    setDeliveryFee(fee: number) {
      this.deliveryFee = fee
      this._persistToStorage()
    },

    setMinimumOrderAmount(amount: number) {
      this.minimumOrderAmount = amount
    },



    // Create order with offline support
    async createOrder(customerInfo: import('~/types').CustomerInfo) {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const { isOnline, savePendingOrder } = useOfflineCart()

        const orderData = {
          items: this.items.map(item => ({
            productId: item.menuItem.id,
            quantity: item.quantity,
            price: item.menuItem.price,
            customizations: item.customizations,
          })),
          customerInfo,
          paymentMethod: 'CASH' as const, // Default payment method
        }

        if (isOnline.value) {
          // Try to create order online - service returns unwrapped data directly
          const order = await orderService.createOrder(orderData)

          // Trigger success haptic feedback
          try {
            const { cartActions } = useTelegramHaptic()
            cartActions.checkoutSuccess()
          } catch (error) {
            // Silently fail if haptic feedback is not available
          }

          // Clear cart only on successful order creation
          this.clearCart()
          return {
            success: true,
            message: 'Order created successfully',
            data: order
          }
        } else {
          // Save as pending order for offline sync
          savePendingOrder({
            items: this.items,
            customerInfo,
          })
          // Clear cart after saving as pending (will be synced later)
          this.clearCart()

          return {
            success: true,
            message: 'Order saved. It will be submitted when you\'re back online.',
            data: { id: 'pending', status: 'pending' },
          }
        }
      } catch (error) {
        console.error('Failed to create order:', error)

        // Store typed error
        this.error = error as ApiError

        // Trigger error haptic feedback
        try {
          const { cartActions } = useTelegramHaptic()
          cartActions.checkoutError()
        } catch (hapticError) {
          // Silently fail if haptic feedback is not available
        }

        // Cart is preserved automatically since we don't clear it on error
        throw error
      } finally {
        this.loading = false
      }
    },

    // Debounced version of server sync to prevent spamming the API
    debouncedSyncWithServer: debounce(async function(this: any) {
      // Skip sync in test environment or if already syncing
      if (import.meta.env.MODE === 'test' || this.syncing) return

      const authStore = useAuthStore()
      if (!authStore.user) return

      this.syncing = true
      this.error = null

      // Optimistic UI: Snapshot current items for rollback
      const previousItems = [...this.items]

      const result = await CartService.syncCart(this.items)

      if (result.success) {
        this.lastSyncAt = new Date()
      } else {
        console.error('Failed to sync cart with server:', result.error)
        this.error = result.error
        this.items = previousItems
      }

      this.syncing = false
    }, 1500),

    // Server synchronization methods
    async syncCartWithServer() {
      // We use the debounced function, passing 'this' context explicitly
      (this as any).debouncedSyncWithServer.call(this)
    },

    async loadCartFromServer() {
      const authStore = useAuthStore()
      if (!authStore.user) return

      this.loading = true
      this.error = null

      const result = await CartService.loadCart()

      if (result.success) {
        // Store clean data directly
        if (result.data?.items) {
          // Merge server cart with local cart
          const serverItems = result.data.items
          const mergedItems = this.mergeCartItems(serverItems)
          this.items = mergedItems
          this._persistToStorage()
          this.lastSyncAt = new Date()
        }
      } else {
        console.error('Failed to load cart from server:', result.error)
        this.error = result.error
      }

      this.loading = false
    },

    mergeCartItems(serverItems: any[]): CartItem[] {
      const merged = [...this.items]
      
      // Create maps for faster lookup by ID + customizations signature
      const localMap = new Map()
      merged.forEach((item, index) => {
        const signature = `${item.menuItem.id}-${JSON.stringify(item.customizations)}`
        localMap.set(signature, { item, index })
      })

      const serverSignatures = new Set()

      for (const serverItem of serverItems) {
        // Skip invalid server items
        if (!serverItem.menuItem) {
          console.warn('Server cart item missing menu data:', serverItem)
          continue
        }

        const signature = `${serverItem.menuItem.id}-${JSON.stringify(serverItem.customizations)}`
        serverSignatures.add(signature)

        if (localMap.has(signature)) {
          // Item exists locally and on server
          const localEntry = localMap.get(signature)
          const localItem = localEntry.item
          
          if (serverItem.quantity !== localItem.quantity) {
            // Take the max quantity to be safe against data loss
            const maxQuantity = Math.max(serverItem.quantity, localItem.quantity)
            const modifierPrice = localItem.selectedModifiers?.reduce((sum: number, mod: any) => sum + (mod.priceAdjustment || 0), 0) || 0
            const newSubtotal = maxQuantity * (localItem.menuItem.price + modifierPrice)
            
            merged[localEntry.index] = updateReadonlyObject(localItem, {
              quantity: maxQuantity,
              subtotal: newSubtotal
            })
          }
        } else {
          // Item exists on server but not locally
          const newItem: CartItem = {
            menuItem: serverItem.menuItem,
            quantity: serverItem.quantity,
            selectedModifiers: serverItem.selectedModifiers || [],
            subtotal: serverItem.quantity * serverItem.menuItem.price,
            customizations: serverItem.customizations
          }
          merged.push(newItem)
        }
      }

      // Identify items that exist locally but were potentially removed on server
      // To strictly prevent zombie items, we could remove items not in serverSignatures,
      // but only if they were synced before. For now, since we only sync when logged in,
      // if an item is local but not on server, the user probably just added it offline.
      // So we KEEP local items that are not on the server.
      
      return merged
    },

    async clearServerCart() {
      const authStore = useAuthStore()
      if (!authStore.user) return

      this.error = null

      const result = await CartService.clearCart()

      if (result.success) {
        this.lastSyncAt = new Date()
      } else {
        console.error('Failed to clear server cart:', result.error)
        this.error = result.error
      }
    },

    // Validation methods
    validateCartItems(): { isValid: boolean; errors: string[] } {
      const errors: string[] = []

      // Check for inactive items
      const inactiveItems = this.items.filter(item => !item.menuItem.isActive)
      if (inactiveItems.length > 0) {
        errors.push(`${inactiveItems.length} item(s) in your cart are no longer available`)
      }

      // Check for invalid quantities
      const invalidQuantities = this.items.filter(item => item.quantity <= 0)
      if (invalidQuantities.length > 0) {
        errors.push('Some items have invalid quantities')
      }

      // Check for price mismatches (in case prices changed)
      const priceMismatches = this.items.filter(
        item => item.subtotal !== item.quantity * item.menuItem.price
      )
      if (priceMismatches.length > 0) {
        errors.push('Some item prices have changed')
        // Auto-fix price mismatches
        priceMismatches.forEach(item => {
          item.subtotal = item.quantity * item.menuItem.price
        })
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    },

    // Validate cart against current menu data (for reconnection)
    // This method is kept for backward compatibility but now uses the validation service
    async validateCartAgainstMenu(): Promise<{
      isValid: boolean
      removedItems: CartItem[]
      priceChanges: Array<{ item: CartItem; oldPrice: number; newPrice: number }>
      errors: string[]
    }> {
      try {
        // Use the cart validation service
        const { useCartValidationService } = await import('~/services/cart-validation.service')
        const validationService = useCartValidationService()

        const result = await validationService.validateOnReconnection(this.items)

        // Update cart with validated items
        if (result.removedItems.length > 0) {
          for (const item of result.removedItems) {
            this.removeItem(item.menuItem.id, item.customizations)
          }
        }

        if (result.priceChanges.length > 0) {
          for (const change of result.priceChanges) {
            const cartItem = this.items.find(
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
          this._persistToStorage()
        }

        return {
          isValid: result.isValid,
          removedItems: result.removedItems,
          priceChanges: result.priceChanges,
          errors: result.errors
        }
      } catch (error) {
        console.error('Failed to validate cart against menu:', error)
        // If validation fails, return current validation state
        const basicValidation = this.validateCartItems()
        return {
          isValid: basicValidation.isValid,
          removedItems: [],
          priceChanges: [],
          errors: basicValidation.errors
        }
      }
    },

    // Initialize cart for authenticated users
    async initializeCart() {
      const authStore = useAuthStore()

      // Always restore from local storage first
      this._restoreFromStorage()

      // If user is authenticated, try to sync with server
      if (authStore.user) {
        await this.loadCartFromServer()
      }
    },
  },
})
