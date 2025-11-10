import { defineStore } from 'pinia'
import { useOrderService } from '~/services/order.service'
import { useOfflineCart } from '~/composables/useOfflineCart'
import type { CartItem, MenuItem, ApiResponse } from '~/types'

// Helper function to get tenant store (to avoid circular dependency)
function getTenantSlug(): string {
  try {
    const { useTenantStore } = require('./tenant')
    const tenantStore = useTenantStore()
    return tenantStore.tenantSlug || ''
  } catch {
    return ''
  }
}

interface CartState {
  items: CartItem[]
  loading: boolean
  syncing: boolean
  lastSyncAt: Date | null
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    loading: false,
    syncing: false,
    lastSyncAt: null,
  }),

  getters: {
    total: state => {
      return state.items.reduce((sum, item) => sum + item.subtotal, 0)
    },

    itemCount: state => {
      return state.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    isEmpty: state => {
      return state.items.length === 0
    },
  },

  actions: {
    addItem(menuItem: MenuItem, quantity: number = 1, customizations?: Record<string, any>) {
      const existingItemIndex = this.items.findIndex(
        item =>
          item.menuItem.id === menuItem.id &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      )

      if (existingItemIndex >= 0) {
        // Update existing item
        this.items[existingItemIndex].quantity += quantity
        this.items[existingItemIndex].subtotal =
          this.items[existingItemIndex].quantity * menuItem.price
      } else {
        // Add new item
        const cartItem: CartItem = {
          menuItem,
          quantity,
          subtotal: quantity * menuItem.price,
          customizations,
        }
        this.items.push(cartItem)
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
          item.subtotal = quantity * item.menuItem.price
          this.persistCart()
        }
      }
    },

    clearCart() {
      this.items = []
      
      if (import.meta.client) {
        // Clear tenant-specific cart from localStorage
        const tenantSlug = getTenantSlug()
        const storageKey = tenantSlug ? `cart_${tenantSlug}` : 'cart'
        
        try {
          localStorage.removeItem(storageKey)
        } catch (error) {
          console.error('Failed to clear cart from localStorage:', error)
        }
        
        // Also clear offline cart
        const { saveCartOffline } = useOfflineCart()
        saveCartOffline([])
      }
    },

    persistCart() {
      if (import.meta.client) {
        // Get tenant context for tenant-specific storage
        const tenantSlug = getTenantSlug()
        
        // Use tenant-specific key if tenant is set
        const storageKey = tenantSlug ? `cart_${tenantSlug}` : 'cart'
        localStorage.setItem(storageKey, JSON.stringify(this.items))
        
        // Also save to offline cart for PWA functionality
        const { saveCartOffline } = useOfflineCart()
        saveCartOffline(this.items)
        
        // Sync with server for authenticated users
        this.syncCartWithServer()
      }
    },

    restoreCart() {
      if (import.meta.client) {
        // Get tenant context for tenant-specific storage
        const tenantSlug = getTenantSlug()
        
        // Try to restore from tenant-specific localStorage first
        const storageKey = tenantSlug ? `cart_${tenantSlug}` : 'cart'
        const savedCart = localStorage.getItem(storageKey)
        if (savedCart) {
          try {
            this.items = JSON.parse(savedCart)
            return
          } catch (error) {
            console.error('Failed to restore cart from localStorage:', error)
          }
        }

        // Fallback to offline cart
        const { loadCartOffline } = useOfflineCart()
        try {
          this.items = loadCartOffline()
        } catch (error) {
          console.error('Failed to restore cart from offline storage:', error)
          this.clearCart()
        }
      }
    },

    // Create order with offline support
    async createOrder(customerInfo: any) {
      this.loading = true
      
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
          // Try to create order online
          const response = await orderService.createOrder(orderData)
          
          if (response.success) {
            this.clearCart()
            return response
          } else {
            // If online but failed, save as pending
            savePendingOrder({
              items: this.items,
              customerInfo,
            })
            this.clearCart()
            throw new Error(response.message || 'Failed to create order')
          }
        } else {
          // Save as pending order for offline sync
          savePendingOrder({
            items: this.items,
            customerInfo,
          })
          this.clearCart()
          
          return {
            success: true,
            message: 'Order saved. It will be submitted when you\'re back online.',
            data: { id: 'pending', status: 'pending' },
          }
        }
      } catch (error) {
        console.error('Failed to create order:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Server synchronization methods
    async syncCartWithServer() {
      const { $auth } = useNuxtApp()
      if (!$auth?.user || this.syncing) return

      this.syncing = true
      try {
        const apiClient = (useNuxtApp() as any).$apiClient
        
        // Save cart to server
        await apiClient.post('/cart/sync', {
          items: this.items.map(item => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            customizations: item.customizations,
          }))
        })
        
        this.lastSyncAt = new Date()
      } catch (error) {
        console.error('Failed to sync cart with server:', error)
      } finally {
        this.syncing = false
      }
    },

    async loadCartFromServer() {
      const { $auth } = useNuxtApp()
      if (!$auth?.user) return

      this.loading = true
      try {
        const apiClient = (useNuxtApp() as any).$apiClient
        const response: ApiResponse<{ items: any[] }> = await apiClient.get('/cart')
        
        if (response.success && response.data?.items) {
          // Merge server cart with local cart
          const serverItems = response.data.items
          const mergedItems = this.mergeCartItems(serverItems)
          this.items = mergedItems
          this.persistCart()
          this.lastSyncAt = new Date()
        }
      } catch (error) {
        console.error('Failed to load cart from server:', error)
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
        const apiClient = (useNuxtApp() as any).$apiClient
        await apiClient.delete('/cart')
        this.lastSyncAt = new Date()
      } catch (error) {
        console.error('Failed to clear server cart:', error)
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
