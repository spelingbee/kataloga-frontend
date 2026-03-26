import { defineStore } from 'pinia'
import { useOrderService } from '~/services/order.service'
import { 
  orderAPIToUI, 
  convertArrayAPIToUI 
} from '~/types/utils/converters'
import type { OrderUI, CreateOrderDto, OrderStatus, ApiError, PaginationMeta, CustomerInfo } from '~/types'

interface OrderState {
  // Clean business data only
  currentOrder: OrderUI | null
  orderHistory: OrderUI[]
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
    async createOrder(orderData: CreateOrderDto): Promise<OrderUI | null> {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const orderAPI = await orderService.createOrder(orderData)

        // Create default customer info (should be passed from orderData in real implementation)
        const customerInfo: CustomerInfo = {
          name: orderData.customerInfo?.name || 'Customer',
          phone: orderData.customerInfo?.phone || '',
          email: orderData.customerInfo?.email,
          address: orderData.customerInfo?.address,
          notes: orderData.customerInfo?.notes
        }
        
        // Convert API data to UI type using converter
        const orderUI = orderAPIToUI(orderAPI, customerInfo)
        
        // Store converted UI data
        this.currentOrder = orderUI
        // Add to order history
        this.orderHistory.unshift(orderUI)
        return orderUI
        
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

        // Convert API data to UI types using converters
        // Note: In a real implementation, customer info should come from the API
        const ordersUI = result.items.map(orderAPI => {
          const customerInfo: CustomerInfo = {
            name: 'Customer', // Should come from API
            phone: '', // Should come from API
          }
          return orderAPIToUI(orderAPI, customerInfo)
        })
        
        // Store converted UI data
        if (page === 1) {
          this.orderHistory = ordersUI
        } else {
          // Append for pagination
          this.orderHistory.push(...ordersUI)
        }
        this.pagination = result.pagination
        
      } catch (error) {
        this.error = error as ApiError
        console.error('Order history fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async trackOrder(orderId: string): Promise<OrderUI | null> {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const trackingResult = await orderService.trackOrder(orderId)

        if (trackingResult?.order) {
          // Create default customer info
          const customerInfo: CustomerInfo = {
            name: 'Customer', // Should come from API
            phone: '', // Should come from API
          }
          
          // Convert API data to UI type using converter
          const orderUI = orderAPIToUI(trackingResult.order, customerInfo)
          
          // Update current order if it matches
          if (this.currentOrder?.id === orderId) {
            this.currentOrder = orderUI
          }
          // Update in order history
          const historyIndex = this.orderHistory.findIndex(o => o.id === orderId)
          if (historyIndex >= 0) {
            this.orderHistory[historyIndex] = orderUI
          }
          return orderUI
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
        const cancelledOrderAPI = await orderService.cancelOrder(orderId, reason)

        if (cancelledOrderAPI) {
          // Create default customer info
          const customerInfo: CustomerInfo = {
            name: 'Customer', // Should come from API
            phone: '', // Should come from API
          }
          
          // Convert API data to UI type using converter
          const cancelledOrderUI = orderAPIToUI(cancelledOrderAPI, customerInfo)
          
          // Update current order if it matches
          if (this.currentOrder?.id === orderId) {
            this.currentOrder = cancelledOrderUI
          }
          // Update in order history
          const historyIndex = this.orderHistory.findIndex(o => o.id === orderId)
          if (historyIndex >= 0) {
            this.orderHistory[historyIndex] = cancelledOrderUI
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

    async getOrder(orderId: string): Promise<OrderUI | null> {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const orderAPI = await orderService.getOrder(orderId)

        if (orderAPI) {
          // Create default customer info
          const customerInfo: CustomerInfo = {
            name: 'Customer', // Should come from API
            phone: '', // Should come from API
          }
          
          // Convert API data to UI type using converter
          const orderUI = orderAPIToUI(orderAPI, customerInfo)
          
          // Update in order history if it exists
          const historyIndex = this.orderHistory.findIndex(o => o.id === orderId)
          if (historyIndex >= 0) {
            this.orderHistory[historyIndex] = orderUI
          } else {
            this.orderHistory.unshift(orderUI)
          }
          return orderUI
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

    async repeatOrder(orderId: string): Promise<OrderUI | null> {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const newOrderAPI = await orderService.repeatOrder(orderId)

        if (newOrderAPI) {
          // Create default customer info
          const customerInfo: CustomerInfo = {
            name: 'Customer', // Should come from API
            phone: '', // Should come from API
          }
          
          // Convert API data to UI type using converter
          const newOrderUI = orderAPIToUI(newOrderAPI, customerInfo)
          
          this.currentOrder = newOrderUI
          this.orderHistory.unshift(newOrderUI)
          return newOrderUI
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

    async getActiveOrders(): Promise<OrderUI[]> {
      this.loading = true
      this.error = null

      try {
        const orderService = useOrderService()
        const ordersAPI = await orderService.getActiveOrders()
        
        // Convert API data to UI types using converters
        const ordersUI = ordersAPI.map(orderAPI => {
          const customerInfo: CustomerInfo = {
            name: 'Customer', // Should come from API
            phone: '', // Should come from API
          }
          return orderAPIToUI(orderAPI, customerInfo)
        })
        
        return ordersUI
      } catch (error) {
        this.error = error as ApiError
        console.error('Active orders fetch error:', error)
        return []
      } finally {
        this.loading = false
      }
    },

    setCurrentOrder(order: OrderUI | null) {
      this.currentOrder = order
    },

    clearCurrentOrder() {
      this.currentOrder = null
    },
  },
})
