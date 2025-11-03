import type { ApiResponse, Order, CreateOrderDto, OrderStatus, OrderItem } from '~/types'

export class OrderService {
  private getApiClient(): any {
    const nuxtApp = useNuxtApp()
    return (nuxtApp as any).$apiClient
  }

  async createOrder(orderData: CreateOrderDto): Promise<ApiResponse<Order>> {
    return this.getApiClient().post('/orders', orderData)
  }

  async getOrders(params?: {
    status?: OrderStatus
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ orders: Order[]; total: number; page: number; limit: number }>> {
    const searchParams = new URLSearchParams()
    
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/orders?${queryString}` : '/orders'
    
    return this.getApiClient().get(endpoint)
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.getApiClient().get(`/orders/${orderId}`)
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<Order>> {
    return this.getApiClient().patch(`/orders/${orderId}/status`, { status })
  }

  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<Order>> {
    return this.getApiClient().patch(`/orders/${orderId}/cancel`, { reason })
  }

  async getOrderHistory(page: number = 1, limit: number = 10): Promise<ApiResponse<{
    orders: Order[]
    total: number
    page: number
    limit: number
  }>> {
    return this.getApiClient().get(`/orders/history?page=${page}&limit=${limit}`)
  }

  async repeatOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.getApiClient().post(`/orders/${orderId}/repeat`)
  }

  async trackOrder(orderId: string): Promise<ApiResponse<{
    order: Order
    tracking: {
      status: OrderStatus
      estimatedTime: number
      currentStep: string
      steps: Array<{
        name: string
        status: 'completed' | 'current' | 'pending'
        timestamp?: string
      }>
    }
  }>> {
    return this.getApiClient().get(`/orders/${orderId}/track`)
  }

  async getOrderTracking(orderId: string): Promise<ApiResponse<{
    status: OrderStatus
    estimatedTime: number
    currentLocation?: {
      latitude: number
      longitude: number
    }
    courierInfo?: {
      name: string
      phone: string
      photo?: string
    }
    timeline: Array<{
      status: OrderStatus
      timestamp: string
      message: string
    }>
  }>> {
    return this.getApiClient().get(`/orders/${orderId}/tracking`)
  }

  async rateOrder(orderId: string, rating: {
    overall: number
    food: number
    delivery: number
    comment?: string
  }): Promise<ApiResponse<void>> {
    return this.getApiClient().post(`/orders/${orderId}/rating`, rating)
  }

  async getOrderReceipt(orderId: string): Promise<ApiResponse<{
    order: Order
    receipt: {
      subtotal: number
      tax: number
      deliveryFee: number
      discount: number
      total: number
      paymentMethod: string
      transactionId: string
    }
  }>> {
    return this.getApiClient().get(`/orders/${orderId}/receipt`)
  }

  async requestRefund(orderId: string, data: {
    reason: string
    items?: string[]
    amount?: number
  }): Promise<ApiResponse<{
    refundId: string
    status: string
    estimatedProcessingTime: string
  }>> {
    return this.getApiClient().post(`/orders/${orderId}/refund`, data)
  }

  async getActiveOrders(): Promise<ApiResponse<Order[]>> {
    return this.getApiClient().get('/orders/active')
  }

  async estimateDeliveryTime(data: {
    items: Array<{ itemId: string; quantity: number }>
    deliveryAddress: {
      latitude: number
      longitude: number
      address: string
    }
  }): Promise<ApiResponse<{
    estimatedTime: number
    deliveryFee: number
    availableTimeSlots: string[]
  }>> {
    return this.getApiClient().post('/orders/estimate', data)
  }
}

// Create singleton instance
let orderService: OrderService | null = null

export function useOrderService(): OrderService {
  if (!orderService) {
    orderService = new OrderService()
  }
  return orderService
}