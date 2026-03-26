/**
 * Mock data type definitions for testing
 * Re-exports all mock types and factory functions
 */

export type { MenuItemMock, CategoryMock } from './menu.mock'
export type { OrderMock, OrderItemMock } from './order.mock'

// Export factory functions for creating mock data
export {
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
} from './factories'
