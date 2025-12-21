import type { Order, CreateOrderDto, OrderStatus, OrderItem, PaginatedResult } from '~/types'
import { useApiClient } from '~/utils/api'

export class OrderService {
  private apiClient = useApiClient()

  private getApiClient() {
    return this.apiClient
  }

  /**
   * Create order (unwrapped data)
   * Returns: Order
   * Requirements: 2.1
   */
  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    return this.getApiClient().post<Order>('/orders', orderData)
  }

  /**
   * Get paginated orders (unwrapped data)
   * Returns: PaginatedResult<Order>
   * Requirements: 2.1, 2.2
   */
  async getOrders(params?: {
    status?: OrderStatus
    page?: number
    limit?: number
  }): Promise<PaginatedResult<Order>> {
    const searchParams = new URLSearchParams()
    
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/orders?${queryString}` : '/orders'
    
    // Get full response to access pagination metadata
    const response = await this.getApiClient().getRaw<Order[]>(endpoint)
    
    if (response.success && response.data) {
      return {
        items: response.data,
        pagination: response.meta.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 20,
          totalItems: response.data.length,
          totalPages: 1
        }
      }
    } else {
      throw new Error(response.error?.message || 'Failed to fetch orders')
    }
  }

  /**
   * Get single order (unwrapped data)
   * Returns: Order | null
   * Requirements: 2.3
   */
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      return await this.getApiClient().get<Order>(`/orders/${orderId}`)
    } catch (error) {
      // Return null for not found cases
      if ((error as any)?.code === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  /**
   * Update order status (unwrapped data)
   * Returns: Order
   * Requirements: 2.1
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return this.getApiClient().patch<Order>(`/orders/${orderId}/status`, { status })
  }

  /**
   * Cancel order (unwrapped data)
   * Returns: Order
   * Requirements: 2.1
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return this.getApiClient().patch<Order>(`/orders/${orderId}/cancel`, { reason })
  }

  /**
   * Get order history (unwrapped data)
   * Returns: PaginatedResult<Order>
   * Requirements: 2.1, 2.2
   */
  async getOrderHistory(page: number = 1, limit: number = 10): Promise<PaginatedResult<Order>> {
    // Get full response to access pagination metadata
    const response = await this.getApiClient().getRaw<Order[]>(`/orders/history?page=${page}&limit=${limit}`)
    
    if (response.success && response.data) {
      return {
        items: response.data,
        pagination: response.meta.pagination || {
          page,
          limit,
          totalItems: response.data.length,
          totalPages: 1
        }
      }
    } else {
      throw new Error(response.error?.message || 'Failed to fetch order history')
    }
  }

  /**
   * Repeat order (unwrapped data)
   * Returns: Order
   * Requirements: 2.1
   */
  async repeatOrder(orderId: string): Promise<Order> {
    return this.getApiClient().post<Order>(`/orders/${orderId}/repeat`)
  }

  /**
   * Track order (unwrapped data)
   * Returns: order tracking data
   * Requirements: 2.1
   */
  async trackOrder(orderId: string): Promise<{
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
  }> {
    return this.getApiClient().get<{
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
    }>(`/orders/${orderId}/track`)
  }

  /**
   * Get order tracking (unwrapped data)
   * Returns: tracking data
   * Requirements: 2.1
   */
  async getOrderTracking(orderId: string): Promise<{
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
  }> {
    return this.getApiClient().get<{
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
    }>(`/orders/${orderId}/tracking`)
  }

  /**
   * Rate order (unwrapped data)
   * Returns: void
   * Requirements: 2.3
   */
  async rateOrder(orderId: string, rating: {
    overall: number
    food: number
    delivery: number
    comment?: string
  }): Promise<void> {
    return this.getApiClient().post<void>(`/orders/${orderId}/rating`, rating)
  }

  /**
   * Get order receipt (unwrapped data)
   * Returns: receipt data
   * Requirements: 2.1
   */
  async getOrderReceipt(orderId: string): Promise<{
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
  }> {
    return this.getApiClient().get<{
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
    }>(`/orders/${orderId}/receipt`)
  }

  /**
   * Request refund (unwrapped data)
   * Returns: refund data
   * Requirements: 2.1
   */
  async requestRefund(orderId: string, data: {
    reason: string
    items?: string[]
    amount?: number
  }): Promise<{
    refundId: string
    status: string
    estimatedProcessingTime: string
  }> {
    return this.getApiClient().post<{
      refundId: string
      status: string
      estimatedProcessingTime: string
    }>(`/orders/${orderId}/refund`, data)
  }

  /**
   * Get active orders (unwrapped data)
   * Returns: Order[]
   * Requirements: 2.1
   */
  async getActiveOrders(): Promise<Order[]> {
    return this.getApiClient().get<Order[]>('/orders/active')
  }

  /**
   * Estimate delivery time (unwrapped data)
   * Returns: estimation data
   * Requirements: 2.1
   */
  async estimateDeliveryTime(data: {
    items: Array<{ itemId: string; quantity: number }>
    deliveryAddress: {
      latitude: number
      longitude: number
      address: string
    }
  }): Promise<{
    estimatedTime: number
    deliveryFee: number
    availableTimeSlots: string[]
  }> {
    return this.getApiClient().post<{
      estimatedTime: number
      deliveryFee: number
      availableTimeSlots: string[]
    }>('/orders/estimate', data)
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