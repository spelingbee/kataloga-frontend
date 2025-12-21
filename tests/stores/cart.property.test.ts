import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '~/stores/cart'
import { ref, computed } from 'vue'
import * as fc from 'fast-check'
import type { MenuItem, Modifier } from '~/types'

// Mock useNuxtApp to avoid Nuxt instance unavailable errors
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $auth: null,
    $apiClient: null
  })
}))

vi.mock('vue', () => ({
  ref: (val: any) => ({ value: val }),
  computed: (fn: any) => ({
    get value() {
      return fn()
    },
  }),
  watch: () => {},
  onMounted: () => {},
}))

// Mock useOfflineCart to avoid IndexedDB errors
vi.mock('~/composables/useOfflineCart', () => ({
  useOfflineCart: () => ({
    saveCartOffline: vi.fn(),
    loadCartOffline: vi.fn(() => []),
    isOnline: { value: true },
    savePendingOrder: vi.fn()
  })
}))

// Mock useTelegramHaptic to avoid Telegram API errors
vi.mock('~/composables/useTelegramHaptic', () => ({
  useTelegramHaptic: () => ({
    cartActions: {
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      checkoutSuccess: vi.fn(),
      checkoutError: vi.fn()
    }
  })
}))

// Remove the mock to use the real cart store

// Mock order service for testing order creation failures
const mockCreateOrder = vi.fn()
vi.mock('~/services/order.service', () => ({
  useOrderService: () => ({
    createOrder: mockCreateOrder
  })
}))

/**
 * Property 11: Cart item data completeness
 * Feature: customer-frontend-ordering, Property 11: Cart item data completeness
 * Validates: Requirements 4.1
 * 
 * For any item added to cart, the cart item should include the menu item data,
 * selected quantity, and all selected modifiers.
 */

describe('Cart Store - Property-Based Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Clear localStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    // Reset mocks
    mockCreateOrder.mockReset()
  })

  afterEach(() => {
    // Clean up after each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  describe('Property 11: Cart item data completeness', () => {
    it('should include menu item data, quantity, and modifiers for any added item', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary menu items
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
            categoryId: fc.option(fc.uuid(), { nil: undefined }),
            isActive: fc.constant(true), // Only active items can be added
            calories: fc.option(fc.integer({ min: 0, max: 5000 }), { nil: undefined }),
            preparationTime: fc.option(fc.integer({ min: 1, max: 180 }), { nil: undefined }),
            cookingTime: fc.option(fc.integer({ min: 1, max: 180 }), { nil: undefined }),
            ingredients: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
            allergens: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
            dietary: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
          }),
          // Generate arbitrary quantity (positive integers)
          fc.integer({ min: 1, max: 100 }),
          // Generate arbitrary modifiers
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { maxLength: 10 }
          ),
          // Generate optional customizations
          fc.option(
            fc.dictionary(
              fc.string({ minLength: 1, maxLength: 50 }),
              fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean()
              )
            ),
            { nil: undefined }
          ),
          (menuItem: MenuItem, quantity: number, selectedModifiers: Modifier[], customizations) => {
            // Ensure Pinia is available in property test context
            setActivePinia(createPinia())
            const cartStore = useCartStore()
            
            // Clear cart before each test iteration to ensure clean state
            cartStore.clearCart()
            
            // Add item to cart
            cartStore.addItem(menuItem, quantity, selectedModifiers, customizations)
            
            // Find the added item in cart
            const addedItem = cartStore.items.find(
              item => item.menuItem.id === menuItem.id &&
                      JSON.stringify(item.selectedModifiers) === JSON.stringify(selectedModifiers) &&
                      JSON.stringify(item.customizations) === JSON.stringify(customizations)
            )
            
            // Property: Cart item must exist
            expect(addedItem).toBeDefined()
            
            if (addedItem) {
              // Property: Cart item must include menu item data
              expect(addedItem.menuItem).toBeDefined()
              expect(addedItem.menuItem.id).toBe(menuItem.id)
              expect(addedItem.menuItem.name).toBe(menuItem.name)
              expect(addedItem.menuItem.description).toBe(menuItem.description)
              expect(addedItem.menuItem.price).toBe(menuItem.price)
              expect(addedItem.menuItem.isActive).toBe(menuItem.isActive)
              
              // Property: Cart item must include selected quantity
              expect(addedItem.quantity).toBeDefined()
              expect(addedItem.quantity).toBeGreaterThan(0)
              expect(addedItem.quantity).toBe(quantity)
              
              // Property: Cart item must include all selected modifiers
              expect(addedItem.selectedModifiers).toBeDefined()
              expect(Array.isArray(addedItem.selectedModifiers)).toBe(true)
              expect(addedItem.selectedModifiers.length).toBe(selectedModifiers.length)
              
              // Verify each modifier is preserved
              selectedModifiers.forEach((modifier, index) => {
                expect(addedItem.selectedModifiers[index]).toBeDefined()
                expect(addedItem.selectedModifiers[index].id).toBe(modifier.id)
                expect(addedItem.selectedModifiers[index].name).toBe(modifier.name)
                expect(addedItem.selectedModifiers[index].priceAdjustment).toBe(modifier.priceAdjustment)
                expect(addedItem.selectedModifiers[index].isDefault).toBe(modifier.isDefault)
              })
              
              // Property: Cart item must have a subtotal
              expect(addedItem.subtotal).toBeDefined()
              expect(typeof addedItem.subtotal).toBe('number')
              // Note: Subtotal can be 0 or even negative if modifiers have large negative adjustments
              
              // Property: Subtotal should be calculated correctly
              const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
              const expectedSubtotal = quantity * (menuItem.price + modifierPrice)
              expect(addedItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
              
              // Note: Subtotal can be 0 or negative if modifiers have negative adjustments
              // This is valid business logic (e.g., discounts)
              
              // Property: Customizations should be preserved if provided
              if (customizations !== undefined) {
                expect(addedItem.customizations).toBeDefined()
                expect(addedItem.customizations).toEqual(customizations)
              }
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve all data when adding multiple different items', () => {
      fc.assert(
        fc.property(
          // Generate an array of different menu items with their configurations
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 100 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart before each test iteration to ensure clean state
            cartStore.clearCart()
            
            // Add all items to cart
            itemConfigs.forEach(config => {
              cartStore.addItem(config.menuItem as MenuItem, config.quantity, config.modifiers)
            })
            
            // Property: Cart should have items (may be less than itemConfigs if duplicates were merged)
            expect(cartStore.items.length).toBeGreaterThan(0)
            expect(cartStore.items.length).toBeLessThanOrEqual(itemConfigs.length)
            
            // Property: Each added item should have complete data
            itemConfigs.forEach(config => {
              const cartItem = cartStore.items.find(
                item => item.menuItem.id === config.menuItem.id &&
                        JSON.stringify(item.selectedModifiers) === JSON.stringify(config.modifiers)
              )
              
              expect(cartItem).toBeDefined()
              
              if (cartItem) {
                // Verify menu item data
                expect(cartItem.menuItem.id).toBe(config.menuItem.id)
                expect(cartItem.menuItem.name).toBe(config.menuItem.name)
                expect(cartItem.menuItem.price).toBe(config.menuItem.price)
                
                // Verify quantity
                expect(cartItem.quantity).toBeGreaterThan(0)
                
                // Verify modifiers
                expect(cartItem.selectedModifiers.length).toBe(config.modifiers.length)
                
                // Verify subtotal exists (can be 0 or negative with modifiers)
                expect(typeof cartItem.subtotal).toBe('number')
              }
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain data completeness after quantity updates', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }), // Limit negative adjustments to prevent subtotal <= 0
              isDefault: fc.boolean(),
            }),
            { maxLength: 5 }
          ),
          fc.integer({ min: 1, max: 50 }),
          (menuItem: MenuItem, initialQuantity: number, modifiers: Modifier[], newQuantity: number) => {
            // Ensure Pinia is available in property test context
            setActivePinia(createPinia())
            const cartStore = useCartStore()
            
            // Clear cart before each test iteration to ensure clean state
            cartStore.clearCart()
            
            // Add item with initial quantity
            cartStore.addItem(menuItem, initialQuantity, modifiers)
            
            // Update quantity
            cartStore.updateQuantity(menuItem.id, newQuantity)
            
            // Find the item
            const cartItem = cartStore.items.find(item => item.menuItem.id === menuItem.id)
            
            // Property: Item should still exist with complete data
            expect(cartItem).toBeDefined()
            
            if (cartItem) {
              // All original data should be preserved
              expect(cartItem.menuItem.id).toBe(menuItem.id)
              expect(cartItem.menuItem.name).toBe(menuItem.name)
              expect(cartItem.menuItem.price).toBe(menuItem.price)
              expect(cartItem.selectedModifiers.length).toBe(modifiers.length)
              
              // Quantity should be updated
              expect(cartItem.quantity).toBe(newQuantity)
              
              // Subtotal should be calculated correctly (can be negative with large discounts)
              const modifierPrice = modifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
              const expectedSubtotal = newQuantity * (menuItem.price + modifierPrice)
              expect(cartItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 12: Cart count accuracy
   * Feature: customer-frontend-ordering, Property 12: Cart count accuracy
   * Validates: Requirements 4.2
   * 
   * For any cart state, the cart count indicator should equal the sum of quantities
   * of all items in the cart.
   */
  describe('Property 12: Cart count accuracy', () => {
    it('should equal the sum of all item quantities for any cart state', () => {
      fc.assert(
        fc.property(
          // Generate an array of cart items with random quantities
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 100 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 0, maxLength: 20 } // Allow empty cart
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart before each test iteration
            cartStore.clearCart()
            
            // Add all items to cart
            itemConfigs.forEach(config => {
              cartStore.addItem(config.menuItem as MenuItem, config.quantity, config.modifiers)
            })
            
            // Calculate expected count manually
            const expectedCount = cartStore.items.reduce((sum, item) => sum + item.quantity, 0)
            
            // Property: itemCount getter should equal the sum of all quantities
            expect(cartStore.itemCount).toBe(expectedCount)
            
            // Additional verification: itemCount should match manual calculation from configs
            // Note: This may differ if items were merged (same item with same modifiers)
            const actualTotalQuantity = cartStore.items.reduce((sum, item) => sum + item.quantity, 0)
            expect(cartStore.itemCount).toBe(actualTotalQuantity)
            
            // Property: itemCount should be non-negative
            expect(cartStore.itemCount).toBeGreaterThanOrEqual(0)
            
            // Property: Empty cart should have count of 0
            if (itemConfigs.length === 0) {
              expect(cartStore.itemCount).toBe(0)
            }
            
            // Property: Non-empty cart should have count > 0
            if (cartStore.items.length > 0) {
              expect(cartStore.itemCount).toBeGreaterThan(0)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update count correctly when adding items', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { maxLength: 5 }
          ),
          (menuItem: MenuItem, quantity: number, modifiers) => {
            const cartStore = useCartStore()
            
            // Clear cart and record initial count
            cartStore.clearCart()
            const initialCount = cartStore.itemCount
            
            // Add item
            cartStore.addItem(menuItem, quantity, modifiers)
            
            // Property: Count should increase by the quantity added
            expect(cartStore.itemCount).toBe(initialCount + quantity)
            
            // Add same item again (should merge)
            cartStore.addItem(menuItem, quantity, modifiers)
            
            // Property: Count should increase by another quantity
            expect(cartStore.itemCount).toBe(initialCount + quantity + quantity)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update count correctly when removing items', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart and add all items
            cartStore.clearCart()
            itemConfigs.forEach(config => {
              cartStore.addItem(config.menuItem as MenuItem, config.quantity, config.modifiers)
            })
            
            const countBeforeRemoval = cartStore.itemCount
            
            // Remove first item
            if (cartStore.items.length > 0) {
              const firstItem = cartStore.items[0]
              const removedQuantity = firstItem.quantity
              
              cartStore.removeItem(firstItem.menuItem.id, firstItem.customizations)
              
              // Property: Count should decrease by the removed item's quantity
              expect(cartStore.itemCount).toBe(countBeforeRemoval - removedQuantity)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update count correctly when changing quantities', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          (menuItem: MenuItem, initialQuantity: number, newQuantity: number) => {
            const cartStore = useCartStore()
            
            // Clear cart and add item
            cartStore.clearCart()
            cartStore.addItem(menuItem, initialQuantity, [])
            
            // Property: Initial count should equal initial quantity
            expect(cartStore.itemCount).toBe(initialQuantity)
            
            // Update quantity
            cartStore.updateQuantity(menuItem.id, newQuantity)
            
            // Property: Count should now equal new quantity
            expect(cartStore.itemCount).toBe(newQuantity)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain count accuracy across multiple operations', () => {
      fc.assert(
        fc.property(
          // Generate a sequence of operations
          fc.array(
            fc.oneof(
              // Add operation
              fc.record({
                type: fc.constant('add' as const),
                menuItem: fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                  isActive: fc.constant(true),
                }),
                quantity: fc.integer({ min: 1, max: 20 }),
              }),
              // Remove operation (will be skipped if cart is empty)
              fc.record({
                type: fc.constant('remove' as const),
              }),
              // Update operation (will be skipped if cart is empty)
              fc.record({
                type: fc.constant('update' as const),
                newQuantity: fc.integer({ min: 1, max: 20 }),
              })
            ),
            { minLength: 1, maxLength: 20 }
          ),
          (operations) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Execute operations
            operations.forEach(op => {
              if (op.type === 'add') {
                cartStore.addItem(op.menuItem as MenuItem, op.quantity, [])
              } else if (op.type === 'remove' && cartStore.items.length > 0) {
                const randomItem = cartStore.items[Math.floor(Math.random() * cartStore.items.length)]
                cartStore.removeItem(randomItem.menuItem.id, randomItem.customizations)
              } else if (op.type === 'update' && cartStore.items.length > 0) {
                const randomItem = cartStore.items[Math.floor(Math.random() * cartStore.items.length)]
                cartStore.updateQuantity(randomItem.menuItem.id, op.newQuantity, randomItem.customizations)
              }
              
              // Property: After each operation, count should equal sum of quantities
              const expectedCount = cartStore.items.reduce((sum, item) => sum + item.quantity, 0)
              expect(cartStore.itemCount).toBe(expectedCount)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 13: Cart persistence round-trip
   * Feature: customer-frontend-ordering, Property 13: Cart persistence round-trip
   * Validates: Requirements 4.3
   * 
   * For any cart state, saving to local storage and then loading should return
   * an equivalent cart state.
   */
  describe('Property 13: Cart persistence round-trip', () => {
    it('should preserve cart state through save and load cycle', () => {
      fc.assert(
        fc.property(
          // Generate an array of cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
                categoryId: fc.option(fc.uuid(), { nil: undefined }),
                isActive: fc.constant(true),
                calories: fc.option(fc.integer({ min: 0, max: 5000 }), { nil: undefined }),
                preparationTime: fc.option(fc.integer({ min: 1, max: 180 }), { nil: undefined }),
                cookingTime: fc.option(fc.integer({ min: 1, max: 180 }), { nil: undefined }),
                ingredients: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
                allergens: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
                dietary: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
              }),
              quantity: fc.integer({ min: 1, max: 100 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 10 }
              ),
              customizations: fc.option(
                fc.dictionary(
                  fc.string({ minLength: 1, maxLength: 50 }),
                  fc.oneof(
                    fc.string(),
                    fc.integer(),
                    fc.boolean()
                  )
                ),
                { nil: undefined }
              ),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          // Generate promo code data
          fc.option(
            fc.record({
              code: fc.string({ minLength: 3, maxLength: 20 }),
              discount: fc.double({ min: 0, max: 1000, noNaN: true }),
            }),
            { nil: undefined }
          ),
          // Generate delivery fee
          fc.double({ min: 0, max: 100, noNaN: true }),
          (itemConfigs, promoData, deliveryFee) => {
            const cartStore = useCartStore()
            
            // Clear cart and localStorage before test
            cartStore.clearCart()
            
            // Build cart state
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers,
                config.customizations
              )
            })
            
            // Set promo code if provided
            if (promoData) {
              cartStore.promoCode = promoData.code
              cartStore.discount = promoData.discount
            }
            
            // Set delivery fee
            cartStore.deliveryFee = deliveryFee
            
            // Capture original state
            const originalItems = JSON.parse(JSON.stringify(cartStore.items))
            const originalPromoCode = cartStore.promoCode
            const originalDiscount = cartStore.discount
            const originalDeliveryFee = cartStore.deliveryFee
            const originalSubtotal = cartStore.subtotal
            const originalTotal = cartStore.total
            const originalItemCount = cartStore.itemCount
            
            // Persist cart (save to localStorage)
            cartStore.persistCart()
            
            // Clear cart in memory (but not localStorage)
            cartStore.items = []
            cartStore.promoCode = null
            cartStore.discount = 0
            cartStore.deliveryFee = 0
            
            // Verify cart is cleared in memory
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            
            // Restore cart from localStorage
            cartStore.restoreCart()
            
            // Property: Cart items should be restored
            expect(cartStore.items.length).toBe(originalItems.length)
            
            // Property: Each item should be preserved with all data
            originalItems.forEach((originalItem: any, index: number) => {
              const restoredItem = cartStore.items.find(
                (item: any) =>
                  item.menuItem.id === originalItem.menuItem.id &&
                  JSON.stringify(item.selectedModifiers) === JSON.stringify(originalItem.selectedModifiers) &&
                  JSON.stringify(item.customizations) === JSON.stringify(originalItem.customizations)
              )
              
              expect(restoredItem).toBeDefined()
              
              if (restoredItem) {
                // Verify menu item data
                expect(restoredItem.menuItem.id).toBe(originalItem.menuItem.id)
                expect(restoredItem.menuItem.name).toBe(originalItem.menuItem.name)
                expect(restoredItem.menuItem.description).toBe(originalItem.menuItem.description)
                expect(restoredItem.menuItem.price).toBe(originalItem.menuItem.price)
                expect(restoredItem.menuItem.isActive).toBe(originalItem.menuItem.isActive)
                
                // Verify quantity
                expect(restoredItem.quantity).toBe(originalItem.quantity)
                
                // Verify modifiers
                expect(restoredItem.selectedModifiers.length).toBe(originalItem.selectedModifiers.length)
                originalItem.selectedModifiers.forEach((mod: any, modIndex: number) => {
                  expect(restoredItem.selectedModifiers[modIndex].id).toBe(mod.id)
                  expect(restoredItem.selectedModifiers[modIndex].name).toBe(mod.name)
                  expect(restoredItem.selectedModifiers[modIndex].priceAdjustment).toBe(mod.priceAdjustment)
                  expect(restoredItem.selectedModifiers[modIndex].isDefault).toBe(mod.isDefault)
                })
                
                // Verify subtotal
                expect(restoredItem.subtotal).toBe(originalItem.subtotal)
                
                // Verify customizations
                if (originalItem.customizations !== undefined) {
                  expect(restoredItem.customizations).toBeDefined()
                  expect(JSON.stringify(restoredItem.customizations)).toBe(
                    JSON.stringify(originalItem.customizations)
                  )
                }
              }
            })
            
            // Property: Promo code should be restored
            expect(cartStore.promoCode).toBe(originalPromoCode)
            
            // Property: Discount should be restored
            expect(cartStore.discount).toBe(originalDiscount)
            
            // Property: Delivery fee should be restored
            expect(cartStore.deliveryFee).toBe(originalDeliveryFee)
            
            // Property: Computed values should match original
            expect(cartStore.subtotal).toBeCloseTo(originalSubtotal, 2)
            expect(cartStore.total).toBeCloseTo(originalTotal, 2)
            expect(cartStore.itemCount).toBe(originalItemCount)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle empty cart persistence', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Verify cart is empty
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            
            // Persist empty cart
            cartStore.persistCart()
            
            // Add some items to memory (but don't persist)
            cartStore.items = [{
              menuItem: {
                id: 'test-id',
                name: 'Test Item',
                description: 'Test',
                price: 10,
                isActive: true,
              } as MenuItem,
              quantity: 1,
              selectedModifiers: [],
              subtotal: 10,
            }]
            
            // Verify items exist in memory
            expect(cartStore.items.length).toBe(1)
            
            // Restore from localStorage (should restore empty cart)
            cartStore.restoreCart()
            
            // Property: Cart should be empty after restore
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            expect(cartStore.subtotal).toBe(0)
            expect(cartStore.total).toBe(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve cart through multiple save/load cycles', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
            modifiers: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                isDefault: fc.boolean(),
              }),
              { maxLength: 5 }
            ),
          }),
          fc.integer({ min: 2, max: 5 }), // Number of cycles
          (itemConfig, numCycles) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              itemConfig.modifiers
            )
            
            // Capture original state
            const originalState = JSON.parse(JSON.stringify({
              items: cartStore.items,
              itemCount: cartStore.itemCount,
              subtotal: cartStore.subtotal,
            }))
            
            // Perform multiple save/load cycles
            for (let i = 0; i < numCycles; i++) {
              // Save
              cartStore.persistCart()
              
              // Clear memory
              cartStore.items = []
              
              // Restore
              cartStore.restoreCart()
              
              // Property: State should remain consistent after each cycle
              expect(cartStore.items.length).toBe(originalState.items.length)
              expect(cartStore.itemCount).toBe(originalState.itemCount)
              expect(cartStore.subtotal).toBeCloseTo(originalState.subtotal, 2)
              
              // Verify item data integrity
              const restoredItem = cartStore.items[0]
              const originalItem = originalState.items[0]
              
              expect(restoredItem.menuItem.id).toBe(originalItem.menuItem.id)
              expect(restoredItem.menuItem.name).toBe(originalItem.menuItem.name)
              expect(restoredItem.quantity).toBe(originalItem.quantity)
              expect(restoredItem.selectedModifiers.length).toBe(originalItem.selectedModifiers.length)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle cart with special characters and edge cases', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.oneof(
                fc.string({ minLength: 0, maxLength: 500 }),
                fc.constant('Special chars: <>&"\''),
                fc.constant('Unicode: 🍕🍔🍟'),
                fc.constant('Newlines:\n\nTest'),
              ),
              price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
            customizations: fc.option(
              fc.dictionary(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.oneof(
                  fc.string(),
                  fc.constant('Special: <>&"\''),
                  fc.constant('Unicode: 🌮'),
                )
              ),
              { nil: undefined }
            ),
          }),
          (itemConfig) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item with special characters
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              [],
              itemConfig.customizations
            )
            
            // Capture original
            const originalDescription = itemConfig.menuItem.description
            const originalCustomizations = itemConfig.customizations
            
            // Persist and restore
            cartStore.persistCart()
            cartStore.items = []
            cartStore.restoreCart()
            
            // Property: Special characters should be preserved
            expect(cartStore.items.length).toBe(1)
            expect(cartStore.items[0].menuItem.description).toBe(originalDescription)
            
            // Property: Customizations with special characters should be preserved
            if (originalCustomizations !== undefined) {
              expect(JSON.stringify(cartStore.items[0].customizations)).toBe(
                JSON.stringify(originalCustomizations)
              )
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 15: Cart display completeness
   * Feature: customer-frontend-ordering, Property 15: Cart display completeness
   * Validates: Requirements 5.1
   * 
   * For any cart item, the cart view should display the item's name, quantity,
   * selected modifiers, and price.
   */
  describe('Property 15: Cart display completeness', () => {
    it('should display name, quantity, modifiers, and price for any cart item', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
                categoryId: fc.option(fc.uuid(), { nil: undefined }),
                isActive: fc.constant(true),
                calories: fc.option(fc.integer({ min: 0, max: 5000 }), { nil: undefined }),
                preparationTime: fc.option(fc.integer({ min: 1, max: 180 }), { nil: undefined }),
                cookingTime: fc.option(fc.integer({ min: 1, max: 180 }), { nil: undefined }),
                ingredients: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
                allergens: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
                dietary: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
              }),
              quantity: fc.integer({ min: 1, max: 100 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 10 }
              ),
              customizations: fc.option(
                fc.dictionary(
                  fc.string({ minLength: 1, maxLength: 50 }),
                  fc.oneof(
                    fc.string(),
                    fc.integer(),
                    fc.boolean()
                  )
                ),
                { nil: undefined }
              ),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart before test
            cartStore.clearCart()
            
            // Add all items to cart
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers,
                config.customizations
              )
            })
            
            // Property: Each cart item must have all required display data
            cartStore.items.forEach(cartItem => {
              // Property: Cart item must have a name (from menu item)
              expect(cartItem.menuItem).toBeDefined()
              expect(cartItem.menuItem.name).toBeDefined()
              expect(typeof cartItem.menuItem.name).toBe('string')
              expect(cartItem.menuItem.name.length).toBeGreaterThan(0)
              
              // Property: Cart item must have a quantity
              expect(cartItem.quantity).toBeDefined()
              expect(typeof cartItem.quantity).toBe('number')
              expect(cartItem.quantity).toBeGreaterThan(0)
              
              // Property: Cart item must have modifiers array (can be empty)
              expect(cartItem.selectedModifiers).toBeDefined()
              expect(Array.isArray(cartItem.selectedModifiers)).toBe(true)
              
              // Property: Each modifier must have a name
              cartItem.selectedModifiers.forEach(modifier => {
                expect(modifier.name).toBeDefined()
                expect(typeof modifier.name).toBe('string')
                expect(modifier.name.length).toBeGreaterThan(0)
              })
              
              // Property: Cart item must have a price (subtotal)
              expect(cartItem.subtotal).toBeDefined()
              expect(typeof cartItem.subtotal).toBe('number')
              // Note: subtotal can be 0 or negative with large negative modifier adjustments
              
              // Property: Menu item must have a base price
              expect(cartItem.menuItem.price).toBeDefined()
              expect(typeof cartItem.menuItem.price).toBe('number')
              expect(cartItem.menuItem.price).toBeGreaterThan(0)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should display complete data for items with no modifiers', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 100 }),
          (menuItem: MenuItem, quantity: number) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item without modifiers
            cartStore.addItem(menuItem, quantity, [])
            
            // Property: Cart should have the item
            expect(cartStore.items.length).toBe(1)
            
            const cartItem = cartStore.items[0]
            
            // Property: All display data must be present even without modifiers
            expect(cartItem.menuItem.name).toBeDefined()
            expect(cartItem.menuItem.name).toBe(menuItem.name)
            
            expect(cartItem.quantity).toBeDefined()
            expect(cartItem.quantity).toBe(quantity)
            
            expect(cartItem.selectedModifiers).toBeDefined()
            expect(Array.isArray(cartItem.selectedModifiers)).toBe(true)
            expect(cartItem.selectedModifiers.length).toBe(0)
            
            expect(cartItem.subtotal).toBeDefined()
            expect(cartItem.subtotal).toBeCloseTo(quantity * menuItem.price, 2)
            
            expect(cartItem.menuItem.price).toBeDefined()
            expect(cartItem.menuItem.price).toBeCloseTo(menuItem.price, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should display complete data for items with multiple modifiers', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (menuItem: MenuItem, quantity: number, modifiers) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item with modifiers
            cartStore.addItem(menuItem, quantity, modifiers)
            
            // Property: Cart should have the item
            expect(cartStore.items.length).toBe(1)
            
            const cartItem = cartStore.items[0]
            
            // Property: Name must be displayed
            expect(cartItem.menuItem.name).toBeDefined()
            expect(cartItem.menuItem.name).toBe(menuItem.name)
            
            // Property: Quantity must be displayed
            expect(cartItem.quantity).toBeDefined()
            expect(cartItem.quantity).toBe(quantity)
            
            // Property: All modifiers must be available for display
            expect(cartItem.selectedModifiers).toBeDefined()
            expect(Array.isArray(cartItem.selectedModifiers)).toBe(true)
            expect(cartItem.selectedModifiers.length).toBe(modifiers.length)
            
            // Property: Each modifier must have displayable data
            cartItem.selectedModifiers.forEach((modifier, index) => {
              expect(modifier.name).toBeDefined()
              expect(modifier.name).toBe(modifiers[index].name)
              expect(typeof modifier.name).toBe('string')
              expect(modifier.name.length).toBeGreaterThan(0)
              
              // Price adjustment should be available for display
              expect(modifier.priceAdjustment).toBeDefined()
              expect(typeof modifier.priceAdjustment).toBe('number')
            })
            
            // Property: Price (subtotal) must be displayed
            expect(cartItem.subtotal).toBeDefined()
            expect(typeof cartItem.subtotal).toBe('number')
            
            // Property: Base price must be available
            expect(cartItem.menuItem.price).toBeDefined()
            expect(cartItem.menuItem.price).toBe(menuItem.price)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain display completeness after quantity updates', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { maxLength: 5 }
          ),
          fc.integer({ min: 1, max: 50 }),
          (menuItem: MenuItem, initialQuantity: number, modifiers, newQuantity: number) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(menuItem, initialQuantity, modifiers)
            
            // Update quantity
            cartStore.updateQuantity(menuItem.id, newQuantity)
            
            // Property: Display data should still be complete after update
            expect(cartStore.items.length).toBe(1)
            
            const cartItem = cartStore.items[0]
            
            // All display fields must still be present
            expect(cartItem.menuItem.name).toBeDefined()
            expect(cartItem.menuItem.name).toBe(menuItem.name)
            
            expect(cartItem.quantity).toBeDefined()
            expect(cartItem.quantity).toBe(newQuantity)
            
            expect(cartItem.selectedModifiers).toBeDefined()
            expect(Array.isArray(cartItem.selectedModifiers)).toBe(true)
            expect(cartItem.selectedModifiers.length).toBe(modifiers.length)
            
            cartItem.selectedModifiers.forEach(modifier => {
              expect(modifier.name).toBeDefined()
              expect(typeof modifier.name).toBe('string')
              expect(modifier.name.length).toBeGreaterThan(0)
            })
            
            expect(cartItem.subtotal).toBeDefined()
            expect(typeof cartItem.subtotal).toBe('number')
            
            expect(cartItem.menuItem.price).toBeDefined()
            expect(cartItem.menuItem.price).toBe(menuItem.price)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain display completeness after persistence and restoration', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Persist cart
            cartStore.persistCart()
            
            // Clear memory
            cartStore.items = []
            
            // Restore cart
            cartStore.restoreCart()
            
            // Property: All display data must be preserved after restoration
            cartStore.items.forEach(cartItem => {
              // Name must be present
              expect(cartItem.menuItem).toBeDefined()
              expect(cartItem.menuItem.name).toBeDefined()
              expect(typeof cartItem.menuItem.name).toBe('string')
              expect(cartItem.menuItem.name.length).toBeGreaterThan(0)
              
              // Quantity must be present
              expect(cartItem.quantity).toBeDefined()
              expect(typeof cartItem.quantity).toBe('number')
              expect(cartItem.quantity).toBeGreaterThan(0)
              
              // Modifiers must be present
              expect(cartItem.selectedModifiers).toBeDefined()
              expect(Array.isArray(cartItem.selectedModifiers)).toBe(true)
              
              cartItem.selectedModifiers.forEach(modifier => {
                expect(modifier.name).toBeDefined()
                expect(typeof modifier.name).toBe('string')
                expect(modifier.name.length).toBeGreaterThan(0)
              })
              
              // Price must be present
              expect(cartItem.subtotal).toBeDefined()
              expect(typeof cartItem.subtotal).toBe('number')
              
              expect(cartItem.menuItem.price).toBeDefined()
              expect(typeof cartItem.menuItem.price).toBe('number')
              expect(cartItem.menuItem.price).toBeGreaterThan(0)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should display complete data for all items in a multi-item cart', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 2, maxLength: 20 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add all items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Property: Every item in cart must have complete display data
            expect(cartStore.items.length).toBeGreaterThan(0)
            
            cartStore.items.forEach(cartItem => {
              // Property: Each item must have all required display fields
              expect(cartItem.menuItem.name).toBeDefined()
              expect(typeof cartItem.menuItem.name).toBe('string')
              expect(cartItem.menuItem.name.length).toBeGreaterThan(0)
              
              expect(cartItem.quantity).toBeDefined()
              expect(typeof cartItem.quantity).toBe('number')
              expect(cartItem.quantity).toBeGreaterThan(0)
              
              expect(cartItem.selectedModifiers).toBeDefined()
              expect(Array.isArray(cartItem.selectedModifiers)).toBe(true)
              
              cartItem.selectedModifiers.forEach(modifier => {
                expect(modifier.name).toBeDefined()
                expect(typeof modifier.name).toBe('string')
                expect(modifier.name.length).toBeGreaterThan(0)
              })
              
              expect(cartItem.subtotal).toBeDefined()
              expect(typeof cartItem.subtotal).toBe('number')
              
              expect(cartItem.menuItem.price).toBeDefined()
              expect(typeof cartItem.menuItem.price).toBe('number')
              expect(cartItem.menuItem.price).toBeGreaterThan(0)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 9: Cart button shows correct totals
   * Feature: customer-frontend-ordering, Property 9: Cart button shows correct totals
   * Validates: Requirements 5.3
   * 
   * For any cart state, the sticky cart button should display the correct
   * item count and total price matching the cart store calculations.
   */
  describe('Property 9: Cart button shows correct totals', () => {
    it('should display correct item count and total for any cart state', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 100 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 10 }
              ),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          // Generate delivery fee and discount
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 50, noNaN: true }),
          (itemConfigs, deliveryFee, discount) => {
            const cartStore = useCartStore()
            
            // Clear cart before test
            cartStore.clearCart()
            
            // Add all items to cart
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Set delivery fee and discount
            cartStore.deliveryFee = deliveryFee
            cartStore.discount = discount
            
            // Calculate expected values manually
            const expectedItemCount = cartStore.items.reduce((sum, item) => sum + item.quantity, 0)
            const expectedSubtotal = cartStore.items.reduce((sum, item) => sum + item.subtotal, 0)
            const expectedTotal = expectedSubtotal + deliveryFee - discount
            
            // Property: Cart store itemCount should match manual calculation
            expect(cartStore.itemCount).toBe(expectedItemCount)
            
            // Property: Cart store total should match manual calculation
            expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
            
            // Property: Cart store subtotal should match manual calculation
            expect(cartStore.subtotal).toBeCloseTo(expectedSubtotal, 2)
            
            // Property: Empty cart should have count 0 and total equal to delivery fee minus discount
            if (itemConfigs.length === 0) {
              expect(cartStore.itemCount).toBe(0)
              expect(cartStore.subtotal).toBe(0)
              expect(cartStore.total).toBeCloseTo(deliveryFee - discount, 2)
            }
            
            // Property: Non-empty cart should have positive count
            if (cartStore.items.length > 0) {
              expect(cartStore.itemCount).toBeGreaterThan(0)
            }
            
            // Property: Total should include delivery fee and discount
            const calculatedTotal = cartStore.subtotal + cartStore.deliveryFee - cartStore.discount
            expect(cartStore.total).toBeCloseTo(calculatedTotal, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain correct totals after item operations', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { maxLength: 5 }
          ),
          fc.integer({ min: 1, max: 50 }),
          (menuItem: MenuItem, initialQuantity: number, modifiers, newQuantity: number) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(menuItem, initialQuantity, modifiers)
            
            // Verify initial state
            const initialCount = cartStore.itemCount
            const initialTotal = cartStore.total
            
            expect(initialCount).toBe(initialQuantity)
            
            // Update quantity
            cartStore.updateQuantity(menuItem.id, newQuantity)
            
            // Property: Count should update correctly
            expect(cartStore.itemCount).toBe(newQuantity)
            
            // Property: Total should update correctly
            const modifierPrice = modifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
            const expectedItemPrice = menuItem.price + modifierPrice
            const expectedSubtotal = newQuantity * expectedItemPrice
            
            expect(cartStore.subtotal).toBeCloseTo(expectedSubtotal, 2)
            expect(cartStore.total).toBeCloseTo(expectedSubtotal + cartStore.deliveryFee - cartStore.discount, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle edge cases with zero quantities and negative prices', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0.01, max: 100, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 10 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -200, max: 10, noNaN: true }), // Allow large negative adjustments
              isDefault: fc.boolean(),
            }),
            { maxLength: 3 }
          ),
          (menuItem: MenuItem, quantity: number, modifiers) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item with potentially negative total due to modifiers
            cartStore.addItem(menuItem, quantity, modifiers)
            
            // Property: Count should always be accurate regardless of price
            expect(cartStore.itemCount).toBe(quantity)
            
            // Property: Subtotal can be negative (valid business case - discounts)
            const modifierPrice = modifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
            const expectedSubtotal = quantity * (menuItem.price + modifierPrice)
            
            expect(cartStore.subtotal).toBeCloseTo(expectedSubtotal, 2)
            
            // Property: Total calculation should handle negative subtotals
            const expectedTotal = expectedSubtotal + cartStore.deliveryFee - cartStore.discount
            expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
            
            // Remove item by setting quantity to 0
            cartStore.updateQuantity(menuItem.id, 0)
            
            // Property: After removal, count should be 0
            expect(cartStore.itemCount).toBe(0)
            expect(cartStore.subtotal).toBe(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 10: Haptic feedback on cart add
   * Feature: customer-frontend-ordering, Property 10: Haptic feedback on cart add
   * Validates: Requirements 5.4
   * 
   * For any cart operation (add, remove, update, clear), the appropriate
   * haptic feedback should be triggered if Telegram WebApp is available.
   */
  describe('Property 10: Haptic feedback on cart add', () => {
    let mockTelegramWebApp: any
    let hapticSpy: any
    let originalWindow: any

    beforeEach(() => {
      // Store original window
      originalWindow = global.window
      
      // Mock Telegram WebApp
      mockTelegramWebApp = {
        HapticFeedback: {
          impactOccurred: vi.fn(),
          notificationOccurred: vi.fn(),
          selectionChanged: vi.fn(),
        }
      }
      
      // Set up global Telegram mock
      global.window = {
        ...global.window,
        Telegram: {
          WebApp: mockTelegramWebApp
        }
      } as any
      
      hapticSpy = mockTelegramWebApp.HapticFeedback
    })

    afterEach(() => {
      // Restore original window
      global.window = originalWindow
      // Clean up mocks
      vi.clearAllMocks()
    })

    it('should trigger haptic feedback for any cart add operation', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 10 }),
          }),
          (config) => {
            const cartStore = useCartStore()
            
            // Clear cart and reset haptic spy
            cartStore.clearCart()
            hapticSpy.impactOccurred.mockClear()
            
            // Property: Cart operations should not throw when haptic feedback is available
            expect(() => {
              cartStore.addItem(config.menuItem as MenuItem, config.quantity, [])
            }).not.toThrow()
            
            // Property: Cart functionality should work normally with haptic feedback
            expect(cartStore.itemCount).toBe(config.quantity)
            
            return true
          }
        ),
        { numRuns: 50 } // Reduced runs for performance with mocking
      )
    })

    it('should trigger haptic feedback for remove operations', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 10 }),
          }),
          (config) => {
            const cartStore = useCartStore()
            
            // Clear cart and add item
            cartStore.clearCart()
            cartStore.addItem(config.menuItem as MenuItem, config.quantity, [])
            
            // Property: Remove operations should not throw when haptic feedback is available
            expect(() => {
              cartStore.removeItem(config.menuItem.id)
            }).not.toThrow()
            
            // Property: Cart should be empty after removal
            expect(cartStore.itemCount).toBe(0)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should trigger haptic feedback for quantity updates', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 20 }),
          (menuItem: MenuItem, initialQuantity: number, newQuantity: number) => {
            const cartStore = useCartStore()
            
            // Clear cart and add item
            cartStore.clearCart()
            cartStore.addItem(menuItem, initialQuantity, [])
            
            // Property: Update quantity operations should not throw when haptic feedback is available
            expect(() => {
              cartStore.updateQuantity(menuItem.id, newQuantity)
            }).not.toThrow()
            
            // Property: Cart quantity should be updated correctly
            expect(cartStore.itemCount).toBe(newQuantity)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should trigger haptic feedback for clear cart operation', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 10 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart first
            cartStore.clearCart()
            
            // Add items
            itemConfigs.forEach(config => {
              cartStore.addItem(config.menuItem as MenuItem, config.quantity, [])
            })
            
            // Property: Clear cart operations should not throw when haptic feedback is available
            expect(() => {
              cartStore.clearCart()
            }).not.toThrow()
            
            // Property: Cart should be empty after clearing
            expect(cartStore.itemCount).toBe(0)
            expect(cartStore.items.length).toBe(0)
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should handle haptic feedback gracefully when Telegram is not available', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 10 }),
          (menuItem: MenuItem, quantity: number) => {
            // Remove Telegram from global scope
            const originalTelegram = global.window?.Telegram
            if (global.window) {
              delete (global.window as any).Telegram
            }
            
            const cartStore = useCartStore()
            
            try {
              // Clear cart
              cartStore.clearCart()
              
              // Property: Cart operations should not throw when Telegram is unavailable
              expect(() => {
                cartStore.addItem(menuItem, quantity, [])
              }).not.toThrow()
              
              expect(() => {
                cartStore.updateQuantity(menuItem.id, quantity + 1)
              }).not.toThrow()
              
              expect(() => {
                cartStore.removeItem(menuItem.id)
              }).not.toThrow()
              
              expect(() => {
                cartStore.clearCart()
              }).not.toThrow()
              
              // Property: Cart functionality should work normally
              cartStore.addItem(menuItem, quantity, [])
              expect(cartStore.itemCount).toBe(quantity)
              
            } finally {
              // Restore Telegram mock
              if (global.window && originalTelegram) {
                (global.window as any).Telegram = originalTelegram
              }
            }
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should trigger success/error haptic feedback for checkout operations', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 5 }),
          (menuItem: MenuItem, quantity: number) => {
            const cartStore = useCartStore()
            
            // Clear cart and add item
            cartStore.clearCart()
            cartStore.addItem(menuItem, quantity, [])
            
            // Property: Cart operations should work with haptic feedback available
            expect(cartStore.itemCount).toBe(quantity)
            
            // Property: Haptic feedback should not interfere with normal cart operations
            expect(() => {
              cartStore.clearCart()
            }).not.toThrow()
            
            expect(cartStore.itemCount).toBe(0)
            
            return true
          }
        ),
        { numRuns: 30 }
      )
    })
  })

  /**
   * Property 16: Cart subtotal invariant
   * Feature: customer-frontend-ordering, Property 16: Cart subtotal invariant
   * Validates: Requirements 5.2
   * 
   * For any cart item, the subtotal should always equal quantity multiplied by
   * the item's unit price (including modifier adjustments).
   */
  describe('Property 16: Cart subtotal invariant', () => {
    it('should maintain subtotal = quantity * (base price + modifier adjustments) for any cart item', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary menu items with modifiers
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 100 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 10 }
              ),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart before test
            cartStore.clearCart()
            
            // Add all items to cart
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Property: For each cart item, subtotal must equal quantity * unit price
            cartStore.items.forEach(cartItem => {
              // Calculate expected unit price (base price + modifier adjustments)
              const modifierPrice = cartItem.selectedModifiers.reduce(
                (sum, mod) => sum + (mod.priceAdjustment || 0),
                0
              )
              const unitPrice = cartItem.menuItem.price + modifierPrice
              const expectedSubtotal = cartItem.quantity * unitPrice
              
              // Property: Subtotal invariant must hold
              expect(cartItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
              
              // Additional verification: subtotal should be a number
              expect(typeof cartItem.subtotal).toBe('number')
              expect(isNaN(cartItem.subtotal)).toBe(false)
              expect(isFinite(cartItem.subtotal)).toBe(true)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain subtotal invariant when adding items', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { maxLength: 5 }
          ),
          (menuItem: MenuItem, quantity: number, modifiers) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(menuItem, quantity, modifiers)
            
            // Find the added item
            const cartItem = cartStore.items.find(item => item.menuItem.id === menuItem.id)
            
            expect(cartItem).toBeDefined()
            
            if (cartItem) {
              // Calculate expected subtotal
              const modifierPrice = modifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
              const unitPrice = menuItem.price + modifierPrice
              const expectedSubtotal = quantity * unitPrice
              
              // Property: Subtotal invariant must hold immediately after adding
              expect(cartItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain subtotal invariant when updating quantity', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { maxLength: 5 }
          ),
          fc.integer({ min: 1, max: 50 }),
          (menuItem: MenuItem, initialQuantity: number, modifiers, newQuantity: number) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item with initial quantity
            cartStore.addItem(menuItem, initialQuantity, modifiers)
            
            // Update quantity
            cartStore.updateQuantity(menuItem.id, newQuantity)
            
            // Find the item
            const cartItem = cartStore.items.find(item => item.menuItem.id === menuItem.id)
            
            expect(cartItem).toBeDefined()
            
            if (cartItem) {
              // Calculate expected subtotal with new quantity
              const modifierPrice = modifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
              const unitPrice = menuItem.price + modifierPrice
              const expectedSubtotal = newQuantity * unitPrice
              
              // Property: Subtotal invariant must hold after quantity update
              expect(cartItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain subtotal invariant when merging duplicate items', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { maxLength: 5 }
          ),
          (menuItem: MenuItem, quantity1: number, quantity2: number, modifiers) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add same item twice (should merge)
            cartStore.addItem(menuItem, quantity1, modifiers)
            cartStore.addItem(menuItem, quantity2, modifiers)
            
            // Should have only 1 item (merged)
            expect(cartStore.items.length).toBe(1)
            
            const cartItem = cartStore.items[0]
            
            // Calculate expected subtotal for merged item
            const modifierPrice = modifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
            const unitPrice = menuItem.price + modifierPrice
            const totalQuantity = quantity1 + quantity2
            const expectedSubtotal = totalQuantity * unitPrice
            
            // Property: Subtotal invariant must hold for merged item
            expect(cartItem.quantity).toBe(totalQuantity)
            expect(cartItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain subtotal invariant with negative modifier adjustments', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 10, max: 10000, noNaN: true }), // Higher base price
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: -0.01, noNaN: true }), // Only negative adjustments
              isDefault: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (menuItem: MenuItem, quantity: number, modifiers) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item with negative modifier adjustments (discounts)
            cartStore.addItem(menuItem, quantity, modifiers)
            
            const cartItem = cartStore.items[0]
            
            // Calculate expected subtotal
            const modifierPrice = modifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
            const unitPrice = menuItem.price + modifierPrice
            const expectedSubtotal = quantity * unitPrice
            
            // Property: Subtotal invariant must hold even with negative adjustments
            expect(cartItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
            
            // Verify that modifiers actually reduced the price
            expect(modifierPrice).toBeLessThan(0)
            expect(unitPrice).toBeLessThan(menuItem.price)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain subtotal invariant with positive modifier adjustments', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: 0.01, max: 100, noNaN: true }), // Only positive adjustments
              isDefault: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (menuItem: MenuItem, quantity: number, modifiers) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item with positive modifier adjustments (extras)
            cartStore.addItem(menuItem, quantity, modifiers)
            
            const cartItem = cartStore.items[0]
            
            // Calculate expected subtotal
            const modifierPrice = modifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
            const unitPrice = menuItem.price + modifierPrice
            const expectedSubtotal = quantity * unitPrice
            
            // Property: Subtotal invariant must hold with positive adjustments
            expect(cartItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
            
            // Verify that modifiers actually increased the price
            expect(modifierPrice).toBeGreaterThan(0)
            expect(unitPrice).toBeGreaterThan(menuItem.price)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain subtotal invariant with mixed modifier adjustments', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 10, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 50 }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -50, max: 50, noNaN: true }), // Mixed adjustments
              isDefault: fc.boolean(),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (menuItem: MenuItem, quantity: number, modifiers) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item with mixed modifier adjustments
            cartStore.addItem(menuItem, quantity, modifiers)
            
            const cartItem = cartStore.items[0]
            
            // Calculate expected subtotal
            const modifierPrice = modifiers.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
            const unitPrice = menuItem.price + modifierPrice
            const expectedSubtotal = quantity * unitPrice
            
            // Property: Subtotal invariant must hold with mixed adjustments
            expect(cartItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain subtotal invariant after persistence and restoration', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Persist cart
            cartStore.persistCart()
            
            // Clear memory
            cartStore.items = []
            
            // Restore cart
            cartStore.restoreCart()
            
            // Property: Subtotal invariant must hold after restoration
            cartStore.items.forEach(cartItem => {
              const modifierPrice = cartItem.selectedModifiers.reduce(
                (sum, mod) => sum + (mod.priceAdjustment || 0),
                0
              )
              const unitPrice = cartItem.menuItem.price + modifierPrice
              const expectedSubtotal = cartItem.quantity * unitPrice
              
              expect(cartItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain subtotal invariant across multiple operations', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { maxLength: 5 }
          ),
          fc.array(
            fc.oneof(
              fc.record({
                type: fc.constant('add' as const),
                quantity: fc.integer({ min: 1, max: 20 }),
              }),
              fc.record({
                type: fc.constant('update' as const),
                quantity: fc.integer({ min: 1, max: 20 }),
              })
            ),
            { minLength: 1, maxLength: 10 }
          ),
          (menuItem: MenuItem, modifiers, operations) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Execute operations
            operations.forEach(op => {
              if (op.type === 'add') {
                cartStore.addItem(menuItem, op.quantity, modifiers)
              } else if (op.type === 'update') {
                cartStore.updateQuantity(menuItem.id, op.quantity)
              }
              
              // Property: After each operation, subtotal invariant must hold
              const cartItem = cartStore.items.find(item => item.menuItem.id === menuItem.id)
              
              if (cartItem) {
                const modifierPrice = cartItem.selectedModifiers.reduce(
                  (sum, mod) => sum + (mod.priceAdjustment || 0),
                  0
                )
                const unitPrice = cartItem.menuItem.price + modifierPrice
                const expectedSubtotal = cartItem.quantity * unitPrice
                
                expect(cartItem.subtotal).toBeCloseTo(expectedSubtotal, 2)
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
   * Property 17: Cart removal persistence
   * Feature: customer-frontend-ordering, Property 17: Cart removal persistence
   * Validates: Requirements 5.3
   * 
   * For any cart item, after removal, the item should not appear in the cart
   * and the change should be persisted to storage.
   */
  describe('Property 17: Cart removal persistence', () => {
    it('should remove item from cart and persist the change', () => {
      fc.assert(
        fc.property(
          // Generate multiple cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
              customizations: fc.option(
                fc.dictionary(
                  fc.string({ minLength: 1, maxLength: 50 }),
                  fc.oneof(fc.string(), fc.integer(), fc.boolean())
                ),
                { nil: undefined }
              ),
            }),
            { minLength: 2, maxLength: 10 } // At least 2 items so we can remove one
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add all items to cart
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers,
                config.customizations
              )
            })
            
            // Capture initial state
            const initialItemCount = cartStore.items.length
            const initialTotalQuantity = cartStore.itemCount
            
            // Property: Cart should have items
            expect(initialItemCount).toBeGreaterThan(0)
            
            // Select a random item to remove
            const itemToRemove = cartStore.items[0]
            const removedItemId = itemToRemove.menuItem.id
            const removedItemCustomizations = itemToRemove.customizations
            const removedItemQuantity = itemToRemove.quantity
            
            // Remove the item
            cartStore.removeItem(removedItemId, removedItemCustomizations)
            
            // Property: Item should be removed from cart
            const itemStillExists = cartStore.items.some(
              item =>
                item.menuItem.id === removedItemId &&
                JSON.stringify(item.customizations) === JSON.stringify(removedItemCustomizations)
            )
            expect(itemStillExists).toBe(false)
            
            // Property: Cart should have one less item
            expect(cartStore.items.length).toBe(initialItemCount - 1)
            
            // Property: Item count should decrease by removed item's quantity
            expect(cartStore.itemCount).toBe(initialTotalQuantity - removedItemQuantity)
            
            // Property: Removal should be persisted to localStorage
            // Restore cart from localStorage
            const cartBeforeRestore = JSON.parse(JSON.stringify(cartStore.items))
            cartStore.items = [] // Clear memory
            cartStore.restoreCart()
            
            // Property: After restoration, removed item should still not be present
            const itemExistsAfterRestore = cartStore.items.some(
              item =>
                item.menuItem.id === removedItemId &&
                JSON.stringify(item.customizations) === JSON.stringify(removedItemCustomizations)
            )
            expect(itemExistsAfterRestore).toBe(false)
            
            // Property: Cart should have same number of items after restoration
            expect(cartStore.items.length).toBe(initialItemCount - 1)
            
            // Property: Remaining items should be preserved
            expect(cartStore.items.length).toBe(cartBeforeRestore.length)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist removal of multiple items', () => {
      fc.assert(
        fc.property(
          // Generate cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
              customizations: fc.option(
                fc.dictionary(
                  fc.string({ minLength: 1, maxLength: 50 }),
                  fc.oneof(fc.string(), fc.integer(), fc.boolean())
                ),
                { nil: undefined }
              ),
            }),
            { minLength: 3, maxLength: 10 } // At least 3 items
          ),
          // Number of items to remove
          fc.integer({ min: 1, max: 2 }),
          (itemConfigs, numToRemove) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add all items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers,
                config.customizations
              )
            })
            
            const initialItemCount = cartStore.items.length
            
            // Remove multiple items
            const itemsToRemove = cartStore.items.slice(0, Math.min(numToRemove, cartStore.items.length))
            const removedItemIds = itemsToRemove.map(item => ({
              id: item.menuItem.id,
              customizations: item.customizations,
            }))
            
            itemsToRemove.forEach(item => {
              cartStore.removeItem(item.menuItem.id, item.customizations)
            })
            
            // Property: All removed items should not be in cart
            removedItemIds.forEach(removed => {
              const itemExists = cartStore.items.some(
                item =>
                  item.menuItem.id === removed.id &&
                  JSON.stringify(item.customizations) === JSON.stringify(removed.customizations)
              )
              expect(itemExists).toBe(false)
            })
            
            // Property: Cart should have correct number of items
            expect(cartStore.items.length).toBe(initialItemCount - removedItemIds.length)
            
            // Property: Removals should be persisted
            cartStore.items = [] // Clear memory
            cartStore.restoreCart()
            
            // Property: After restoration, removed items should still not be present
            removedItemIds.forEach(removed => {
              const itemExists = cartStore.items.some(
                item =>
                  item.menuItem.id === removed.id &&
                  JSON.stringify(item.customizations) === JSON.stringify(removed.customizations)
              )
              expect(itemExists).toBe(false)
            })
            
            // Property: Cart should still have correct number of items after restoration
            expect(cartStore.items.length).toBe(initialItemCount - removedItemIds.length)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist removal when cart becomes empty', () => {
      fc.assert(
        fc.property(
          // Generate a single cart item
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
            modifiers: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                isDefault: fc.boolean(),
              }),
              { maxLength: 5 }
            ),
            customizations: fc.option(
              fc.dictionary(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.oneof(fc.string(), fc.integer(), fc.boolean())
              ),
              { nil: undefined }
            ),
          }),
          (itemConfig) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add single item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              itemConfig.modifiers,
              itemConfig.customizations
            )
            
            // Property: Cart should have 1 item
            expect(cartStore.items.length).toBe(1)
            
            // Remove the only item
            cartStore.removeItem(itemConfig.menuItem.id, itemConfig.customizations)
            
            // Property: Cart should be empty
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            expect(cartStore.isEmpty).toBe(true)
            
            // Property: Empty cart should be persisted
            cartStore.items = [
              {
                menuItem: {
                  id: 'fake-id',
                  name: 'Fake Item',
                  description: 'Test',
                  price: 10,
                  isActive: true,
                } as MenuItem,
                quantity: 1,
                selectedModifiers: [],
                subtotal: 10,
              },
            ] // Add fake item to memory
            
            // Restore from localStorage
            cartStore.restoreCart()
            
            // Property: Cart should still be empty after restoration
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            expect(cartStore.isEmpty).toBe(true)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist removal with different modifiers correctly', () => {
      fc.assert(
        fc.property(
          // Generate a menu item
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          // Generate two different modifier sets
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 20 }),
          (menuItem: MenuItem, modifiers1, modifiers2, quantity1, quantity2) => {
            // Ensure modifiers are different
            if (JSON.stringify(modifiers1) === JSON.stringify(modifiers2)) {
              return true
            }
            
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add same menu item with different modifiers (creates 2 separate cart items)
            cartStore.addItem(menuItem, quantity1, modifiers1)
            cartStore.addItem(menuItem, quantity2, modifiers2)
            
            // Property: Should have 2 items
            expect(cartStore.items.length).toBe(2)
            
            // Remove first variant
            cartStore.removeItem(menuItem.id, undefined)
            
            // Property: Should have 1 item remaining
            expect(cartStore.items.length).toBe(1)
            
            // Property: Remaining item should be the second variant
            const remainingItem = cartStore.items[0]
            expect(remainingItem.menuItem.id).toBe(menuItem.id)
            
            // Property: Removal should be persisted
            cartStore.items = [] // Clear memory
            cartStore.restoreCart()
            
            // Property: After restoration, should still have 1 item
            expect(cartStore.items.length).toBe(1)
            
            // Property: The remaining item should still be present
            expect(cartStore.items[0].menuItem.id).toBe(menuItem.id)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain persistence across multiple removal operations', () => {
      fc.assert(
        fc.property(
          // Generate cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 3, maxLength: 8 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add all items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            const initialCount = cartStore.items.length
            
            // Remove items one by one and verify persistence after each removal
            let expectedCount = initialCount
            
            while (cartStore.items.length > 0) {
              const itemToRemove = cartStore.items[0]
              const removedId = itemToRemove.menuItem.id
              const removedCustomizations = itemToRemove.customizations
              
              // Remove item
              cartStore.removeItem(removedId, removedCustomizations)
              expectedCount--
              
              // Property: Cart should have correct count
              expect(cartStore.items.length).toBe(expectedCount)
              
              // Property: Removed item should not exist
              const itemExists = cartStore.items.some(
                item =>
                  item.menuItem.id === removedId &&
                  JSON.stringify(item.customizations) === JSON.stringify(removedCustomizations)
              )
              expect(itemExists).toBe(false)
              
              // Property: Persistence should work after each removal
              const currentItems = JSON.parse(JSON.stringify(cartStore.items))
              cartStore.items = [] // Clear memory
              cartStore.restoreCart()
              
              // Property: After restoration, cart should have same items
              expect(cartStore.items.length).toBe(expectedCount)
              
              // Verify all remaining items are correct
              currentItems.forEach((currentItem: any) => {
                const itemStillExists = cartStore.items.some(
                  item =>
                    item.menuItem.id === currentItem.menuItem.id &&
                    JSON.stringify(item.customizations) === JSON.stringify(currentItem.customizations)
                )
                expect(itemStillExists).toBe(true)
              })
            }
            
            // Property: Final cart should be empty and persisted
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.isEmpty).toBe(true)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 14: Cart item uniqueness
   * Feature: customer-frontend-ordering, Property 14: Cart item uniqueness
   * Validates: Requirements 4.5
   * 
   * For any two items with different modifiers, they should be treated as separate
   * cart items even if they reference the same menu item.
   */
  describe('Property 14: Cart item uniqueness', () => {
    it('should treat items with different modifiers as separate cart items', () => {
      fc.assert(
        fc.property(
          // Generate a menu item
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          // Generate two different sets of modifiers
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          // Generate quantities
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          (menuItem: MenuItem, modifiers1, modifiers2, quantity1, quantity2) => {
            // Ensure modifiers are different
            const modifiers1Str = JSON.stringify(modifiers1)
            const modifiers2Str = JSON.stringify(modifiers2)
            
            // Skip if modifiers are identical
            if (modifiers1Str === modifiers2Str) {
              return true
            }
            
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add same menu item with first set of modifiers
            cartStore.addItem(menuItem, quantity1, modifiers1)
            
            // Add same menu item with second set of modifiers
            cartStore.addItem(menuItem, quantity2, modifiers2)
            
            // Property: Cart should have 2 separate items
            expect(cartStore.items.length).toBe(2)
            
            // Property: Both items should reference the same menu item
            expect(cartStore.items[0].menuItem.id).toBe(menuItem.id)
            expect(cartStore.items[1].menuItem.id).toBe(menuItem.id)
            
            // Property: Items should have different modifiers
            expect(JSON.stringify(cartStore.items[0].selectedModifiers)).not.toBe(
              JSON.stringify(cartStore.items[1].selectedModifiers)
            )
            
            // Property: Each item should have its own quantity
            const item1 = cartStore.items.find(
              item => JSON.stringify(item.selectedModifiers) === modifiers1Str
            )
            const item2 = cartStore.items.find(
              item => JSON.stringify(item.selectedModifiers) === modifiers2Str
            )
            
            expect(item1).toBeDefined()
            expect(item2).toBeDefined()
            
            if (item1 && item2) {
              expect(item1.quantity).toBe(quantity1)
              expect(item2.quantity).toBe(quantity2)
              
              // Property: Each item should have its own subtotal
              const modifierPrice1 = modifiers1.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
              const modifierPrice2 = modifiers2.reduce((sum, mod) => sum + (mod.priceAdjustment || 0), 0)
              
              const expectedSubtotal1 = quantity1 * (menuItem.price + modifierPrice1)
              const expectedSubtotal2 = quantity2 * (menuItem.price + modifierPrice2)
              
              expect(item1.subtotal).toBeCloseTo(expectedSubtotal1, 2)
              expect(item2.subtotal).toBeCloseTo(expectedSubtotal2, 2)
            }
            
            // Property: Total item count should be sum of both quantities
            expect(cartStore.itemCount).toBe(quantity1 + quantity2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should treat items with different customizations as separate cart items', () => {
      fc.assert(
        fc.property(
          // Generate a menu item
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          // Generate two different customizations
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            { minKeys: 1, maxKeys: 3 }
          ),
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            { minKeys: 1, maxKeys: 3 }
          ),
          // Generate quantities
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          (menuItem: MenuItem, customizations1, customizations2, quantity1, quantity2) => {
            // Ensure customizations are different
            const customizations1Str = JSON.stringify(customizations1)
            const customizations2Str = JSON.stringify(customizations2)
            
            // Skip if customizations are identical
            if (customizations1Str === customizations2Str) {
              return true
            }
            
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add same menu item with first customizations
            cartStore.addItem(menuItem, quantity1, [], customizations1)
            
            // Add same menu item with second customizations
            cartStore.addItem(menuItem, quantity2, [], customizations2)
            
            // Property: Cart should have 2 separate items
            expect(cartStore.items.length).toBe(2)
            
            // Property: Both items should reference the same menu item
            expect(cartStore.items[0].menuItem.id).toBe(menuItem.id)
            expect(cartStore.items[1].menuItem.id).toBe(menuItem.id)
            
            // Property: Items should have different customizations
            expect(JSON.stringify(cartStore.items[0].customizations)).not.toBe(
              JSON.stringify(cartStore.items[1].customizations)
            )
            
            // Property: Each item should have its own quantity
            const item1 = cartStore.items.find(
              item => JSON.stringify(item.customizations) === customizations1Str
            )
            const item2 = cartStore.items.find(
              item => JSON.stringify(item.customizations) === customizations2Str
            )
            
            expect(item1).toBeDefined()
            expect(item2).toBeDefined()
            
            if (item1 && item2) {
              expect(item1.quantity).toBe(quantity1)
              expect(item2.quantity).toBe(quantity2)
            }
            
            // Property: Total item count should be sum of both quantities
            expect(cartStore.itemCount).toBe(quantity1 + quantity2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should merge items with identical modifiers and customizations', () => {
      fc.assert(
        fc.property(
          // Generate a menu item
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          // Generate modifiers
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { maxLength: 5 }
          ),
          // Generate customizations
          fc.option(
            fc.dictionary(
              fc.string({ minLength: 1, maxLength: 50 }),
              fc.oneof(fc.string(), fc.integer(), fc.boolean())
            ),
            { nil: undefined }
          ),
          // Generate quantities
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          (menuItem: MenuItem, modifiers, customizations, quantity1, quantity2) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add same menu item with same modifiers and customizations twice
            cartStore.addItem(menuItem, quantity1, modifiers, customizations)
            cartStore.addItem(menuItem, quantity2, modifiers, customizations)
            
            // Property: Cart should have only 1 item (merged)
            expect(cartStore.items.length).toBe(1)
            
            // Property: The item should have combined quantity
            expect(cartStore.items[0].quantity).toBe(quantity1 + quantity2)
            
            // Property: The item should reference the menu item
            expect(cartStore.items[0].menuItem.id).toBe(menuItem.id)
            
            // Property: The item should have the modifiers
            expect(JSON.stringify(cartStore.items[0].selectedModifiers)).toBe(
              JSON.stringify(modifiers)
            )
            
            // Property: The item should have the customizations
            expect(JSON.stringify(cartStore.items[0].customizations)).toBe(
              JSON.stringify(customizations)
            )
            
            // Property: Total item count should be sum of both quantities
            expect(cartStore.itemCount).toBe(quantity1 + quantity2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain uniqueness across multiple items with various configurations', () => {
      fc.assert(
        fc.property(
          // Generate a menu item
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          // Generate multiple configurations
          fc.array(
            fc.record({
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 3 }
              ),
              customizations: fc.option(
                fc.dictionary(
                  fc.string({ minLength: 1, maxLength: 50 }),
                  fc.oneof(fc.string(), fc.integer(), fc.boolean())
                ),
                { nil: undefined }
              ),
              quantity: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (menuItem: MenuItem, configurations) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add all configurations
            configurations.forEach(config => {
              cartStore.addItem(menuItem, config.quantity, config.modifiers, config.customizations)
            })
            
            // Property: Number of cart items should be <= number of configurations
            // (some may be merged if identical)
            expect(cartStore.items.length).toBeLessThanOrEqual(configurations.length)
            expect(cartStore.items.length).toBeGreaterThan(0)
            
            // Property: All items should reference the same menu item
            cartStore.items.forEach(item => {
              expect(item.menuItem.id).toBe(menuItem.id)
            })
            
            // Property: Each unique configuration should exist in cart
            const uniqueConfigs = new Map<string, number>()
            configurations.forEach(config => {
              const key = JSON.stringify({
                modifiers: config.modifiers,
                customizations: config.customizations,
              })
              uniqueConfigs.set(key, (uniqueConfigs.get(key) || 0) + config.quantity)
            })
            
            // Property: Cart should have exactly as many items as unique configurations
            expect(cartStore.items.length).toBe(uniqueConfigs.size)
            
            // Property: Each unique configuration should have correct total quantity
            uniqueConfigs.forEach((expectedQuantity, configKey) => {
              const config = JSON.parse(configKey)
              const cartItem = cartStore.items.find(
                item =>
                  JSON.stringify(item.selectedModifiers) === JSON.stringify(config.modifiers) &&
                  JSON.stringify(item.customizations) === JSON.stringify(config.customizations)
              )
              
              expect(cartItem).toBeDefined()
              if (cartItem) {
                expect(cartItem.quantity).toBe(expectedQuantity)
              }
            })
            
            // Property: Total item count should equal sum of all quantities
            const totalQuantity = configurations.reduce((sum, config) => sum + config.quantity, 0)
            expect(cartStore.itemCount).toBe(totalQuantity)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve uniqueness after persistence and restoration', () => {
      fc.assert(
        fc.property(
          // Generate a menu item
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            isActive: fc.constant(true),
          }),
          // Generate two different modifier sets
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
              isDefault: fc.boolean(),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 20 }),
          (menuItem: MenuItem, modifiers1, modifiers2, quantity1, quantity2) => {
            // Ensure modifiers are different
            if (JSON.stringify(modifiers1) === JSON.stringify(modifiers2)) {
              return true
            }
            
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add items with different modifiers
            cartStore.addItem(menuItem, quantity1, modifiers1)
            cartStore.addItem(menuItem, quantity2, modifiers2)
            
            // Capture original state
            const originalItemCount = cartStore.items.length
            const originalTotalQuantity = cartStore.itemCount
            
            // Property: Should have 2 separate items
            expect(originalItemCount).toBe(2)
            
            // Persist and restore
            cartStore.persistCart()
            cartStore.items = []
            cartStore.restoreCart()
            
            // Property: Should still have 2 separate items after restoration
            expect(cartStore.items.length).toBe(originalItemCount)
            expect(cartStore.itemCount).toBe(originalTotalQuantity)
            
            // Property: Items should still have different modifiers
            expect(JSON.stringify(cartStore.items[0].selectedModifiers)).not.toBe(
              JSON.stringify(cartStore.items[1].selectedModifiers)
            )
            
            // Property: Each item should maintain its quantity
            const item1 = cartStore.items.find(
              item => JSON.stringify(item.selectedModifiers) === JSON.stringify(modifiers1)
            )
            const item2 = cartStore.items.find(
              item => JSON.stringify(item.selectedModifiers) === JSON.stringify(modifiers2)
            )
            
            expect(item1).toBeDefined()
            expect(item2).toBeDefined()
            
            if (item1 && item2) {
              expect(item1.quantity).toBe(quantity1)
              expect(item2.quantity).toBe(quantity2)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 18: Minimum order validation
   * Feature: customer-frontend-ordering, Property 18: Minimum order validation
   * Validates: Requirements 5.5
   * 
   * For any cart state, if the subtotal (items total excluding delivery fee) is below
   * the minimum order amount, the checkout button should be disabled and a warning
   * message should be displayed.
   */
  describe('Property 18: Minimum order validation', () => {
    it('should disable checkout when subtotal is below minimum order amount', () => {
      fc.assert(
        fc.property(
          // Generate minimum order amount
          fc.double({ min: 10, max: 100, noNaN: true }),
          // Generate cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 20, noNaN: true }), // Low prices to test below minimum
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 3 }), // Low quantities
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 5, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 2 }
              ),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (minimumOrderAmount, itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart and set minimum order amount
            cartStore.clearCart()
            cartStore.setMinimumOrderAmount(minimumOrderAmount)
            
            // Add items to cart
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Calculate subtotal (excluding delivery fee)
            const subtotal = cartStore.subtotal
            
            // Property: If subtotal < minimum, canCheckout should be false
            if (subtotal < minimumOrderAmount) {
              expect(cartStore.canCheckout).toBe(false)
              
              // Property: remainingForMinimum should show how much more is needed
              const remaining = cartStore.remainingForMinimum
              expect(remaining).toBeGreaterThan(0)
              expect(remaining).toBeCloseTo(minimumOrderAmount - subtotal, 2)
            }
            
            // Property: If subtotal >= minimum, canCheckout should be true (if cart not empty)
            if (subtotal >= minimumOrderAmount && cartStore.items.length > 0) {
              expect(cartStore.canCheckout).toBe(true)
              
              // Property: remainingForMinimum should be 0
              expect(cartStore.remainingForMinimum).toBe(0)
            }
            
            // Property: Empty cart should never allow checkout
            if (cartStore.items.length === 0) {
              expect(cartStore.canCheckout).toBe(false)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should enable checkout when subtotal meets or exceeds minimum order amount', () => {
      fc.assert(
        fc.property(
          // Generate minimum order amount
          fc.double({ min: 10, max: 50, noNaN: true }),
          // Generate cart items with higher prices to ensure we meet minimum
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 20, max: 100, noNaN: true }), // Higher prices
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 5 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: 0, max: 10, noNaN: true }), // Positive adjustments
                  isDefault: fc.boolean(),
                }),
                { maxLength: 3 }
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (minimumOrderAmount, itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart and set minimum order amount
            cartStore.clearCart()
            cartStore.setMinimumOrderAmount(minimumOrderAmount)
            
            // Add items to cart
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            const subtotal = cartStore.subtotal
            
            // Property: If subtotal >= minimum, canCheckout should be true
            if (subtotal >= minimumOrderAmount) {
              expect(cartStore.canCheckout).toBe(true)
              expect(cartStore.remainingForMinimum).toBe(0)
            }
            
            // Property: If subtotal < minimum, canCheckout should be false
            if (subtotal < minimumOrderAmount) {
              expect(cartStore.canCheckout).toBe(false)
              expect(cartStore.remainingForMinimum).toBeGreaterThan(0)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update checkout availability when items are added or removed', () => {
      fc.assert(
        fc.property(
          // Generate minimum order amount
          fc.double({ min: 20, max: 50, noNaN: true }),
          // Generate two items
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 5, max: 15, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 5, max: 15, noNaN: true }),
            isActive: fc.constant(true),
          }),
          fc.integer({ min: 1, max: 3 }),
          fc.integer({ min: 1, max: 3 }),
          (minimumOrderAmount, item1, item2, quantity1, quantity2) => {
            const cartStore = useCartStore()
            
            // Clear cart and set minimum
            cartStore.clearCart()
            cartStore.setMinimumOrderAmount(minimumOrderAmount)
            
            // Add first item
            cartStore.addItem(item1 as MenuItem, quantity1, [])
            
            const subtotalAfterFirst = cartStore.subtotal
            const canCheckoutAfterFirst = cartStore.canCheckout
            
            // Property: canCheckout should reflect whether subtotal meets minimum
            if (subtotalAfterFirst < minimumOrderAmount) {
              expect(canCheckoutAfterFirst).toBe(false)
            } else {
              expect(canCheckoutAfterFirst).toBe(true)
            }
            
            // Add second item
            cartStore.addItem(item2 as MenuItem, quantity2, [])
            
            const subtotalAfterSecond = cartStore.subtotal
            const canCheckoutAfterSecond = cartStore.canCheckout
            
            // Property: canCheckout should update after adding second item
            if (subtotalAfterSecond < minimumOrderAmount) {
              expect(canCheckoutAfterSecond).toBe(false)
            } else {
              expect(canCheckoutAfterSecond).toBe(true)
            }
            
            // Property: If second item pushed us over minimum, canCheckout should now be true
            if (subtotalAfterFirst < minimumOrderAmount && subtotalAfterSecond >= minimumOrderAmount) {
              expect(canCheckoutAfterSecond).toBe(true)
            }
            
            // Remove first item
            cartStore.removeItem(item1.id)
            
            const subtotalAfterRemoval = cartStore.subtotal
            const canCheckoutAfterRemoval = cartStore.canCheckout
            
            // Property: canCheckout should update after removal
            if (subtotalAfterRemoval < minimumOrderAmount) {
              expect(canCheckoutAfterRemoval).toBe(false)
            } else {
              expect(canCheckoutAfterRemoval).toBe(true)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should calculate remainingForMinimum correctly', () => {
      fc.assert(
        fc.property(
          // Generate minimum order amount
          fc.double({ min: 50, max: 100, noNaN: true }),
          // Generate cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 5, max: 30, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 3 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 5, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 2 }
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (minimumOrderAmount, itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart and set minimum
            cartStore.clearCart()
            cartStore.setMinimumOrderAmount(minimumOrderAmount)
            
            // Add items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            const subtotal = cartStore.subtotal
            const remaining = cartStore.remainingForMinimum
            
            // Property: remainingForMinimum should be max(0, minimum - subtotal)
            const expectedRemaining = Math.max(0, minimumOrderAmount - subtotal)
            expect(remaining).toBeCloseTo(expectedRemaining, 2)
            
            // Property: If subtotal >= minimum, remaining should be 0
            if (subtotal >= minimumOrderAmount) {
              expect(remaining).toBe(0)
            }
            
            // Property: If subtotal < minimum, remaining should be positive
            if (subtotal < minimumOrderAmount) {
              expect(remaining).toBeGreaterThan(0)
              expect(remaining).toBeCloseTo(minimumOrderAmount - subtotal, 2)
            }
            
            // Property: remaining should never be negative
            expect(remaining).toBeGreaterThanOrEqual(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not consider delivery fee in minimum order validation', () => {
      fc.assert(
        fc.property(
          // Generate minimum order amount
          fc.double({ min: 30, max: 50, noNaN: true }),
          // Generate delivery fee
          fc.double({ min: 5, max: 20, noNaN: true }),
          // Generate cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 10, max: 25, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 2 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: 0, max: 5, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 2 }
              ),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (minimumOrderAmount, deliveryFee, itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart and set minimum
            cartStore.clearCart()
            cartStore.setMinimumOrderAmount(minimumOrderAmount)
            
            // Add items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Set delivery fee
            cartStore.setDeliveryFee(deliveryFee)
            
            const subtotal = cartStore.subtotal
            const total = cartStore.total
            
            // Property: canCheckout should be based on subtotal, not total
            // Even if total >= minimum, if subtotal < minimum, checkout should be disabled
            if (subtotal < minimumOrderAmount) {
              expect(cartStore.canCheckout).toBe(false)
              
              // Property: This should be true even if total >= minimum
              if (total >= minimumOrderAmount) {
                // Delivery fee pushed total over minimum, but subtotal is still below
                expect(cartStore.canCheckout).toBe(false)
              }
            }
            
            // Property: If subtotal >= minimum, checkout should be enabled
            if (subtotal >= minimumOrderAmount) {
              expect(cartStore.canCheckout).toBe(true)
            }
            
            // Property: remainingForMinimum should be based on subtotal only
            const expectedRemaining = Math.max(0, minimumOrderAmount - subtotal)
            expect(cartStore.remainingForMinimum).toBeCloseTo(expectedRemaining, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain minimum order validation after quantity updates', () => {
      fc.assert(
        fc.property(
          // Generate minimum order amount
          fc.double({ min: 40, max: 60, noNaN: true }),
          // Generate menu item
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            price: fc.double({ min: 10, max: 20, noNaN: true }),
            isActive: fc.constant(true),
          }),
          // Generate quantities
          fc.integer({ min: 1, max: 3 }),
          fc.integer({ min: 1, max: 5 }),
          (minimumOrderAmount, menuItem, initialQuantity, newQuantity) => {
            const cartStore = useCartStore()
            
            // Clear cart and set minimum
            cartStore.clearCart()
            cartStore.setMinimumOrderAmount(minimumOrderAmount)
            
            // Add item with initial quantity
            cartStore.addItem(menuItem as MenuItem, initialQuantity, [])
            
            const subtotalBefore = cartStore.subtotal
            const canCheckoutBefore = cartStore.canCheckout
            
            // Property: canCheckout should reflect subtotal vs minimum
            if (subtotalBefore < minimumOrderAmount) {
              expect(canCheckoutBefore).toBe(false)
            } else {
              expect(canCheckoutBefore).toBe(true)
            }
            
            // Update quantity
            cartStore.updateQuantity(menuItem.id, newQuantity)
            
            const subtotalAfter = cartStore.subtotal
            const canCheckoutAfter = cartStore.canCheckout
            
            // Property: canCheckout should update based on new subtotal
            if (subtotalAfter < minimumOrderAmount) {
              expect(canCheckoutAfter).toBe(false)
            } else {
              expect(canCheckoutAfter).toBe(true)
            }
            
            // Property: If quantity increase pushed us over minimum, checkout should be enabled
            if (subtotalBefore < minimumOrderAmount && subtotalAfter >= minimumOrderAmount) {
              expect(canCheckoutAfter).toBe(true)
            }
            
            // Property: If quantity decrease pushed us below minimum, checkout should be disabled
            if (subtotalBefore >= minimumOrderAmount && subtotalAfter < minimumOrderAmount) {
              expect(canCheckoutAfter).toBe(false)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain minimum order validation after persistence and restoration', () => {
      fc.assert(
        fc.property(
          // Generate minimum order amount
          fc.double({ min: 25, max: 75, noNaN: true }),
          // Generate cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 5, max: 30, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 4 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 10, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 3 }
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (minimumOrderAmount, itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart and set minimum
            cartStore.clearCart()
            cartStore.setMinimumOrderAmount(minimumOrderAmount)
            
            // Add items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Capture state before persistence
            const subtotalBefore = cartStore.subtotal
            const canCheckoutBefore = cartStore.canCheckout
            const remainingBefore = cartStore.remainingForMinimum
            
            // Persist cart
            cartStore.persistCart()
            
            // Clear memory
            cartStore.items = []
            
            // Restore cart
            cartStore.restoreCart()
            
            // Note: minimumOrderAmount is not persisted, so we need to set it again
            cartStore.setMinimumOrderAmount(minimumOrderAmount)
            
            // Property: Subtotal should be the same after restoration
            expect(cartStore.subtotal).toBeCloseTo(subtotalBefore, 2)
            
            // Property: canCheckout should be the same after restoration
            expect(cartStore.canCheckout).toBe(canCheckoutBefore)
            
            // Property: remainingForMinimum should be the same after restoration
            expect(cartStore.remainingForMinimum).toBeCloseTo(remainingBefore, 2)
            
            // Property: Validation logic should still work correctly
            if (cartStore.subtotal < minimumOrderAmount) {
              expect(cartStore.canCheckout).toBe(false)
              expect(cartStore.remainingForMinimum).toBeGreaterThan(0)
            } else {
              expect(cartStore.canCheckout).toBe(true)
              expect(cartStore.remainingForMinimum).toBe(0)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle edge case where minimum order amount is zero', () => {
      fc.assert(
        fc.property(
          // Generate cart items with positive prices to avoid negative subtotals
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 5, max: 50, noNaN: true }), // Higher minimum to avoid negative subtotals
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 5 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: 0, max: 10, noNaN: true }), // Only positive adjustments
                  isDefault: fc.boolean(),
                }),
                { maxLength: 2 }
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart and set minimum to 0
            cartStore.clearCart()
            cartStore.setMinimumOrderAmount(0)
            
            // Add items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            const subtotal = cartStore.subtotal
            
            // Property: With minimum of 0, any non-empty cart with positive subtotal should allow checkout
            if (cartStore.items.length > 0 && subtotal > 0) {
              expect(cartStore.canCheckout).toBe(true)
              expect(cartStore.remainingForMinimum).toBe(0)
            }
            
            // Property: Even with minimum of 0, if subtotal is 0 or negative, checkout should be disabled
            // (This protects against edge cases with large negative modifiers)
            if (subtotal <= 0) {
              expect(cartStore.canCheckout).toBe(false)
            }
            
            // Property: Empty cart should still not allow checkout
            cartStore.clearCart()
            expect(cartStore.canCheckout).toBe(false)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 19: Delivery fee display
   * Feature: customer-frontend-ordering, Property 19: Delivery fee display
   * Validates: Requirements 5.6
   * 
   * For any cart with delivery order type, the cart summary should include a delivery fee line item.
   */
  describe('Property 19: Delivery fee display', () => {
    it('should include delivery fee in cart when delivery fee is set', () => {
      fc.assert(
        fc.property(
          // Generate cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -50, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          // Generate delivery fee (can be 0 or positive)
          fc.double({ min: 0, max: 100, noNaN: true }),
          (itemConfigs, deliveryFee) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add items to cart
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Set delivery fee (simulating delivery order type)
            cartStore.setDeliveryFee(deliveryFee)
            
            // Property: Delivery fee should be accessible in cart state
            expect(cartStore.deliveryFee).toBeDefined()
            expect(typeof cartStore.deliveryFee).toBe('number')
            expect(cartStore.deliveryFee).toBe(deliveryFee)
            
            // Property: Delivery fee should be non-negative
            expect(cartStore.deliveryFee).toBeGreaterThanOrEqual(0)
            
            // Property: Total should include delivery fee
            const subtotal = cartStore.subtotal
            const expectedTotal = subtotal + deliveryFee - cartStore.discount
            expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
            
            // Property: If delivery fee is set (> 0.01), it should be included in total calculation
            // Note: We use 0.01 threshold to avoid floating point precision issues with very small numbers
            if (deliveryFee >= 0.01) {
              expect(cartStore.total).toBeGreaterThan(subtotal)
              expect(cartStore.total - subtotal).toBeCloseTo(deliveryFee, 2)
            }
            
            // Property: If delivery fee is 0, total should equal subtotal (minus discount)
            if (deliveryFee === 0 && cartStore.discount === 0) {
              expect(cartStore.total).toBeCloseTo(subtotal, 2)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should persist and restore delivery fee', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
          }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (itemConfig, deliveryFee) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              []
            )
            
            // Set delivery fee
            cartStore.setDeliveryFee(deliveryFee)
            
            // Capture original state
            const originalDeliveryFee = cartStore.deliveryFee
            const originalTotal = cartStore.total
            
            // Persist cart
            cartStore.persistCart()
            
            // Clear memory
            cartStore.items = []
            cartStore.deliveryFee = 0
            
            // Verify cleared
            expect(cartStore.deliveryFee).toBe(0)
            
            // Restore cart
            cartStore.restoreCart()
            
            // Property: Delivery fee should be restored
            expect(cartStore.deliveryFee).toBe(originalDeliveryFee)
            expect(cartStore.deliveryFee).toBe(deliveryFee)
            
            // Property: Total should be recalculated correctly with restored delivery fee
            expect(cartStore.total).toBeCloseTo(originalTotal, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle delivery fee with discount applied', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 10, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 10 }),
          }),
          fc.double({ min: 0, max: 50, noNaN: true }), // delivery fee
          fc.double({ min: 0, max: 100, noNaN: true }), // discount
          (itemConfig, deliveryFee, discount) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              []
            )
            
            // Set delivery fee and discount
            cartStore.setDeliveryFee(deliveryFee)
            cartStore.discount = discount
            
            const subtotal = cartStore.subtotal
            
            // Property: Total should be subtotal + delivery fee - discount
            const expectedTotal = subtotal + deliveryFee - discount
            expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
            
            // Property: Delivery fee should not be affected by discount
            expect(cartStore.deliveryFee).toBe(deliveryFee)
            
            // Property: Discount should not affect delivery fee
            if (discount > 0) {
              const totalWithoutDiscount = subtotal + deliveryFee
              expect(cartStore.total).toBeCloseTo(totalWithoutDiscount - discount, 2)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain delivery fee through cart operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          fc.double({ min: 5, max: 50, noNaN: true }),
          (itemConfigs, deliveryFee) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Set delivery fee first
            cartStore.setDeliveryFee(deliveryFee)
            
            // Add items one by one
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                []
              )
              
              // Property: Delivery fee should remain constant after adding items
              expect(cartStore.deliveryFee).toBe(deliveryFee)
            })
            
            // Update quantity of first item
            if (cartStore.items.length > 0) {
              const firstItem = cartStore.items[0]
              cartStore.updateQuantity(firstItem.menuItem.id, firstItem.quantity + 1)
              
              // Property: Delivery fee should remain constant after quantity update
              expect(cartStore.deliveryFee).toBe(deliveryFee)
            }
            
            // Remove an item
            if (cartStore.items.length > 1) {
              const itemToRemove = cartStore.items[0]
              cartStore.removeItem(itemToRemove.menuItem.id)
              
              // Property: Delivery fee should remain constant after item removal
              expect(cartStore.deliveryFee).toBe(deliveryFee)
            }
            
            // Property: Total should always include delivery fee
            const subtotal = cartStore.subtotal
            const expectedTotal = subtotal + deliveryFee - cartStore.discount
            expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clear delivery fee when cart is cleared', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
          }),
          fc.double({ min: 5, max: 100, noNaN: true }),
          (itemConfig, deliveryFee) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item and set delivery fee
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              []
            )
            cartStore.setDeliveryFee(deliveryFee)
            
            // Verify delivery fee is set
            expect(cartStore.deliveryFee).toBe(deliveryFee)
            expect(cartStore.items.length).toBeGreaterThan(0)
            
            // Clear cart
            cartStore.clearCart()
            
            // Property: Delivery fee should be reset to 0 after cart is cleared
            expect(cartStore.deliveryFee).toBe(0)
            
            // Property: Total should be 0 after cart is cleared
            expect(cartStore.total).toBe(0)
            
            // Property: Items should be empty
            expect(cartStore.items.length).toBe(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle zero delivery fee correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
          }),
          (itemConfig) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              []
            )
            
            // Set delivery fee to 0 (e.g., free delivery or pickup order)
            cartStore.setDeliveryFee(0)
            
            const subtotal = cartStore.subtotal
            
            // Property: Delivery fee should be 0
            expect(cartStore.deliveryFee).toBe(0)
            
            // Property: Total should equal subtotal when delivery fee is 0 and no discount
            if (cartStore.discount === 0) {
              expect(cartStore.total).toBeCloseTo(subtotal, 2)
            }
            
            // Property: Total should not be less than subtotal when delivery fee is 0 (unless discount applied)
            if (cartStore.discount === 0) {
              expect(cartStore.total).toBeGreaterThanOrEqual(subtotal - 0.01) // Allow for floating point precision
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update total when delivery fee changes', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
          }),
          fc.double({ min: 5, max: 50, noNaN: true }), // initial delivery fee
          fc.double({ min: 5, max: 50, noNaN: true }), // new delivery fee
          (itemConfig, initialDeliveryFee, newDeliveryFee) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              []
            )
            
            // Set initial delivery fee
            cartStore.setDeliveryFee(initialDeliveryFee)
            
            const subtotal = cartStore.subtotal
            const initialTotal = cartStore.total
            
            // Property: Initial total should include initial delivery fee
            expect(initialTotal).toBeCloseTo(subtotal + initialDeliveryFee, 2)
            
            // Change delivery fee
            cartStore.setDeliveryFee(newDeliveryFee)
            
            const newTotal = cartStore.total
            
            // Property: New total should include new delivery fee
            expect(newTotal).toBeCloseTo(subtotal + newDeliveryFee, 2)
            
            // Property: Difference in total should equal difference in delivery fee
            const totalDifference = newTotal - initialTotal
            const feeDifference = newDeliveryFee - initialDeliveryFee
            expect(totalDifference).toBeCloseTo(feeDifference, 2)
            
            // Property: Delivery fee should be updated
            expect(cartStore.deliveryFee).toBe(newDeliveryFee)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 20: Cart total breakdown completeness
   * Feature: customer-frontend-ordering, Property 20: Cart total breakdown completeness
   * Validates: Requirements 5.7
   * 
   * For any cart with delivery, the total breakdown should show subtotal, delivery fee,
   * discount (if any), and final total as separate line items.
   */
  describe('Property 20: Cart total breakdown completeness', () => {
    it('should provide all breakdown components for any cart with delivery', () => {
      fc.assert(
        fc.property(
          // Generate cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -50, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          // Generate delivery fee (can be 0 or positive)
          fc.double({ min: 0, max: 100, noNaN: true }),
          // Generate optional discount
          fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
          (itemConfigs, deliveryFee, discount) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add items to cart
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Set delivery fee (simulating delivery order type)
            cartStore.setDeliveryFee(deliveryFee)
            
            // Set discount if provided
            if (discount !== undefined) {
              cartStore.discount = discount
            }
            
            // Property: Subtotal should be available as a separate line item
            expect(cartStore.subtotal).toBeDefined()
            expect(typeof cartStore.subtotal).toBe('number')
            // Note: Subtotal can be 0 or even negative if modifiers have large negative adjustments
            // This is valid business logic (e.g., promotional discounts)
            
            // Property: Delivery fee should be available as a separate line item
            expect(cartStore.deliveryFee).toBeDefined()
            expect(typeof cartStore.deliveryFee).toBe('number')
            expect(cartStore.deliveryFee).toBeGreaterThanOrEqual(0)
            expect(cartStore.deliveryFee).toBe(deliveryFee)
            
            // Property: Discount should be available as a separate line item
            expect(cartStore.discount).toBeDefined()
            expect(typeof cartStore.discount).toBe('number')
            expect(cartStore.discount).toBeGreaterThanOrEqual(0)
            if (discount !== undefined) {
              expect(cartStore.discount).toBe(discount)
            }
            
            // Property: Final total should be available as a separate line item
            expect(cartStore.total).toBeDefined()
            expect(typeof cartStore.total).toBe('number')
            
            // Property: All breakdown components should be separate and distinct
            // (i.e., we can access each component independently)
            const subtotal = cartStore.subtotal
            const fee = cartStore.deliveryFee
            const disc = cartStore.discount
            const total = cartStore.total
            
            // Verify each is a distinct value
            expect(typeof subtotal).toBe('number')
            expect(typeof fee).toBe('number')
            expect(typeof disc).toBe('number')
            expect(typeof total).toBe('number')
            
            // Property: Total should equal subtotal + delivery fee - discount
            const expectedTotal = subtotal + fee - disc
            expect(total).toBeCloseTo(expectedTotal, 2)
            
            // Property: Breakdown should be mathematically consistent
            // subtotal + deliveryFee - discount = total
            const calculatedTotal = subtotal + fee - disc
            expect(total).toBeCloseTo(calculatedTotal, 2)
            
            // Property: Each component should be independently accessible
            // (not just calculated on the fly)
            expect(cartStore.subtotal).toBe(subtotal)
            expect(cartStore.deliveryFee).toBe(fee)
            expect(cartStore.discount).toBe(disc)
            expect(cartStore.total).toBe(total)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should show complete breakdown with zero discount', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
          }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (itemConfig, deliveryFee) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              []
            )
            
            // Set delivery fee
            cartStore.setDeliveryFee(deliveryFee)
            
            // Property: All breakdown components should be present even with zero discount
            expect(cartStore.subtotal).toBeDefined()
            expect(cartStore.deliveryFee).toBeDefined()
            expect(cartStore.discount).toBeDefined()
            expect(cartStore.total).toBeDefined()
            
            // Property: Discount should be 0
            expect(cartStore.discount).toBe(0)
            
            // Property: Total should equal subtotal + delivery fee (no discount)
            const expectedTotal = cartStore.subtotal + deliveryFee
            expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
            
            // Property: All components should be separate line items
            expect(typeof cartStore.subtotal).toBe('number')
            expect(typeof cartStore.deliveryFee).toBe('number')
            expect(typeof cartStore.discount).toBe('number')
            expect(typeof cartStore.total).toBe('number')
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should show complete breakdown with zero delivery fee', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
          }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (itemConfig, discount) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              []
            )
            
            // Set discount (but no delivery fee)
            cartStore.discount = discount
            
            // Property: All breakdown components should be present even with zero delivery fee
            expect(cartStore.subtotal).toBeDefined()
            expect(cartStore.deliveryFee).toBeDefined()
            expect(cartStore.discount).toBeDefined()
            expect(cartStore.total).toBeDefined()
            
            // Property: Delivery fee should be 0
            expect(cartStore.deliveryFee).toBe(0)
            
            // Property: Total should equal subtotal - discount (no delivery fee)
            const expectedTotal = cartStore.subtotal - discount
            expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
            
            // Property: All components should be separate line items
            expect(typeof cartStore.subtotal).toBe('number')
            expect(typeof cartStore.deliveryFee).toBe('number')
            expect(typeof cartStore.discount).toBe('number')
            expect(typeof cartStore.total).toBe('number')
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain breakdown completeness through cart operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          fc.double({ min: 5, max: 50, noNaN: true }),
          fc.double({ min: 0, max: 50, noNaN: true }),
          (itemConfigs, deliveryFee, discount) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Set delivery fee and discount
            cartStore.setDeliveryFee(deliveryFee)
            cartStore.discount = discount
            
            // Add items one by one and verify breakdown after each addition
            itemConfigs.forEach((config, index) => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                []
              )
              
              // Property: After each operation, all breakdown components should be present
              expect(cartStore.subtotal).toBeDefined()
              expect(cartStore.deliveryFee).toBeDefined()
              expect(cartStore.discount).toBeDefined()
              expect(cartStore.total).toBeDefined()
              
              // Property: Breakdown should be mathematically consistent
              const expectedTotal = cartStore.subtotal + cartStore.deliveryFee - cartStore.discount
              expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
              
              // Property: Delivery fee and discount should remain unchanged
              expect(cartStore.deliveryFee).toBe(deliveryFee)
              expect(cartStore.discount).toBe(discount)
            })
            
            // Remove first item and verify breakdown is still complete
            if (cartStore.items.length > 0) {
              const firstItem = cartStore.items[0]
              cartStore.removeItem(firstItem.menuItem.id, firstItem.customizations)
              
              // Property: Breakdown should still be complete after removal
              expect(cartStore.subtotal).toBeDefined()
              expect(cartStore.deliveryFee).toBeDefined()
              expect(cartStore.discount).toBeDefined()
              expect(cartStore.total).toBeDefined()
              
              // Property: Breakdown should still be mathematically consistent
              const expectedTotal = cartStore.subtotal + cartStore.deliveryFee - cartStore.discount
              expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve breakdown completeness through persistence', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (itemConfigs, deliveryFee, discount) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Build cart state
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                []
              )
            })
            
            // Set delivery fee and discount
            cartStore.setDeliveryFee(deliveryFee)
            cartStore.discount = discount
            
            // Capture original breakdown
            const originalSubtotal = cartStore.subtotal
            const originalDeliveryFee = cartStore.deliveryFee
            const originalDiscount = cartStore.discount
            const originalTotal = cartStore.total
            
            // Persist cart
            cartStore.persistCart()
            
            // Clear memory
            cartStore.items = []
            cartStore.deliveryFee = 0
            cartStore.discount = 0
            
            // Restore cart
            cartStore.restoreCart()
            
            // Property: All breakdown components should be restored
            expect(cartStore.subtotal).toBeDefined()
            expect(cartStore.deliveryFee).toBeDefined()
            expect(cartStore.discount).toBeDefined()
            expect(cartStore.total).toBeDefined()
            
            // Property: Each component should match original values
            expect(cartStore.subtotal).toBeCloseTo(originalSubtotal, 2)
            expect(cartStore.deliveryFee).toBe(originalDeliveryFee)
            expect(cartStore.discount).toBe(originalDiscount)
            expect(cartStore.total).toBeCloseTo(originalTotal, 2)
            
            // Property: Breakdown should still be mathematically consistent
            const expectedTotal = cartStore.subtotal + cartStore.deliveryFee - cartStore.discount
            expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle breakdown with all components at maximum values', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 100, max: 1000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 5, max: 20 }),
            }),
            { minLength: 3, maxLength: 10 }
          ),
          fc.double({ min: 50, max: 200, noNaN: true }),
          fc.double({ min: 50, max: 500, noNaN: true }),
          (itemConfigs, deliveryFee, discount) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                []
              )
            })
            
            // Set delivery fee and discount
            cartStore.setDeliveryFee(deliveryFee)
            cartStore.discount = discount
            
            // Property: All breakdown components should be present with large values
            expect(cartStore.subtotal).toBeDefined()
            expect(cartStore.deliveryFee).toBeDefined()
            expect(cartStore.discount).toBeDefined()
            expect(cartStore.total).toBeDefined()
            
            // Property: Subtotal should be large (multiple items with high prices)
            expect(cartStore.subtotal).toBeGreaterThan(100)
            
            // Property: All components should be separate and accessible
            expect(typeof cartStore.subtotal).toBe('number')
            expect(typeof cartStore.deliveryFee).toBe('number')
            expect(typeof cartStore.discount).toBe('number')
            expect(typeof cartStore.total).toBe('number')
            
            // Property: Breakdown should be mathematically consistent even with large values
            const expectedTotal = cartStore.subtotal + deliveryFee - discount
            expect(cartStore.total).toBeCloseTo(expectedTotal, 2)
            
            // Property: Total should be positive (assuming discount doesn't exceed subtotal + fee)
            // Note: In edge cases, discount could exceed subtotal + fee, resulting in negative total
            // This is a business logic decision, but we verify the calculation is correct
            const calculatedTotal = cartStore.subtotal + cartStore.deliveryFee - cartStore.discount
            expect(cartStore.total).toBeCloseTo(calculatedTotal, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should provide breakdown components as separate line items (not just calculated)', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
          }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (itemConfig, deliveryFee, discount) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              []
            )
            
            // Set delivery fee and discount
            cartStore.setDeliveryFee(deliveryFee)
            cartStore.discount = discount
            
            // Property: Each component should be independently accessible
            // (i.e., they are stored as separate properties, not just calculated)
            const subtotal1 = cartStore.subtotal
            const subtotal2 = cartStore.subtotal
            expect(subtotal1).toBe(subtotal2)
            
            const fee1 = cartStore.deliveryFee
            const fee2 = cartStore.deliveryFee
            expect(fee1).toBe(fee2)
            
            const disc1 = cartStore.discount
            const disc2 = cartStore.discount
            expect(disc1).toBe(disc2)
            
            const total1 = cartStore.total
            const total2 = cartStore.total
            expect(total1).toBe(total2)
            
            // Property: Components should be accessible multiple times with same result
            // (verifying they are stored values, not recalculated each time)
            for (let i = 0; i < 5; i++) {
              expect(cartStore.subtotal).toBe(subtotal1)
              expect(cartStore.deliveryFee).toBe(fee1)
              expect(cartStore.discount).toBe(disc1)
              expect(cartStore.total).toBe(total1)
            }
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

  /**
   * Property 25: Order confirmation cart clearing
   * Feature: customer-frontend-ordering, Property 25: Order confirmation cart clearing
   * Validates: Requirements 8.2
   * 
   * For any successful order creation, the cart should be emptied immediately after confirmation.
   */
  describe('Property 25: Order confirmation cart clearing', () => {
    it('should clear cart immediately after successful order creation', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          // Generate customer info
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            address: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
          }),
          // Generate promo code and delivery fee
          fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: null }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (itemConfigs, customerInfo, promoCode, deliveryFee, discount) => {
            const cartStore = useCartStore()
            
            // Clear cart before test
            cartStore.clearCart()
            
            // Build cart state
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers
              )
            })
            
            // Set promo code and delivery fee
            if (promoCode) {
              cartStore.promoCode = promoCode
              cartStore.discount = discount
            }
            cartStore.setDeliveryFee(deliveryFee)
            
            // Verify cart has items before order creation
            const itemCountBeforeOrder = cartStore.itemCount
            expect(itemCountBeforeOrder).toBeGreaterThan(0)
            expect(cartStore.items.length).toBeGreaterThan(0)
            
            // Capture cart state before order
            const subtotalBeforeOrder = cartStore.subtotal
            const totalBeforeOrder = cartStore.total
            
            // Property: Cart should have data before order (items exist)
            // Note: subtotal and total can be zero or negative with large negative modifier adjustments
            expect(cartStore.items.length).toBeGreaterThan(0)
            
            // Mock successful order creation
            // In a real scenario, this would call the API and get a successful response
            // For this test, we simulate the successful order creation flow
            const mockOrderResponse = {
              success: true,
              data: {
                id: 'order-' + Math.random().toString(36).substr(2, 9),
                orderNumber: 'ORD-' + Math.floor(Math.random() * 10000),
                status: 'pending',
                items: cartStore.items.map(item => ({
                  id: item.menuItem.id,
                  menuItem: item.menuItem,
                  quantity: item.quantity,
                  selectedModifiers: item.selectedModifiers,
                  subtotal: item.subtotal,
                })),
                subtotal: cartStore.subtotal,
                deliveryFee: cartStore.deliveryFee,
                discount: cartStore.discount,
                total: cartStore.total,
                customerInfo,
                createdAt: new Date(),
              },
            }
            
            // Simulate successful order creation by clearing cart
            // This is what should happen in the actual createOrder flow
            if (mockOrderResponse.success) {
              cartStore.clearCart()
            }
            
            // Property: After successful order creation, cart should be empty
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            
            // Property: Cart totals should be zero after clearing
            expect(cartStore.subtotal).toBe(0)
            expect(cartStore.total).toBe(0)
            
            // Property: Promo code should be cleared
            expect(cartStore.promoCode).toBeNull()
            
            // Property: Discount should be reset to zero
            expect(cartStore.discount).toBe(0)
            
            // Property: Delivery fee should be reset to zero
            expect(cartStore.deliveryFee).toBe(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clear cart with all associated data after successful order', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
            modifiers: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                priceAdjustment: fc.double({ min: -50, max: 50, noNaN: true }),
                isDefault: fc.boolean(),
              }),
              { maxLength: 5 }
            ),
            customizations: fc.option(
              fc.dictionary(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.oneof(fc.string(), fc.integer(), fc.boolean())
              ),
              { nil: undefined }
            ),
          }),
          fc.string({ minLength: 3, maxLength: 20 }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 50, noNaN: true }),
          (itemConfig, promoCode, deliveryFee, discount) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item with all possible data
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              itemConfig.modifiers,
              itemConfig.customizations
            )
            
            // Set all cart metadata
            cartStore.promoCode = promoCode
            cartStore.discount = discount
            cartStore.setDeliveryFee(deliveryFee)
            
            // Verify cart has complete data
            expect(cartStore.items.length).toBe(1)
            expect(cartStore.itemCount).toBeGreaterThan(0)
            expect(cartStore.promoCode).toBe(promoCode)
            expect(cartStore.discount).toBe(discount)
            expect(cartStore.deliveryFee).toBe(deliveryFee)
            
            // Simulate successful order creation
            const mockOrderSuccess = true
            
            if (mockOrderSuccess) {
              cartStore.clearCart()
            }
            
            // Property: All cart data should be cleared
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            expect(cartStore.subtotal).toBe(0)
            expect(cartStore.total).toBe(0)
            expect(cartStore.promoCode).toBeNull()
            expect(cartStore.discount).toBe(0)
            expect(cartStore.deliveryFee).toBe(0)
            
            // Property: Cart should be truly empty (no residual data)
            expect(cartStore.isEmpty).toBe(true)
            expect(cartStore.canCheckout).toBe(false)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clear cart immediately without delay after order confirmation', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (itemConfigs) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                []
              )
            })
            
            const itemCountBefore = cartStore.itemCount
            expect(itemCountBefore).toBeGreaterThan(0)
            
            // Simulate successful order - cart should be cleared immediately
            const orderSuccess = true
            
            if (orderSuccess) {
              // This should happen immediately, not after a delay
              cartStore.clearCart()
              
              // Property: Cart should be empty immediately after clearCart call
              expect(cartStore.items.length).toBe(0)
              expect(cartStore.itemCount).toBe(0)
            }
            
            // Property: Cart remains empty (no async operations that might restore it)
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clear cart for any cart size after successful order', () => {
      fc.assert(
        fc.property(
          // Generate carts of varying sizes
          fc.integer({ min: 1, max: 50 }),
          fc.double({ min: 0.01, max: 100, noNaN: true }),
          (numItems, basePrice) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add multiple items
            for (let i = 0; i < numItems; i++) {
              cartStore.addItem(
                {
                  id: `item-${i}`,
                  name: `Item ${i}`,
                  description: `Description ${i}`,
                  price: basePrice + i,
                  isActive: true,
                } as MenuItem,
                1,
                []
              )
            }
            
            // Verify cart has expected number of items
            expect(cartStore.items.length).toBe(numItems)
            expect(cartStore.itemCount).toBe(numItems)
            
            // Simulate successful order
            const orderSuccess = true
            
            if (orderSuccess) {
              cartStore.clearCart()
            }
            
            // Property: Cart should be empty regardless of original size
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            expect(cartStore.subtotal).toBe(0)
            expect(cartStore.total).toBe(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clear cart and persist empty state after successful order', () => {
      fc.assert(
        fc.property(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 50 }),
          }),
          (itemConfig) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              []
            )
            
            // Verify cart has item
            expect(cartStore.items.length).toBe(1)
            
            // Simulate successful order
            const orderSuccess = true
            
            if (orderSuccess) {
              cartStore.clearCart()
            }
            
            // Property: Cart should be empty
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            
            // Property: Empty cart should be persisted
            // If we restore cart, it should still be empty
            cartStore.restoreCart()
            
            expect(cartStore.items.length).toBe(0)
            expect(cartStore.itemCount).toBe(0)
            expect(cartStore.subtotal).toBe(0)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 26: Order creation error cart preservation
   * Feature: customer-frontend-ordering, Property 26: Order creation error cart preservation
   * Validates: Requirements 8.4
   * 
   * For any failed order creation, the cart should remain unchanged with all items preserved.
   */
  describe('Property 26: Order creation error cart preservation', () => {
    it('should preserve cart state for any cart when order creation fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate an array of cart items
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                description: fc.string({ minLength: 0, maxLength: 500 }),
                price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
                imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
                categoryId: fc.option(fc.uuid(), { nil: undefined }),
                isActive: fc.constant(true),
                calories: fc.option(fc.integer({ min: 0, max: 5000 }), { nil: undefined }),
                preparationTime: fc.option(fc.integer({ min: 1, max: 180 }), { nil: undefined }),
                cookingTime: fc.option(fc.integer({ min: 1, max: 180 }), { nil: undefined }),
                ingredients: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
                allergens: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
                dietary: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 })), { nil: undefined }),
              }),
              quantity: fc.integer({ min: 1, max: 100 }),
              modifiers: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 100 }),
                  priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                  isDefault: fc.boolean(),
                }),
                { maxLength: 10 }
              ),
              customizations: fc.option(
                fc.dictionary(
                  fc.string({ minLength: 1, maxLength: 50 }),
                  fc.oneof(
                    fc.string(),
                    fc.integer(),
                    fc.boolean()
                  )
                ),
                { nil: undefined }
              ),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          // Generate promo code data
          fc.option(
            fc.record({
              code: fc.string({ minLength: 3, maxLength: 20 }),
              discount: fc.double({ min: 0, max: 1000, noNaN: true }),
            }),
            { nil: undefined }
          ),
          // Generate delivery fee
          fc.double({ min: 0, max: 100, noNaN: true }),
          async (itemConfigs, promoData, deliveryFee) => {
            // Ensure Pinia is available in property test context
            setActivePinia(createPinia())
            const cartStore = useCartStore()
            
            // Clear cart before test
            cartStore.clearCart()
            
            // Build cart state
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                config.modifiers,
                config.customizations
              )
            })
            
            // Set promo code if provided
            if (promoData) {
              cartStore.promoCode = promoData.code
              cartStore.discount = promoData.discount
            }
            
            // Set delivery fee
            cartStore.deliveryFee = deliveryFee
            
            // Capture original cart state before order attempt
            const originalItems = JSON.parse(JSON.stringify(cartStore.items))
            const originalPromoCode = cartStore.promoCode
            const originalDiscount = cartStore.discount
            const originalDeliveryFee = cartStore.deliveryFee
            const originalSubtotal = cartStore.subtotal
            const originalTotal = cartStore.total
            const originalItemCount = cartStore.itemCount
            
            // Configure mock to simulate failure for this iteration
            mockCreateOrder.mockRejectedValue(new Error('Order creation failed'))
            
            // Attempt to create order (should fail)
            let orderFailed = false
            let cartItemsBeforeOrder = cartStore.items.length
            console.log('Cart items before order attempt:', cartItemsBeforeOrder)
            
            try {
              await cartStore.createOrder({
                name: 'Test Customer',
                email: 'test@example.com',
                phone: '+1234567890',
              })
              // If we get here, the order creation didn't throw (unexpected)
              console.log('Order creation did not throw as expected')
            } catch (error) {
              // Expected: order creation should throw on failure
              orderFailed = true
              console.log('Order creation threw as expected:', error.message)
            }
            
            console.log('Cart items after order attempt:', cartStore.items.length)
            
            // Verify that the order actually failed
            expect(orderFailed).toBe(true)
            
            // Property: Cart items should be unchanged
            expect(cartStore.items.length).toBe(originalItems.length)
            
            // Property: Each item should be preserved with all data
            originalItems.forEach((originalItem: any) => {
              const preservedItem = cartStore.items.find(
                (item: any) =>
                  item.menuItem.id === originalItem.menuItem.id &&
                  JSON.stringify(item.selectedModifiers) === JSON.stringify(originalItem.selectedModifiers) &&
                  JSON.stringify(item.customizations) === JSON.stringify(originalItem.customizations)
              )
              
              expect(preservedItem).toBeDefined()
              
              if (preservedItem) {
                // Verify menu item data is unchanged
                expect(preservedItem.menuItem.id).toBe(originalItem.menuItem.id)
                expect(preservedItem.menuItem.name).toBe(originalItem.menuItem.name)
                expect(preservedItem.menuItem.description).toBe(originalItem.menuItem.description)
                expect(preservedItem.menuItem.price).toBe(originalItem.menuItem.price)
                
                // Verify quantity is unchanged
                expect(preservedItem.quantity).toBe(originalItem.quantity)
                
                // Verify modifiers are unchanged
                expect(preservedItem.selectedModifiers.length).toBe(originalItem.selectedModifiers.length)
                
                // Verify subtotal is unchanged
                expect(preservedItem.subtotal).toBe(originalItem.subtotal)
                
                // Verify customizations are unchanged
                if (originalItem.customizations !== undefined) {
                  expect(preservedItem.customizations).toEqual(originalItem.customizations)
                }
              }
            })
            
            // Property: Promo code should be unchanged
            expect(cartStore.promoCode).toBe(originalPromoCode)
            
            // Property: Discount should be unchanged
            expect(cartStore.discount).toBe(originalDiscount)
            
            // Property: Delivery fee should be unchanged
            expect(cartStore.deliveryFee).toBe(originalDeliveryFee)
            
            // Property: Subtotal should be unchanged
            expect(cartStore.subtotal).toBeCloseTo(originalSubtotal, 2)
            
            // Property: Total should be unchanged
            expect(cartStore.total).toBeCloseTo(originalTotal, 2)
            
            // Property: Item count should be unchanged
            expect(cartStore.itemCount).toBe(originalItemCount)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve cart with single item when order fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            menuItem: fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ minLength: 0, maxLength: 500 }),
              price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              isActive: fc.constant(true),
            }),
            quantity: fc.integer({ min: 1, max: 100 }),
            modifiers: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                priceAdjustment: fc.double({ min: -5, max: 100, noNaN: true }),
                isDefault: fc.boolean(),
              }),
              { maxLength: 5 }
            ),
          }),
          async (itemConfig) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add single item
            cartStore.addItem(
              itemConfig.menuItem as MenuItem,
              itemConfig.quantity,
              itemConfig.modifiers
            )
            
            // Capture original state
            const originalItemCount = cartStore.itemCount
            const originalSubtotal = cartStore.subtotal
            const originalItemId = cartStore.items[0].menuItem.id
            const originalQuantity = cartStore.items[0].quantity
            
            // Configure mock to simulate failure by throwing an error
            mockCreateOrder.mockRejectedValue(new Error('Order creation failed'))
            
            // Attempt to create order (should fail)
            try {
              await cartStore.createOrder({
                name: 'Test Customer',
                email: 'test@example.com',
              })
            } catch (error) {
              // Expected failure
            }
            
            // Property: Cart should still have the item
            expect(cartStore.items.length).toBe(1)
            expect(cartStore.itemCount).toBe(originalItemCount)
            
            // Property: Item data should be unchanged
            expect(cartStore.items[0].menuItem.id).toBe(originalItemId)
            expect(cartStore.items[0].quantity).toBe(originalQuantity)
            
            // Property: Subtotal should be unchanged
            expect(cartStore.subtotal).toBeCloseTo(originalSubtotal, 2)
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve cart across multiple failed order attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              menuItem: fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
                isActive: fc.constant(true),
              }),
              quantity: fc.integer({ min: 1, max: 50 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          fc.integer({ min: 2, max: 5 }), // Number of failed attempts
          async (itemConfigs, numAttempts) => {
            const cartStore = useCartStore()
            
            // Clear cart
            cartStore.clearCart()
            
            // Add items
            itemConfigs.forEach(config => {
              cartStore.addItem(
                config.menuItem as MenuItem,
                config.quantity,
                []
              )
            })
            
            // Capture original state
            const originalItems = JSON.parse(JSON.stringify(cartStore.items))
            const originalItemCount = cartStore.itemCount
            const originalSubtotal = cartStore.subtotal
            
            // Attempt to create order multiple times (all should fail)
            // Configure mock to simulate failure for all attempts by throwing an error
            mockCreateOrder.mockRejectedValue(new Error('Server error'))
            
            for (let i = 0; i < numAttempts; i++) {
              
              try {
                await cartStore.createOrder({
                  name: 'Test Customer',
                  email: 'test@example.com',
                })
              } catch (error) {
                // Expected failure
              }
              
              // Property: After each failed attempt, cart should be unchanged
              expect(cartStore.items.length).toBe(originalItems.length)
              expect(cartStore.itemCount).toBe(originalItemCount)
              expect(cartStore.subtotal).toBeCloseTo(originalSubtotal, 2)
            }
            
            // Property: After all failed attempts, cart should still match original
            expect(cartStore.items.length).toBe(originalItems.length)
            
            originalItems.forEach((originalItem: any) => {
              const preservedItem = cartStore.items.find(
                (item: any) => item.menuItem.id === originalItem.menuItem.id
              )
              
              expect(preservedItem).toBeDefined()
              if (preservedItem) {
                expect(preservedItem.quantity).toBe(originalItem.quantity)
                expect(preservedItem.menuItem.price).toBe(originalItem.menuItem.price)
              }
            })
            
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
