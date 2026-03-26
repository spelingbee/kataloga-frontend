/**
 * Mock Factory Functions Tests
 * 
 * Tests for the new mock factory functions that create UI-compatible mock data.
 * These tests verify that the factory functions generate proper mock data with
 * correct types and sensible defaults.
 */

import { describe, it, expect } from 'vitest'
import {
  createMockMenuItem,
  createMockCategory,
  createMockOrder,
  createMockOrderItem,
  createMockMenuItemUI,
  createMockCategoryUI,
  createMockOrderUI,
  createMockOrderItemUI,
  createMockMenuItems,
  createMockCategories,
  createMockOrders,
  createMockMenuItemsUI,
  createMockCategoriesUI,
  createMockOrdersUI
} from '~/types/mocks'
import { OrderStatus } from '~/types/api/order.api'

describe('Mock Factory Functions', () => {
  describe('Basic Mock Factories', () => {
    it('should create a mock MenuItem with sensible defaults', () => {
      const mockItem = createMockMenuItem()
      
      expect(mockItem.id).toBeDefined()
      expect(mockItem.name).toBe('Mock Menu Item')
      expect(mockItem.price).toBe(12.99)
      expect(mockItem.description).toBe('A delicious mock menu item')
      expect(mockItem.isActive).toBe(true)
      expect(mockItem.stockQuantity).toBe(100)
      expect(mockItem.ingredients).toEqual(['ingredient1', 'ingredient2'])
      expect(mockItem.allergens).toEqual(['gluten'])
      expect(mockItem.dietary).toEqual(['vegetarian'])
    })

    it('should create a mock MenuItem with custom overrides', () => {
      const mockItem = createMockMenuItem({
        name: 'Custom Pizza',
        price: 18.99,
        description: 'A custom pizza description',
        isActive: false,
        calories: 650
      })
      
      expect(mockItem.name).toBe('Custom Pizza')
      expect(mockItem.price).toBe(18.99)
      expect(mockItem.description).toBe('A custom pizza description')
      expect(mockItem.isActive).toBe(false)
      expect(mockItem.calories).toBe(650)
    })

    it('should create a mock Category with sensible defaults', () => {
      const mockCategory = createMockCategory()
      
      expect(mockCategory.id).toBeDefined()
      expect(mockCategory.name).toBe('Mock Category')
      expect(mockCategory.description).toBe('A mock category for testing')
      expect(mockCategory.sortOrder).toBe(0)
      expect(mockCategory.count).toBe(5)
    })

    it('should create a mock Order with sensible defaults', () => {
      const mockOrder = createMockOrder()
      
      expect(mockOrder.id).toBeDefined()
      expect(mockOrder.orderNumber).toBeDefined()
      expect(mockOrder.status).toBe(OrderStatus.PENDING)
      expect(mockOrder.total).toBe(29.99)
      expect(mockOrder.items).toHaveLength(1)
      expect(mockOrder.orderType).toBe('delivery')
      expect(mockOrder.subtotal).toBe(24.99)
      expect(mockOrder.deliveryFee).toBe(5.00)
    })

    it('should create a mock OrderItem with sensible defaults', () => {
      const mockOrderItem = createMockOrderItem()
      
      expect(mockOrderItem.id).toBeDefined()
      expect(mockOrderItem.menuItemId).toBe('mock-menu-item-1')
      expect(mockOrderItem.quantity).toBe(1)
      expect(mockOrderItem.price).toBe(12.99)
      expect(mockOrderItem.subtotal).toBe(12.99)
      expect(mockOrderItem.customizations).toEqual({ size: 'medium', spice: 'mild' })
    })
  })

  describe('UI-Compatible Mock Factories', () => {
    it('should create a MenuItemUI with proper UI fields', () => {
      const uiItem = createMockMenuItemUI({
        name: 'UI Pizza',
        price: 15.99
      })
      
      expect(uiItem.name).toBe('UI Pizza')
      expect(uiItem.price).toBe(15.99)
      expect(uiItem.isAvailable).toBe(true)
      expect(uiItem.badges).toEqual([])
      expect(uiItem.modifierGroups).toEqual([])
      expect(uiItem.category).toBeNull()
      expect(typeof uiItem.createdAt).toBe('string')
      expect(typeof uiItem.updatedAt).toBe('string')
    })

    it('should create a CategoryUI with proper UI fields', () => {
      const uiCategory = createMockCategoryUI({
        name: 'UI Category',
        count: 10
      })
      
      expect(uiCategory.name).toBe('UI Category')
      expect(uiCategory.count).toBe(10)
      expect(uiCategory.sortOrder).toBe(0)
    })

    it('should create an OrderUI with proper UI fields', () => {
      const customerInfo = { name: 'John Doe', phone: '123-456-7890' }
      const uiOrder = createMockOrderUI({
        status: OrderStatus.CONFIRMED,
        total: 35.99
      }, customerInfo)
      
      expect(uiOrder.status).toBe(OrderStatus.CONFIRMED)
      expect(uiOrder.total).toBe(35.99)
      expect(uiOrder.customerInfo).toEqual(customerInfo)
      expect(uiOrder.subtotal).toBeDefined()
      expect(uiOrder.deliveryFee).toBeDefined()
      expect(uiOrder.tax).toBeDefined()
      expect(uiOrder.items).toHaveLength(1)
    })

    it('should create an OrderItemUI with proper UI fields', () => {
      const uiOrderItem = createMockOrderItemUI({
        quantity: 2,
        price: 8.99
      })
      
      expect(uiOrderItem.quantity).toBe(2)
      expect(uiOrderItem.price).toBe(8.99)
      expect(uiOrderItem.subtotal).toBe(17.98)
      expect(uiOrderItem.menuItem).toBeDefined()
      expect(uiOrderItem.menuItem.name).toBe('Mock Menu Item')
      expect(uiOrderItem.selectedModifiers).toEqual([])
    })
  })

  describe('Batch Creation Utilities', () => {
    it('should create multiple mock MenuItems', () => {
      const mockItems = createMockMenuItems(3, { categoryId: 'pizza-category' })
      
      expect(mockItems).toHaveLength(3)
      expect(mockItems[0].name).toBe('Mock Item 1')
      expect(mockItems[1].name).toBe('Mock Item 2')
      expect(mockItems[2].name).toBe('Mock Item 3')
      expect(mockItems[0].categoryId).toBe('pizza-category')
      expect(mockItems[1].categoryId).toBe('pizza-category')
      expect(mockItems[2].categoryId).toBe('pizza-category')
    })

    it('should create multiple mock Categories', () => {
      const mockCategories = createMockCategories(2)
      
      expect(mockCategories).toHaveLength(2)
      expect(mockCategories[0].name).toBe('Category 1')
      expect(mockCategories[1].name).toBe('Category 2')
      expect(mockCategories[0].sortOrder).toBe(0)
      expect(mockCategories[1].sortOrder).toBe(1)
    })

    it('should create multiple mock Orders', () => {
      const mockOrders = createMockOrders(2, { orderType: 'pickup' })
      
      expect(mockOrders).toHaveLength(2)
      expect(mockOrders[0].orderType).toBe('pickup')
      expect(mockOrders[1].orderType).toBe('pickup')
      expect(mockOrders[0].orderNumber).toBe('ORD-001')
      expect(mockOrders[1].orderNumber).toBe('ORD-002')
    })

    it('should create multiple UI-compatible mock MenuItems', () => {
      const uiItems = createMockMenuItemsUI(2, { isAvailable: true })
      
      expect(uiItems).toHaveLength(2)
      expect(uiItems[0].isAvailable).toBe(true)
      expect(uiItems[1].isAvailable).toBe(true)
      expect(uiItems[0].badges).toEqual([])
      expect(uiItems[1].badges).toEqual([])
    })

    it('should create multiple UI-compatible mock Categories', () => {
      const uiCategories = createMockCategoriesUI(2)
      
      expect(uiCategories).toHaveLength(2)
      expect(uiCategories[0].name).toBe('Category 1')
      expect(uiCategories[1].name).toBe('Category 2')
    })

    it('should create multiple UI-compatible mock Orders', () => {
      const customerInfo = { name: 'Jane Doe', phone: '987-654-3210' }
      const uiOrders = createMockOrdersUI(2, { orderType: 'delivery' }, customerInfo)
      
      expect(uiOrders).toHaveLength(2)
      expect(uiOrders[0].orderType).toBe('delivery')
      expect(uiOrders[1].orderType).toBe('delivery')
      expect(uiOrders[0].customerInfo).toEqual(customerInfo)
      expect(uiOrders[1].customerInfo).toEqual(customerInfo)
    })
  })

  describe('Type Compatibility', () => {
    it('should create mock data with undefined for nullable fields (UI standard)', () => {
      const mockItem = createMockMenuItem()
      
      // Test that the factory can handle undefined values properly
      const mockItemWithUndefined = createMockMenuItem({
        description: undefined,
        imageUrl: undefined,
        categoryId: undefined
      })
      
      // The factory should respect undefined values when explicitly set
      expect(mockItemWithUndefined.description).toBeUndefined()
      expect(mockItemWithUndefined.imageUrl).toBeUndefined()
      expect(mockItemWithUndefined.categoryId).toBeUndefined()
    })

    it('should create UI mock data that is compatible with UI types', () => {
      const uiItem = createMockMenuItemUI()
      
      // Should have all required UI fields
      expect(uiItem.isAvailable).toBeDefined()
      expect(uiItem.stockQuantity).toBeDefined()
      expect(uiItem.badges).toBeDefined()
      expect(uiItem.modifierGroups).toBeDefined()
      expect(uiItem.category).toBeDefined()
      
      // Nullable fields should use undefined (Vue standard)
      expect(uiItem.description === undefined || typeof uiItem.description === 'string').toBe(true)
      expect(uiItem.imageUrl === undefined || typeof uiItem.imageUrl === 'string').toBe(true)
      expect(uiItem.categoryId === undefined || typeof uiItem.categoryId === 'string').toBe(true)
    })
  })
})