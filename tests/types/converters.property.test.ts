/**
 * Property-Based Tests for Type Converters
 * 
 * This test suite validates universal properties of converter functions using property-based testing.
 * These tests verify that converters maintain correctness across all possible inputs by testing
 * invariants and properties that should hold for any valid data.
 * 
 * **Validates: Requirements 3.1, 3.2**
 * 
 * The property tests verify:
 * 1. **Data Preservation**: Essential data is preserved during conversion (id, name, price, etc.)
 * 2. **Null/Undefined Conversion**: Proper null ↔ undefined conversion following Vue standards
 * 3. **Round-trip Properties**: For reversible conversions (API ↔ UI), data should survive round-trip conversion
 * 4. **Type Compatibility**: Converted types should be compatible with their target interfaces
 * 5. **Mass Conversion**: Array conversion utilities should preserve all individual conversions
 * 6. **Edge Cases**: Handle empty arrays, null values, missing optional fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

import { 
  menuItemAPIToUI, 
  menuItemUIToAPI, 
  categoryAPIToUI, 
  categoryUIToAPI,
  orderAPIToUI,
  orderItemAPIToUI,
  modifierAPIToUI,
  modifierUIToAPI,
  modifierGroupAPIToUI,
  modifierGroupUIToAPI,
  menuItemMockToAPI,
  categoryMockToAPI,
  orderMockToAPI,
  orderItemMockToAPI,
  convertArrayAPIToUI,
  convertArrayUIToAPI,
  convertArrayMockToAPI,
  nullToUndefined,
  undefinedToNull,
  convertNullsToUndefined,
  convertUndefinedsToNulls,
  calculateMenuItemBadges,
  calculateOrderTotals,
  createMenuItemUI
} from '~/types/utils/converters'
import type { MenuItemAPI, CategoryAPI, ModifierAPI, ModifierGroupAPI } from '~/types/api/menu.api'
import type { OrderAPI, OrderItemAPI, OrderStatus } from '~/types/api/order.api'
import type { MenuItemUI, CategoryUI, ModifierUI, ModifierGroupUI } from '~/types/ui/menu.ui'
import type { OrderUI, OrderItemUI, CustomerInfo } from '~/types/ui/order.ui'
import type { MenuItemMock, CategoryMock } from '~/types/mocks/menu.mock'
import type { OrderMock, OrderItemMock } from '~/types/mocks/order.mock'

// ============================================================================
// Fast-check Arbitraries for Property Testing
// ============================================================================

/**
 * Generate arbitrary MenuItemAPI with proper null handling
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
 * Generate arbitrary CategoryAPI with proper null handling
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
 * Generate arbitrary ModifierAPI
 */
const arbitraryModifierAPI = (): fc.Arbitrary<ModifierAPI> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    priceAdjustment: fc.double({ min: -10, max: 50, noNaN: true }),
    isDefault: fc.boolean()
  })

/**
 * Generate arbitrary ModifierGroupAPI with nested modifiers
 */
const arbitraryModifierGroupAPI = (): fc.Arbitrary<ModifierGroupAPI> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    required: fc.boolean(),
    minSelection: fc.integer({ min: 0, max: 5 }),
    maxSelection: fc.integer({ min: 1, max: 10 }),
    modifiers: fc.array(arbitraryModifierAPI(), { maxLength: 10 })
  })

/**
 * Generate arbitrary OrderItemAPI
 */
const arbitraryOrderItemAPI = (): fc.Arbitrary<OrderItemAPI> =>
  fc.record({
    id: fc.uuid(),
    menuItemId: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 10 }),
    price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
    subtotal: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    customizations: fc.oneof(
      fc.record({
        size: fc.constantFrom('small', 'medium', 'large'),
        spice: fc.constantFrom('mild', 'medium', 'hot'),
        extras: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 })
      }),
      fc.constant(null)
    )
  })

/**
 * Generate arbitrary OrderAPI
 */
const arbitraryOrderAPI = (): fc.Arbitrary<OrderAPI> =>
  fc.record({
    id: fc.uuid(),
    orderNumber: fc.string({ minLength: 5, maxLength: 20 }),
    status: fc.constantFrom('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') as fc.Arbitrary<OrderStatus>,
    total: fc.double({ min: 1, max: 10000, noNaN: true }),
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
 * Generate arbitrary CustomerInfo
 */
const arbitraryCustomerInfo = (): fc.Arbitrary<CustomerInfo> =>
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    phone: fc.string({ minLength: 10, maxLength: 15 }),
    email: fc.option(fc.emailAddress()),
    address: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
    notes: fc.option(fc.string({ minLength: 0, maxLength: 500 }))
  })

/**
 * Generate arbitrary MenuItemMock
 */
const arbitraryMenuItemMock = (): fc.Arbitrary<MenuItemMock> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.oneof(
      fc.string({ minLength: 0, maxLength: 500 }),
      fc.constant(null)
    )),
    price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    imageUrl: fc.option(fc.oneof(
      fc.webUrl(),
      fc.constant(null)
    )),
    categoryId: fc.option(fc.oneof(
      fc.uuid(),
      fc.constant(null)
    )),
    menuId: fc.option(fc.uuid()),
    isActive: fc.option(fc.boolean()),
    createdAt: fc.option(fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
      .map(timestamp => new Date(timestamp).toISOString())),
    updatedAt: fc.option(fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
      .map(timestamp => new Date(timestamp).toISOString()))
  })

/**
 * Generate arbitrary CategoryMock
 */
const arbitraryCategoryMock = (): fc.Arbitrary<CategoryMock> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.oneof(
      fc.string({ minLength: 0, maxLength: 500 }),
      fc.constant(null)
    )),
    imageUrl: fc.option(fc.oneof(
      fc.webUrl(),
      fc.constant(null)
    )),
    sortOrder: fc.option(fc.integer({ min: 0, max: 1000 })),
    icon: fc.option(fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.constant(null)
    ))
  })

/**
 * Generate arbitrary OrderMock
 */
const arbitraryOrderMock = (): fc.Arbitrary<OrderMock> =>
  fc.record({
    id: fc.uuid(),
    orderNumber: fc.string({ minLength: 5, maxLength: 20 }),
    status: fc.constantFrom('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') as fc.Arbitrary<OrderStatus>,
    total: fc.double({ min: 1, max: 10000, noNaN: true }),
    items: fc.array(fc.record({
      id: fc.uuid(),
      menuItemId: fc.uuid(),
      quantity: fc.integer({ min: 1, max: 10 }),
      price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
      subtotal: fc.double({ min: 0.01, max: 10000, noNaN: true }),
      customizations: fc.option(fc.record({
        size: fc.constantFrom('small', 'medium', 'large'),
        extras: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 })
      }))
    }), { minLength: 1, maxLength: 5 }),
    customerId: fc.uuid(),
    createdAt: fc.option(fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
      .map(timestamp => new Date(timestamp).toISOString())),
    updatedAt: fc.option(fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
      .map(timestamp => new Date(timestamp).toISOString())),
    estimatedTime: fc.option(fc.integer({ min: 5, max: 120 })),
    deliveryAddress: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
    orderType: fc.constantFrom('delivery', 'pickup', 'dine-in')
  })

describe('Converter Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Property 1: Data Preservation
   * **Validates: Requirements 3.1, 3.2**
   * 
   * Essential data is preserved during conversion (id, name, price, etc.)
   */
  describe('Property 1: Data Preservation', () => {
    
    it('should preserve essential MenuItemAPI data during conversion to UI', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          (apiItem: MenuItemAPI) => {
            const uiItem = menuItemAPIToUI(apiItem)
            
            // Essential fields must be preserved exactly
            expect(uiItem.id).toBe(apiItem.id)
            expect(uiItem.name).toBe(apiItem.name)
            expect(uiItem.price).toBe(apiItem.price)
            expect(uiItem.menuId).toBe(apiItem.menuId)
            expect(uiItem.isActive).toBe(apiItem.isActive)
            expect(uiItem.createdAt).toBe(apiItem.createdAt)
            expect(uiItem.updatedAt).toBe(apiItem.updatedAt)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve essential CategoryAPI data during conversion to UI', () => {
      fc.assert(
        fc.property(
          arbitraryCategoryAPI(),
          fc.integer({ min: 0, max: 1000 }),
          (apiCategory: CategoryAPI, itemCount: number) => {
            const uiCategory = categoryAPIToUI(apiCategory, itemCount)
            
            // Essential fields must be preserved exactly
            expect(uiCategory.id).toBe(apiCategory.id)
            expect(uiCategory.name).toBe(apiCategory.name)
            expect(uiCategory.sortOrder).toBe(apiCategory.sortOrder)
            expect(uiCategory.count).toBe(itemCount)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve essential OrderAPI data during conversion to UI', () => {
      fc.assert(
        fc.property(
          arbitraryOrderAPI(),
          arbitraryCustomerInfo(),
          (apiOrder: OrderAPI, customerInfo: CustomerInfo) => {
            const uiOrder = orderAPIToUI(apiOrder, customerInfo)
            
            // Essential fields must be preserved exactly
            expect(uiOrder.id).toBe(apiOrder.id)
            expect(uiOrder.orderNumber).toBe(apiOrder.orderNumber)
            expect(uiOrder.status).toBe(apiOrder.status)
            expect(uiOrder.total).toBe(apiOrder.total)
            expect(uiOrder.customerId).toBe(apiOrder.customerId)
            expect(uiOrder.createdAt).toBe(apiOrder.createdAt)
            expect(uiOrder.updatedAt).toBe(apiOrder.updatedAt)
            expect(uiOrder.estimatedTime).toBe(apiOrder.estimatedTime)
            expect(uiOrder.deliveryAddress).toBe(apiOrder.deliveryAddress)
            expect(uiOrder.orderType).toBe(apiOrder.orderType)
            
            // Items array length must be preserved
            expect(uiOrder.items).toHaveLength(apiOrder.items.length)
            
            // Customer info must be added
            expect(uiOrder.customerInfo).toEqual(customerInfo)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve essential ModifierAPI data during conversion to UI', () => {
      fc.assert(
        fc.property(
          arbitraryModifierAPI(),
          (apiModifier: ModifierAPI) => {
            const uiModifier = modifierAPIToUI(apiModifier)
            
            // All fields must be preserved exactly (pass-through conversion)
            expect(uiModifier.id).toBe(apiModifier.id)
            expect(uiModifier.name).toBe(apiModifier.name)
            expect(uiModifier.priceAdjustment).toBe(apiModifier.priceAdjustment)
            expect(uiModifier.isDefault).toBe(apiModifier.isDefault)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve essential ModifierGroupAPI data during conversion to UI', () => {
      fc.assert(
        fc.property(
          arbitraryModifierGroupAPI(),
          (apiGroup: ModifierGroupAPI) => {
            const uiGroup = modifierGroupAPIToUI(apiGroup)
            
            // Essential fields must be preserved exactly
            expect(uiGroup.id).toBe(apiGroup.id)
            expect(uiGroup.name).toBe(apiGroup.name)
            expect(uiGroup.required).toBe(apiGroup.required)
            expect(uiGroup.minSelection).toBe(apiGroup.minSelection)
            expect(uiGroup.maxSelection).toBe(apiGroup.maxSelection)
            
            // Modifiers array length must be preserved
            expect(uiGroup.modifiers).toHaveLength(apiGroup.modifiers.length)
            
            // Each modifier must be preserved
            uiGroup.modifiers.forEach((uiModifier, index) => {
              const apiModifier = apiGroup.modifiers[index]
              expect(uiModifier.id).toBe(apiModifier.id)
              expect(uiModifier.name).toBe(apiModifier.name)
              expect(uiModifier.priceAdjustment).toBe(apiModifier.priceAdjustment)
              expect(uiModifier.isDefault).toBe(apiModifier.isDefault)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 2: Null/Undefined Conversion
   * **Validates: Requirements 3.1, 3.2**
   * 
   * Proper null ↔ undefined conversion following Vue standards
   */
  describe('Property 2: Null/Undefined Conversion', () => {
    
    it('should convert null to undefined in MenuItemAPI to UI conversion', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          (apiItem: MenuItemAPI) => {
            const uiItem = menuItemAPIToUI(apiItem)
            
            // null values should become undefined for Vue compatibility
            if (apiItem.description === null) {
              expect(uiItem.description).toBeUndefined()
            } else {
              expect(uiItem.description).toBe(apiItem.description)
            }
            
            if (apiItem.imageUrl === null) {
              expect(uiItem.imageUrl).toBeUndefined()
            } else {
              expect(uiItem.imageUrl).toBe(apiItem.imageUrl)
            }
            
            if (apiItem.categoryId === null) {
              expect(uiItem.categoryId).toBeUndefined()
            } else {
              expect(uiItem.categoryId).toBe(apiItem.categoryId)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should convert undefined to null in MenuItemUI to API conversion', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          (originalApiItem: MenuItemAPI) => {
            // Convert API -> UI -> API to test round-trip null/undefined conversion
            const uiItem = menuItemAPIToUI(originalApiItem)
            const convertedApiItem = menuItemUIToAPI(uiItem)
            
            // undefined values should become null for API compatibility
            if (uiItem.description === undefined) {
              expect(convertedApiItem.description).toBeNull()
            } else {
              expect(convertedApiItem.description).toBe(uiItem.description)
            }
            
            if (uiItem.imageUrl === undefined) {
              expect(convertedApiItem.imageUrl).toBeNull()
            } else {
              expect(convertedApiItem.imageUrl).toBe(uiItem.imageUrl)
            }
            
            if (uiItem.categoryId === undefined) {
              expect(convertedApiItem.categoryId).toBeNull()
            } else {
              expect(convertedApiItem.categoryId).toBe(uiItem.categoryId)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle null/undefined conversion utilities correctly', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (value: any) => {
            // Test nullToUndefined
            const undefinedResult = nullToUndefined(value)
            if (value === null) {
              expect(undefinedResult).toBeUndefined()
            } else {
              expect(undefinedResult).toBe(value)
            }
            
            // Test undefinedToNull
            const nullResult = undefinedToNull(value)
            if (value === undefined) {
              expect(nullResult).toBeNull()
            } else {
              expect(nullResult).toBe(value)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should convert object null/undefined values correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            stringField: fc.oneof(fc.string(), fc.constant(null)),
            numberField: fc.oneof(fc.integer(), fc.constant(null)),
            booleanField: fc.boolean(),
            nullField: fc.constant(null)
          }),
          (objWithNulls: any) => {
            const objWithUndefined = convertNullsToUndefined(objWithNulls)
            
            // All null values should become undefined
            Object.keys(objWithNulls).forEach(key => {
              if (objWithNulls[key] === null) {
                expect(objWithUndefined[key]).toBeUndefined()
              } else {
                expect(objWithUndefined[key]).toBe(objWithNulls[key])
              }
            })
            
            // Test reverse conversion
            const backToNulls = convertUndefinedsToNulls(objWithUndefined)
            Object.keys(objWithUndefined).forEach(key => {
              if (objWithUndefined[key] === undefined) {
                expect(backToNulls[key]).toBeNull()
              } else {
                expect(backToNulls[key]).toBe(objWithUndefined[key])
              }
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 3: Round-trip Properties
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For reversible conversions (API ↔ UI), data should survive round-trip conversion
   */
  describe('Property 3: Round-trip Properties', () => {
    
    it('should preserve core data in MenuItemAPI -> UI -> API round-trip', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          (originalApiItem: MenuItemAPI) => {
            // Round-trip conversion: API -> UI -> API
            const uiItem = menuItemAPIToUI(originalApiItem)
            const convertedApiItem = menuItemUIToAPI(uiItem)
            
            // Core fields should survive round-trip exactly
            expect(convertedApiItem.id).toBe(originalApiItem.id)
            expect(convertedApiItem.name).toBe(originalApiItem.name)
            expect(convertedApiItem.price).toBe(originalApiItem.price)
            expect(convertedApiItem.menuId).toBe(originalApiItem.menuId)
            expect(convertedApiItem.isActive).toBe(originalApiItem.isActive)
            
            // Nullable fields should maintain their null state after round-trip
            expect(convertedApiItem.description).toBe(originalApiItem.description)
            expect(convertedApiItem.imageUrl).toBe(originalApiItem.imageUrl)
            expect(convertedApiItem.categoryId).toBe(originalApiItem.categoryId)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve core data in CategoryAPI -> UI -> API round-trip', () => {
      fc.assert(
        fc.property(
          arbitraryCategoryAPI(),
          fc.integer({ min: 0, max: 1000 }),
          (originalApiCategory: CategoryAPI, itemCount: number) => {
            // Round-trip conversion: API -> UI -> API
            const uiCategory = categoryAPIToUI(originalApiCategory, itemCount)
            const convertedApiCategory = categoryUIToAPI(uiCategory)
            
            // Core fields should survive round-trip exactly
            expect(convertedApiCategory.name).toBe(originalApiCategory.name)
            expect(convertedApiCategory.sortOrder).toBe(originalApiCategory.sortOrder)
            
            // Nullable fields should maintain their null state after round-trip
            expect(convertedApiCategory.description).toBe(originalApiCategory.description)
            expect(convertedApiCategory.imageUrl).toBe(originalApiCategory.imageUrl)
            expect(convertedApiCategory.icon).toBe(originalApiCategory.icon)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve data in ModifierAPI -> UI -> API round-trip', () => {
      fc.assert(
        fc.property(
          arbitraryModifierAPI(),
          (originalApiModifier: ModifierAPI) => {
            // Round-trip conversion: API -> UI -> API
            const uiModifier = modifierAPIToUI(originalApiModifier)
            const convertedApiModifier = modifierUIToAPI(uiModifier)
            
            // All fields should survive round-trip exactly (pass-through conversion)
            expect(convertedApiModifier.id).toBe(originalApiModifier.id)
            expect(convertedApiModifier.name).toBe(originalApiModifier.name)
            expect(convertedApiModifier.priceAdjustment).toBe(originalApiModifier.priceAdjustment)
            expect(convertedApiModifier.isDefault).toBe(originalApiModifier.isDefault)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve data in ModifierGroupAPI -> UI -> API round-trip', () => {
      fc.assert(
        fc.property(
          arbitraryModifierGroupAPI(),
          (originalApiGroup: ModifierGroupAPI) => {
            // Round-trip conversion: API -> UI -> API
            const uiGroup = modifierGroupAPIToUI(originalApiGroup)
            const convertedApiGroup = modifierGroupUIToAPI(uiGroup)
            
            // All fields should survive round-trip exactly
            expect(convertedApiGroup.id).toBe(originalApiGroup.id)
            expect(convertedApiGroup.name).toBe(originalApiGroup.name)
            expect(convertedApiGroup.required).toBe(originalApiGroup.required)
            expect(convertedApiGroup.minSelection).toBe(originalApiGroup.minSelection)
            expect(convertedApiGroup.maxSelection).toBe(originalApiGroup.maxSelection)
            
            // Modifiers should survive round-trip
            expect(convertedApiGroup.modifiers).toHaveLength(originalApiGroup.modifiers.length)
            convertedApiGroup.modifiers.forEach((convertedModifier, index) => {
              const originalModifier = originalApiGroup.modifiers[index]
              expect(convertedModifier.id).toBe(originalModifier.id)
              expect(convertedModifier.name).toBe(originalModifier.name)
              expect(convertedModifier.priceAdjustment).toBe(originalModifier.priceAdjustment)
              expect(convertedModifier.isDefault).toBe(originalModifier.isDefault)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 4: Type Compatibility
   * **Validates: Requirements 3.1, 3.2**
   * 
   * Converted types should be compatible with their target interfaces
   */
  describe('Property 4: Type Compatibility', () => {
    
    it('should produce valid MenuItemUI types from any MenuItemAPI', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          (apiItem: MenuItemAPI) => {
            const uiItem = menuItemAPIToUI(apiItem)
            
            // Type compatibility checks
            expect(typeof uiItem.id).toBe('string')
            expect(typeof uiItem.name).toBe('string')
            expect(typeof uiItem.price).toBe('number')
            expect(typeof uiItem.menuId).toBe('string')
            expect(typeof uiItem.isActive).toBe('boolean')
            expect(typeof uiItem.createdAt).toBe('string')
            expect(typeof uiItem.updatedAt).toBe('string')
            
            // Nullable fields should be string or undefined (not null)
            expect(uiItem.description === undefined || typeof uiItem.description === 'string').toBe(true)
            expect(uiItem.imageUrl === undefined || typeof uiItem.imageUrl === 'string').toBe(true)
            expect(uiItem.categoryId === undefined || typeof uiItem.categoryId === 'string').toBe(true)
            
            // UI-specific fields should have correct types
            expect(typeof uiItem.isAvailable).toBe('boolean')
            expect(typeof uiItem.stockQuantity).toBe('number')
            expect(uiItem.calories === null || typeof uiItem.calories === 'number').toBe(true)
            expect(uiItem.preparationTime === null || typeof uiItem.preparationTime === 'number').toBe(true)
            expect(uiItem.cookingTime === null || typeof uiItem.cookingTime === 'number').toBe(true)
            expect(Array.isArray(uiItem.ingredients)).toBe(true)
            expect(Array.isArray(uiItem.allergens)).toBe(true)
            expect(Array.isArray(uiItem.dietary)).toBe(true)
            expect(Array.isArray(uiItem.badges)).toBe(true)
            expect(Array.isArray(uiItem.modifierGroups)).toBe(true)
            expect(typeof uiItem.isNew).toBe('boolean')
            expect(typeof uiItem.isPopular).toBe('boolean')
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should produce valid OrderUI types from any OrderAPI', () => {
      fc.assert(
        fc.property(
          arbitraryOrderAPI(),
          arbitraryCustomerInfo(),
          (apiOrder: OrderAPI, customerInfo: CustomerInfo) => {
            const uiOrder = orderAPIToUI(apiOrder, customerInfo)
            
            // Type compatibility checks for core fields
            expect(typeof uiOrder.id).toBe('string')
            expect(typeof uiOrder.orderNumber).toBe('string')
            expect(typeof uiOrder.status).toBe('string')
            expect(typeof uiOrder.total).toBe('number')
            expect(typeof uiOrder.customerId).toBe('string')
            expect(typeof uiOrder.createdAt).toBe('string')
            expect(typeof uiOrder.updatedAt).toBe('string')
            expect(typeof uiOrder.orderType).toBe('string')
            
            // Computed fields should have correct types
            expect(typeof uiOrder.subtotal).toBe('number')
            expect(typeof uiOrder.deliveryFee).toBe('number')
            expect(typeof uiOrder.discount).toBe('number')
            expect(typeof uiOrder.tax).toBe('number')
            
            // UI-specific fields should have correct types
            expect(typeof uiOrder.customerInfo).toBe('object')
            expect(typeof uiOrder.customerInfo.name).toBe('string')
            expect(typeof uiOrder.customerInfo.phone).toBe('string')
            
            // Items array should contain valid OrderItemUI objects
            expect(Array.isArray(uiOrder.items)).toBe(true)
            uiOrder.items.forEach(item => {
              expect(typeof item.id).toBe('string')
              expect(typeof item.menuItemId).toBe('string')
              expect(typeof item.quantity).toBe('number')
              expect(typeof item.price).toBe('number')
              expect(typeof item.subtotal).toBe('number')
              expect(typeof item.menuItem).toBe('object')
              expect(Array.isArray(item.selectedModifiers)).toBe(true)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 5: Mass Conversion
   * **Validates: Requirements 3.1, 3.2**
   * 
   * Array conversion utilities should preserve all individual conversions
   */
  describe('Property 5: Mass Conversion', () => {
    
    it('should preserve array length and individual conversions for MenuItemAPI arrays', () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryMenuItemAPI(), { maxLength: 20 }),
          (apiItems: MenuItemAPI[]) => {
            const uiItems = convertArrayAPIToUI(apiItems, menuItemAPIToUI)
            
            // Array length should be preserved
            expect(uiItems).toHaveLength(apiItems.length)
            
            // Each individual conversion should be correct
            uiItems.forEach((uiItem, index) => {
              const apiItem = apiItems[index]
              expect(uiItem.id).toBe(apiItem.id)
              expect(uiItem.name).toBe(apiItem.name)
              expect(uiItem.price).toBe(apiItem.price)
              
              // Null/undefined conversion should be correct
              if (apiItem.description === null) {
                expect(uiItem.description).toBeUndefined()
              } else {
                expect(uiItem.description).toBe(apiItem.description)
              }
            })
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle empty arrays correctly', () => {
      fc.assert(
        fc.property(
          fc.constant([]),
          (emptyArray: any[]) => {
            const result = convertArrayAPIToUI(emptyArray, menuItemAPIToUI)
            expect(result).toHaveLength(0)
            expect(Array.isArray(result)).toBe(true)
            
            return true
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should preserve array conversion for mock to API conversion', () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryMenuItemMock(), { maxLength: 10 }),
          (mockItems: MenuItemMock[]) => {
            const apiItems = convertArrayMockToAPI(mockItems, menuItemMockToAPI)
            
            // Array length should be preserved
            expect(apiItems).toHaveLength(mockItems.length)
            
            // Each individual conversion should be correct
            apiItems.forEach((apiItem, index) => {
              const mockItem = mockItems[index]
              expect(apiItem.id).toBe(mockItem.id)
              expect(apiItem.name).toBe(mockItem.name)
              expect(apiItem.price).toBe(mockItem.price)
              
              // Required fields should be filled with defaults if not provided
              expect(typeof apiItem.menuId).toBe('string')
              expect(typeof apiItem.isActive).toBe('boolean')
              expect(typeof apiItem.createdAt).toBe('string')
              expect(typeof apiItem.updatedAt).toBe('string')
            })
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Property 6: Edge Cases
   * **Validates: Requirements 3.1, 3.2**
   * 
   * Handle empty arrays, null values, missing optional fields
   */
  describe('Property 6: Edge Cases', () => {
    
    it('should handle MenuItemMock with minimal data correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0.01, max: 1000, noNaN: true })
          }),
          (minimalMock: { id: string; name: string; price: number }) => {
            const apiItem = menuItemMockToAPI(minimalMock)
            
            // Required fields should be present
            expect(apiItem.id).toBe(minimalMock.id)
            expect(apiItem.name).toBe(minimalMock.name)
            expect(apiItem.price).toBe(minimalMock.price)
            
            // Optional fields should have defaults
            expect(apiItem.description).toBeNull()
            expect(apiItem.imageUrl).toBeNull()
            expect(apiItem.categoryId).toBeNull()
            expect(typeof apiItem.menuId).toBe('string')
            expect(typeof apiItem.isActive).toBe('boolean')
            expect(typeof apiItem.createdAt).toBe('string')
            expect(typeof apiItem.updatedAt).toBe('string')
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle createMenuItemUI with partial data correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 })),
            calories: fc.option(fc.integer({ min: 0, max: 5000 }))
          }),
          (partialData: any) => {
            const completeItem = createMenuItemUI(partialData)
            
            // Required fields should be preserved
            expect(completeItem.id).toBe(partialData.id)
            expect(completeItem.name).toBe(partialData.name)
            expect(completeItem.price).toBe(partialData.price)
            
            // Optional fields should use provided values or defaults
            // Note: createMenuItemUI converts null to undefined for Vue compatibility
            if (partialData.description !== undefined && partialData.description !== null) {
              expect(completeItem.description).toBe(partialData.description)
            } else {
              expect(completeItem.description).toBeUndefined()
            }
            
            if (partialData.calories !== undefined && partialData.calories !== null) {
              expect(completeItem.calories).toBe(partialData.calories)
            } else {
              expect(completeItem.calories).toBeNull()
            }
            
            // All required UI fields should be present with proper types
            expect(typeof completeItem.menuId).toBe('string')
            expect(typeof completeItem.isActive).toBe('boolean')
            expect(typeof completeItem.createdAt).toBe('string')
            expect(typeof completeItem.updatedAt).toBe('string')
            expect(typeof completeItem.isAvailable).toBe('boolean')
            expect(typeof completeItem.stockQuantity).toBe('number')
            expect(Array.isArray(completeItem.ingredients)).toBe(true)
            expect(Array.isArray(completeItem.allergens)).toBe(true)
            expect(Array.isArray(completeItem.dietary)).toBe(true)
            expect(Array.isArray(completeItem.badges)).toBe(true)
            expect(Array.isArray(completeItem.modifierGroups)).toBe(true)
            expect(typeof completeItem.isNew).toBe('boolean')
            expect(typeof completeItem.isPopular).toBe('boolean')
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle order calculations correctly for different order types', () => {
      fc.assert(
        fc.property(
          fc.array(arbitraryOrderItemAPI(), { minLength: 1, maxLength: 10 }),
          fc.constantFrom('delivery', 'pickup', 'dine-in'),
          fc.double({ min: 0.05, max: 0.25, noNaN: true }),
          (items: OrderItemAPI[], orderType: 'delivery' | 'pickup' | 'dine-in', taxRate: number) => {
            const totals = calculateOrderTotals(items, orderType, taxRate)
            
            // Subtotal should equal sum of item subtotals
            const expectedSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
            expect(Math.abs(totals.subtotal - expectedSubtotal)).toBeLessThan(0.01)
            
            // Delivery fee should be correct based on order type
            if (orderType === 'delivery') {
              expect(totals.deliveryFee).toBe(5.00)
            } else {
              expect(totals.deliveryFee).toBe(0)
            }
            
            // Tax should be calculated correctly
            const expectedTax = totals.subtotal * taxRate
            expect(Math.abs(totals.tax - expectedTax)).toBeLessThan(0.01)
            
            // Total should be sum of all components
            const expectedTotal = totals.subtotal + totals.deliveryFee + totals.tax
            expect(Math.abs(totals.total - expectedTotal)).toBeLessThan(0.01)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle badge calculation for menu items correctly', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          (apiItem: MenuItemAPI) => {
            const badges = calculateMenuItemBadges(apiItem)
            
            // Badges should be an array
            expect(Array.isArray(badges)).toBe(true)
            
            // Each badge should have correct structure
            badges.forEach(badge => {
              expect(typeof badge.type).toBe('string')
              expect(['new', 'popular', 'spicy', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free'].includes(badge.type)).toBe(true)
            })
            
            // New badge logic should be consistent
            const createdDate = new Date(apiItem.createdAt)
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            const shouldHaveNewBadge = createdDate > weekAgo
            const hasNewBadge = badges.some(badge => badge.type === 'new')
            
            expect(hasNewBadge).toBe(shouldHaveNewBadge)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})