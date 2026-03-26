/**
 * Property-Based Tests for Immutable Operations on Readonly Types
 * 
 * This test suite validates that immutable operations correctly handle readonly objects
 * without mutating originals and return new objects with correct updates applied.
 * 
 * Property 4: Immutable Operations for Readonly Types
 * **Validates: Requirements 4.1, 4.2**
 * 
 * For any readonly object update operation, the system should provide immutable alternatives 
 * that return new objects without modifying the original readonly properties.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

import {
  updateReadonlyObject,
  updateReadonlyArray,
  updateOrderStatus,
  updateOrderWithItems,
  updateMenuItemPrice,
  updateMenuItemAvailability,
  updateCategorySortOrder,
  updateModifierPrice,
  updateModifierGroupModifiers,
  updateOrderItemQuantity,
  updateOrderItemCustomizations
} from '../../app/types/utils/readonly'

import type { 
  MenuItemAPI, 
  CategoryAPI, 
  ModifierAPI, 
  ModifierGroupAPI 
} from '../../app/types/api/menu.api'
import type { 
  OrderAPI, 
  OrderItemAPI
} from '../../app/types/api/order.api'
import { OrderStatus } from '../../app/types/api/order.api'

// ============================================================================
// Fast-check Arbitraries for API Types
// ============================================================================

/**
 * Generate arbitrary MenuItemAPI with readonly properties
 */
const arbitraryMenuItemAPI = (): fc.Arbitrary<MenuItemAPI> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.oneof(
      fc.string({ minLength: 0, maxLength: 500 }),
      fc.constant(null)
    ),
    price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    imageUrl: fc.oneof(
      fc.webUrl(),
      fc.constant(null)
    ),
    categoryId: fc.oneof(
      fc.uuid(),
      fc.constant(null)
    ),
    menuId: fc.uuid(),
    isActive: fc.boolean(),
    createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
      .map(timestamp => new Date(timestamp).toISOString()),
    updatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
      .map(timestamp => new Date(timestamp).toISOString())
  })

/**
 * Generate arbitrary CategoryAPI with readonly properties
 */
const arbitraryCategoryAPI = (): fc.Arbitrary<CategoryAPI> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.oneof(
      fc.string({ minLength: 0, maxLength: 500 }),
      fc.constant(null)
    ),
    imageUrl: fc.oneof(
      fc.webUrl(),
      fc.constant(null)
    ),
    sortOrder: fc.integer({ min: 0, max: 1000 }),
    icon: fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.constant(null)
    )
  })

/**
 * Generate arbitrary ModifierAPI with readonly properties
 */
const arbitraryModifierAPI = (): fc.Arbitrary<ModifierAPI> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    priceAdjustment: fc.double({ min: -50, max: 100, noNaN: true }),
    isDefault: fc.boolean()
  })

/**
 * Generate arbitrary ModifierGroupAPI with readonly properties
 */
const arbitraryModifierGroupAPI = (): fc.Arbitrary<ModifierGroupAPI> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    required: fc.boolean(),
    minSelection: fc.integer({ min: 0, max: 5 }),
    maxSelection: fc.integer({ min: 1, max: 10 }),
    modifiers: fc.array(arbitraryModifierAPI(), { minLength: 1, maxLength: 10 })
  })

/**
 * Generate arbitrary OrderItemAPI with readonly properties
 */
const arbitraryOrderItemAPI = (): fc.Arbitrary<OrderItemAPI> =>
  fc.record({
    id: fc.uuid(),
    menuItemId: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 20 }),
    price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
    subtotal: fc.double({ min: 0.01, max: 20000, noNaN: true }),
    customizations: fc.oneof(
      fc.record({
        size: fc.constantFrom('small', 'medium', 'large'),
        spice: fc.constantFrom('mild', 'medium', 'hot'),
        notes: fc.option(fc.string({ maxLength: 200 }), { nil: undefined })
      }),
      fc.constant(null)
    )
  })

/**
 * Generate arbitrary OrderAPI with readonly properties
 */
const arbitraryOrderAPI = (): fc.Arbitrary<OrderAPI> =>
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
    total: fc.double({ min: 0.01, max: 50000, noNaN: true }),
    items: fc.array(arbitraryOrderItemAPI(), { minLength: 1, maxLength: 10 }),
    customerId: fc.uuid(),
    createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
      .map(timestamp => new Date(timestamp).toISOString()),
    updatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
      .map(timestamp => new Date(timestamp).toISOString()),
    estimatedTime: fc.oneof(
      fc.integer({ min: 5, max: 120 }),
      fc.constant(null)
    ),
    deliveryAddress: fc.oneof(
      fc.string({ minLength: 10, maxLength: 200 }),
      fc.constant(null)
    ),
    orderType: fc.constantFrom('delivery', 'pickup', 'dine-in')
  })

/**
 * Generate arbitrary OrderStatus values
 */
const arbitraryOrderStatus = (): fc.Arbitrary<OrderStatus> =>
  fc.constantFrom(
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED
  )

describe('Immutable Operations - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Property 4: Immutable Operations for Readonly Types
   * **Validates: Requirements 4.1, 4.2**
   * 
   * For any readonly object update operation, the system should provide immutable alternatives 
   * that return new objects without modifying the original readonly properties.
   */
  describe('Property 4: Immutable Operations for Readonly Types', () => {
    
    it('should never mutate original readonly objects during updates', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            price: fc.option(fc.double({ min: 0.01, max: 10000, noNaN: true }), { nil: undefined }),
            isActive: fc.option(fc.boolean(), { nil: undefined }),
            description: fc.option(
              fc.oneof(fc.string({ maxLength: 500 }), fc.constant(null)), 
              { nil: undefined }
            )
          }),
          (originalItem: MenuItemAPI, updates: Partial<MenuItemAPI>) => {
            // Create deep copy to verify original remains unchanged
            const originalCopy = JSON.parse(JSON.stringify(originalItem))
            
            // Perform immutable update
            const updatedItem = updateReadonlyObject(originalItem, updates)
            
            // Property: Original object should remain completely unchanged
            expect(originalItem).toEqual(originalCopy)
            
            // Property: Updated object should be a different reference
            expect(updatedItem).not.toBe(originalItem)
            
            // Property: Updated object should have applied changes
            Object.keys(updates).forEach(key => {
              if (updates[key as keyof MenuItemAPI] !== undefined) {
                expect(updatedItem[key as keyof MenuItemAPI]).toEqual(updates[key as keyof MenuItemAPI])
              }
            })
            
            // Property: Unchanged fields should remain the same
            Object.keys(originalItem).forEach(key => {
              if (updates[key as keyof MenuItemAPI] === undefined) {
                expect(updatedItem[key as keyof MenuItemAPI]).toEqual(originalItem[key as keyof MenuItemAPI])
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve object structure and types during immutable updates', () => {
      fc.assert(
        fc.property(
          arbitraryOrderAPI(),
          arbitraryOrderStatus(),
          (originalOrder: OrderAPI, newStatus: OrderStatus) => {
            // Perform immutable status update
            const updatedOrder = updateOrderStatus(originalOrder, newStatus)
            
            // Property: Original order should remain unchanged
            expect(originalOrder.status).not.toBe(newStatus)
            
            // Property: Updated order should have new status
            expect(updatedOrder.status).toBe(newStatus)
            
            // Property: All other fields should be preserved
            expect(updatedOrder.id).toBe(originalOrder.id)
            expect(updatedOrder.orderNumber).toBe(originalOrder.orderNumber)
            expect(updatedOrder.total).toBe(originalOrder.total)
            expect(updatedOrder.items).toBe(originalOrder.items) // Same reference for unchanged array
            expect(updatedOrder.customerId).toBe(originalOrder.customerId)
            expect(updatedOrder.createdAt).toBe(originalOrder.createdAt)
            
            // Property: updatedAt should be newer
            expect(new Date(updatedOrder.updatedAt).getTime()).toBeGreaterThanOrEqual(
              new Date(originalOrder.updatedAt).getTime()
            )
            
            // Property: Objects should have different references
            expect(updatedOrder).not.toBe(originalOrder)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle array updates immutably', () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryMenuItemAPI(), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          fc.double({ min: 0.01, max: 1000, noNaN: true }),
          (originalItems: MenuItemAPI[], updateIndex: number, newPrice: number) => {
            // Ensure index is within bounds
            const validIndex = updateIndex % originalItems.length
            
            // Create deep copy to verify original remains unchanged
            const originalCopy = JSON.parse(JSON.stringify(originalItems))
            
            // Perform immutable array update
            const updatedItems = updateReadonlyArray(
              originalItems, 
              validIndex, 
              { price: newPrice }
            )
            
            // Property: Original array should remain unchanged
            expect(originalItems).toEqual(originalCopy)
            
            // Property: Updated array should be different reference
            expect(updatedItems).not.toBe(originalItems)
            
            // Property: Array length should be preserved
            expect(updatedItems.length).toBe(originalItems.length)
            
            // Property: Updated item should have new price
            expect(updatedItems[validIndex].price).toBe(newPrice)
            
            // Property: Other items should remain unchanged (same references)
            updatedItems.forEach((item, index) => {
              if (index !== validIndex) {
                expect(item).toBe(originalItems[index])
              } else {
                expect(item).not.toBe(originalItems[index])
                // All other properties should be preserved
                expect(item.id).toBe(originalItems[index].id)
                expect(item.name).toBe(originalItems[index].name)
                expect(item.description).toBe(originalItems[index].description)
              }
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle specialized menu item updates correctly', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          fc.double({ min: 0.01, max: 1000, noNaN: true }),
          fc.boolean(),
          (originalItem: MenuItemAPI, newPrice: number, newAvailability: boolean) => {
            // Test price update
            const priceUpdated = updateMenuItemPrice(originalItem, newPrice)
            expect(priceUpdated.price).toBe(newPrice)
            expect(priceUpdated).not.toBe(originalItem)
            expect(priceUpdated.id).toBe(originalItem.id)
            expect(new Date(priceUpdated.updatedAt).getTime()).toBeGreaterThanOrEqual(
              new Date(originalItem.updatedAt).getTime()
            )
            
            // Test availability update
            const availabilityUpdated = updateMenuItemAvailability(originalItem, newAvailability)
            expect(availabilityUpdated.isActive).toBe(newAvailability)
            expect(availabilityUpdated).not.toBe(originalItem)
            expect(availabilityUpdated.id).toBe(originalItem.id)
            expect(new Date(availabilityUpdated.updatedAt).getTime()).toBeGreaterThanOrEqual(
              new Date(originalItem.updatedAt).getTime()
            )
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle order item updates with recalculation', () => {
      fc.assert(
        fc.property(
          arbitraryOrderItemAPI(),
          fc.integer({ min: 1, max: 20 }),
          (originalItem: OrderItemAPI, newQuantity: number) => {
            // Perform quantity update
            const updatedItem = updateOrderItemQuantity(originalItem, newQuantity)
            
            // Property: Original item should remain unchanged
            expect(originalItem.quantity).not.toBe(newQuantity)
            
            // Property: Updated item should have new quantity
            expect(updatedItem.quantity).toBe(newQuantity)
            
            // Property: Subtotal should be recalculated correctly
            const expectedSubtotal = originalItem.price * newQuantity
            expect(updatedItem.subtotal).toBe(expectedSubtotal)
            
            // Property: Other fields should be preserved
            expect(updatedItem.id).toBe(originalItem.id)
            expect(updatedItem.menuItemId).toBe(originalItem.menuItemId)
            expect(updatedItem.price).toBe(originalItem.price)
            expect(updatedItem.customizations).toBe(originalItem.customizations)
            
            // Property: Objects should have different references
            expect(updatedItem).not.toBe(originalItem)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle customization updates immutably', () => {
      fc.assert(
        fc.property(
          arbitraryOrderItemAPI(),
          fc.record({
            specialInstructions: fc.string({ maxLength: 100 }),
            extraSpicy: fc.boolean(),
            temperature: fc.constantFrom('hot', 'warm', 'cold')
          }),
          (originalItem: OrderItemAPI, newCustomizations: Record<string, any>) => {
            // Perform customization update
            const updatedItem = updateOrderItemCustomizations(originalItem, newCustomizations)
            
            // Property: Original item should remain unchanged
            expect(originalItem.customizations).not.toBe(updatedItem.customizations)
            
            // Property: New customizations should be merged
            Object.keys(newCustomizations).forEach(key => {
              expect(updatedItem.customizations?.[key]).toBe(newCustomizations[key])
            })
            
            // Property: Original customizations should be preserved if they exist
            if (originalItem.customizations) {
              Object.keys(originalItem.customizations).forEach(key => {
                if (!(key in newCustomizations)) {
                  expect(updatedItem.customizations?.[key]).toBe(originalItem.customizations?.[key])
                }
              })
            }
            
            // Property: Other fields should be preserved
            expect(updatedItem.id).toBe(originalItem.id)
            expect(updatedItem.quantity).toBe(originalItem.quantity)
            expect(updatedItem.price).toBe(originalItem.price)
            expect(updatedItem.subtotal).toBe(originalItem.subtotal)
            
            // Property: Objects should have different references
            expect(updatedItem).not.toBe(originalItem)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle category sort order updates', () => {
      fc.assert(
        fc.property(
          arbitraryCategoryAPI(),
          fc.integer({ min: 0, max: 1000 }),
          (originalCategory: CategoryAPI, newSortOrder: number) => {
            // Perform sort order update
            const updatedCategory = updateCategorySortOrder(originalCategory, newSortOrder)
            
            // Property: Original category should remain unchanged
            expect(originalCategory.sortOrder).not.toBe(newSortOrder)
            
            // Property: Updated category should have new sort order
            expect(updatedCategory.sortOrder).toBe(newSortOrder)
            
            // Property: All other fields should be preserved
            expect(updatedCategory.id).toBe(originalCategory.id)
            expect(updatedCategory.name).toBe(originalCategory.name)
            expect(updatedCategory.description).toBe(originalCategory.description)
            expect(updatedCategory.imageUrl).toBe(originalCategory.imageUrl)
            expect(updatedCategory.icon).toBe(originalCategory.icon)
            
            // Property: Objects should have different references
            expect(updatedCategory).not.toBe(originalCategory)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle modifier group updates with array replacement', () => {
      fc.assert(
        fc.property(
          arbitraryModifierGroupAPI(),
          fc.array(arbitraryModifierAPI(), { minLength: 1, maxLength: 5 }),
          (originalGroup: ModifierGroupAPI, newModifiers: ModifierAPI[]) => {
            // Perform modifiers update
            const updatedGroup = updateModifierGroupModifiers(originalGroup, newModifiers)
            
            // Property: Original group should remain unchanged
            expect(originalGroup.modifiers).not.toBe(updatedGroup.modifiers)
            
            // Property: Updated group should have new modifiers
            expect(updatedGroup.modifiers).toEqual(newModifiers)
            expect(updatedGroup.modifiers.length).toBe(newModifiers.length)
            
            // Property: All other fields should be preserved
            expect(updatedGroup.id).toBe(originalGroup.id)
            expect(updatedGroup.name).toBe(originalGroup.name)
            expect(updatedGroup.required).toBe(originalGroup.required)
            expect(updatedGroup.minSelection).toBe(originalGroup.minSelection)
            expect(updatedGroup.maxSelection).toBe(originalGroup.maxSelection)
            
            // Property: Objects should have different references
            expect(updatedGroup).not.toBe(originalGroup)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should handle order updates with item replacement and total recalculation', () => {
      fc.assert(
        fc.property(
          arbitraryOrderAPI(),
          fc.array(arbitraryOrderItemAPI(), { minLength: 1, maxLength: 5 }),
          (originalOrder: OrderAPI, newItems: OrderItemAPI[]) => {
            // Perform order items update
            const updatedOrder = updateOrderWithItems(originalOrder, newItems)
            
            // Property: Original order should remain unchanged
            expect(originalOrder.items).not.toBe(updatedOrder.items)
            expect(originalOrder.total).not.toBe(updatedOrder.total)
            
            // Property: Updated order should have new items
            expect(updatedOrder.items).toEqual(newItems)
            
            // Property: Total should be recalculated correctly
            const expectedTotal = newItems.reduce((sum, item) => sum + item.subtotal, 0)
            expect(updatedOrder.total).toBe(expectedTotal)
            
            // Property: updatedAt should be newer
            expect(new Date(updatedOrder.updatedAt).getTime()).toBeGreaterThanOrEqual(
              new Date(originalOrder.updatedAt).getTime()
            )
            
            // Property: All other fields should be preserved
            expect(updatedOrder.id).toBe(originalOrder.id)
            expect(updatedOrder.orderNumber).toBe(originalOrder.orderNumber)
            expect(updatedOrder.status).toBe(originalOrder.status)
            expect(updatedOrder.customerId).toBe(originalOrder.customerId)
            expect(updatedOrder.createdAt).toBe(originalOrder.createdAt)
            
            // Property: Objects should have different references
            expect(updatedOrder).not.toBe(originalOrder)
          }
        ),
        { numRuns: 30 }
      )
    })
  })
})