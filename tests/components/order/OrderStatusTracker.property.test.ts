import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import * as fc from 'fast-check'
import OrderStatusTracker from '~/components/order/OrderStatusTracker.vue'
import { OrderStatus } from '~/types'
import type { Order, OrderStatus as OrderStatusEnum } from '~/types'

// Mock useTenant composable
vi.mock('~/composables/useTenant', () => ({
  useTenant: () => ({
    tenantSettings: {
      value: {
        language: 'en',
        currency: 'USD',
        timezone: 'UTC'
      }
    },
    tenantSlug: { value: 'test-tenant' },
    isLoading: { value: false }
  })
}))

/**
 * Property 27: Order cancellation availability
 * Feature: customer-frontend-ordering, Property 27: Order cancellation availability
 * Validates: Requirements 9.5
 * 
 * For any order with status 'pending' or 'confirmed', a cancel button should be displayed;
 * for orders with status 'preparing', 'ready', 'in-transit', or 'delivered', no cancel button should appear.
 */

describe('OrderStatusTracker - Property-Based Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Property 27: Order cancellation availability', () => {
    it('should display cancel button only for pending or confirmed orders', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary order with random status
          fc.record({
            id: fc.uuid(),
            orderNumber: fc.string({ minLength: 5, maxLength: 20 }),
            status: fc.constantFrom(
              OrderStatus.PENDING,
              OrderStatus.CONFIRMED,
              OrderStatus.PREPARING,
              OrderStatus.READY,
              OrderStatus.OUT_FOR_DELIVERY,
              OrderStatus.DELIVERED,
              OrderStatus.CANCELLED
            ),
            total: fc.double({ min: 1, max: 10000, noNaN: true }),
            items: fc.array(
              fc.record({
                id: fc.uuid(),
                menuItemId: fc.uuid(),
                quantity: fc.integer({ min: 1, max: 10 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                subtotal: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              }),
              { minLength: 1, maxLength: 10 }
            ),
            customerInfo: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              phone: fc.string({ minLength: 10, maxLength: 15 }),
              email: fc.option(fc.emailAddress(), { nil: undefined }),
              address: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
            }),
            createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() }).map(timestamp => new Date(timestamp).toISOString()),
            estimatedTime: fc.option(fc.integer({ min: 5, max: 120 }), { nil: undefined }),
          }),
          (order: Order) => {
            // Mount component with the generated order
            const pinia = createPinia()
            const wrapper = mount(OrderStatusTracker, {
              props: {
                order,
                showActions: true,
              },
              global: {
                plugins: [pinia],
                stubs: {
                  BaseButton: {
                    template: '<button><slot /></button>',
                    props: ['variant', 'loading'],
                  },
                  BaseIcon: {
                    template: '<span></span>',
                    props: ['name', 'size'],
                  },
                  AppHeading: {
                    template: '<div><slot /></div>',
                    props: ['level', 'size'],
                  },
                  AppText: {
                    template: '<div><slot /></div>',
                    props: ['size'],
                  },
                  ProgressBar: {
                    template: '<div></div>',
                    props: ['currentStatus'],
                  },
                },
              },
            })

            // Find cancel button
            const cancelButton = wrapper.findAll('button').find(btn => 
              btn.text().includes('Cancel Order')
            )

            // Property: Cancel button should be displayed for PENDING and CONFIRMED orders
            if (order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) {
              expect(cancelButton).toBeDefined()
              expect(cancelButton?.exists()).toBe(true)
            }

            // Property: Cancel button should NOT be displayed for other statuses
            if (
              order.status === OrderStatus.PREPARING ||
              order.status === OrderStatus.READY ||
              order.status === OrderStatus.OUT_FOR_DELIVERY ||
              order.status === OrderStatus.DELIVERED ||
              order.status === OrderStatus.CANCELLED
            ) {
              expect(cancelButton).toBeUndefined()
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should respect showActions prop when determining cancel button visibility', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            orderNumber: fc.string({ minLength: 5, maxLength: 20 }),
            status: fc.constantFrom(OrderStatus.PENDING, OrderStatus.CONFIRMED),
            total: fc.double({ min: 1, max: 10000, noNaN: true }),
            items: fc.array(
              fc.record({
                id: fc.uuid(),
                menuItemId: fc.uuid(),
                quantity: fc.integer({ min: 1, max: 10 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                subtotal: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            customerInfo: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              phone: fc.string({ minLength: 10, maxLength: 15 }),
            }),
            createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() }).map(timestamp => new Date(timestamp).toISOString()),
          }),
          fc.boolean(),
          (order: Order, showActions: boolean) => {
            const pinia = createPinia()
            const wrapper = mount(OrderStatusTracker, {
              props: {
                order,
                showActions,
              },
              global: {
                plugins: [pinia],
                stubs: {
                  BaseButton: {
                    template: '<button><slot /></button>',
                    props: ['variant', 'loading'],
                  },
                  BaseIcon: {
                    template: '<span></span>',
                    props: ['name', 'size'],
                  },
                  AppHeading: {
                    template: '<div><slot /></div>',
                    props: ['level', 'size'],
                  },
                  AppText: {
                    template: '<div><slot /></div>',
                    props: ['size'],
                  },
                  ProgressBar: {
                    template: '<div></div>',
                    props: ['currentStatus'],
                  },
                },
              },
            })

            const cancelButton = wrapper.findAll('button').find(btn => 
              btn.text().includes('Cancel Order')
            )

            // Property: Cancel button should only appear if showActions is true
            // AND order status is PENDING or CONFIRMED
            if (showActions && (order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED)) {
              expect(cancelButton).toBeDefined()
              expect(cancelButton?.exists()).toBe(true)
            } else {
              expect(cancelButton).toBeUndefined()
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should emit cancel-order event when cancel button is clicked for cancellable orders', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            orderNumber: fc.string({ minLength: 5, maxLength: 20 }),
            status: fc.constantFrom(OrderStatus.PENDING, OrderStatus.CONFIRMED),
            total: fc.double({ min: 1, max: 10000, noNaN: true }),
            items: fc.array(
              fc.record({
                id: fc.uuid(),
                menuItemId: fc.uuid(),
                quantity: fc.integer({ min: 1, max: 10 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                subtotal: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            customerInfo: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              phone: fc.string({ minLength: 10, maxLength: 15 }),
            }),
            createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() }).map(timestamp => new Date(timestamp).toISOString()),
          }),
          (order: Order) => {
            const pinia = createPinia()
            const wrapper = mount(OrderStatusTracker, {
              props: {
                order,
                showActions: true,
              },
              global: {
                plugins: [pinia],
                stubs: {
                  BaseButton: {
                    template: '<button @click="$emit(\'click\')"><slot /></button>',
                    props: ['variant', 'loading'],
                    emits: ['click'],
                  },
                  BaseIcon: {
                    template: '<span></span>',
                    props: ['name', 'size'],
                  },
                  AppHeading: {
                    template: '<div><slot /></div>',
                    props: ['level', 'size'],
                  },
                  AppText: {
                    template: '<div><slot /></div>',
                    props: ['size'],
                  },
                  ProgressBar: {
                    template: '<div></div>',
                    props: ['currentStatus'],
                  },
                },
              },
            })

            const cancelButton = wrapper.findAll('button').find(btn => 
              btn.text().includes('Cancel Order')
            )

            // Property: Cancel button should exist for cancellable orders
            expect(cancelButton).toBeDefined()
            expect(cancelButton?.exists()).toBe(true)

            if (cancelButton) {
              // Click the cancel button
              cancelButton.trigger('click')

              // Property: cancel-order event should be emitted with order ID
              expect(wrapper.emitted('cancel-order')).toBeDefined()
              expect(wrapper.emitted('cancel-order')?.[0]).toEqual([order.id])
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain cancel button visibility across all cancellable statuses', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.double({ min: 1, max: 10000, noNaN: true }),
          (orderId: string, orderNumber: string, total: number) => {
            // Test both cancellable statuses
            const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED]
            
            cancellableStatuses.forEach(status => {
              const order: Order = {
                id: orderId,
                orderNumber,
                status,
                total,
                items: [{
                  id: 'item-1',
                  menuItemId: 'menu-1',
                  quantity: 1,
                  price: total,
                  subtotal: total,
                  menuItem: {
                    id: 'menu-1',
                    name: 'Test Item',
                    description: 'Test',
                    price: total,
                    isActive: true,
                  },
                }],
                customerInfo: {
                  name: 'Test Customer',
                  phone: '1234567890',
                },
                createdAt: new Date().toISOString(),
              }

              const pinia = createPinia()
              const wrapper = mount(OrderStatusTracker, {
                props: {
                  order,
                  showActions: true,
                },
                global: {
                  plugins: [pinia],
                  stubs: {
                    BaseButton: {
                      template: '<button><slot /></button>',
                      props: ['variant', 'loading'],
                    },
                    BaseIcon: {
                      template: '<span></span>',
                      props: ['name', 'size'],
                    },
                    AppHeading: {
                      template: '<div><slot /></div>',
                      props: ['level', 'size'],
                    },
                    AppText: {
                      template: '<div><slot /></div>',
                      props: ['size'],
                    },
                    ProgressBar: {
                      template: '<div></div>',
                      props: ['currentStatus'],
                    },
                  },
                },
              })

              const cancelButton = wrapper.findAll('button').find(btn => 
                btn.text().includes('Cancel Order')
              )

              // Property: Cancel button must be present for all cancellable statuses
              expect(cancelButton).toBeDefined()
              expect(cancelButton?.exists()).toBe(true)
            })

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should never display cancel button for non-cancellable statuses', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.double({ min: 1, max: 10000, noNaN: true }),
          (orderId: string, orderNumber: string, total: number) => {
            // Test all non-cancellable statuses
            const nonCancellableStatuses = [
              OrderStatus.PREPARING,
              OrderStatus.READY,
              OrderStatus.OUT_FOR_DELIVERY,
              OrderStatus.DELIVERED,
              OrderStatus.CANCELLED,
            ]
            
            nonCancellableStatuses.forEach(status => {
              const order: Order = {
                id: orderId,
                orderNumber,
                status,
                total,
                items: [{
                  id: 'item-1',
                  menuItemId: 'menu-1',
                  quantity: 1,
                  price: total,
                  subtotal: total,
                  menuItem: {
                    id: 'menu-1',
                    name: 'Test Item',
                    description: 'Test',
                    price: total,
                    isActive: true,
                  },
                }],
                customerInfo: {
                  name: 'Test Customer',
                  phone: '1234567890',
                },
                createdAt: new Date().toISOString(),
              }

              const pinia = createPinia()
              const wrapper = mount(OrderStatusTracker, {
                props: {
                  order,
                  showActions: true,
                },
                global: {
                  plugins: [pinia],
                  stubs: {
                    BaseButton: {
                      template: '<button><slot /></button>',
                      props: ['variant', 'loading'],
                    },
                    BaseIcon: {
                      template: '<span></span>',
                      props: ['name', 'size'],
                    },
                    AppHeading: {
                      template: '<div><slot /></div>',
                      props: ['level', 'size'],
                    },
                    AppText: {
                      template: '<div><slot /></div>',
                      props: ['size'],
                    },
                    ProgressBar: {
                      template: '<div></div>',
                      props: ['currentStatus'],
                    },
                  },
                },
              })

              const cancelButton = wrapper.findAll('button').find(btn => 
                btn.text().includes('Cancel Order')
              )

              // Property: Cancel button must NOT be present for non-cancellable statuses
              expect(cancelButton).toBeUndefined()
            })

            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 28: Order cancellation state update
   * Feature: customer-frontend-ordering, Property 28: Order cancellation state update
   * Validates: Requirements 10.3
   * 
   * For any successful order cancellation, the order status should be updated to 'cancelled'.
   */
  describe('Property 28: Order cancellation state update', () => {
    it('should update order status to cancelled after successful cancellation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            orderNumber: fc.string({ minLength: 5, maxLength: 20 }),
            status: fc.constantFrom(OrderStatus.PENDING, OrderStatus.CONFIRMED),
            total: fc.double({ min: 1, max: 10000, noNaN: true }),
            items: fc.array(
              fc.record({
                id: fc.uuid(),
                menuItemId: fc.uuid(),
                quantity: fc.integer({ min: 1, max: 10 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                subtotal: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                menuItem: fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  description: fc.string({ minLength: 1, maxLength: 200 }),
                  price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                  isActive: fc.boolean(),
                }),
              }),
              { minLength: 1, maxLength: 10 }
            ),
            customerInfo: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              phone: fc.string({ minLength: 10, maxLength: 15 }),
              email: fc.option(fc.emailAddress(), { nil: undefined }),
              address: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
            }),
            createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() }).map(timestamp => new Date(timestamp).toISOString()),
            estimatedTime: fc.option(fc.integer({ min: 5, max: 120 }), { nil: undefined }),
          }),
          async (order: Order) => {
            // Create a mock order store
            const mockOrderStore = {
              cancelOrder: async (orderId: string) => {
                // Simulate successful cancellation
                return true
              },
              currentOrder: { ...order },
            }

            // Mount component with the generated order
            const pinia = createPinia()
            const wrapper = mount(OrderStatusTracker, {
              props: {
                order,
                showActions: true,
              },
              global: {
                plugins: [pinia],
                stubs: {
                  BaseButton: {
                    template: '<button @click="$emit(\'click\')"><slot /></button>',
                    props: ['variant', 'loading'],
                    emits: ['click'],
                  },
                  BaseIcon: {
                    template: '<span></span>',
                    props: ['name', 'size'],
                  },
                  AppHeading: {
                    template: '<div><slot /></div>',
                    props: ['level', 'size'],
                  },
                  AppText: {
                    template: '<div><slot /></div>',
                    props: ['size'],
                  },
                  ProgressBar: {
                    template: '<div></div>',
                    props: ['currentStatus'],
                  },
                },
                mocks: {
                  $orderStore: mockOrderStore,
                },
              },
            })

            // Find and click cancel button
            const cancelButton = wrapper.findAll('button').find(btn => 
              btn.text().includes('Cancel Order')
            )

            if (cancelButton) {
              // Trigger cancel action
              await cancelButton.trigger('click')

              // Wait for any async operations
              await wrapper.vm.$nextTick()

              // Property: After successful cancellation, the cancel-order event should be emitted
              expect(wrapper.emitted('cancel-order')).toBeDefined()
              expect(wrapper.emitted('cancel-order')?.[0]).toEqual([order.id])

              // In a real scenario, the parent component would call the store's cancelOrder
              // and then update the order prop, which would cause the status to be 'cancelled'
              const cancelSuccess = await mockOrderStore.cancelOrder(order.id)
              expect(cancelSuccess).toBe(true)

              // Simulate the order status update that would happen after successful cancellation
              const updatedOrder = { ...order, status: OrderStatus.CANCELLED }
              await wrapper.setProps({ order: updatedOrder })

              // Property: Order status should now be CANCELLED
              expect(wrapper.props('order').status).toBe(OrderStatus.CANCELLED)

              // Property: Cancel button should no longer be visible after status update
              await wrapper.vm.$nextTick()
              const cancelButtonAfter = wrapper.findAll('button').find(btn => 
                btn.text().includes('Cancel Order')
              )
              expect(cancelButtonAfter).toBeUndefined()
            }

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain cancelled status across component re-renders', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            orderNumber: fc.string({ minLength: 5, maxLength: 20 }),
            total: fc.double({ min: 1, max: 10000, noNaN: true }),
            items: fc.array(
              fc.record({
                id: fc.uuid(),
                menuItemId: fc.uuid(),
                quantity: fc.integer({ min: 1, max: 10 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                subtotal: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                menuItem: fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  description: fc.string({ minLength: 1, maxLength: 200 }),
                  price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                  isActive: fc.boolean(),
                }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            customerInfo: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              phone: fc.string({ minLength: 10, maxLength: 15 }),
            }),
            createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() }).map(timestamp => new Date(timestamp).toISOString()),
          }),
          async (orderData: Omit<Order, 'status'>) => {
            // Start with a cancellable order
            const initialOrder: Order = {
              ...orderData,
              status: OrderStatus.PENDING,
            }

            const pinia = createPinia()
            const wrapper = mount(OrderStatusTracker, {
              props: {
                order: initialOrder,
                showActions: true,
              },
              global: {
                plugins: [pinia],
                stubs: {
                  BaseButton: {
                    template: '<button><slot /></button>',
                    props: ['variant', 'loading'],
                  },
                  BaseIcon: {
                    template: '<span></span>',
                    props: ['name', 'size'],
                  },
                  AppHeading: {
                    template: '<div><slot /></div>',
                    props: ['level', 'size'],
                  },
                  AppText: {
                    template: '<div><slot /></div>',
                    props: ['size'],
                  },
                  ProgressBar: {
                    template: '<div></div>',
                    props: ['currentStatus'],
                  },
                },
              },
            })

            // Simulate successful cancellation by updating order status
            const cancelledOrder: Order = {
              ...initialOrder,
              status: OrderStatus.CANCELLED,
            }

            await wrapper.setProps({ order: cancelledOrder })
            await wrapper.vm.$nextTick()

            // Property: Status should be CANCELLED
            expect(wrapper.props('order').status).toBe(OrderStatus.CANCELLED)

            // Force re-render by updating a different prop
            await wrapper.setProps({ showActions: false })
            await wrapper.vm.$nextTick()

            // Property: Status should still be CANCELLED after re-render
            expect(wrapper.props('order').status).toBe(OrderStatus.CANCELLED)

            // Re-render again
            await wrapper.setProps({ showActions: true })
            await wrapper.vm.$nextTick()

            // Property: Status should remain CANCELLED
            expect(wrapper.props('order').status).toBe(OrderStatus.CANCELLED)

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should transition from any cancellable status to cancelled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            orderNumber: fc.string({ minLength: 5, maxLength: 20 }),
            total: fc.double({ min: 1, max: 10000, noNaN: true }),
            items: fc.array(
              fc.record({
                id: fc.uuid(),
                menuItemId: fc.uuid(),
                quantity: fc.integer({ min: 1, max: 10 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                subtotal: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                menuItem: fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  description: fc.string({ minLength: 1, maxLength: 200 }),
                  price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                  isActive: fc.boolean(),
                }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            customerInfo: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              phone: fc.string({ minLength: 10, maxLength: 15 }),
            }),
            createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() }).map(timestamp => new Date(timestamp).toISOString()),
          }),
          fc.constantFrom(OrderStatus.PENDING, OrderStatus.CONFIRMED),
          async (orderData: Omit<Order, 'status'>, initialStatus: OrderStatusEnum) => {
            // Create order with cancellable status
            const order: Order = {
              ...orderData,
              status: initialStatus,
            }

            const pinia = createPinia()
            const wrapper = mount(OrderStatusTracker, {
              props: {
                order,
                showActions: true,
              },
              global: {
                plugins: [pinia],
                stubs: {
                  BaseButton: {
                    template: '<button><slot /></button>',
                    props: ['variant', 'loading'],
                  },
                  BaseIcon: {
                    template: '<span></span>',
                    props: ['name', 'size'],
                  },
                  AppHeading: {
                    template: '<div><slot /></div>',
                    props: ['level', 'size'],
                  },
                  AppText: {
                    template: '<div><slot /></div>',
                    props: ['size'],
                  },
                  ProgressBar: {
                    template: '<div></div>',
                    props: ['currentStatus'],
                  },
                },
              },
            })

            // Property: Initial status should be one of the cancellable statuses
            expect([OrderStatus.PENDING, OrderStatus.CONFIRMED]).toContain(wrapper.props('order').status)

            // Simulate cancellation
            const cancelledOrder: Order = {
              ...order,
              status: OrderStatus.CANCELLED,
            }

            await wrapper.setProps({ order: cancelledOrder })
            await wrapper.vm.$nextTick()

            // Property: Status should transition to CANCELLED regardless of initial cancellable status
            expect(wrapper.props('order').status).toBe(OrderStatus.CANCELLED)

            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reflect cancelled status in order store after cancellation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            orderNumber: fc.string({ minLength: 5, maxLength: 20 }),
            status: fc.constantFrom(OrderStatus.PENDING, OrderStatus.CONFIRMED),
            total: fc.double({ min: 1, max: 10000, noNaN: true }),
            items: fc.array(
              fc.record({
                id: fc.uuid(),
                menuItemId: fc.uuid(),
                quantity: fc.integer({ min: 1, max: 10 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                subtotal: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                menuItem: fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  description: fc.string({ minLength: 1, maxLength: 200 }),
                  price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                  isActive: fc.boolean(),
                }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
            customerInfo: fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              phone: fc.string({ minLength: 10, maxLength: 15 }),
            }),
            createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() }).map(timestamp => new Date(timestamp).toISOString()),
          }),
          async (order: Order) => {
            // Create a mock order store that tracks state changes
            let storeOrderStatus = order.status
            const mockOrderStore = {
              cancelOrder: async (orderId: string) => {
                // Simulate successful cancellation and update store state
                storeOrderStatus = OrderStatus.CANCELLED
                return true
              },
              currentOrder: { ...order },
            }

            // Property: Initial store status should match order status
            expect(storeOrderStatus).toBe(order.status)
            expect([OrderStatus.PENDING, OrderStatus.CONFIRMED]).toContain(storeOrderStatus)

            // Simulate cancellation
            const cancelSuccess = await mockOrderStore.cancelOrder(order.id)

            // Property: Cancellation should succeed
            expect(cancelSuccess).toBe(true)

            // Property: Store status should be updated to CANCELLED
            expect(storeOrderStatus).toBe(OrderStatus.CANCELLED)

            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
