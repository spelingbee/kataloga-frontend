/**
 * API response types for menu-related endpoints
 * 
 * These types are readonly and match backend responses exactly.
 * They should be used when receiving data from API endpoints and
 * converted to UI types for component usage.
 * 
 * @module types/api/menu
 */

/**
 * Menu item as returned by the API
 * 
 * Represents a menu item exactly as it comes from the backend API.
 * All fields are readonly to prevent accidental mutations.
 * 
 * @interface MenuItemAPI
 * @example
 * ```typescript
 * const apiItem: MenuItemAPI = await fetchMenuItem('item-123')
 * const uiItem = menuItemAPIToUI(apiItem) // Convert for UI use
 * ```
 */
export interface MenuItemAPI {
  /** Unique identifier for the menu item */
  readonly id: string
  /** Display name of the menu item */
  readonly name: string
  /** Optional description of the menu item */
  readonly description: string | null
  /** Price in the tenant's currency */
  readonly price: number
  /** Optional URL to the item's image */
  readonly imageUrl: string | null
  /** ID of the category this item belongs to */
  readonly categoryId: string | null
  /** ID of the menu this item belongs to */
  readonly menuId: string
  /** Whether the item is currently active/available */
  readonly isActive: boolean
  /** ISO timestamp when the item was created */
  readonly createdAt: string
  /** ISO timestamp when the item was last updated */
  readonly updatedAt: string
  /** Optional modifier groups for this item */
  readonly modifierGroups?: readonly ModifierGroupAPI[]
}

/**
 * Category as returned by the API
 * 
 * Represents a menu category exactly as it comes from the backend API.
 * Categories are used to organize menu items.
 * 
 * @interface CategoryAPI
 * @example
 * ```typescript
 * const categories: CategoryAPI[] = await fetchCategories()
 * ```
 */
export interface CategoryAPI {
  /** Unique identifier for the category */
  readonly id: string
  /** Display name of the category */
  readonly name: string
  /** URL-friendly unique identifier for the category */
  readonly slug: string
  /** Optional description of the category */
  readonly description: string | null
  /** Optional URL to the category's image */
  readonly imageUrl: string | null
  /** Sort order for displaying categories */
  readonly sortOrder: number
  /** Optional icon identifier for the category */
  readonly icon: string | null
}

/**
 * Modifier as returned by the API
 * 
 * Represents a menu item modifier (add-on, customization) as returned by the API.
 * Modifiers can adjust the price and are grouped into modifier groups.
 * 
 * @interface ModifierAPI
 * @example
 * ```typescript
 * const modifier: ModifierAPI = {
 *   id: 'mod-1',
 *   name: 'Extra Cheese',
 *   priceAdjustment: 2.50,
 *   isDefault: false
 * }
 * ```
 */
export interface ModifierAPI {
  /** Unique identifier for the modifier */
  readonly id: string
  /** Display name of the modifier */
  readonly name: string
  /** Price adjustment (positive for additional cost, negative for discount) */
  readonly priceAdjustment: number
  /** Whether this modifier is selected by default */
  readonly isDefault: boolean
}

/**
 * Modifier group as returned by the API
 * 
 * Represents a group of related modifiers with selection rules.
 * For example, "Size" group with "Small", "Medium", "Large" modifiers.
 * 
 * @interface ModifierGroupAPI
 * @example
 * ```typescript
 * const sizeGroup: ModifierGroupAPI = {
 *   id: 'size-group',
 *   name: 'Size',
 *   required: true,
 *   minSelection: 1,
 *   maxSelection: 1,
 *   modifiers: [smallModifier, mediumModifier, largeModifier]
 * }
 * ```
 */
export interface ModifierGroupAPI {
  /** Unique identifier for the modifier group */
  readonly id: string
  /** Display name of the modifier group */
  readonly name: string
  /** Whether customer must select from this group */
  readonly required: boolean
  /** Minimum number of modifiers that must be selected */
  readonly minSelection: number
  /** Maximum number of modifiers that can be selected */
  readonly maxSelection: number
  /** Array of modifiers in this group */
  readonly modifiers: readonly ModifierAPI[]
}
