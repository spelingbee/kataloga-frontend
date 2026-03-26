/**
 * Runtime validation for UI types.
 * Used for validating data loaded from cache or untrusted sources.
 */

import type { CategoryUI, MenuItemUI } from '~/types/ui/menu.ui'

/**
 * Validates if the input is a valid CategoryUI object
 */
export function isValidCategoryUI(data: unknown): data is CategoryUI {
  if (!data || typeof data !== 'object') return false
  
  const c = data as Partial<CategoryUI>
  
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.slug === 'string' &&
    typeof c.sortOrder === 'number' &&
    typeof c.count === 'number'
    // Optional fields (undefined in UI types) check skipped or just type checked if present
  )
}

/**
 * Validates if the input is an array of CategoryUI objects
 */
export function isValidCategoryUIArray(data: unknown): data is CategoryUI[] {
  if (!Array.isArray(data)) return false
  return data.every(isValidCategoryUI)
}

/**
 * Validates if the input is a valid MenuItemUI object
 */
export function isValidMenuItemUI(data: unknown): data is MenuItemUI {
  if (!data || typeof data !== 'object') return false
  
  const m = data as Partial<MenuItemUI>
  
  // Basic scalar checks
  const hasScalars = 
    typeof m.id === 'string' &&
    typeof m.name === 'string' &&
    typeof m.price === 'number' &&
    typeof m.menuId === 'string' &&
    typeof m.isActive === 'boolean' &&
    typeof m.createdAt === 'string' &&
    typeof m.updatedAt === 'string' &&
    typeof m.isAvailable === 'boolean' &&
    typeof m.stockQuantity === 'number' &&
    typeof m.isNew === 'boolean' &&
    typeof m.isPopular === 'boolean'
    
  if (!hasScalars) return false

  // Arrays checks (lightweight check: just isArray)
  const hasArrays =
    Array.isArray(m.ingredients) &&
    Array.isArray(m.allergens) &&
    Array.isArray(m.dietary) &&
    Array.isArray(m.badges) &&
    Array.isArray(m.modifierGroups)
    
  if (!hasArrays) return false
  
  // Category relationship
  if (m.category !== null && !isValidCategoryUI(m.category)) {
    return false
  }
  
  return true
}

/**
 * Validates if the input is an array of MenuItemUI objects
 */
export function isValidMenuItemUIArray(data: unknown): data is MenuItemUI[] {
  if (!Array.isArray(data)) return false
  return data.every(isValidMenuItemUI)
}
