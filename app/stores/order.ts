import { defineStore } from 'pinia'
import { useOrderService } from '~/services/order.service'
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
        const orderService = useOrderService()
        const order = await orderService.createOrder(orderData)

        // Store clean data directly
        this.currentOrder = order
        // Add to order history
        this.orderHistory.unshift(order)
        return order
        
      } catch (error) {
        this.error = error as ApiError
        console.error('Order creation error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async fetchOrderHistory(page: number = 1, limit: number = 10) {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const result = await orderService.getOrderHistory(page, limit)

        // Store clean data directly
        if (page === 1) {
          this.orderHistory = result.items
        } else {
          // Append for pagination
          this.orderHistory.push(...result.items)
        }
        this.pagination = result.pagination
        
      } catch (error) {
        this.error = error as ApiError
        console.error('Order history fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async trackOrder(orderId: string): Promise<Order | null> {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const order = await orderService.trackOrder(orderId)

        if (order) {
          // Update current order if it matches
          if (this.currentOrder?.id === orderId) {
            this.currentOrder = order
          }
          // Update in order history
          const historyIndex = this.orderHistory.findIndex(o => o.id === orderId)
          if (historyIndex >= 0) {
            this.orderHistory[historyIndex] = order
          }
          return order
        }
        return null
      } catch (error) {
        this.error = error as ApiError
        console.error('Order tracking error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const cancelledOrder = await orderService.cancelOrder(orderId, reason)

        if (cancelledOrder) {
          // Update current order if it matches
          if (this.currentOrder?.id === orderId) {
            this.currentOrder = cancelledOrder
          }
          // Update in order history
          const historyIndex = this.orderHistory.findIndex(o => o.id === orderId)
          if (historyIndex >= 0) {
            this.orderHistory[historyIndex] = cancelledOrder
          }
          return true
        }
        return false
      } catch (error) {
        this.error = error as ApiError
        console.error('Order cancellation error:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    async getOrder(orderId: string): Promise<Order | null> {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const order = await orderService.getOrder(orderId)

        if (order) {
          // Update in order history if it exists
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
        console.error('Order fetch error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async repeatOrder(orderId: string): Promise<Order | null> {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const newOrder = await orderService.repeatOrder(orderId)

        if (newOrder) {
          this.currentOrder = newOrder
          this.orderHistory.unshift(newOrder)
          return newOrder
        }
        return null
      } catch (error) {
        this.error = error as ApiError
        console.error('Order repeat error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async getActiveOrders(): Promise<Order[]> {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const orders = await orderService.getActiveOrders()
        return orders
      } catch (error) {
        this.error = error as ApiError
        console.error('Active orders fetch error:', error)
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
