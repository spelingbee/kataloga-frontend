/**
 * UI model types for menu-related components
 * 
 * These types are mutable and include computed/display fields that are
 * specific to the frontend. They extend API types with additional
 * properties needed for UI components and user interactions.
 * 
 * @module types/ui/menu
 */

import type { MenuItemAPI, CategoryAPI, ModifierAPI, ModifierGroupAPI } from '../api/menu.api'

/**
 * Menu item for UI components
 * 
 * UI-specific menu item type that uses undefined for nullable fields (Vue standard)
 * instead of null (API standard). This type should be used in Vue components, 
 * stores, and composables.
 * 
 * @interface MenuItemUI
 * @example
 * ```typescript
 * // In a component
 * interface Props {
 *   item: MenuItemUI
 * }
 * 
 * // Access computed fields
 * console.log(item.subtotal) // Available
 * console.log(item.isAvailable) // Available
 * ```
 */
export interface MenuItemUI {
  // Core API fields with Vue-compatible nullable types
  /** Unique identifier for the menu item */
  id: string
  /** Display name of the menu item */
  name: string
  /** Optional description of the menu item (undefined for Vue compatibility) */
  description: string | undefined
  /** Price in the tenant's currency */
  price: number
  /** Optional URL to the item's image (undefined for Vue compatibility) */
  imageUrl: string | undefined
  /** ID of the category this item belongs to (undefined for Vue compatibility) */
  categoryId: string | undefined
  /** ID of the menu this item belongs to */
  menuId: string
  /** Whether the item is currently active/available */
  isActive: boolean
  /** ISO timestamp when the item was created */
  createdAt: string
  /** ISO timestamp when the item was last updated */
  updatedAt: string
  // Computed display fields
  /** Whether the item is currently available for ordering */
  isAvailable: boolean
  /** Current stock quantity (for inventory management) */
  stockQuantity: number
  /** Nutritional calories information */
  calories: number | null
  /** Estimated preparation time in minutes */
  preparationTime: number | null
  /** Estimated cooking time in minutes */
  cookingTime: number | null
  /** List of ingredients */
  ingredients: readonly IngredientUI[]
  /** List of allergens */
  allergens: readonly string[]
  /** Detailed nutrition information */
  nutritionInfo: NutritionInfo | null
  /** Dietary categories (vegetarian, vegan, etc.) */
  dietary: readonly string[]
  /** Display badges (new, popular, etc.) */
  badges: readonly MenuItemBadge[]
  /** Available modifier groups for this item */
  modifierGroups: readonly ModifierGroupUI[]
  /** Whether this is a new item */
  isNew: boolean
  /** Whether this is a popular item */
  isPopular: boolean
  /** List of additional images for the item */
  images?: string[]
  /** List of subcategories/options for the item */
  subcategories?: any[]
  /** Alias for modifierGroups (used in some components) */
  customizations?: ModifierGroupUI[]
  /** List of size options */
  sizes?: any[]
  /** Alias for nutritionInfo (used in some components) */
  nutrition?: NutritionInfo | null

  // Mutable category reference
  /** Category this item belongs to (mutable reference) */
  category: CategoryUI | null
}

/**
 * Category for UI components
 * 
 * UI-specific category type that uses undefined for nullable fields (Vue standard)
 * instead of null (API standard).
 * 
 * @interface CategoryUI
 */
export interface CategoryUI {
  /** Unique identifier for the category */
  id: string
  /** Display name of the category */
  name: string
  /** URL-friendly unique identifier for the category */
  slug: string
  /** Optional description of the category (undefined for Vue compatibility) */
  description: string | undefined
  /** Optional URL to the category's image (undefined for Vue compatibility) */
  imageUrl: string | undefined
  /** Sort order for displaying categories */
  sortOrder: number
  /** Optional icon identifier for the category (undefined for Vue compatibility) */
  icon: string | undefined
  /** Number of items in this category */
  count: number
}

/**
 * Modifier for UI components
 * 
 * Currently identical to API modifier but allows for future UI-specific extensions.
 * 
 * @interface ModifierUI
 * @extends ModifierAPI
 */
export interface ModifierUI extends ModifierAPI {
  // UI-specific fields can be added here
}

/**
 * Modifier group for UI components
 * 
 * Extends the API modifier group with UI-specific modifier references.
 * 
 * @interface ModifierGroupUI
 */
export interface ModifierGroupUI extends Omit<ModifierGroupAPI, 'modifiers'> {
  /** Array of UI modifiers in this group */
  modifiers: readonly ModifierUI[]
  /** Selection type for UI logic */
  type?: 'single' | 'multiple'
}

/**
 * Ingredient for UI components
 * 
 * @interface IngredientUI
 */
export interface IngredientUI {
  id: string
  name: string
  description?: string
  isDefault: boolean
  isOptional: boolean
  price?: number
  allergens?: readonly string[]
}

/**
 * Badge displayed on menu items
 * 
 * Visual indicators for special properties of menu items.
 * 
 * @interface MenuItemBadge
 * @example
 * ```typescript
 * const badge: MenuItemBadge = {
 *   type: 'vegetarian',
 *   label: 'Vegetarian'
 * }
 * ```
 */
export interface MenuItemBadge {
  /** Type of badge determining its appearance and meaning */
  type: 'new' | 'popular' | 'spicy' | 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free'
  /** Optional custom label for the badge */
  label?: string
}

/**
 * Nutritional information for menu items
 * 
 * Detailed nutritional data displayed to customers.
 * 
 * @interface NutritionInfo
 * @example
 * ```typescript
 * const nutrition: NutritionInfo = {
 *   calories: 450,
 *   protein: 25,
 *   carbs: 35,
 *   fat: 18,
 *   fiber: 5
 * }
 * ```
 */
export interface NutritionInfo {
  /** Total calories */
  calories: number
  /** Protein in grams */
  protein: number
  /** Carbohydrates in grams */
  carbs: number
  /** Fat in grams */
  fat: number
  /** Fiber in grams (optional) */
  fiber?: number
  /** Sugar in grams (optional) */
  sugar?: number
  /** Sodium in milligrams (optional) */
  sodium?: number
  /** Allergens (optional) */
  allergens?: readonly string[]
  /** Dietary labels (optional) */
  dietaryLabels?: readonly string[]
}

/**
 * Filters for menu browsing
 * 
 * Used in menu filtering and search functionality.
 * 
 * @interface MenuFilters
 * @example
 * ```typescript
 * const filters: MenuFilters = {
 *   priceRange: [10, 50],
 *   dietary: ['vegetarian', 'gluten-free'],
 *   availability: true
 * }
 * ```
 */
export interface MenuFilters {
  /** Price range filter [min, max] */
  priceRange?: [number, number]
  /** Calorie range filter [min, max] */
  calories?: [number, number]
  /** Dietary restriction filters */
  dietary?: readonly string[]
  /** Maximum cooking time filter */
  cookingTime?: number
  /** Filter by availability */
  availability?: boolean
}

// ============================================================================
// Type Aliases for Backward Compatibility
// ============================================================================
// These aliases maintain backward compatibility while encouraging migration
// to the new explicit type names.

/** @deprecated Use MenuItemUI instead. Will be removed in v2.0 */
export type MenuItem = MenuItemUI

/** @deprecated Use CategoryUI instead. Will be removed in v2.0 */
export type Category = CategoryUI

/** @deprecated Use ModifierUI instead. Will be removed in v2.0 */
export type Modifier = ModifierUI

/** @deprecated Use ModifierGroupUI instead. Will be removed in v2.0 */
export type ModifierGroup = ModifierGroupUI
