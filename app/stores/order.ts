import { defineStore } from 'pinia'
import type { Order, CreateOrderDto, OrderStatus, ApiError, PaginationMeta } from '~/types'

interface OrderState {
  // Clean business data only
  currentOrder: Order | null
  orderHistory: Order[]
  pagination: PaginationMeta | null
  
  // State management
  loading: boolean
  error: ApiError | null
}

export const useOrderStore = defineStore('order', {
  state: (): OrderState => ({
    // Clean business data only
    currentOrder: null,
    orderHistory: [],
    pagination: null,
    
    // State management
    loading: false,
    error: null,
  }),

  getters: {
    hasActiveOrder: state => {
      return state.currentOrder !== null
    },
  },

  actions: {
    async createOrder(orderData: CreateOrderDto): Promise<Order | null> {
      this.loading = true
      this.error = null

      try {
        const order = await (this as any).$services.order.createOrder(orderData)
        this.currentOrder = order
        this.orderHistory.unshift(order)
        return order
      } catch (error) {
        this.error = error as ApiError
        return null
      } finally {
        this.loading = false
      }
    },

    async fetchOrderHistory(page: number = 1, limit: number = 10) {
      this.loading = true
      this.error = null

      try {
        const result = await (this as any).$services.order.getOrderHistory(page, limit)
        if (page === 1) {
          this.orderHistory = result.items
        } else {
          this.orderHistory.push(...result.items)
        }
        this.pagination = result.pagination
      } catch (error) {
        this.error = error as ApiError
      } finally {
        this.loading = false
      }
    },

    async trackOrder(orderId: string): Promise<Order | null> {
      this.loading = true
      this.error = null

      try {
        const result = await (this as any).$services.order.trackOrder(orderId)
        if (result && result.order) {
          const order = result.order
          if (this.currentOrder?.id === orderId) {
            this.currentOrder = order
          }
          const historyIndex = this.orderHistory.findIndex(o => o.id === orderId)
          if (historyIndex >= 0) {
            this.orderHistory[historyIndex] = order
          }
          return order
        }
        return null
      } catch (error) {
        this.error = error as ApiError
        return null
      } finally {
        this.loading = false
      }
    },

    async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const cancelledOrder = await (this as any).$services.order.cancelOrder(orderId, reason)
        if (cancelledOrder) {
          if (this.currentOrder?.id === orderId) {
            this.currentOrder = cancelledOrder
          }
          const historyIndex = this.orderHistory.findIndex(o => o.id === orderId)
          if (historyIndex >= 0) {
            this.orderHistory[historyIndex] = cancelledOrder
          }
          return true
        }
        return false
      } catch (error) {
        this.error = error as ApiError
        return false
      } finally {
        this.loading = false
      }
    },

    async getOrder(orderId: string): Promise<Order | null> {
      this.loading = true
      this.error = null

      try {
        const order = await (this as any).$services.order.getOrder(orderId)
        if (order) {
          const historyIndex = this.orderHistory.findIndex(o => o.id === orderId)
          if (historyIndex >= 0) {
            this.orderHistory[historyIndex] = order
          } else {
            this.orderHistory.unshift(order)
          }
          return order
        }
        return null
      } catch (error) {
        this.error = error as ApiError
        return null
      } finally {
        this.loading = false
      }
    },

    async repeatOrder(orderId: string): Promise<Order | null> {
      this.loading = true
      this.error = null

      try {
        const newOrder = await (this as any).$services.order.repeatOrder(orderId)
        if (newOrder) {
          this.currentOrder = newOrder
          this.orderHistory.unshift(newOrder)
          return newOrder
        }
        return null
      } catch (error) {
        this.error = error as ApiError
        return null
      } finally {
        this.loading = false
      }
    },

    async getActiveOrders(): Promise<Order[]> {
      this.loading = true
      this.error = null

      try {
        const orders = await (this as any).$services.order.getActiveOrders()
        return orders
      } catch (error) {
        this.error = error as ApiError
        return []
      } finally {
        this.loading = false
      }
    },

    setCurrentOrder(order: Order | null) {
      this.currentOrder = order
    },

    clearCurrentOrder() {
      this.currentOrder = null
    },
  },
})
