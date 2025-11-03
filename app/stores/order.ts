import { defineStore } from 'pinia'
import { useOrderService } from '~/services/order.service'
import type { Order, CreateOrderDto, OrderStatus } from '~/types'

interface OrderState {
  currentOrder: Order | null
  orderHistory: Order[]
  loading: boolean
  error: string | null
}

export const useOrderStore = defineStore('order', {
  state: (): OrderState => ({
    currentOrder: null,
    orderHistory: [],
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
        const response = await orderService.createOrder(orderData)

        if (response.success && response.data) {
          this.currentOrder = response.data
          // Add to order history
          this.orderHistory.unshift(response.data)
          return response.data
        } else {
          throw new Error(response.message || 'Failed to create order')
        }
      } catch (error) {
        this.error = 'Failed to create order'
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
        const response = await orderService.getOrderHistory(page, limit)

        if (response.success && response.data) {
          if (page === 1) {
            this.orderHistory = response.data.orders
          } else {
            // Append for pagination
            this.orderHistory.push(...response.data.orders)
          }
        }
      } catch (error) {
        this.error = 'Failed to fetch order history'
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
        const response = await orderService.trackOrder(orderId)

        if (response.success && response.data) {
          const order = response.data.order
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
        this.error = 'Failed to track order'
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
        const response = await orderService.cancelOrder(orderId, reason)

        if (response.success && response.data) {
          const cancelledOrder = response.data
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
        this.error = 'Failed to cancel order'
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
        const response = await orderService.getOrder(orderId)

        if (response.success && response.data) {
          const order = response.data
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
        this.error = 'Failed to fetch order'
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
        const response = await orderService.repeatOrder(orderId)

        if (response.success && response.data) {
          const newOrder = response.data
          this.currentOrder = newOrder
          this.orderHistory.unshift(newOrder)
          return newOrder
        }
        return null
      } catch (error) {
        this.error = 'Failed to repeat order'
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
        const response = await orderService.getActiveOrders()

        if (response.success && response.data) {
          return response.data
        }
        return []
      } catch (error) {
        this.error = 'Failed to fetch active orders'
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
