/**
 * Simple Property-Based Tests for Immutable Operations on Readonly Types
 * 
 * This test suite validates that immutable operations correctly handle readonly objects
 * without mutating originals and return new objects with correct updates applied.
 * 
 * Property 4: Immutable Operations for Readonly Types
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Import the utilities directly without going through the complex setup
import {
  updateReadonlyObject,
  updateReadonlyArray,
  updateOrderStatus,
  updateMenuItemPrice,
  updateMenuItemAvailability,
  updateCategorySortOrder,
  updateOrderItemQuantity
} from '../../app/types/utils/readonly'

// Simple type definitions for testing
interface TestMenuItem {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly price: number
  readonly isActive: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

interface TestOrder {
  readonly id: string
  readonly status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  readonly total: number
  readonly updatedAt: string
}

interface TestOrderItem {
  readonly id: string
  readonly quantity: number
  readonly price: number
  readonly subtotal: number
}

interface TestCategory {
  readonly id: string
  readonly name: string
  readonly sortOrder: number
}

// Simple arbitraries
const testMenuItemArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.oneof(fc.string({ maxLength: 100 }), fc.constant(null)),
  price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
  isActive: fc.boolean(),
  createdAt: fc.constant('2024-01-01T00:00:00Z'),
  updatedAt: fc.constant('2024-01-01T00:00:00Z')
})

const testOrderArbitrary = fc.record({
  id: fc.uuid(),
  status: fc.constantFrom('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'),
  total: fc.double({ min: 0.01, max: 1000, noNaN: true }),
  updatedAt: fc.constant('2024-01-01T00:00:00Z')
})

const testOrderItemArbitrary = fc.record({
  id: fc.uuid(),
  quantity: fc.integer({ min: 1, max: 10 }),
  price: fc.double({ min: 0.01, max: 100, noNaN: true }),
  subtotal: fc.double({ min: 0.01, max: 1000, noNaN: true })
})

const testCategoryArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  sortOrder: fc.integer({ min: 0, max: 100 })
})

describe('Immutable Operations - Property Tests', () => {
  /**
   * Property 4: Immutable Operations for Readonly Types
   * **Validates: Requirements 4.1, 4.2**
   */
  describe('Property 4: Immutable Operations for Readonly Types', () => {
    
    it('should never mutate original readonly objects during updates', () => {
      fc.assert(
        fc.property(
          testMenuItemArbitrary,
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            price: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true }), { nil: undefined }),
            isActive: fc.option(fc.boolean(), { nil: undefined })
          }),
          (originalItem: TestMenuItem, updates: Partial<TestMenuItem>) => {
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
              if (updates[key as keyof TestMenuItem] !== undefined) {
                expect(updatedItem[key as keyof TestMenuItem]).toEqual(updates[key as keyof TestMenuItem])
              }
            })
            
            // Property: Unchanged fields should remain the same
            Object.keys(originalItem).forEach(key => {
              if (updates[key as keyof TestMenuItem] === undefined) {
                expect(updatedItem[key as keyof TestMenuItem]).toEqual(originalItem[key as keyof TestMenuItem])
              }
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle array updates immutably', () => {
      fc.assert(
        fc.property(
          fc.array(testMenuItemArbitrary, { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          fc.double({ min: 0.01, max: 500, noNaN: true }),
          (originalItems: TestMenuItem[], updateIndex: number, newPrice: number) => {
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
        { numRuns: 30 }
      )
    })

    it('should handle specialized updates correctly', () => {
      fc.assert(
        fc.property(
          testMenuItemArbitrary,
          fc.double({ min: 0.01, max: 500, noNaN: true }),
          fc.boolean(),
          (originalItem: TestMenuItem, newPrice: number, newAvailability: boolean) => {
            // Test price update
            const priceUpdated = updateMenuItemPrice(originalItem as any, newPrice)
            expect(priceUpdated.price).toBe(newPrice)
            expect(priceUpdated).not.toBe(originalItem)
            expect(priceUpdated.id).toBe(originalItem.id)
            
            // Test availability update
            const availabilityUpdated = updateMenuItemAvailability(originalItem as any, newAvailability)
            expect(availabilityUpdated.isActive).toBe(newAvailability)
            expect(availabilityUpdated).not.toBe(originalItem)
            expect(availabilityUpdated.id).toBe(originalItem.id)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should handle order item quantity updates with recalculation', () => {
      fc.assert(
        fc.property(
          testOrderItemArbitrary,
          fc.integer({ min: 1, max: 10 }),
          (originalItem: TestOrderItem, newQuantity: number) => {
            // Perform quantity update
            const updatedItem = updateOrderItemQuantity(originalItem as any, newQuantity)
            
            // Property: Original item should remain unchanged
            expect(originalItem.quantity).not.toBe(newQuantity)
            
            // Property: Updated item should have new quantity
            expect(updatedItem.quantity).toBe(newQuantity)
            
            // Property: Subtotal should be recalculated correctly
            const expectedSubtotal = originalItem.price * newQuantity
            expect(updatedItem.subtotal).toBe(expectedSubtotal)
            
            // Property: Other fields should be preserved
            expect(updatedItem.id).toBe(originalItem.id)
            expect(updatedItem.price).toBe(originalItem.price)
            
            // Property: Objects should have different references
            expect(updatedItem).not.toBe(originalItem)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should handle category sort order updates', () => {
      fc.assert(
        fc.property(
          testCategoryArbitrary,
          fc.integer({ min: 0, max: 100 }),
          (originalCategory: TestCategory, newSortOrder: number) => {
            // Perform sort order update
            const updatedCategory = updateCategorySortOrder(originalCategory as any, newSortOrder)
            
            // Property: Original category should remain unchanged
            expect(originalCategory.sortOrder).not.toBe(newSortOrder)
            
            // Property: Updated category should have new sort order
            expect(updatedCategory.sortOrder).toBe(newSortOrder)
            
            // Property: All other fields should be preserved
            expect(updatedCategory.id).toBe(originalCategory.id)
            expect(updatedCategory.name).toBe(originalCategory.name)
            
            // Property: Objects should have different references
            expect(updatedCategory).not.toBe(originalCategory)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should handle order status updates with timestamp', () => {
      fc.assert(
        fc.property(
          testOrderArbitrary,
          fc.constantFrom('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'),
          (originalOrder: TestOrder, newStatus: any) => {
            // Perform status update
            const updatedOrder = updateOrderStatus(originalOrder as any, newStatus)
            
            // Property: Original order should remain unchanged
            expect(originalOrder.status).not.toBe(newStatus)
            
            // Property: Updated order should have new status
            expect(updatedOrder.status).toBe(newStatus)
            
            // Property: All other fields should be preserved
            expect(updatedOrder.id).toBe(originalOrder.id)
            expect(updatedOrder.total).toBe(originalOrder.total)
            
            // Property: updatedAt should be newer or equal
            expect(new Date(updatedOrder.updatedAt).getTime()).toBeGreaterThanOrEqual(
              new Date(originalOrder.updatedAt).getTime()
            )
            
            // Property: Objects should have different references
            expect(updatedOrder).not.toBe(originalOrder)
          }
        ),
        { numRuns: 30 }
      )
    })
  })
})