import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OrderService } from '~/services/order.service'

// Mock useNuxtApp
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    },
  }),
}))

describe('OrderService', () => {
  let orderService: OrderService
  let mockApiClient: any

  beforeEach(() => {
    orderService = new OrderService()
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    }
    
    // Mock the getApiClient method
    vi.spyOn(orderService as any, 'getApiClient').mockReturnValue(mockApiClient)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const orderData = {
        items: [
          { itemId: 'item-1', quantity: 2, price: 12.99 },
        ],
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
        deliveryInfo: {
          address: '123 Main St',
          city: 'New York',
          zipCode: '10001',
        },
      }

      const mockOrder = {
        id: 'order-1',
        status: 'PENDING',
        total: 25.98,
        ...orderData,
      }

      mockApiClient.post.mockResolvedValue({
        success: true,
        data: mockOrder,
      })

      const result = await orderService.createOrder(orderData)

      expect(mockApiClient.post).toHaveBeenCalledWith('/orders', orderData)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockOrder)
    })
  })

  describe('getOrders', () => {
    it('should fetch orders without filters', async () => {
      const mockOrders = {
        orders: [
          { id: 'order-1', status: 'PENDING', total: 25.98 },
          { id: 'order-2', status: 'DELIVERED', total: 18.50 },
        ],
        total: 2,
        page: 1,
        limit: 10,
      }

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockOrders,
      })

      const result = await orderService.getOrders()

      expect(mockApiClient.get).toHaveBeenCalledWith('/orders')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockOrders)
    })

    it('should fetch orders with filters', async () => {
      const params = {
        status: 'PENDING' as const,
        page: 2,
        limit: 5,
      }

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: { orders: [], total: 0, page: 2, limit: 5 },
      })

      await orderService.getOrders(params)

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/orders?status=PENDING&page=2&limit=5'
      )
    })
  })

  describe('getOrder', () => {
    it('should fetch a specific order', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'PENDING',
        total: 25.98,
        items: [],
      }

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockOrder,
      })

      const result = await orderService.getOrder('order-1')

      expect(mockApiClient.get).toHaveBeenCalledWith('/orders/order-1')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockOrder)
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'CONFIRMED',
        total: 25.98,
      }

      mockApiClient.patch.mockResolvedValue({
        success: true,
        data: mockOrder,
      })

      const result = await orderService.updateOrderStatus('order-1', 'CONFIRMED')

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/orders/order-1/status',
        { status: 'CONFIRMED' }
      )
      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('CONFIRMED')
    })
  })

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'CANCELLED',
        total: 25.98,
      }

      mockApiClient.patch.mockResolvedValue({
        success: true,
        data: mockOrder,
      })

      const result = await orderService.cancelOrder('order-1', 'Customer request')

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/orders/order-1/cancel',
        { reason: 'Customer request' }
      )
      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('CANCELLED')
    })

    it('should cancel an order without reason', async () => {
      mockApiClient.patch.mockResolvedValue({
        success: true,
        data: { id: 'order-1', status: 'CANCELLED' },
      })

      await orderService.cancelOrder('order-1')

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/orders/order-1/cancel',
        { reason: undefined }
      )
    })
  })

  describe('trackOrder', () => {
    it('should get order tracking information', async () => {
      const mockTracking = {
        order: { id: 'order-1', status: 'PREPARING' },
        tracking: {
          status: 'PREPARING',
          estimatedTime: 25,
          currentStep: 'Preparing your order',
          steps: [
            { name: 'Order confirmed', status: 'completed', timestamp: '2023-01-01T10:00:00Z' },
            { name: 'Preparing', status: 'current' },
            { name: 'Ready for pickup', status: 'pending' },
          ],
        },
      }

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockTracking,
      })

      const result = await orderService.trackOrder('order-1')

      expect(mockApiClient.get).toHaveBeenCalledWith('/orders/order-1/track')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTracking)
    })
  })

  describe('repeatOrder', () => {
    it('should repeat an existing order', async () => {
      const mockNewOrder = {
        id: 'order-2',
        status: 'PENDING',
        total: 25.98,
      }

      mockApiClient.post.mockResolvedValue({
        success: true,
        data: mockNewOrder,
      })

      const result = await orderService.repeatOrder('order-1')

      expect(mockApiClient.post).toHaveBeenCalledWith('/orders/order-1/repeat')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNewOrder)
    })
  })

  describe('rateOrder', () => {
    it('should rate an order', async () => {
      const rating = {
        overall: 5,
        food: 4,
        delivery: 5,
        comment: 'Great service!',
      }

      mockApiClient.post.mockResolvedValue({
        success: true,
        message: 'Rating submitted successfully',
      })

      const result = await orderService.rateOrder('order-1', rating)

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/orders/order-1/rating',
        rating
      )
      expect(result.success).toBe(true)
    })
  })

  describe('estimateDeliveryTime', () => {
    it('should estimate delivery time and fee', async () => {
      const estimateData = {
        items: [{ itemId: 'item-1', quantity: 2 }],
        deliveryAddress: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St, New York, NY',
        },
      }

      const mockEstimate = {
        estimatedTime: 30,
        deliveryFee: 3.99,
        availableTimeSlots: ['12:00', '12:30', '13:00'],
      }

      mockApiClient.post.mockResolvedValue({
        success: true,
        data: mockEstimate,
      })

      const result = await orderService.estimateDeliveryTime(estimateData)

      expect(mockApiClient.post).toHaveBeenCalledWith('/orders/estimate', estimateData)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockEstimate)
    })
  })

  describe('getActiveOrders', () => {
    it('should fetch active orders', async () => {
      const mockActiveOrders = [
        { id: 'order-1', status: 'PREPARING', total: 25.98 },
        { id: 'order-2', status: 'READY', total: 18.50 },
      ]

      mockApiClient.get.mockResolvedValue({
        success: true,
        data: mockActiveOrders,
      })

      const result = await orderService.getActiveOrders()

      expect(mockApiClient.get).toHaveBeenCalledWith('/orders/active')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockActiveOrders)
    })
  })
})