import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OrderService } from '~/services/order.service'
import type { Order, OrderStatus } from '~/types'

describe('OrderService', () => {
  let orderService: OrderService
  let mockApiClient: any

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      getRaw: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    }
    orderService = new OrderService(mockApiClient)
  })

  afterEach(() => {
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

      mockApiClient.post.mockResolvedValue(mockOrder)

      const result = await orderService.createOrder(orderData as any)

      expect(mockApiClient.post).toHaveBeenCalledWith('/orders', orderData)
      expect(result).toEqual(mockOrder)
    })
  })

  describe('getOrders', () => {
    it('should fetch orders without filters', async () => {
      const mockOrders = [
        { id: 'order-1', status: 'PENDING', total: 25.98 },
      ]

      mockApiClient.getRaw.mockResolvedValue({
        success: true,
        data: mockOrders,
        meta: {
          pagination: {
            page: 1,
            limit: 20,
            totalItems: 1,
            totalPages: 1,
          }
        }
      })

      const result = await orderService.getOrders()

      expect(mockApiClient.getRaw).toHaveBeenCalledWith('/my-orders')
      expect(result.items).toEqual(mockOrders)
      expect(result.pagination).toBeDefined()
    })

    it('should fetch orders with filters', async () => {
      const params = {
        status: 'PENDING' as OrderStatus,
        page: 2,
        limit: 5,
      }

      mockApiClient.getRaw.mockResolvedValue({
        success: true,
        data: [],
        meta: {
          pagination: {
            page: 2,
            limit: 5,
            totalItems: 0,
            totalPages: 0,
          }
        }
      })

      await orderService.getOrders(params)

      expect(mockApiClient.getRaw).toHaveBeenCalledWith(
        '/my-orders?status=PENDING&page=2&limit=5'
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

      mockApiClient.get.mockResolvedValue(mockOrder)

      const result = await orderService.getOrder('order-1')

      expect(mockApiClient.get).toHaveBeenCalledWith('/my-orders/order-1')
      expect(result).toEqual(mockOrder)
    })
  })

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'CONFIRMED',
        total: 25.98,
      }

      mockApiClient.patch.mockResolvedValue(mockOrder)

      const result = await orderService.updateOrderStatus('order-1', 'CONFIRMED' as OrderStatus)

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/my-orders/order-1/status',
        { status: 'CONFIRMED' }
      )
      expect(result.status).toBe('CONFIRMED')
    })
  })

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const mockOrder = {
        id: 'order-1',
        status: 'CANCELLED',
        total: 25.98,
      }

      mockApiClient.patch.mockResolvedValue(mockOrder)

      const result = await orderService.cancelOrder('order-1', 'Customer request')

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/my-orders/order-1/cancel',
        { reason: 'Customer request' }
      )
      expect(result.status).toBe('CANCELLED')
    })

    it('should cancel an order without reason', async () => {
      mockApiClient.patch.mockResolvedValue({ id: 'order-1', status: 'CANCELLED' })

      await orderService.cancelOrder('order-1')

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/my-orders/order-1/cancel',
        { reason: undefined }
      )
    })
  })

  describe('trackOrder', () => {
    it('should get order tracking information', async () => {
      const mockTracking = {
        order: { id: 'order-1', status: 'PREPARING' as OrderStatus },
        tracking: {
          status: 'PREPARING' as OrderStatus,
          estimatedTime: 25,
          currentStep: 'Preparing your order',
          steps: [
            { name: 'Order confirmed', status: 'completed' as const },
            { name: 'Preparing', status: 'current' as const },
          ],
        },
      }

      mockApiClient.get.mockResolvedValue(mockTracking)

      const result = await orderService.trackOrder('order-1')

      expect(mockApiClient.get).toHaveBeenCalledWith('/orders/order-1/track')
      expect(result).toEqual(mockTracking)
    })
  })

  describe('repeatOrder', () => {
    it('should repeat an existing order', async () => {
      const mockNewOrder = {
        id: 'order-2',
        status: 'PENDING',
        total: 25.98,
      }

      mockApiClient.post.mockResolvedValue(mockNewOrder)

      const result = await orderService.repeatOrder('order-1')

      expect(mockApiClient.post).toHaveBeenCalledWith('/my-orders/order-1/repeat')
      expect(result).toEqual(mockNewOrder)
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

      mockApiClient.post.mockResolvedValue(undefined)

      await orderService.rateOrder('order-1', rating)

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/my-orders/order-1/rating',
        rating
      )
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

      mockApiClient.post.mockResolvedValue(mockEstimate)

      const result = await orderService.estimateDeliveryTime(estimateData)

      expect(mockApiClient.post).toHaveBeenCalledWith('/orders/estimate', estimateData)
      expect(result).toEqual(mockEstimate)
    })
  })

  describe('getActiveOrders', () => {
    it('should fetch active orders', async () => {
      const mockActiveOrders = [
        { id: 'order-1', status: 'PREPARING', total: 25.98 },
        { id: 'order-2', status: 'READY', total: 18.50 },
      ]

      mockApiClient.getRaw.mockResolvedValue({
        success: true,
        data: mockActiveOrders,
      })

      const result = await orderService.getActiveOrders()

      expect(mockApiClient.getRaw).toHaveBeenCalledWith('/my-orders?limit=100&status=PENDING')
      expect(result).toEqual(mockActiveOrders)
    })
  })
})