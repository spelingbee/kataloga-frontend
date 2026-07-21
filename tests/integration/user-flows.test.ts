import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      apiBaseUrl: 'http://localhost:3001',
      tenantSlug: 'test',
      websocketUrl: 'ws://localhost:3001'
    }
  }),
  navigateTo: vi.fn(),
  useRoute: () => ({
    params: { id: '1' },
    query: {},
    path: '/test'
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  }),
  useCookie: vi.fn(() => ({
    value: null
  })),
  useState: vi.fn((key, init) => ({
    value: init ? init() : null
  })),
  useNuxtApp: () => {
    const path = require('path')
    const { useApiClient } = require(path.resolve(__dirname, '../../app/utils/api'))
    const { MenuService } = require(path.resolve(__dirname, '../../app/services/menu.service'))
    const { OrderService } = require(path.resolve(__dirname, '../../app/services/order.service'))
    const apiClient = useApiClient()
    return {
      $apiClient: apiClient,
      $services: {
        menu: new MenuService(apiClient),
        order: new OrderService(apiClient)
      }
    }
  }
}))

// User flow integration tests
describe('User Flow Integration Tests', () => {
  beforeEach(async () => {
    const pinia = createPinia()
    
    const { useApiClient } = await import('~/utils/api')
    const { MenuService } = await import('~/services/menu.service')
    const { OrderService } = await import('~/services/order.service')
    
    const apiClient = useApiClient()
    pinia.use((ctx) => {
      console.log('TEST PLUGIN RUNNING FOR STORE:', ctx.store.$id)
      return {
        $apiClient: apiClient,
        $services: {
          menu: new MenuService(apiClient),
          order: new OrderService(apiClient)
        }
      }
    })

    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  describe('Authentication Flow', () => {
    it('should complete login flow', async () => {
      // ApiClient expects the new envelope and returns response.data unwrapped.
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({
          success: true,
          statusCode: 200,
          data: {
            accessToken: 'test-token',
            refreshToken: 'refresh-token',
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User'
            }
          },
          error: null,
          meta: { requestId: 'login-test-123', timestamp: new Date().toISOString() }
        })
      })

      const { getActivePinia } = await import('pinia')
      const activePinia = getActivePinia()
      console.log('ACTIVE PINIA:', !!activePinia, activePinia ? activePinia._p : 'no active pinia')

      const { useAuth } = await import('~/composables/useAuth')
      const auth = useAuth()

      const result = await auth.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(true)
      expect(auth.user.value).toBeDefined()
      expect(auth.isAuthenticated.value).toBe(true)
    })

    it('should handle login failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({
          success: false,
          statusCode: 401,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
          meta: { requestId: 'login-fail-123', timestamp: new Date().toISOString() }
        })
      })

      const { useAuth } = await import('~/composables/useAuth')
      const auth = useAuth()

      await expect(auth.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow()

      expect(auth.isAuthenticated.value).toBe(false)
    })

    it('should complete registration flow', async () => {
      // ApiClient expects the new envelope and returns response.data unwrapped.
      global.fetch = vi.fn().mockImplementation((url: any) => {
        const urlStr = String(url)
        
        if (urlStr.includes('/public/test-tenant/auth/register')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({
              success: true,
              statusCode: 200,
              data: {
                user: {
                  id: '1',
                  email: 'newuser@example.com',
                  firstName: 'New',
                  lastName: 'User'
                },
                accessToken: 'test-token',
                refreshToken: 'refresh-token'
              },
              error: null,
              meta: { requestId: 'register-test-123', timestamp: new Date().toISOString() }
            })
          })
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({
            success: true,
            statusCode: 200,
            data: {},
            error: null,
            meta: { requestId: 'default-test-123', timestamp: new Date().toISOString() }
          })
        })
      })

      const { useAuth } = await import('~/composables/useAuth')
      const auth = useAuth()

      const result = await auth.register({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Menu Browsing Flow', () => {
    it('should load and display menu items', async () => {
      global.fetch = vi.fn().mockImplementation((url: any) => {
        const urlStr = String(url)

        // fetchMenu() -> MenuService.getCategories() -> apiClient.get('/public/menu/<tenant>/categories')
        if (urlStr.includes('/public/menu/test-tenant/categories')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({
              success: true,
              statusCode: 200,
              data: [
                { id: 'cat-1', name: 'Pizza', itemCount: 1 },
                { id: 'cat-2', name: 'Salads', itemCount: 1 },
              ],
              error: null,
              meta: { requestId: 'categories-test-123', timestamp: new Date().toISOString() }
            })
          })
        }

        // fetchMenu() -> MenuService.getMenuItems() -> apiClient.getRaw('/public/menu/<tenant>')
        if (urlStr.includes('/public/menu/test-tenant')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({
              success: true,
              statusCode: 200,
              data: [
                {
                  id: 'menu-1',
                  items: [
                    {
                      id: '1',
                      name: 'Pizza Margherita',
                      description: 'Classic pizza with tomato and mozzarella',
                      price: 12.99,
                      isActive: true,
                      category: { id: 'cat-1', name: 'Pizza' },
                      categoryId: 'cat-1',
                      imageUrl: '/images/pizza-margherita.jpg'
                    },
                    {
                      id: '2',
                      name: 'Caesar Salad',
                      description: 'Fresh salad with caesar dressing',
                      price: 8.99,
                      isActive: true,
                      category: { id: 'cat-2', name: 'Salads' },
                      categoryId: 'cat-2',
                      imageUrl: '/images/caesar-salad.jpg'
                    }
                  ]
                }
              ],
              error: null,
              meta: {
                requestId: 'menu-test-123',
                timestamp: new Date().toISOString(),
                pagination: {
                  page: 1,
                  limit: 20,
                  totalItems: 2,
                  totalPages: 1,
                }
              }
            })
          })
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({
            success: true,
            statusCode: 200,
            data: {},
            error: null,
            meta: { requestId: 'default-test-123', timestamp: new Date().toISOString() }
          })
        })
      })

      const { useMenu } = await import('~/composables/useMenu')
      const menu = useMenu()

      await menu.loadMenuItems()

      expect(menu.items.value).toHaveLength(2)
      expect(menu.items.value[0].name).toBe('Pizza Margherita')
      expect(menu.loading.value).toBe(false)
    })

    it('should filter menu items by category', async () => {
      // useMenu.loadMenuItems({ category }) calls fetchMenu(), which loads categories+items.
      global.fetch = vi.fn().mockImplementation((url: any) => {
        const urlStr = String(url)

        if (urlStr.includes('/public/menu/test-tenant/categories')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({
              success: true,
              statusCode: 200,
              data: [
                { id: 'cat-pizza', name: 'Pizza', itemCount: 1 },
              ],
              error: null,
              meta: { requestId: 'categories-test-456', timestamp: new Date().toISOString() }
            })
          })
        }

        if (urlStr.includes('/public/menu/test-tenant')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({
              success: true,
              statusCode: 200,
              data: [
                {
                  id: 'menu-1',
                  items: [
                    {
                      id: '1',
                      name: 'Pizza Margherita',
                      categoryId: 'cat-pizza',
                      category: { id: 'cat-pizza', name: 'Pizza' },
                      price: 12.99,
                      isActive: true,
                    }
                  ]
                }
              ],
              error: null,
              meta: { requestId: 'menu-test-456', timestamp: new Date().toISOString() }
            })
          })
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({
            success: true,
            statusCode: 200,
            data: {},
            error: null,
            meta: { requestId: 'default-test-123', timestamp: new Date().toISOString() }
          })
        })
      })

      const { useMenu } = await import('~/composables/useMenu')
      const menu = useMenu()

      await menu.loadMenuItems({ category: 'Pizza' })

      expect(menu.items.value).toHaveLength(1)
      expect(menu.items.value[0].category).toBe('Pizza')
    })

    it('should search menu items', async () => {
      // searchItems() uses store.searchItems(), which calls menuService.searchMenuItems().
      // We'll provide a menu with one item; filtering happens client-side after load.
      global.fetch = vi.fn().mockImplementation((url: any) => {
        const urlStr = String(url)

        if (urlStr.includes('/public/menu/test-tenant/categories')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({
              success: true,
              statusCode: 200,
              data: [
                { id: 'cat-1', name: 'Pizza', itemCount: 1 },
              ],
              error: null,
              meta: { requestId: 'categories-test-789', timestamp: new Date().toISOString() }
            })
          })
        }

        if (urlStr.includes('/public/menu/test-tenant')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({
              success: true,
              statusCode: 200,
              data: [
                {
                  id: 'menu-1',
                  items: [
                    {
                      id: '1',
                      name: 'Pizza Margherita',
                      description: 'Classic pizza',
                      categoryId: 'cat-1',
                      category: { id: 'cat-1', name: 'Pizza' },
                      price: 12.99,
                      isActive: true,
                    }
                  ]
                }
              ],
              error: null,
              meta: { requestId: 'menu-test-789', timestamp: new Date().toISOString() }
            })
          })
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({
            success: true,
            statusCode: 200,
            data: {},
            error: null,
            meta: { requestId: 'default-test-123', timestamp: new Date().toISOString() }
          })
        })
      })

      const { useMenu } = await import('~/composables/useMenu')
      const menu = useMenu()

      await menu.searchItems('pizza')

      expect(menu.searchResults.value).toHaveLength(1)
      expect(menu.searchResults.value[0].name).toContain('Pizza')
    })
  })

  describe('Cart Management Flow', () => {
    it('should add items to cart', async () => {
      const { useCart } = await import('~/composables/useCart')
      const cart = useCart()

      const item = {
        id: '1',
        name: 'Pizza Margherita',
        price: 12.99,
        quantity: 1
      }

      cart.addItem(item)

      expect(cart.items.value).toHaveLength(1)
      expect(cart.items.value[0].name).toBe('Pizza Margherita')
      expect(cart.total.value).toBe(12.99)
    })

    it('should update item quantity', async () => {
      const { useCart } = await import('~/composables/useCart')
      const cart = useCart()

      const item = {
        id: '1',
        name: 'Pizza Margherita',
        price: 12.99,
        quantity: 1
      }

      cart.addItem(item)
      cart.updateQuantity('1', 3)

      expect(cart.items.value[0].quantity).toBe(3)
      expect(cart.total.value).toBe(38.97)
    })

    it('should remove items from cart', async () => {
      const { useCart } = await import('~/composables/useCart')
      const cart = useCart()

      const item = {
        id: '1',
        name: 'Pizza Margherita',
        price: 12.99,
        quantity: 1
      }

      cart.addItem(item)
      cart.removeItem('1')

      expect(cart.items.value).toHaveLength(0)
      expect(cart.total.value).toBe(0)
    })

    it('should clear entire cart', async () => {
      const { useCart } = await import('~/composables/useCart')
      const cart = useCart()

      cart.addItem({ id: '1', name: 'Item 1', price: 10, quantity: 1 })
      cart.addItem({ id: '2', name: 'Item 2', price: 15, quantity: 2 })

      expect(cart.items.value).toHaveLength(2)

      cart.clearCart()

      expect(cart.items.value).toHaveLength(0)
      expect(cart.total.value).toBe(0)
    })
  })

  describe('Order Placement Flow', () => {
    it('should create order successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({
          success: true,
          statusCode: 200,
          data: {
            id: 'order-123',
            status: 'PENDING',
            total: 25.98,
            items: [
              { id: '1', name: 'Pizza Margherita', quantity: 2, price: 12.99 }
            ]
          },
          error: null,
          meta: { requestId: 'order-test-123', timestamp: new Date().toISOString() }
        })
      })

      const { useOrders } = await import('~/composables/useOrders')
      const orders = useOrders()

      const orderData = {
        items: [
          { id: '1', name: 'Pizza Margherita', quantity: 2, price: 12.99 }
        ],
        customerInfo: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        },
        deliveryInfo: {
          address: '123 Main St',
          city: 'Test City',
          postalCode: '12345'
        }
      }

      const result = await orders.createOrder(orderData)

      expect(result.success).toBe(true)
      expect(result.data.id).toBe('order-123')
      expect(result.data.status).toBe('PENDING')
    })

    it('should handle order creation failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          message: 'Invalid order data'
        })
      })

      const { useOrders } = await import('~/composables/useOrders')
      const orders = useOrders()

      const orderData = {
        items: [], // Invalid: empty items
        customerInfo: {},
        deliveryInfo: {}
      }

      await expect(orders.createOrder(orderData)).rejects.toThrow()
    })
  })

  describe('Order Tracking Flow', () => {
    it('should track order status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({
          success: true,
          statusCode: 200,
          data: {
            id: 'order-123',
            status: 'PREPARING',
            estimatedDelivery: '2024-01-01T12:00:00Z',
            timeline: [
              { status: 'PENDING', timestamp: '2024-01-01T10:00:00Z', message: 'Order pending' },
              { status: 'CONFIRMED', timestamp: '2024-01-01T11:00:00Z', message: 'Order confirmed' },
              { status: 'PREPARING', timestamp: '2024-01-01T12:00:00Z', message: 'Order preparing' }
            ]
          },
          error: null,
          meta: { requestId: 'track-test-123', timestamp: new Date().toISOString() }
        })
      })

      const { useOrderTracking } = await import('~/composables/useOrderTracking')
      const tracking = useOrderTracking()

      await tracking.trackOrder('order-123')

      expect(tracking.currentOrder.value?.id).toBe('order-123')
      expect(tracking.currentOrder.value?.status).toBe('PREPARING')
      expect(tracking.statusHistory.value).toHaveLength(3)
    })
  })


  describe('Error Handling Flow', () => {
    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const { useErrorHandler } = await import('~/composables/useErrorHandler')
      const errorHandler = useErrorHandler()

      try {
        await fetch('/api/test')
      } catch (error) {
        errorHandler.handleError(error as Error)
      }

      expect(errorHandler.hasError.value).toBe(true)
      expect(errorHandler.errorMessage.value).toContain('Network error')
    })

    it('should retry failed requests', async () => {
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({
            success: true,
            statusCode: 200,
            data: { success: true },
            error: null,
            meta: { requestId: 'retry-test-123', timestamp: new Date().toISOString() }
          })
        })
      })

      const { useApi } = await import('~/composables/useApi')
      const api = useApi()

      const result = await api.get('/api/test', { retry: 3 })

      expect(callCount).toBe(3)
      expect(result.success).toBe(true)
    })
  })

  describe('Performance Flow', () => {
    it('should implement lazy loading', async () => {
      const { useLazyLoading } = await import('~/composables/useLazyLoading')
      const lazyLoading = useLazyLoading()

      const mockElement = {
        getBoundingClientRect: () => ({
          top: 100,
          bottom: 200,
          left: 0,
          right: 100
        })
      } as Element

      const isVisible = lazyLoading.isElementVisible(mockElement)
      expect(typeof isVisible).toBe('boolean')
    })

    it('should measure performance metrics', async () => {
      const { usePerformance } = await import('~/composables/usePerformance')
      const performance = usePerformance()

      performance.startMeasure('test-operation')
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const duration = performance.endMeasure('test-operation')
      
      expect(duration).toBeGreaterThan(0)
    })
  })
})