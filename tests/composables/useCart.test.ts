import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCart } from '~/composables/useCart'

// Mock stores
vi.mock('~/stores/cart', () => ({
  useCartStore: () => ({
    items: [],
    loading: false,
    total: 0,
    itemCount: 0,
    isEmpty: true,
    syncing: false,
    lastSyncAt: null,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    restoreCart: vi.fn(),
    validateCartItems: vi.fn(),
    syncCartWithServer: vi.fn(),
    loadCartFromServer: vi.fn(),
    initializeCart: vi.fn(),
  }),
}))

vi.mock('~/stores/order', () => ({
  useOrderStore: () => ({
    createOrder: vi.fn(),
  }),
}))

vi.mock('~/services/order.service', () => ({
  useOrderService: () => ({
    estimateDeliveryTime: vi.fn(),
  }),
}))

describe('useCart', () => {
  let mockCartStore: any
  let mockOrderStore: any

  beforeEach(async () => {
    mockCartStore = {
      items: ref([]),
      loading: ref(false),
      total: ref(0),
      itemCount: ref(0),
      isEmpty: ref(true),
      syncing: ref(false),
      lastSyncAt: ref(null),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      restoreCart: vi.fn(),
      validateCartItems: vi.fn(),
      syncCartWithServer: vi.fn(),
      loadCartFromServer: vi.fn(),
      initializeCart: vi.fn(),
    }

    mockOrderStore = {
      createOrder: vi.fn(),
    }

    // Mock the store imports
    vi.mocked(await import('~/stores/cart')).useCartStore.mockReturnValue(mockCartStore)
    vi.mocked(await import('~/stores/order')).useOrderStore.mockReturnValue(mockOrderStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('basic cart operations', () => {
    it('should add item to cart', () => {
      const { addItem } = useCart()
      const menuItem = {
        id: 'item-1',
        name: 'Pizza',
        price: 12.99,
        description: 'Delicious pizza',
        isActive: true,
      }

      addItem(menuItem, 2)

      expect(mockCartStore.addItem).toHaveBeenCalledWith(menuItem, 2, undefined)
    })

    it('should add item with customizations', () => {
      const { addItem } = useCart()
      const menuItem = {
        id: 'item-1',
        name: 'Pizza',
        price: 12.99,
        description: 'Delicious pizza',
        isActive: true,
      }
      const customizations = { size: 'large', toppings: ['pepperoni'] }

      addItem(menuItem, 1, customizations)

      expect(mockCartStore.addItem).toHaveBeenCalledWith(menuItem, 1, customizations)
    })

    it('should remove item from cart', () => {
      const { removeItem } = useCart()

      removeItem('item-1')

      expect(mockCartStore.removeItem).toHaveBeenCalledWith('item-1', undefined)
    })

    it('should update item quantity', () => {
      const { updateQuantity } = useCart()

      updateQuantity('item-1', 3)

      expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('item-1', 3, undefined)
    })

    it('should clear cart', () => {
      const { clearCart } = useCart()

      clearCart()

      expect(mockCartStore.clearCart).toHaveBeenCalled()
    })
  })

  describe('cart state', () => {
    it('should compute hasItems correctly', () => {
      mockCartStore.isEmpty.value = false
      
      const { hasItems } = useCart()

      expect(hasItems.value).toBe(true)
    })

    it('should format total as currency', () => {
      mockCartStore.total.value = 25.99
      
      const { formattedTotal } = useCart()

      expect(formattedTotal.value).toBe('$25.99')
    })
  })

  describe('item helpers', () => {
    beforeEach(() => {
      mockCartStore.items.value = [
        {
          menuItem: { id: 'item-1', name: 'Pizza', price: 12.99 },
          quantity: 2,
          subtotal: 25.98,
          customizations: { size: 'large' },
        },
        {
          menuItem: { id: 'item-2', name: 'Burger', price: 8.99 },
          quantity: 1,
          subtotal: 8.99,
          customizations: {},
        },
      ]
    })

    it('should get item quantity', () => {
      const { getItemQuantity } = useCart()

      const quantity = getItemQuantity('item-1', { size: 'large' })

      expect(quantity).toBe(2)
    })

    it('should return 0 for non-existent item', () => {
      const { getItemQuantity } = useCart()

      const quantity = getItemQuantity('item-3')

      expect(quantity).toBe(0)
    })

    it('should check if cart has item', () => {
      const { hasItem } = useCart()

      expect(hasItem('item-1', { size: 'large' })).toBe(true)
      expect(hasItem('item-3')).toBe(false)
    })

    it('should get item subtotal', () => {
      const { getItemSubtotal } = useCart()

      const subtotal = getItemSubtotal('item-1', { size: 'large' })

      expect(subtotal).toBe(25.98)
    })
  })

  describe('checkout', () => {
    beforeEach(() => {
      mockCartStore.isEmpty.value = false
      mockCartStore.items.value = [
        {
          menuItem: { id: 'item-1', name: 'Pizza', price: 12.99 },
          quantity: 2,
          customizations: { size: 'large' },
        },
      ]
    })

    it('should create order from cart', async () => {
      const mockOrder = { id: 'order-1', status: 'PENDING' }
      mockOrderStore.createOrder.mockResolvedValue(mockOrder)

      const { createOrderFromCart } = useCart()
      const customerInfo = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      }

      const result = await createOrderFromCart(customerInfo, 'Special instructions')

      expect(mockOrderStore.createOrder).toHaveBeenCalledWith({
        items: [
          {
            productId: 'item-1',
            quantity: 2,
            price: 12.99,
            customizations: { size: 'large' },
          },
        ],
        customerInfo,
        notes: 'Special instructions',
      })
      expect(result).toEqual(mockOrder)
      expect(mockCartStore.clearCart).toHaveBeenCalled()
    })

    it('should throw error when cart is empty', async () => {
      mockCartStore.isEmpty.value = true

      const { createOrderFromCart } = useCart()
      const customerInfo = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      }

      await expect(createOrderFromCart(customerInfo)).rejects.toThrow('Cart is empty')
    })
  })

  describe('validation', () => {
    it('should validate cart successfully', () => {
      mockCartStore.isEmpty.value = false
      mockCartStore.validateCartItems.mockReturnValue({
        isValid: true,
        errors: [],
      })

      const { validateCart } = useCart()
      const result = validateCart()

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return errors for empty cart', () => {
      mockCartStore.isEmpty.value = true
      mockCartStore.validateCartItems.mockReturnValue({
        isValid: false,
        errors: ['Some items are unavailable'],
      })

      const { validateCart } = useCart()
      const result = validateCart()

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Cart is empty')
      expect(result.errors).toContain('Some items are unavailable')
    })
  })

  describe('server synchronization', () => {
    it('should sync with server', async () => {
      const { syncWithServer } = useCart()

      await syncWithServer()

      expect(mockCartStore.syncCartWithServer).toHaveBeenCalled()
    })

    it('should load from server', async () => {
      const { loadFromServer } = useCart()

      await loadFromServer()

      expect(mockCartStore.loadCartFromServer).toHaveBeenCalled()
    })

    it('should initialize cart', async () => {
      const { initializeCart } = useCart()

      await initializeCart()

      expect(mockCartStore.initializeCart).toHaveBeenCalled()
    })
  })

  describe('delivery estimation', () => {
    beforeEach(() => {
      mockCartStore.isEmpty.value = false
      mockCartStore.items.value = [
        {
          menuItem: { id: 'item-1', name: 'Pizza', price: 12.99 },
          quantity: 2,
        },
      ]
    })

    it('should estimate delivery time', async () => {
      const mockEstimate = {
        estimatedTime: 30,
        deliveryFee: 3.99,
        availableTimeSlots: ['12:00', '12:30'],
      }

      const mockOrderService = {
        estimateDeliveryTime: vi.fn().mockResolvedValue({
          success: true,
          data: mockEstimate,
        }),
      }

      vi.mocked(await import('~/services/order.service')).useOrderService.mockReturnValue(mockOrderService)

      const { estimateDeliveryTime } = useCart()
      const deliveryAddress = {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St',
      }

      const result = await estimateDeliveryTime(deliveryAddress)

      expect(mockOrderService.estimateDeliveryTime).toHaveBeenCalledWith({
        items: [{ itemId: 'item-1', quantity: 2 }],
        deliveryAddress,
      })
      expect(result).toEqual(mockEstimate)
    })

    it('should throw error when cart is empty', async () => {
      mockCartStore.isEmpty.value = true

      const { estimateDeliveryTime } = useCart()
      const deliveryAddress = {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St',
      }

      await expect(estimateDeliveryTime(deliveryAddress)).rejects.toThrow('Cart is empty')
    })
  })
})