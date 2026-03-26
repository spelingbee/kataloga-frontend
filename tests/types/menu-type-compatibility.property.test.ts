/**
 * Property-Based Tests for Menu Type Compatibility
 * 
 * This test suite validates that menu type conversions between MenuItem and MenuItemUI 
 * are compatible and handle null/undefined correctly.
 * 
 * Property 3: Menu Type Compatibility
 * **Validates: Requirements 3.1, 3.2**
 * 
 * For any conversion between MenuItem and MenuItemUI types, the system should ensure 
 * type compatibility and provide consistent type definitions across all menu-related properties.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

import { 
  menuItemAPIToUI, 
  menuItemUIToAPI, 
  categoryAPIToUI, 
  categoryUIToAPI,
  createMenuItemUI 
} from '~/types/utils/converters'
import type { MenuItemAPI, CategoryAPI } from '~/types/api/menu.api'
import type { MenuItemUI, CategoryUI } from '~/types/ui/menu.ui'

// ============================================================================
// Fast-check Arbitraries for Menu Types
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
 * Generate arbitrary MenuItemUI with proper undefined handling
 */
const arbitraryMenuItemUI = (): fc.Arbitrary<MenuItemUI> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.oneof(
      fc.string({ minLength: 0, maxLength: 500 }),
      fc.constant(undefined)
    ),
    price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    imageUrl: fc.oneof(
      fc.webUrl(),
      fc.constant(undefined)
    ),
    categoryId: fc.oneof(
      fc.uuid(),
      fc.constant(undefined)
    ),
    menuId: fc.uuid(),
    isActive: fc.boolean(),
    createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
      .map(timestamp => new Date(timestamp).toISOString()),
    updatedAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
      .map(timestamp => new Date(timestamp).toISOString()),
    // UI-specific fields
    isAvailable: fc.boolean(),
    stockQuantity: fc.integer({ min: 0, max: 1000 }),
    calories: fc.oneof(
      fc.integer({ min: 0, max: 5000 }),
      fc.constant(null)
    ),
    preparationTime: fc.oneof(
      fc.integer({ min: 1, max: 120 }),
      fc.constant(null)
    ),
    cookingTime: fc.oneof(
      fc.integer({ min: 1, max: 180 }),
      fc.constant(null)
    ),
    ingredients: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
    allergens: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 10 }),
    nutritionInfo: fc.oneof(
      fc.record({
        calories: fc.integer({ min: 0, max: 5000 }),
        protein: fc.integer({ min: 0, max: 200 }),
        carbs: fc.integer({ min: 0, max: 500 }),
        fat: fc.integer({ min: 0, max: 200 }),
        fiber: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        sugar: fc.option(fc.integer({ min: 0, max: 200 }), { nil: undefined })
      }),
      fc.constant(null)
    ),
    dietary: fc.array(
      fc.constantFrom('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'),
      { maxLength: 5 }
    ),
    badges: fc.array(
      fc.record({
        type: fc.constantFrom('new', 'popular', 'spicy', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free'),
        label: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined })
      }),
      { maxLength: 5 }
    ),
    modifierGroups: fc.array(
      fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        required: fc.boolean(),
        minSelection: fc.integer({ min: 0, max: 5 }),
        maxSelection: fc.integer({ min: 1, max: 10 }),
        modifiers: fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            priceAdjustment: fc.double({ min: -10, max: 50, noNaN: true }),
            isDefault: fc.boolean()
          }),
          { maxLength: 10 }
        )
      }),
      { maxLength: 5 }
    ),
    isNew: fc.boolean(),
    isPopular: fc.boolean(),
    category: fc.oneof(
      fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 1, maxLength: 100 }),
        description: fc.oneof(
          fc.string({ minLength: 0, maxLength: 500 }),
          fc.constant(undefined)
        ),
        imageUrl: fc.oneof(
          fc.webUrl(),
          fc.constant(undefined)
        ),
        sortOrder: fc.integer({ min: 0, max: 1000 }),
        icon: fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constant(undefined)
        ),
        count: fc.integer({ min: 0, max: 1000 })
      }),
      fc.constant(null)
    )
  })

/**
 * Generate arbitrary CategoryUI with proper undefined handling
 */
const arbitraryCategoryUI = (): fc.Arbitrary<CategoryUI> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.oneof(
      fc.string({ minLength: 0, maxLength: 500 }),
      fc.constant(undefined)
    ),
    imageUrl: fc.oneof(
      fc.webUrl(),
      fc.constant(undefined)
    ),
    sortOrder: fc.integer({ min: 0, max: 1000 }),
    icon: fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.constant(undefined)
    ),
    count: fc.integer({ min: 0, max: 1000 })
  })

describe('Menu Type Compatibility - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Property 3: Menu Type Compatibility
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For any conversion between MenuItem and MenuItemUI types, the system should ensure 
   * type compatibility and provide consistent type definitions across all menu-related properties.
   */
  describe('Property 3: Menu Type Compatibility', () => {
    
    it('should preserve essential data during MenuItemAPI to MenuItemUI conversion', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          (apiItem: MenuItemAPI) => {
            // Convert API item to UI item
            const uiItem = menuItemAPIToUI(apiItem)
            
            // Property: Essential API fields should be preserved exactly
            expect(uiItem.id).toBe(apiItem.id)
            expect(uiItem.name).toBe(apiItem.name)
            expect(uiItem.price).toBe(apiItem.price)
            expect(uiItem.menuId).toBe(apiItem.menuId)
            expect(uiItem.isActive).toBe(apiItem.isActive)
            expect(uiItem.createdAt).toBe(apiItem.createdAt)
            expect(uiItem.updatedAt).toBe(apiItem.updatedAt)
            
            // Property: null values should be converted to undefined for Vue compatibility
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
            
            // Property: UI-specific fields should be added with default values
            expect(typeof uiItem.isAvailable).toBe('boolean')
            expect(typeof uiItem.stockQuantity).toBe('number')
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

    it('should handle null/undefined conversion correctly in round-trip operations', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          (originalApiItem: MenuItemAPI) => {
            // Convert API -> UI -> API
            const uiItem = menuItemAPIToUI(originalApiItem)
            const convertedApiItem = menuItemUIToAPI(uiItem)
            
            // Property: Core fields should survive round-trip conversion
            expect(convertedApiItem.id).toBe(originalApiItem.id)
            expect(convertedApiItem.name).toBe(originalApiItem.name)
            expect(convertedApiItem.price).toBe(originalApiItem.price)
            expect(convertedApiItem.menuId).toBe(originalApiItem.menuId)
            expect(convertedApiItem.isActive).toBe(originalApiItem.isActive)
            
            // Property: null/undefined conversion should be consistent
            // API null -> UI undefined -> API null
            if (originalApiItem.description === null) {
              expect(convertedApiItem.description).toBeNull()
            } else {
              expect(convertedApiItem.description).toBe(originalApiItem.description)
            }
            
            if (originalApiItem.imageUrl === null) {
              expect(convertedApiItem.imageUrl).toBeNull()
            } else {
              expect(convertedApiItem.imageUrl).toBe(originalApiItem.imageUrl)
            }
            
            if (originalApiItem.categoryId === null) {
              expect(convertedApiItem.categoryId).toBeNull()
            } else {
              expect(convertedApiItem.categoryId).toBe(originalApiItem.categoryId)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain type compatibility across all nullable fields', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          (apiItem: MenuItemAPI) => {
            const uiItem = menuItemAPIToUI(apiItem)
            
            // Property: All nullable fields should have consistent type handling
            
            // description: string | null -> string | undefined
            if (apiItem.description === null) {
              expect(uiItem.description).toBeUndefined()
            } else {
              expect(typeof uiItem.description).toBe('string')
              expect(uiItem.description).toBe(apiItem.description)
            }
            
            // imageUrl: string | null -> string | undefined
            if (apiItem.imageUrl === null) {
              expect(uiItem.imageUrl).toBeUndefined()
            } else {
              expect(typeof uiItem.imageUrl).toBe('string')
              expect(uiItem.imageUrl).toBe(apiItem.imageUrl)
            }
            
            // categoryId: string | null -> string | undefined
            if (apiItem.categoryId === null) {
              expect(uiItem.categoryId).toBeUndefined()
            } else {
              expect(typeof uiItem.categoryId).toBe('string')
              expect(uiItem.categoryId).toBe(apiItem.categoryId)
            }
            
            // Property: Non-nullable fields should remain unchanged
            expect(typeof uiItem.id).toBe('string')
            expect(typeof uiItem.name).toBe('string')
            expect(typeof uiItem.price).toBe('number')
            expect(typeof uiItem.menuId).toBe('string')
            expect(typeof uiItem.isActive).toBe('boolean')
            expect(typeof uiItem.createdAt).toBe('string')
            expect(typeof uiItem.updatedAt).toBe('string')
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve category type compatibility during conversion', () => {
      fc.assert(
        fc.property(
          arbitraryCategoryAPI(),
          fc.integer({ min: 0, max: 1000 }),
          (apiCategory: CategoryAPI, itemCount: number) => {
            // Convert API category to UI category
            const uiCategory = categoryAPIToUI(apiCategory, itemCount)
            
            // Property: Essential fields should be preserved
            expect(uiCategory.id).toBe(apiCategory.id)
            expect(uiCategory.name).toBe(apiCategory.name)
            expect(uiCategory.sortOrder).toBe(apiCategory.sortOrder)
            expect(uiCategory.count).toBe(itemCount)
            
            // Property: null values should be converted to undefined
            if (apiCategory.description === null) {
              expect(uiCategory.description).toBeUndefined()
            } else {
              expect(uiCategory.description).toBe(apiCategory.description)
            }
            
            if (apiCategory.imageUrl === null) {
              expect(uiCategory.imageUrl).toBeUndefined()
            } else {
              expect(uiCategory.imageUrl).toBe(apiCategory.imageUrl)
            }
            
            if (apiCategory.icon === null) {
              expect(uiCategory.icon).toBeUndefined()
            } else {
              expect(uiCategory.icon).toBe(apiCategory.icon)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle category round-trip conversion correctly', () => {
      fc.assert(
        fc.property(
          arbitraryCategoryAPI(),
          fc.integer({ min: 0, max: 1000 }),
          (originalApiCategory: CategoryAPI, itemCount: number) => {
            // Convert API -> UI -> API
            const uiCategory = categoryAPIToUI(originalApiCategory, itemCount)
            const convertedApiCategory = categoryUIToAPI(uiCategory)
            
            // Property: Core fields should survive round-trip
            expect(convertedApiCategory.name).toBe(originalApiCategory.name)
            expect(convertedApiCategory.sortOrder).toBe(originalApiCategory.sortOrder)
            
            // Property: null/undefined conversion should be consistent
            if (originalApiCategory.description === null) {
              expect(convertedApiCategory.description).toBeNull()
            } else {
              expect(convertedApiCategory.description).toBe(originalApiCategory.description)
            }
            
            if (originalApiCategory.imageUrl === null) {
              expect(convertedApiCategory.imageUrl).toBeNull()
            } else {
              expect(convertedApiCategory.imageUrl).toBe(originalApiCategory.imageUrl)
            }
            
            if (originalApiCategory.icon === null) {
              expect(convertedApiCategory.icon).toBeNull()
            } else {
              expect(convertedApiCategory.icon).toBe(originalApiCategory.icon)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should create complete MenuItemUI objects with proper defaults', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            description: fc.option(fc.string({ minLength: 0, max: 500 }), { nil: undefined }),
            imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
            categoryId: fc.option(fc.uuid(), { nil: undefined }),
            menuId: fc.option(fc.uuid(), { nil: undefined }),
            isActive: fc.option(fc.boolean(), { nil: undefined }),
            calories: fc.option(fc.integer({ min: 0, max: 5000 }), { nil: undefined })
          }),
          (partialData: any) => {
            // Create complete MenuItemUI from partial data
            const completeItem = createMenuItemUI(partialData)
            
            // Property: Required fields should be preserved
            expect(completeItem.id).toBe(partialData.id)
            expect(completeItem.name).toBe(partialData.name)
            expect(completeItem.price).toBe(partialData.price)
            
            // Property: Optional fields should use provided values or defaults
            if (partialData.description !== undefined) {
              expect(completeItem.description).toBe(partialData.description)
            } else {
              expect(completeItem.description).toBeUndefined()
            }
            
            if (partialData.imageUrl !== undefined) {
              expect(completeItem.imageUrl).toBe(partialData.imageUrl)
            } else {
              expect(completeItem.imageUrl).toBeUndefined()
            }
            
            if (partialData.categoryId !== undefined) {
              expect(completeItem.categoryId).toBe(partialData.categoryId)
            } else {
              expect(completeItem.categoryId).toBeUndefined()
            }
            
            // Property: All required UI fields should be present with proper types
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

    it('should maintain consistent type definitions across all menu properties', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemUI(),
          (uiItem: MenuItemUI) => {
            // Property: All properties should have consistent types
            
            // Core API fields
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
            
            // UI-specific fields
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
            
            // Property: Arrays should contain elements of correct types
            uiItem.ingredients.forEach(ingredient => {
              expect(typeof ingredient).toBe('string')
            })
            
            uiItem.allergens.forEach(allergen => {
              expect(typeof allergen).toBe('string')
            })
            
            uiItem.dietary.forEach(diet => {
              expect(typeof diet).toBe('string')
            })
            
            uiItem.badges.forEach(badge => {
              expect(typeof badge.type).toBe('string')
              expect(badge.label === undefined || typeof badge.label === 'string').toBe(true)
            })
            
            uiItem.modifierGroups.forEach(group => {
              expect(typeof group.id).toBe('string')
              expect(typeof group.name).toBe('string')
              expect(typeof group.required).toBe('boolean')
              expect(typeof group.minSelection).toBe('number')
              expect(typeof group.maxSelection).toBe('number')
              expect(Array.isArray(group.modifiers)).toBe(true)
              
              group.modifiers.forEach(modifier => {
                expect(typeof modifier.id).toBe('string')
                expect(typeof modifier.name).toBe('string')
                expect(typeof modifier.priceAdjustment).toBe('number')
                expect(typeof modifier.isDefault).toBe('boolean')
              })
            })
            
            // Property: Category should be properly typed if present
            if (uiItem.category !== null) {
              expect(typeof uiItem.category.id).toBe('string')
              expect(typeof uiItem.category.name).toBe('string')
              expect(uiItem.category.description === undefined || typeof uiItem.category.description === 'string').toBe(true)
              expect(uiItem.category.imageUrl === undefined || typeof uiItem.category.imageUrl === 'string').toBe(true)
              expect(typeof uiItem.category.sortOrder).toBe('number')
              expect(uiItem.category.icon === undefined || typeof uiItem.category.icon === 'string').toBe(true)
              expect(typeof uiItem.category.count).toBe('number')
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle edge cases in null/undefined conversion', () => {
      fc.assert(
        fc.property(
          fc.record({
            // Test all possible null/undefined combinations
            description: fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
            imageUrl: fc.oneof(fc.webUrl(), fc.constant(null), fc.constant(undefined)),
            categoryId: fc.oneof(fc.uuid(), fc.constant(null), fc.constant(undefined))
          }),
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.double({ min: 0.01, max: 1000, noNaN: true }),
          (nullableFields: any, id: string, name: string, price: number) => {
            // Create API item with various null/undefined combinations
            const apiItem: MenuItemAPI = {
              id,
              name,
              description: nullableFields.description === undefined ? null : nullableFields.description,
              price,
              imageUrl: nullableFields.imageUrl === undefined ? null : nullableFields.imageUrl,
              categoryId: nullableFields.categoryId === undefined ? null : nullableFields.categoryId,
              menuId: fc.sample(fc.uuid(), 1)[0],
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            // Convert to UI
            const uiItem = menuItemAPIToUI(apiItem)
            
            // Property: null should always become undefined in UI types
            if (apiItem.description === null) {
              expect(uiItem.description).toBeUndefined()
            }
            if (apiItem.imageUrl === null) {
              expect(uiItem.imageUrl).toBeUndefined()
            }
            if (apiItem.categoryId === null) {
              expect(uiItem.categoryId).toBeUndefined()
            }
            
            // Convert back to API
            const backToApi = menuItemUIToAPI(uiItem)
            
            // Property: undefined should become null in API types
            if (uiItem.description === undefined) {
              expect(backToApi.description).toBeNull()
            }
            if (uiItem.imageUrl === undefined) {
              expect(backToApi.imageUrl).toBeNull()
            }
            if (uiItem.categoryId === undefined) {
              expect(backToApi.categoryId).toBeNull()
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should ensure type compatibility across different menu item states', () => {
      fc.assert(
        fc.property(
          arbitraryMenuItemAPI(),
          fc.boolean(), // isActive override
          fc.integer({ min: 0, max: 1000 }), // stock override
          (baseApiItem: MenuItemAPI, isActiveOverride: boolean, stockOverride: number) => {
            // Create variations of the same menu item
            const activeItem = { ...baseApiItem, isActive: true }
            const inactiveItem = { ...baseApiItem, isActive: false }
            const overriddenItem = { ...baseApiItem, isActive: isActiveOverride }
            
            // Convert all variations
            const activeUI = menuItemAPIToUI(activeItem)
            const inactiveUI = menuItemAPIToUI(inactiveItem)
            const overriddenUI = menuItemAPIToUI(overriddenItem)
            
            // Override stock for testing
            const stockVariation = { ...overriddenUI, stockQuantity: stockOverride }
            
            // Property: All variations should have consistent type structure
            const items = [activeUI, inactiveUI, overriddenUI, stockVariation]
            
            items.forEach(item => {
              // Core fields should maintain types
              expect(typeof item.id).toBe('string')
              expect(typeof item.name).toBe('string')
              expect(typeof item.price).toBe('number')
              expect(typeof item.isActive).toBe('boolean')
              expect(typeof item.isAvailable).toBe('boolean')
              expect(typeof item.stockQuantity).toBe('number')
              
              // Nullable fields should be consistent
              expect(item.description === undefined || typeof item.description === 'string').toBe(true)
              expect(item.imageUrl === undefined || typeof item.imageUrl === 'string').toBe(true)
              expect(item.categoryId === undefined || typeof item.categoryId === 'string').toBe(true)
            })
            
            // Property: Business logic should be consistent
            expect(activeUI.isActive).toBe(true)
            expect(inactiveUI.isActive).toBe(false)
            expect(overriddenUI.isActive).toBe(isActiveOverride)
            expect(stockVariation.stockQuantity).toBe(stockOverride)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})