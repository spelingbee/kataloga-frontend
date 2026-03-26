/**
 * Standalone Property-Based Tests for Immutable Operations on Readonly Types
 * 
 * Property 4: Immutable Operations for Readonly Types
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Mock localStorage before any imports
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  },
  writable: true,
})

// Import the utilities
import {
  updateReadonlyObject,
  updateReadonlyArray
} from '../app/types/utils/readonly'

// Simple test types
interface TestItem {
  readonly id: string
  readonly name: string
  readonly price: number
  readonly isActive: boolean
}

// Simple arbitraries
const testItemArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
  isActive: fc.boolean()
})

describe('Immutable Operations - Standalone Tests', () => {
  /**
   * Property 4: Immutable Operations for Readonly Types
   * **Validates: Requirements 4.1, 4.2**
   */
  describe('Property 4: Core Immutable Operations', () => {
    
    it('should never mutate original readonly objects during updates', () => {
      fc.assert(
        fc.property(
          testItemArbitrary,
          fc.record({
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            price: fc.option(fc.double({ min: 0.01, max: 1000, noNaN: true }), { nil: undefined }),
            isActive: fc.option(fc.boolean(), { nil: undefined })
          }),
          (originalItem: TestItem, updates: Partial<TestItem>) => {
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
              if (updates[key as keyof TestItem] !== undefined) {
                expect(updatedItem[key as keyof TestItem]).toEqual(updates[key as keyof TestItem])
              }
            })
            
            // Property: Unchanged fields should remain the same
            Object.keys(originalItem).forEach(key => {
              if (updates[key as keyof TestItem] === undefined) {
                expect(updatedItem[key as keyof TestItem]).toEqual(originalItem[key as keyof TestItem])
              }
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle array updates immutably', () => {
      fc.assert(
        fc.property(
          fc.array(testItemArbitrary, { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          fc.double({ min: 0.01, max: 500, noNaN: true }),
          (originalItems: TestItem[], updateIndex: number, newPrice: number) => {
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
                expect(item.isActive).toBe(originalItems[index].isActive)
              }
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should preserve object structure and types during updates', () => {
      fc.assert(
        fc.property(
          testItemArbitrary,
          (originalItem: TestItem) => {
            // Test various update scenarios
            const priceUpdate = updateReadonlyObject(originalItem, { price: 99.99 })
            const nameUpdate = updateReadonlyObject(originalItem, { name: 'Updated Name' })
            const statusUpdate = updateReadonlyObject(originalItem, { isActive: !originalItem.isActive })
            
            // Property: All updates should preserve original structure
            expect(typeof priceUpdate.id).toBe('string')
            expect(typeof priceUpdate.name).toBe('string')
            expect(typeof priceUpdate.price).toBe('number')
            expect(typeof priceUpdate.isActive).toBe('boolean')
            
            expect(typeof nameUpdate.id).toBe('string')
            expect(typeof nameUpdate.name).toBe('string')
            expect(typeof nameUpdate.price).toBe('number')
            expect(typeof nameUpdate.isActive).toBe('boolean')
            
            expect(typeof statusUpdate.id).toBe('string')
            expect(typeof statusUpdate.name).toBe('string')
            expect(typeof statusUpdate.price).toBe('number')
            expect(typeof statusUpdate.isActive).toBe('boolean')
            
            // Property: Updates should be applied correctly
            expect(priceUpdate.price).toBe(99.99)
            expect(nameUpdate.name).toBe('Updated Name')
            expect(statusUpdate.isActive).toBe(!originalItem.isActive)
            
            // Property: Non-updated fields should remain the same
            expect(priceUpdate.id).toBe(originalItem.id)
            expect(priceUpdate.name).toBe(originalItem.name)
            expect(priceUpdate.isActive).toBe(originalItem.isActive)
            
            expect(nameUpdate.id).toBe(originalItem.id)
            expect(nameUpdate.price).toBe(originalItem.price)
            expect(nameUpdate.isActive).toBe(originalItem.isActive)
            
            expect(statusUpdate.id).toBe(originalItem.id)
            expect(statusUpdate.name).toBe(originalItem.name)
            expect(statusUpdate.price).toBe(originalItem.price)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle empty updates correctly', () => {
      fc.assert(
        fc.property(
          testItemArbitrary,
          (originalItem: TestItem) => {
            // Perform empty update
            const updatedItem = updateReadonlyObject(originalItem, {})
            
            // Property: Should return a new object with same values
            expect(updatedItem).not.toBe(originalItem)
            expect(updatedItem).toEqual(originalItem)
            
            // Property: All fields should be identical
            expect(updatedItem.id).toBe(originalItem.id)
            expect(updatedItem.name).toBe(originalItem.name)
            expect(updatedItem.price).toBe(originalItem.price)
            expect(updatedItem.isActive).toBe(originalItem.isActive)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should handle multiple field updates correctly', () => {
      fc.assert(
        fc.property(
          testItemArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.double({ min: 0.01, max: 1000, noNaN: true }),
          fc.boolean(),
          (originalItem: TestItem, newName: string, newPrice: number, newStatus: boolean) => {
            // Perform multiple field update
            const updatedItem = updateReadonlyObject(originalItem, {
              name: newName,
              price: newPrice,
              isActive: newStatus
            })
            
            // Property: Original should remain unchanged
            expect(originalItem.name).not.toBe(newName)
            expect(originalItem.price).not.toBe(newPrice)
            expect(originalItem.isActive).not.toBe(newStatus)
            
            // Property: Updated item should have all new values
            expect(updatedItem.name).toBe(newName)
            expect(updatedItem.price).toBe(newPrice)
            expect(updatedItem.isActive).toBe(newStatus)
            
            // Property: ID should remain unchanged
            expect(updatedItem.id).toBe(originalItem.id)
            
            // Property: Should be different reference
            expect(updatedItem).not.toBe(originalItem)
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})