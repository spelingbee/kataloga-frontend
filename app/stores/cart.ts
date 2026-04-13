import { defineStore } from 'pinia'
import type { CartItem, MenuItem, ApiError } from '~/types'
import { useTenantStore } from '~/stores/tenant'
interface CartState {
  items: CartItem[]
  promoCode: string | null
  discount: number
  deliveryFee: number
  minimumOrderAmount: number
  loading: boolean
  syncing: boolean
  lastSyncAt: Date | null
  error: ApiError | null
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    promoCode: null,
    discount: 0,
    deliveryFee: 0,
    minimumOrderAmount: 0,
    loading: false,
    syncing: false,
    lastSyncAt: null,
    error: null,
  }),

  getters: {
    subtotal: state => {
      return state.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    },

    total: (state): number => {
      const subtotal = state.items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
      return Math.max(0, subtotal + (state.deliveryFee || 0) - (state.discount || 0))
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
      const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
      const itemPrice = menuItem.price + modifierPrice
      
      const existingItemIndex = this.items.findIndex(
        item =>
          item.menuItem.id === menuItem.id &&
          JSON.stringify(item.selectedModifiers) === JSON.stringify(selectedModifiers) &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      )

      if (existingItemIndex >= 0) {
        this.items[existingItemIndex].quantity += quantity
        this.items[existingItemIndex].subtotal =
          Math.round((this.items[existingItemIndex].quantity * itemPrice) * 100) / 100
      } else {
        const cartItem: CartItem = {
          productId: menuItem.productId,
          menuItem,
          quantity,
          selectedModifiers,
          subtotal: Math.round((quantity * itemPrice) * 100) / 100,
          customizations,
        }
        this.items.push(cartItem)
      }

      // Sync with server if authenticated (Temporarily disabled - Backend not ready)
      // this.syncCartWithServer()
    },

    removeItem(menuItemId: string, customizations?: Record<string, any>) {
      const itemIndex = this.items.findIndex(
        item =>
          item.menuItem.id === menuItemId &&
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
      )

      if (itemIndex >= 0) {
        this.items.splice(itemIndex, 1)
        // this.syncCartWithServer()
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
          const modifierPrice = item.selectedModifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
          const itemPrice = item.menuItem.price + modifierPrice
          item.subtotal = Math.round((quantity * itemPrice) * 100) / 100
          // this.syncCartWithServer()
        }
      }
    },

    clearCart() {
      this.items = []
      this.promoCode = null
      this.discount = 0
      this.deliveryFee = 0
      // this.syncCartWithServer()
    },

    async applyPromoCode(code: string): Promise<{ success: boolean; message: string }> {
      if (!code || code.trim() === '') {
        return { success: false, message: 'Please enter a promo code' }
      }

      this.loading = true
      this.error = null
      
      try {
        const result = await (this as any).$apiClient.post<{ discount: number; message: string }>('/promo/validate', {
          code: code.trim(),
          subtotal: this.subtotal
        })

        this.promoCode = code.trim()
        this.discount = result.discount
        return { success: true, message: result.message || 'Promo code applied successfully' }
        
      } catch (error: any) {
        this.error = error as ApiError
        return { success: false, message: this.error.message || 'Failed to apply promo code' }
      } finally {
        this.loading = false
      }
    },

    removePromoCode() {
      this.promoCode = null
      this.discount = 0
    },

    setDeliveryFee(fee: number) {
      this.deliveryFee = fee
    },

    setMinimumOrderAmount(amount: number) {
      this.minimumOrderAmount = amount
    },

    async createOrder(customerInfo: any) {
      this.loading = true
      this.error = null
      
      try {
        const orderData = {
          items: this.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.menuItem.price,
            customizations: item.customizations,
          })),
          customerInfo,
        }

        const order = await (this as any).$services.order.createOrder(orderData)
        this.clearCart()
        return { success: true, message: 'Order created successfully', data: order }
      } catch (error) {
        this.error = error as ApiError
        throw error
      } finally {
        this.loading = false
      }
    },

    restoreCart() {
      // Persistedstate plugin handles the basic loading from localStorage.
      // We can use this hook for additional validation or migration.
      if (this.items.length > 0) {
        this.validateCartAgainstMenu()
      }
    },

    async syncCartWithServer() {
      if (this.syncing || !import.meta.client) return
      
      try {
        this.syncing = true
        await (this as any).$apiClient.post<void>('/cart/sync', {
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
      this.loading = true
      try {
        const result = await (this as any).$apiClient.get<{ items: any[] }>('/cart')
        if (result?.items) {
          this.items = this.mergeCartItems(result.items)
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
          merged[existingIndex].quantity = Math.max(merged[existingIndex].quantity, serverItem.quantity)
          merged[existingIndex].subtotal = merged[existingIndex].quantity * merged[existingIndex].menuItem.price
        }
      }
      return merged
    },

    async validateCart(): Promise<any> {
      return await this.validateCartAgainstMenu()
    },

    async validateCartAgainstMenu(): Promise<any> {
      try {
        const result = await (this as any).$services.cartValidation.validateOnReconnection(this.items)
        if (result.removedItems.length > 0) {
          result.removedItems.forEach((item: any) => this.removeItem(item.menuItem.id, item.customizations))
        }
        return result
      } catch (error) {
        console.error('Failed to validate cart:', error)
      }
    },
  },

  persist: {
    key: (id: string) => {
      // In Nuxt, we can use the injected stores or NuxtApp
      const tenantStore = useTenantStore()
      return `cart_${tenantStore.tenantSlug || 'default'}`
    },
    pick: ['items', 'promoCode', 'discount', 'deliveryFee'],
  }
})
