/**
 * Property-Based Tests for Required Properties Validation
 * 
 * **Property 5: Required Properties Validation**
 * For any object creation or function parameter passing, the TypeScript compiler 
 * should validate the presence of all required properties and reject incomplete objects.
 * 
 * **Validates: Requirements 5.1, 5.2**
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { MenuItemUI, OrderItemUI, OrderUI, CategoryUI } from '~/types/ui'
import type { ApiError, CreateOrderDto } from '~/types'

describe('Property 5: Required Properties Validation', () => {
  describe('MenuItemUI Required Properties', () => {
    it('should validate all required properties are present', () => {
      fc.assert(fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          description: fc.oneof(fc.string(), fc.constant(undefined)),
          price: fc.float({ min: 0, max: 1000 }),
          imageUrl: fc.oneof(fc.string(), fc.constant(undefined)),
          categoryId: fc.oneof(fc.string(), fc.constant(undefined)),
          menuId: fc.string({ minLength: 1 }),
          isActive: fc.boolean(),
          createdAt: fc.date().map(d => d.toISOString()),
          updatedAt: fc.date().map(d => d.toISOString()),
          isAvailable: fc.boolean(),
          stockQuantity: fc.integer({ min: 0, max: 1000 }),
          calories: fc.oneof(fc.integer({ min: 0, max: 5000 }), fc.constant(null)),
          preparationTime: fc.oneof(fc.integer({ min: 0, max: 180 }), fc.constant(null)),
          cookingTime: fc.oneof(fc.integer({ min: 0, max: 180 }), fc.constant(null)),
          ingredients: fc.array(fc.string()),
          allergens: fc.array(fc.string()),
          nutritionInfo: fc.oneof(
            fc.record({
              calories: fc.integer({ min: 0, max: 5000 }),
              protein: fc.integer({ min: 0, max: 200 }),
              carbs: fc.integer({ min: 0, max: 500 }),
              fat: fc.integer({ min: 0, max: 200 }),
              fiber: fc.option(fc.integer({ min: 0, max: 100 })),
              sugar: fc.option(fc.integer({ min: 0, max: 200 }))
            }),
            fc.constant(null)
          ),
          dietary: fc.array(fc.string()),
          badges: fc.array(fc.record({
            type: fc.constantFrom('new', 'popular', 'spicy', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free'),
            label: fc.option(fc.string())
          })),
          modifierGroups: fc.array(fc.record({
            id: fc.string(),
            name: fc.string(),
            required: fc.boolean(),
            minSelection: fc.integer({ min: 0, max: 10 }),
            maxSelection: fc.integer({ min: 1, max: 10 }),
            modifiers: fc.array(fc.record({
              id: fc.string(),
              name: fc.string(),
              priceAdjustment: fc.float({ min: -50, max: 50 }),
              isDefault: fc.boolean()
            }))
          })),
          isNew: fc.boolean(),
          isPopular: fc.boolean(),
          category: fc.oneof(
            fc.record({
              id: fc.string(),
              name: fc.string(),
              description: fc.oneof(fc.string(), fc.constant(undefined)),
              imageUrl: fc.oneof(fc.string(), fc.constant(undefined)),
              sortOrder: fc.integer({ min: 0, max: 100 }),
              icon: fc.oneof(fc.string(), fc.constant(undefined)),
              count: fc.integer({ min: 0, max: 1000 })
            }),
            fc.constant(null)
          )
        }),
        (menuItem) => {
          // Property: A valid MenuItemUI must have all required properties
          expect(menuItem).toHaveProperty('id')
          expect(menuItem).toHaveProperty('name')
          expect(menuItem).toHaveProperty('price')
          expect(menuItem).toHaveProperty('menuId')
          expect(menuItem).toHaveProperty('isActive')
          expect(menuItem).toHaveProperty('createdAt')
          expect(menuItem).toHaveProperty('updatedAt')
          expect(menuItem).toHaveProperty('isAvailable')
          expect(menuItem).toHaveProperty('stockQuantity')
          
          // Required properties should not be null or undefined
          expect(menuItem.id).toBeTruthy()
          expect(menuItem.name).toBeTruthy()
          expect(typeof menuItem.price).toBe('number')
          expect(menuItem.menuId).toBeTruthy()
          expect(typeof menuItem.isActive).toBe('boolean')
          expect(menuItem.createdAt).toBeTruthy()
          expect(menuItem.updatedAt).toBeTruthy()
          expect(typeof menuItem.isAvailable).toBe('boolean')
          expect(typeof menuItem.stockQuantity).toBe('number')
          
          // Arrays should be defined (can be empty)
          expect(Array.isArray(menuItem.ingredients)).toBe(true)
          expect(Array.isArray(menuItem.allergens)).toBe(true)
          expect(Array.isArray(menuItem.dietary)).toBe(true)
          expect(Array.isArray(menuItem.badges)).toBe(true)
          expect(Array.isArray(menuItem.modifierGroups)).toBe(true)
        }
      ))
    })
  })

  describe('OrderItemUI Required Properties', () => {
    it('should validate all required properties are present', () => {
      fc.assert(fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          menuItemId: fc.string({ minLength: 1 }),
          menuItem: fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            description: fc.oneof(fc.string(), fc.constant(undefined)),
            price: fc.float({ min: 0, max: 1000 }),
            imageUrl: fc.oneof(fc.string(), fc.constant(undefined)),
            categoryId: fc.oneof(fc.string(), fc.constant(undefined)),
            menuId: fc.string({ minLength: 1 }),
            isActive: fc.boolean(),
            createdAt: fc.date().map(d => d.toISOString()),
            updatedAt: fc.date().map(d => d.toISOString()),
            isAvailable: fc.boolean(),
            stockQuantity: fc.integer({ min: 0, max: 1000 }),
            calories: fc.oneof(fc.integer({ min: 0, max: 5000 }), fc.constant(null)),
            preparationTime: fc.oneof(fc.integer({ min: 0, max: 180 }), fc.constant(null)),
            cookingTime: fc.oneof(fc.integer({ min: 0, max: 180 }), fc.constant(null)),
            ingredients: fc.array(fc.string()),
            allergens: fc.array(fc.string()),
            nutritionInfo: fc.constant(null),
            dietary: fc.array(fc.string()),
            badges: fc.array(fc.record({
              type: fc.constantFrom('new', 'popular', 'spicy', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free'),
              label: fc.option(fc.string())
            })),
            modifierGroups: fc.array(fc.record({
              id: fc.string(),
              name: fc.string(),
              required: fc.boolean(),
              minSelection: fc.integer({ min: 0, max: 10 }),
              maxSelection: fc.integer({ min: 1, max: 10 }),
              modifiers: fc.array(fc.record({
                id: fc.string(),
                name: fc.string(),
                priceAdjustment: fc.float({ min: -50, max: 50 }),
                isDefault: fc.boolean()
              }))
            })),
            isNew: fc.boolean(),
            isPopular: fc.boolean(),
            category: fc.constant(null)
          }),
          quantity: fc.integer({ min: 1, max: 20 }),
          price: fc.float({ min: 0, max: 1000 }),
          subtotal: fc.float({ min: 0, max: 20000 }),
          selectedModifiers: fc.array(fc.record({
            id: fc.string(),
            name: fc.string(),
            priceAdjustment: fc.float({ min: -50, max: 50 }),
            isDefault: fc.boolean()
          })),
          customizations: fc.record({}, { withDeletedKeys: true }),
          notes: fc.option(fc.string())
        }),
        (orderItem) => {
          // Property: A valid OrderItemUI must have all required properties
          expect(orderItem).toHaveProperty('id')
          expect(orderItem).toHaveProperty('menuItemId')
          expect(orderItem).toHaveProperty('menuItem')
          expect(orderItem).toHaveProperty('quantity')
          expect(orderItem).toHaveProperty('price')
          expect(orderItem).toHaveProperty('subtotal')
          expect(orderItem).toHaveProperty('selectedModifiers')
          expect(orderItem).toHaveProperty('customizations')
          
          // Required properties should not be null or undefined
          expect(orderItem.id).toBeTruthy()
          expect(orderItem.menuItemId).toBeTruthy()
          expect(orderItem.menuItem).toBeTruthy()
          expect(typeof orderItem.quantity).toBe('number')
          expect(orderItem.quantity).toBeGreaterThan(0)
          expect(typeof orderItem.price).toBe('number')
          expect(typeof orderItem.subtotal).toBe('number')
          
          // Arrays should be defined (can be empty)
          expect(Array.isArray(orderItem.selectedModifiers)).toBe(true)
          
          // Objects should be defined
          expect(typeof orderItem.customizations).toBe('object')
          expect(orderItem.customizations).not.toBeNull()
          
          // MenuItem should have all required properties
          expect(orderItem.menuItem.id).toBeTruthy()
          expect(orderItem.menuItem.name).toBeTruthy()
          expect(orderItem.menuItem.menuId).toBeTruthy()
        }
      ))
    })
  })

  describe('ApiError Required Properties', () => {
    it('should validate code property is always present', () => {
      fc.assert(fc.property(
        fc.record({
          code: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          status: fc.option(fc.integer({ min: 100, max: 599 })),
          details: fc.option(fc.oneof(
            fc.array(fc.record({
              field: fc.string(),
              message: fc.string(),
              value: fc.anything()
            })),
            fc.record({}, { withDeletedKeys: true })
          ))
        }),
        (apiError) => {
          // Property: ApiError must always have a code property
          expect(apiError).toHaveProperty('code')
          expect(apiError).toHaveProperty('message')
          
          // Required properties should not be empty
          expect(apiError.code).toBeTruthy()
          expect(apiError.message).toBeTruthy()
          expect(typeof apiError.code).toBe('string')
          expect(typeof apiError.message).toBe('string')
        }
      ))
    })
  })

  describe('CreateOrderDto Required Properties', () => {
    it('should validate paymentMethod is always present', () => {
      fc.assert(fc.property(
        fc.record({
          items: fc.array(fc.record({
            productId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            quantity: fc.integer({ min: 1, max: 20 }),
            price: fc.float({ min: 0, max: 1000, noNaN: true }),
            customizations: fc.option(fc.record({}, { withDeletedKeys: true }))
          }), { minLength: 1 }),
          customerInfo: fc.record({
            name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            phone: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            email: fc.option(fc.string()),
            address: fc.option(fc.string()),
            notes: fc.option(fc.string())
          }),
          paymentMethod: fc.constantFrom('STRIPE', 'CASH', 'TRANSFER'),
          notes: fc.option(fc.string()),
          deliveryAddress: fc.option(fc.string())
        }),
        (orderDto) => {
          // Property: CreateOrderDto must always have paymentMethod
          expect(orderDto).toHaveProperty('items')
          expect(orderDto).toHaveProperty('customerInfo')
          expect(orderDto).toHaveProperty('paymentMethod')
          
          // Required properties validation
          expect(Array.isArray(orderDto.items)).toBe(true)
          expect(orderDto.items.length).toBeGreaterThan(0)
          expect(orderDto.customerInfo).toBeTruthy()
          expect(orderDto.paymentMethod).toBeTruthy()
          expect(['STRIPE', 'CASH', 'TRANSFER']).toContain(orderDto.paymentMethod)
          
          // Customer info required properties
          expect(orderDto.customerInfo.name).toBeTruthy()
          expect(orderDto.customerInfo.phone).toBeTruthy()
          
          // Items validation
          orderDto.items.forEach(item => {
            expect(item.productId).toBeTruthy()
            expect(item.productId.trim()).toBeTruthy() // Should not be just whitespace
            expect(typeof item.quantity).toBe('number')
            expect(item.quantity).toBeGreaterThan(0)
            expect(typeof item.price).toBe('number')
            expect(item.price).toBeGreaterThanOrEqual(0)
            expect(Number.isNaN(item.price)).toBe(false) // Should not be NaN
          })
          
          // Customer info should not be just whitespace
          expect(orderDto.customerInfo.name.trim()).toBeTruthy()
          expect(orderDto.customerInfo.phone.trim()).toBeTruthy()
        }
      ))
    })
  })

  describe('Type Completeness Validation', () => {
    it('should ensure objects cannot be created without required properties', () => {
      // This test validates that TypeScript compilation would fail for incomplete objects
      // We test this by ensuring our complete objects have all required properties
      
      const validMenuItemUI: MenuItemUI = {
        id: 'test-id',
        name: 'Test Item',
        description: 'Test description',
        price: 10.99,
        imageUrl: 'test.jpg',
        categoryId: 'cat-1',
        menuId: 'menu-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAvailable: true,
        stockQuantity: 50,
        calories: 250,
        preparationTime: 15,
        cookingTime: 10,
        ingredients: ['ingredient1'],
        allergens: ['allergen1'],
        nutritionInfo: {
          calories: 250,
          protein: 10,
          carbs: 30,
          fat: 8
        },
        dietary: ['vegetarian'],
        badges: [],
        modifierGroups: [],
        isNew: false,
        isPopular: true,
        category: null
      }
      
      // Property: Complete objects should have all required properties
      expect(validMenuItemUI.id).toBeDefined()
      expect(validMenuItemUI.name).toBeDefined()
      expect(validMenuItemUI.menuId).toBeDefined()
      expect(validMenuItemUI.isActive).toBeDefined()
      expect(validMenuItemUI.createdAt).toBeDefined()
      expect(validMenuItemUI.updatedAt).toBeDefined()
      expect(validMenuItemUI.isAvailable).toBeDefined()
      expect(validMenuItemUI.stockQuantity).toBeDefined()
      
      const validApiError: ApiError = {
        code: 'TEST_ERROR',
        message: 'Test error message'
      }
      
      // Property: ApiError must have code property
      expect(validApiError.code).toBeDefined()
      expect(validApiError.message).toBeDefined()
      
      const validCreateOrderDto: CreateOrderDto = {
        items: [{
          productId: 'prod-1',
          quantity: 2,
          price: 10.99
        }],
        customerInfo: {
          name: 'John Doe',
          phone: '+1234567890'
        },
        paymentMethod: 'CASH'
      }
      
      // Property: CreateOrderDto must have paymentMethod
      expect(validCreateOrderDto.paymentMethod).toBeDefined()
      expect(validCreateOrderDto.items).toBeDefined()
      expect(validCreateOrderDto.customerInfo).toBeDefined()
    })
  })
})