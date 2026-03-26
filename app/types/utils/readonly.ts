/**
 * Readonly utility types and immutable operation functions
 * 
 * This module provides TypeScript utility types for creating readonly variants
 * of existing types and utility functions for performing immutable operations
 * on readonly objects. These utilities help enforce immutability at the type level,
 * particularly useful for API response types that should not be mutated.
 * 
 * @module types/utils/readonly
 */

import type { OrderAPI, OrderItemAPI, OrderStatus } from '../api/order.api'
import type { MenuItemAPI, CategoryAPI, ModifierAPI, ModifierGroupAPI } from '../api/menu.api'

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Makes all properties of T deeply readonly
 * 
 * @template T - The type to make readonly
 * @example
 * ```typescript
 * interface User {
 *   name: string
 *   address: {
 *     street: string
 *     city: string
 *   }
 * }
 * 
 * type ReadonlyUser = DeepReadonly<User>
 * // All properties including nested ones are readonly
 * ```
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P]
}

/**
 * Makes all properties of T readonly (shallow)
 * 
 * @template T - The type to make readonly
 * @example
 * ```typescript
 * interface User {
 *   name: string
 *   age: number
 * }
 * 
 * type ReadonlyUser = Immutable<User>
 * // Top-level properties are readonly
 * ```
 */
export type Immutable<T> = {
  readonly [P in keyof T]: T[P]
}

/**
 * Makes specified properties of T readonly
 * 
 * @template T - The base type
 * @template K - Keys to make readonly
 * @example
 * ```typescript
 * interface User {
 *   id: string
 *   name: string
 *   email: string
 * }
 * 
 * type UserWithReadonlyId = ReadonlyProps<User, 'id'>
 * // Only 'id' is readonly, other properties remain mutable
 * ```
 */
export type ReadonlyProps<T, K extends keyof T> = Omit<T, K> & {
  readonly [P in K]: T[P]
}

/**
 * Makes all properties of T mutable (removes readonly)
 * 
 * @template T - The type to make mutable
 * @example
 * ```typescript
 * interface ReadonlyUser {
 *   readonly id: string
 *   readonly name: string
 * }
 * 
 * type MutableUser = Mutable<ReadonlyUser>
 * // All properties are now mutable
 * ```
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * Makes all properties of T deeply mutable (removes readonly recursively)
 * 
 * @template T - The type to make mutable
 * @example
 * ```typescript
 * interface ReadonlyUser {
 *   readonly name: string
 *   readonly address: {
 *     readonly street: string
 *     readonly city: string
 *   }
 * }
 * 
 * type MutableUser = DeepMutable<ReadonlyUser>
 * // All properties including nested ones are mutable
 * ```
 */
export type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepMutable<T[P]>
    : T[P]
}

// ============================================================================
// IMMUTABLE OPERATION FUNCTIONS
// ============================================================================

/**
 * Creates a new object with updated properties without mutating the original
 * 
 * This is the core utility function for performing immutable updates on readonly objects.
 * It creates a shallow copy of the original object and applies the provided updates.
 * Undefined values in updates are filtered out to avoid overwriting existing values with undefined.
 * 
 * @template T - The type of the object to update
 * @param obj - The original readonly object
 * @param updates - Partial object with properties to update
 * @returns A new object with the updates applied
 * 
 * @example
 * ```typescript
 * const originalItem: MenuItemAPI = {
 *   id: '1',
 *   name: 'Pizza',
 *   price: 10,
 *   isActive: true,
 *   // ... other readonly properties
 * }
 * 
 * // Create updated version without mutating original
 * const updatedItem = updateReadonlyObject(originalItem, { 
 *   price: 12,
 *   isActive: false 
 * })
 * 
 * console.log(originalItem.price) // 10 (unchanged)
 * console.log(updatedItem.price)  // 12 (updated)
 * ```
 */
export function updateReadonlyObject<T>(obj: T, updates: Partial<T>): T {
  // Filter out undefined values from updates to avoid overwriting existing values
  const filteredUpdates: Partial<T> = {}
  Object.keys(updates).forEach(key => {
    const value = updates[key as keyof T]
    if (value !== undefined) {
      filteredUpdates[key as keyof T] = value
    }
  })
  return { ...obj, ...filteredUpdates }
}

/**
 * Creates a new array with updated items without mutating the original
 * 
 * This function allows updating specific items in a readonly array by their index
 * or by a predicate function, returning a new array with the updates applied.
 * 
 * @template T - The type of items in the array
 * @param array - The original readonly array
 * @param indexOrPredicate - Index number or predicate function to find items to update
 * @param updates - Partial object with properties to update, or update function
 * @returns A new array with the updates applied
 * 
 * @example
 * ```typescript
 * const items: readonly MenuItemAPI[] = [item1, item2, item3]
 * 
 * // Update by index
 * const updatedItems = updateReadonlyArray(items, 1, { price: 15 })
 * 
 * // Update by predicate
 * const updatedItems2 = updateReadonlyArray(
 *   items, 
 *   item => item.id === 'target-id',
 *   { isActive: false }
 * )
 * 
 * // Update with function
 * const updatedItems3 = updateReadonlyArray(
 *   items,
 *   0,
 *   item => ({ ...item, price: item.price * 1.1 })
 * )
 * ```
 */
export function updateReadonlyArray<T>(
  array: readonly T[],
  indexOrPredicate: number | ((item: T) => boolean),
  updates: Partial<T> | ((item: T) => T)
): T[] {
  return array.map((item, index) => {
    const shouldUpdate = typeof indexOrPredicate === 'number' 
      ? index === indexOrPredicate
      : indexOrPredicate(item)
    
    if (!shouldUpdate) return item
    
    return typeof updates === 'function' 
      ? updates(item)
      : updateReadonlyObject(item, updates)
  })
}

// ============================================================================
// SPECIALIZED FUNCTIONS FOR SPECIFIC TYPES
// ============================================================================

/**
 * Updates an order's status immutably
 * 
 * @param order - The original readonly order
 * @param status - The new order status
 * @returns A new order object with updated status and timestamp
 */
export function updateOrderStatus(order: OrderAPI, status: OrderStatus): OrderAPI {
  return updateReadonlyObject(order, { 
    status,
    updatedAt: new Date().toISOString()
  })
}

/**
 * Updates an order with new items immutably
 * 
 * @param order - The original readonly order
 * @param items - The new readonly array of order items
 * @returns A new order object with updated items, total, and timestamp
 */
export function updateOrderWithItems(
  order: OrderAPI, 
  items: readonly OrderItemAPI[]
): OrderAPI {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0)
  
  return updateReadonlyObject(order, { 
    items,
    total,
    updatedAt: new Date().toISOString()
  })
}

/**
 * Updates a menu item's price immutably
 * 
 * @param menuItem - The original readonly menu item
 * @param price - The new price
 * @returns A new menu item object with updated price and timestamp
 */
export function updateMenuItemPrice(menuItem: MenuItemAPI, price: number): MenuItemAPI {
  return updateReadonlyObject(menuItem, { 
    price,
    updatedAt: new Date().toISOString()
  })
}

/**
 * Updates a menu item's availability status immutably
 * 
 * @param menuItem - The original readonly menu item
 * @param isActive - The new availability status
 * @returns A new menu item object with updated status and timestamp
 */
export function updateMenuItemAvailability(menuItem: MenuItemAPI, isActive: boolean): MenuItemAPI {
  return updateReadonlyObject(menuItem, { 
    isActive,
    updatedAt: new Date().toISOString()
  })
}

/**
 * Updates a category's sort order immutably
 * 
 * @param category - The original readonly category
 * @param sortOrder - The new sort order
 * @returns A new category object with updated sort order
 */
export function updateCategorySortOrder(category: CategoryAPI, sortOrder: number): CategoryAPI {
  return updateReadonlyObject(category, { sortOrder })
}

/**
 * Updates a modifier's price adjustment immutably
 * 
 * @param modifier - The original readonly modifier
 * @param priceAdjustment - The new price adjustment
 * @returns A new modifier object with updated price adjustment
 */
export function updateModifierPrice(modifier: ModifierAPI, priceAdjustment: number): ModifierAPI {
  return updateReadonlyObject(modifier, { priceAdjustment })
}

/**
 * Updates modifiers in a modifier group immutably
 * 
 * @param modifierGroup - The original readonly modifier group
 * @param modifiers - The new readonly array of modifiers
 * @returns A new modifier group object with updated modifiers
 */
export function updateModifierGroupModifiers(
  modifierGroup: ModifierGroupAPI, 
  modifiers: readonly ModifierAPI[]
): ModifierGroupAPI {
  return updateReadonlyObject(modifierGroup, { modifiers })
}

/**
 * Updates an order item's quantity and recalculates subtotal immutably
 * 
 * @param orderItem - The original readonly order item
 * @param quantity - The new quantity
 * @returns A new order item object with updated quantity and recalculated subtotal
 */
export function updateOrderItemQuantity(orderItem: OrderItemAPI, quantity: number): OrderItemAPI {
  const subtotal = orderItem.price * quantity
  return updateReadonlyObject(orderItem, { quantity, subtotal })
}

/**
 * Adds customizations to an order item immutably
 * 
 * @param orderItem - The original readonly order item
 * @param customizations - The customizations to add or update
 * @returns A new order item object with updated customizations
 */
export function updateOrderItemCustomizations(
  orderItem: OrderItemAPI, 
  customizations: Record<string, any>
): OrderItemAPI {
  const mergedCustomizations = {
    ...orderItem.customizations,
    ...customizations
  }
  
  return updateReadonlyObject(orderItem, { 
    customizations: mergedCustomizations 
  })
}
