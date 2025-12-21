import { defineStore } from 'pinia'
import { useOrderService } from '~/services/order.service'
import { useOfflineCart } from '~/composables/useOfflineCart'
import { useTelegramHaptic } from '~/composables/useTelegramHaptic'
import type { CartItem, MenuItem, ApiError } from '~/types'

// Helper function to get tenant store (to avoid circular dependency)
function getTenantSlug(): string {
  try {
    // Skip tenant store access in test environment
    if (import.meta.env.MODE === 'test') {
      return ''
    }
    const { useTenantStore } = require('./tenant')
    const tenantStore = useTenantStore()
    return tenantStore.tenantSlug || ''
  } catch {
    return ''
  }
}

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
    addItem(menuItem: MenuItem, quantity: number = 1, selectedModifiers: any[] = [], customizations?: Record<string, any>) {
      // Calculate price including modifiers
      const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
      const itemPrice = menuItem.price + modifierPrice
      
      const existingItemIndex = this.items.findIndex(
        item =>
          item.menuItem.id === menuItem.id &&
          JSON.stringify(item.selectedModifiers) === JSON.stringify(selectedModifiers) &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      )

      if (existingItemIndex >= 0) {
        // Update existing item
        this.items[existingItemIndex].quantity += quantity
        this.items[existingItemIndex].subtotal =
          Math.round((this.items[existingItemIndex].quantity * itemPrice) * 100) / 100
      } else {
        // Add new item
        const cartItem: CartItem = {
          menuItem,
          quantity,
          selectedModifiers,
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

      this.persistCart()
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
        
        this.persistCart()
      }
    },

    updateQuantity(menuItemId: string, quantity: number, customizations?: Record<string, any>) {
      const item = this.items.find(
        item =>
          item.menuItem.id === menuItemId &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      )

      if (item) {
        if (quantity <= 0) {
          this.removeItem(menuItemId, customizations)
        } else {
          item.quantity = quantity
          // Calculate price including modifiers
          const modifierPrice = item.selectedModifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
          const itemPrice = item.menuItem.price + modifierPrice
          // Allow negative subtotals (e.g., from large discounts)
          item.subtotal = Math.round((quantity * itemPrice) * 100) / 100
          
          // Trigger haptic feedback for quantity update
          try {
            const { cartActions } = useTelegramHaptic()
            cartActions.updateQuantity()
          } catch (error) {
            // Silently fail if haptic feedback is not available
          }
          
          this.persistCart()
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
      
      if (typeof localStorage !== 'undefined') {
        // Clear tenant-specific cart from localStorage
        const tenantSlug = getTenantSlug()
        const storageKey = tenantSlug ? `cart_${tenantSlug}` : 'cart'
        
        try {
          localStorage.removeItem(storageKey)
          // Also try to clear the default key in case it exists
          if (storageKey !== 'cart') {
            localStorage.removeItem('cart')
          }
        } catch (error) {
          console.error('Failed to clear cart from localStorage:', error)
        }
        
        // Also clear offline cart
        try {
          const { saveCartOffline } = useOfflineCart()
          saveCartOffline([])
        } catch (error) {
          console.error('Failed to clear offline cart:', error)
        }
      }
    },

    async applyPromoCode(code: string): Promise<{ success: boolean; message: string }> {
      if (!code || code.trim() === '') {
        return { success: false, message: 'Please enter a promo code' }
      }

      this.loading = true
      this.error = null
      
      try {
        const apiClient = (useNuxtApp() as any).$apiClient
        const result = await apiClient.post<{ discount: number; message: string }>('/promo/validate', {
          code: code.trim(),
          subtotal: this.subtotal
        })

        // Store clean data directly
        this.promoCode = code.trim()
        this.discount = result.discount
        this.persistCart()
        
        return { success: true, message: result.message || 'Promo code applied successfully' }
        
      } catch (error: any) {
        console.error('Failed to apply promo code:', error)
        
        // Store typed error
        this.error = error as ApiError
        
        const errorMessage = (error as ApiError)?.message || error.message || 'Failed to apply promo code'
        return { success: false, message: errorMessage }
      } finally {
        this.loading = false
      }
    },

    removePromoCode() {
      this.promoCode = null
      this.discount = 0
      this.persistCart()
    },

    setDeliveryFee(fee: number) {
      this.deliveryFee = fee
      this.persistCart()
    },

    setMinimumOrderAmount(amount: number) {
      this.minimumOrderAmount = amount
    },

    persistCart() {
      if (typeof localStorage !== 'undefined') {
        // Get tenant context for tenant-specific storage
        const tenantSlug = getTenantSlug()
        
        // Use tenant-specific key if tenant is set
        const storageKey = tenantSlug ? `cart_${tenantSlug}` : 'cart'
        const cartData = {
          items: this.items,
          promoCode: this.promoCode,
          discount: this.discount,
          deliveryFee: this.deliveryFee
        }
        localStorage.setItem(storageKey, JSON.stringify(cartData))
        
        // Also save to offline cart for PWA functionality
        const { saveCartOffline } = useOfflineCart()
        saveCartOffline(this.items)
        
        // Sync with server for authenticated users
        this.syncCartWithServer()
      }
    },

    restoreCart() {
      if (typeof localStorage !== 'undefined') {
        // Get tenant context for tenant-specific storage
        const tenantSlug = getTenantSlug()
        
        // Try to restore from tenant-specific localStorage first
        const storageKey = tenantSlug ? `cart_${tenantSlug}` : 'cart'
        const savedCart = localStorage.getItem(storageKey)
        if (savedCart) {
          try {
            const cartData = JSON.parse(savedCart)
            // Handle both old format (array) and new format (object)
            if (Array.isArray(cartData)) {
              // Old format - just items array
              this.items = cartData
              // Reset other fields to defaults
              this.promoCode = null
              this.discount = 0
              this.deliveryFee = 0
            } else {
              // New format - object with all cart data
              this.items = cartData.items || []
              this.promoCode = cartData.promoCode || null
              this.discount = typeof cartData.discount === 'number' ? cartData.discount : 0
              // Ensure deliveryFee is properly restored - handle all cases
              this.deliveryFee = typeof cartData.deliveryFee === 'number' ? cartData.deliveryFee : 
                                 (typeof cartData.deliveryFee === 'string' ? parseFloat(cartData.deliveryFee) : 0)
            }
            return
          } catch (error) {
            console.error('Failed to restore cart from localStorage:', error)
          }
        }

        // Fallback to offline cart
        const { loadCartOffline } = useOfflineCart()
        try {
          const offlineItems = loadCartOffline()
          this.items = offlineItems
          // Reset other fields when loading from offline cart
          this.promoCode = null
          this.discount = 0
          this.deliveryFee = 0
        } catch (error) {
          console.error('Failed to restore cart from offline storage:', error)
          this.clearCart()
        }
      }
    },

    // Create order with offline support
    async createOrder(customerInfo: any) {
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

    // Server synchronization methods
    async syncCartWithServer() {
      // Skip sync in test environment or if already syncing
      if (import.meta.env.MODE === 'test' || this.syncing) return
      
      try {
        const { $auth } = useNuxtApp()
        if (!$auth?.user) return

        this.syncing = true
        this.error = null
        
        const apiClient = (useNuxtApp() as any).$apiClient
        
        // Save cart to server - service returns unwrapped data
        await apiClient.post<void>('/cart/sync', {
          items: this.items.map(item => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            customizations: item.customizations,
          }))
        })
        
        this.lastSyncAt = new Date()
      } catch (error) {
        console.error('Failed to sync cart with server:', error)
        this.error = error as ApiError
      } finally {
        this.syncing = false
      }
    },

    async loadCartFromServer() {
      const { $auth } = useNuxtApp()
      if (!$auth?.user) return

      this.loading = true
      this.error = null
      
      try {
        const apiClient = (useNuxtApp() as any).$apiClient
        const result = await apiClient.get<{ items: any[] }>('/cart')
        
        // Store clean data directly
        if (result?.items) {
          // Merge server cart with local cart
          const serverItems = result.items
          const mergedItems = this.mergeCartItems(serverItems)
          this.items = mergedItems
          this.persistCart()
          this.lastSyncAt = new Date()
        }
      } catch (error) {
        console.error('Failed to load cart from server:', error)
        this.error = error as ApiError
      } finally {
        this.loading = false
      }
    },

    mergeCartItems(serverItems: any[]): CartItem[] {
      const merged = [...this.items]
      
      for (const serverItem of serverItems) {
        const existingIndex = merged.findIndex(
          item => 
            item.menuItem.id === serverItem.menuItemId &&
            JSON.stringify(item.customizations) === JSON.stringify(serverItem.customizations)
        )
        
        if (existingIndex >= 0) {
          // Use the higher quantity (server or local)
          merged[existingIndex].quantity = Math.max(
            merged[existingIndex].quantity,
            serverItem.quantity
          )
          merged[existingIndex].subtotal = 
            merged[existingIndex].quantity * merged[existingIndex].menuItem.price
        } else {
          // Add server item if we have the menu item data
          // Note: In a real implementation, you'd need to fetch menu item details
          // For now, we'll skip items we don't have locally
          console.warn('Server cart item not found in local menu data:', serverItem.menuItemId)
        }
      }
      
      return merged
    },

    async clearServerCart() {
      const { $auth } = useNuxtApp()
      if (!$auth?.user) return

      try {
        this.error = null
        const apiClient = (useNuxtApp() as any).$apiClient
        await apiClient.delete<void>('/cart')
        this.lastSyncAt = new Date()
      } catch (error) {
        console.error('Failed to clear server cart:', error)
        this.error = error as ApiError
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
          this.persistCart()
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
      const { $auth } = useNuxtApp()
      
      // Always restore from local storage first
      this.restoreCart()
      
      // If user is authenticated, try to sync with server
      if ($auth?.user) {
        await this.loadCartFromServer()
      }
    },
  },
})
