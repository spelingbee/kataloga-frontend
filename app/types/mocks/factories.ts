/**
 * Mock Data Factory Functions
 * 
 * This module provides factory functions to create mock data that's compatible
 * with UI types. These factories generate test data with proper defaults and
 * type compatibility for use in tests and development.
 * 
 * @module types/mocks/factories
 */

import type { MenuItemMock, CategoryMock, OrderMock, OrderItemMock } from './index'
import type { MenuItemUI, CategoryUI } from '../ui/menu.ui'
import type { OrderUI, OrderItemUI, CustomerInfo } from '../ui/order.ui'
import { OrderStatus } from '../api/order.api'
import { menuItemMockToUI, categoryMockToUI, orderMockToUI, orderItemMockToUI } from '../utils/converters'

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Create a mock MenuItem with sensible defaults
 * 
 * @param overrides - Optional fields to override defaults
 * @returns A complete MenuItemMock with all fields populated
 * 
 * @example
 * ```typescript
 * const mockItem = createMockMenuItem({
 *   name: 'Custom Pizza',
 *   price: 15.99,
 *   description: 'A delicious custom pizza'
 * })
 * ```
 */
export function createMockMenuItem(overrides: Partial<MenuItemMock> = {}): MenuItemMock {
  const id = overrides.id ?? `menu-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    name: overrides.name ?? 'Mock Menu Item',
    description: overrides.hasOwnProperty('description') ? overrides.description : 'A delicious mock menu item',
    price: overrides.price ?? 12.99,
    imageUrl: overrides.hasOwnProperty('imageUrl') ? overrides.imageUrl : `https://example.com/images/${id}.jpg`,
    categoryId: overrides.hasOwnProperty('categoryId') ? overrides.categoryId : 'mock-category-1',
    menuId: overrides.menuId ?? 'mock-menu-1',
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    stockQuantity: overrides.stockQuantity ?? 100,
    calories: overrides.calories ?? 450,
    preparationTime: overrides.preparationTime ?? 15,
    cookingTime: overrides.cookingTime ?? 10,
    ingredients: overrides.ingredients ?? ['ingredient1', 'ingredient2'],
    allergens: overrides.allergens ?? ['gluten'],
    dietary: overrides.dietary ?? ['vegetarian'],
    isNew: overrides.isNew ?? false,
    isPopular: overrides.isPopular ?? false
  }
}

/**
 * Create a mock Category with sensible defaults
 * 
 * @param overrides - Optional fields to override defaults
 * @returns A complete CategoryMock with all fields populated
 * 
 * @example
 * ```typescript
 * const mockCategory = createMockCategory({
 *   name: 'Pizzas',
 *   count: 12
 * })
 * ```
 */
export function createMockCategory(overrides: Partial<CategoryMock> = {}): CategoryMock {
  const id = overrides.id ?? `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    name: overrides.name ?? 'Mock Category',
    description: overrides.hasOwnProperty('description') ? overrides.description : 'A mock category for testing',
    imageUrl: overrides.hasOwnProperty('imageUrl') ? overrides.imageUrl : `https://example.com/categories/${id}.jpg`,
    sortOrder: overrides.sortOrder ?? 0,
    icon: overrides.hasOwnProperty('icon') ? overrides.icon : 'category-icon',
    count: overrides.count ?? 5
  }
}

/**
 * Create a mock Order with sensible defaults
 * 
 * @param overrides - Optional fields to override defaults
 * @returns A complete OrderMock with all fields populated
 * 
 * @example
 * ```typescript
 * const mockOrder = createMockOrder({
 *   status: OrderStatus.CONFIRMED,
 *   total: 25.99,
 *   orderType: 'delivery'
 * })
 * ```
 */
export function createMockOrder(overrides: Partial<OrderMock> = {}): OrderMock {
  const id = overrides.id ?? `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const orderNumber = overrides.orderNumber ?? `ORD-${Date.now().toString().slice(-6)}`
  
  return {
    id,
    orderNumber,
    status: overrides.status ?? OrderStatus.PENDING,
    total: overrides.total ?? 29.99,
    items: overrides.items ?? [createMockOrderItem()],
    customerId: overrides.customerId ?? 'mock-customer-1',
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    estimatedTime: overrides.estimatedTime ?? 30,
    deliveryAddress: overrides.deliveryAddress ?? '123 Mock Street, Test City',
    orderType: overrides.orderType ?? 'delivery',
    subtotal: overrides.subtotal ?? 24.99,
    deliveryFee: overrides.deliveryFee ?? 5.00,
    discount: overrides.discount ?? 0,
    tax: overrides.tax ?? 2.50
  }
}

/**
 * Create a mock OrderItem with sensible defaults
 * 
 * @param overrides - Optional fields to override defaults
 * @returns A complete OrderItemMock with all fields populated
 * 
 * @example
 * ```typescript
 * const mockOrderItem = createMockOrderItem({
 *   quantity: 2,
 *   price: 15.99
 * })
 * ```
 */
export function createMockOrderItem(overrides: Partial<OrderItemMock> = {}): OrderItemMock {
  const id = overrides.id ?? `order-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const quantity = overrides.quantity ?? 1
  const price = overrides.price ?? 12.99
  
  return {
    id,
    menuItemId: overrides.menuItemId ?? 'mock-menu-item-1',
    quantity,
    price,
    subtotal: overrides.subtotal ?? (quantity * price),
    customizations: overrides.customizations ?? { size: 'medium', spice: 'mild' },
    notes: overrides.notes ?? 'Mock order item notes'
  }
}

// ============================================================================
// UI-COMPATIBLE MOCK FACTORIES
// ============================================================================

/**
 * Create a mock MenuItemUI directly (bypassing API conversion)
 * 
 * @param overrides - Optional fields to override defaults
 * @returns A complete MenuItemUI ready for use in components
 * 
 * @example
 * ```typescript
 * const uiItem = createMockMenuItemUI({
 *   name: 'Deluxe Pizza',
 *   price: 18.99,
 *   isAvailable: true
 * })
 * ```
 */
export function createMockMenuItemUI(overrides: Partial<MenuItemMock> = {}): MenuItemUI {
  const mockItem = createMockMenuItem(overrides)
  return menuItemMockToUI(mockItem)
}

/**
 * Create a mock CategoryUI directly (bypassing API conversion)
 * 
 * @param overrides - Optional fields to override defaults
 * @returns A complete CategoryUI ready for use in components
 * 
 * @example
 * ```typescript
 * const uiCategory = createMockCategoryUI({
 *   name: 'Desserts',
 *   count: 8
 * })
 * ```
 */
export function createMockCategoryUI(overrides: Partial<CategoryMock> = {}): CategoryUI {
  const mockCategory = createMockCategory(overrides)
  return categoryMockToUI(mockCategory)
}

/**
 * Create a mock OrderUI directly (bypassing API conversion)
 * 
 * @param overrides - Optional fields to override defaults
 * @param customerInfo - Customer information for the order
 * @returns A complete OrderUI ready for use in components
 * 
 * @example
 * ```typescript
 * const customerInfo = { name: 'John Doe', phone: '123-456-7890' }
 * const uiOrder = createMockOrderUI({
 *   status: OrderStatus.DELIVERED,
 *   total: 45.99
 * }, customerInfo)
 * ```
 */
export function createMockOrderUI(
  overrides: Partial<OrderMock> = {},
  customerInfo?: CustomerInfo
): OrderUI {
  const mockOrder = createMockOrder(overrides)
  const defaultCustomerInfo: CustomerInfo = {
    name: 'Mock Customer',
    phone: '+1-555-0123',
    email: 'mock@example.com',
    address: '123 Mock Street, Test City'
  }
  
  return orderMockToUI(mockOrder, customerInfo ?? defaultCustomerInfo)
}

/**
 * Create a mock OrderItemUI directly (bypassing API conversion)
 * 
 * @param overrides - Optional fields to override defaults
 * @returns A complete OrderItemUI ready for use in components
 * 
 * @example
 * ```typescript
 * const uiOrderItem = createMockOrderItemUI({
 *   quantity: 3,
 *   price: 8.99
 * })
 * ```
 */
export function createMockOrderItemUI(overrides: Partial<OrderItemMock> = {}): OrderItemUI {
  const mockOrderItem = createMockOrderItem(overrides)
  return orderItemMockToUI(mockOrderItem)
}

// ============================================================================
// BATCH CREATION UTILITIES
// ============================================================================

/**
 * Create multiple mock MenuItems
 * 
 * @param count - Number of items to create
 * @param baseOverrides - Base overrides applied to all items
 * @returns Array of MenuItemMock objects
 * 
 * @example
 * ```typescript
 * const mockItems = createMockMenuItems(5, { categoryId: 'pizza-category' })
 * ```
 */
export function createMockMenuItems(
  count: number,
  baseOverrides: Partial<MenuItemMock> = {}
): MenuItemMock[] {
  return Array.from({ length: count }, (_, index) =>
    createMockMenuItem({
      ...baseOverrides,
      name: `${baseOverrides.name ?? 'Mock Item'} ${index + 1}`,
      price: (baseOverrides.price ?? 10) + index
    })
  )
}

/**
 * Create multiple mock Categories
 * 
 * @param count - Number of categories to create
 * @param baseOverrides - Base overrides applied to all categories
 * @returns Array of CategoryMock objects
 * 
 * @example
 * ```typescript
 * const mockCategories = createMockCategories(3)
 * ```
 */
export function createMockCategories(
  count: number,
  baseOverrides: Partial<CategoryMock> = {}
): CategoryMock[] {
  return Array.from({ length: count }, (_, index) =>
    createMockCategory({
      ...baseOverrides,
      name: `${baseOverrides.name ?? 'Category'} ${index + 1}`,
      sortOrder: index
    })
  )
}

/**
 * Create multiple mock Orders
 * 
 * @param count - Number of orders to create
 * @param baseOverrides - Base overrides applied to all orders
 * @returns Array of OrderMock objects
 * 
 * @example
 * ```typescript
 * const mockOrders = createMockOrders(10, { orderType: 'delivery' })
 * ```
 */
export function createMockOrders(
  count: number,
  baseOverrides: Partial<OrderMock> = {}
): OrderMock[] {
  return Array.from({ length: count }, (_, index) =>
    createMockOrder({
      ...baseOverrides,
      orderNumber: `ORD-${String(index + 1).padStart(3, '0')}`,
      total: (baseOverrides.total ?? 20) + (index * 5)
    })
  )
}

/**
 * Create multiple UI-compatible mock MenuItems
 * 
 * @param count - Number of items to create
 * @param baseOverrides - Base overrides applied to all items
 * @returns Array of MenuItemUI objects
 * 
 * @example
 * ```typescript
 * const uiItems = createMockMenuItemsUI(5, { isAvailable: true })
 * ```
 */
export function createMockMenuItemsUI(
  count: number,
  baseOverrides: Partial<MenuItemMock> = {}
): MenuItemUI[] {
  const mockItems = createMockMenuItems(count, baseOverrides)
  return mockItems.map(menuItemMockToUI)
}

/**
 * Create multiple UI-compatible mock Categories
 * 
 * @param count - Number of categories to create
 * @param baseOverrides - Base overrides applied to all categories
 * @returns Array of CategoryUI objects
 * 
 * @example
 * ```typescript
 * const uiCategories = createMockCategoriesUI(3)
 * ```
 */
export function createMockCategoriesUI(
  count: number,
  baseOverrides: Partial<CategoryMock> = {}
): CategoryUI[] {
  const mockCategories = createMockCategories(count, baseOverrides)
  return mockCategories.map(categoryMockToUI)
}

/**
 * Create multiple UI-compatible mock Orders
 * 
 * @param count - Number of orders to create
 * @param baseOverrides - Base overrides applied to all orders
 * @param customerInfo - Customer information for all orders
 * @returns Array of OrderUI objects
 * 
 * @example
 * ```typescript
 * const customerInfo = { name: 'John Doe', phone: '123-456-7890' }
 * const uiOrders = createMockOrdersUI(10, { orderType: 'pickup' }, customerInfo)
 * ```
 */
export function createMockOrdersUI(
  count: number,
  baseOverrides: Partial<OrderMock> = {},
  customerInfo?: CustomerInfo
): OrderUI[] {
  const mockOrders = createMockOrders(count, baseOverrides)
  const defaultCustomerInfo: CustomerInfo = {
    name: 'Mock Customer',
    phone: '+1-555-0123',
    email: 'mock@example.com',
    address: '123 Mock Street, Test City'
  }
  
  return mockOrders.map(mockOrder => 
    orderMockToUI(mockOrder, customerInfo ?? defaultCustomerInfo)
  )
}