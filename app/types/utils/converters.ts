/**
 * Type conversion utility functions
 * 
 * This module provides functions to convert between different type variants:
 * - API response types (readonly, backend-aligned) to UI model types (mutable, frontend-specific)
 * - Mock data types (minimal, testing) to API types (complete, validated)
 * 
 * These converters maintain type safety while transforming data between layers
 * of the application architecture.
 * 
 * @module types/utils/converters
 */

import type { MenuItemAPI, CategoryAPI, ModifierAPI, ModifierGroupAPI } from '../api/menu.api'
import type { OrderAPI, OrderItemAPI } from '../api/order.api'
import type { UserAPI, UserProfileAPI, UserAddressAPI } from '../api/user.api'
import type { DeliveryAPI, DriverAPI, DeliveryTrackingAPI } from '../api/delivery.api'
import type { MenuItemUI, CategoryUI, ModifierUI, ModifierGroupUI, MenuItemBadge, IngredientUI } from '../ui/menu.ui'
import type { OrderUI, OrderItemUI, CustomerInfo } from '../ui/order.ui'
import type { MenuItemMock, CategoryMock } from '../mocks/menu.mock'
import type { OrderMock, OrderItemMock } from '../mocks/order.mock'

/**
 * Convert API MenuItem to UI MenuItem
 * 
 * Transforms a readonly API response MenuItem into a mutable UI model MenuItem
 * by adding computed display fields, converting null to undefined for Vue compatibility,
 * and providing default values for UI-specific properties.
 * 
 * @param api - The readonly MenuItem from API response
 * @returns A mutable MenuItemUI with all required UI fields populated
 * 
 * @example
 * ```typescript
 * const apiItem: MenuItemAPI = await fetchMenuItem(id)
 * const uiItem: MenuItemUI = menuItemAPIToUI(apiItem)
 * // uiItem now has isAvailable, badges, modifierGroups, etc.
 * // null values are converted to undefined for Vue compatibility
 * ```
 */
export function menuItemAPIToUI(api: MenuItemAPI): MenuItemUI {
  return {
    // Copy all API fields with null -> undefined conversion
    id: api.id,
    name: api.name,
    description: api.description ?? undefined, // null -> undefined for Vue
    price: api.price,
    imageUrl: api.imageUrl ?? undefined, // null -> undefined for Vue
    categoryId: api.categoryId ?? undefined, // null -> undefined for Vue
    menuId: api.menuId,
    isActive: api.isActive,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,

    // Add computed display fields with default values
    isAvailable: api.isActive,
    stockQuantity: 100, // Default value, should be fetched separately if needed
    calories: null,
    preparationTime: null,
    cookingTime: null,
    ingredients: [],
    allergens: [],
    nutritionInfo: null,
    dietary: [],
    badges: calculateMenuItemBadges(api),
    modifierGroups: api.modifierGroups?.map(modifierGroupAPIToUI) || [],
    isNew: false,
    isPopular: false,
    category: null
  }
}

/**
 * Convert API Category to UI Category
 * 
 * Transforms a readonly API response Category into a mutable UI model Category
 * by converting null to undefined for Vue compatibility and adding UI-specific fields.
 * 
 * @param api - The readonly Category from API response
 * @param itemCount - Number of items in this category (default: 0)
 * @returns A mutable CategoryUI with Vue-compatible nullable fields
 * 
 * @example
 * ```typescript
 * const apiCategory: CategoryAPI = await fetchCategory(id)
 * const uiCategory: CategoryUI = categoryAPIToUI(apiCategory, 5)
 * // uiCategory now has null values converted to undefined
 * ```
 */
export function categoryAPIToUI(api: CategoryAPI, itemCount: number = 0): CategoryUI {
  return {
    // Copy all API fields with null -> undefined conversion
    id: api.id,
    name: api.name,
    slug: api.slug,
    description: api.description ?? undefined, // null -> undefined for Vue
    imageUrl: api.imageUrl ?? undefined, // null -> undefined for Vue
    sortOrder: api.sortOrder,
    icon: api.icon ?? undefined, // null -> undefined for Vue

    // Add UI-specific fields
    count: itemCount
  }
}

/**
 * Convert UI MenuItem back to API format
 * 
 * Transforms a mutable UI MenuItem back to API format for sending to backend.
 * Converts undefined back to null for API compatibility.
 * 
 * @param ui - The UI MenuItem to convert
 * @returns API-compatible MenuItem data (without readonly fields like createdAt, updatedAt)
 * 
 * @example
 * ```typescript
 * const uiItem: MenuItemUI = getMenuItemFromForm()
 * const apiData = menuItemUIToAPI(uiItem)
 * await $apiClient.post('/admin/menu-items', apiData)
 * ```
 */
export function menuItemUIToAPI(ui: MenuItemUI): Omit<MenuItemAPI, 'createdAt' | 'updatedAt'> {
  return {
    id: ui.id,
    name: ui.name,
    description: ui.description ?? null, // undefined -> null for API
    price: ui.price,
    imageUrl: ui.imageUrl ?? null, // undefined -> null for API
    categoryId: ui.categoryId ?? null, // undefined -> null for API
    menuId: ui.menuId,
    isActive: ui.isActive
  }
}

/**
 * Convert UI Category back to API format
 * 
 * Transforms a mutable UI Category back to API format for sending to backend.
 * Converts undefined back to null for API compatibility.
 * 
 * @param ui - The UI Category to convert
 * @returns API-compatible Category data
 * 
 * @example
 * ```typescript
 * const uiCategory: CategoryUI = getCategoryFromForm()
 * const apiData = categoryUIToAPI(uiCategory)
 * await $apiClient.post('/admin/categories', apiData)
 * ```
 */
export function categoryUIToAPI(ui: CategoryUI): Omit<CategoryAPI, 'id'> {
  return {
    name: ui.name,
    slug: ui.slug,
    description: ui.description ?? null, // undefined -> null for API
    imageUrl: ui.imageUrl ?? null, // undefined -> null for API
    sortOrder: ui.sortOrder,
    icon: ui.icon ?? null // undefined -> null for API
  }
}

/**
 * Convert API Order to UI Order
 * by calculating computed fields (subtotal, deliveryFee, discount, tax) and
 * adding customer information and delivery details.
 * 
 * @param api - The readonly Order from API response
 * @param customerInfo - Customer information for the order
 * @returns A mutable OrderUI with all computed fields calculated
 * 
 * @example
 * ```typescript
 * const apiOrder: OrderAPI = await fetchOrder(id)
 * const customerInfo: CustomerInfo = { name: 'John', phone: '123-456-7890' }
 * const uiOrder: OrderUI = orderAPIToUI(apiOrder, customerInfo)
 * // uiOrder now has subtotal, deliveryFee, discount, tax calculated
 * ```
 */
export function orderAPIToUI(api: OrderAPI, customerInfo: CustomerInfo): OrderUI {
  // Calculate totals using helper function
  const totals = calculateOrderTotals(api.items, api.orderType)

  return {
    // Copy all API fields (removing readonly)
    id: api.id,
    orderNumber: api.orderNumber,
    status: api.status,
    total: api.total,
    customerId: api.customerId,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    estimatedTime: api.estimatedTime,
    deliveryAddress: api.deliveryAddress,
    orderType: api.orderType,

    // Convert order items to UI format
    items: api.items.map(orderItemAPIToUI),

    // Add computed fields from calculation
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    discount: 0, // TODO: Implement discount calculation based on promotions
    tax: totals.tax,

    // Add customer information
    customerInfo,

    // Add delivery details if applicable
    deliveryDetails: api.orderType === 'delivery' && api.deliveryAddress
      ? {
        address: api.deliveryAddress,
        estimatedTime: api.estimatedTime ?? undefined
      }
      : undefined
  }
}

/**
 * Convert API OrderItem to UI OrderItem
 * 
 * Transforms a readonly API response OrderItem into a mutable UI model OrderItem.
 * Note: The menuItem field is set to a placeholder and should be populated
 * from the menu store after conversion.
 * 
 * @param api - The readonly OrderItem from API response
 * @returns A mutable OrderItemUI (menuItem needs to be populated separately)
 * 
 * @example
 * ```typescript
 * const apiOrderItem: OrderItemAPI = apiOrder.items[0]
 * const uiOrderItem: OrderItemUI = orderItemAPIToUI(apiOrderItem)
 * // Populate menuItem from store:
 * uiOrderItem.menuItem = menuStore.getMenuItem(uiOrderItem.menuItemId)
 * ```
 */
export function orderItemAPIToUI(api: OrderItemAPI): OrderItemUI {
  // Create a placeholder MenuItemUI - in a real implementation, this should be populated from menu store
  const placeholderMenuItem: MenuItemUI = {
    id: api.menuItemId,
    name: 'Menu Item', // Should be populated from menu store
    description: undefined,
    price: api.price,
    imageUrl: undefined,
    categoryId: undefined,
    menuId: 'default-menu',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isAvailable: true,
    stockQuantity: 100,
    calories: null,
    preparationTime: null,
    cookingTime: null,
    ingredients: [],
    allergens: [],
    nutritionInfo: null,
    dietary: [],
    badges: [],
    modifierGroups: [],
    isNew: false,
    isPopular: false,
    category: null
  }

  return {
    // Copy all API fields (removing readonly)
    id: api.id,
    menuItemId: api.menuItemId,
    quantity: api.quantity,
    price: api.price,
    subtotal: api.subtotal,
    customizations: api.customizations,

    // Add UI-specific fields
    menuItem: placeholderMenuItem, // Placeholder - should be populated by caller from menu store
    selectedModifiers: [],
    notes: undefined
  }
}

/**
 * Convert mock MenuItem to API MenuItem
 * 
 * Transforms a minimal mock MenuItem (used in tests) into a complete API MenuItem
 * by filling in required fields with sensible defaults. This allows test data
 * to omit fields like menuId, createdAt, and updatedAt.
 * 
 * @param mock - The minimal mock MenuItem from test data
 * @returns A complete MenuItemAPI with all required fields populated
 * 
 * @example
 * ```typescript
 * const mockItem: MenuItemMock = {
 *   id: '123',
 *   name: 'Test Item',
 *   price: 10.99
 * }
 * const apiItem: MenuItemAPI = menuItemMockToAPI(mockItem)
 * // apiItem now has menuId, createdAt, updatedAt with default values
 * ```
 */
export function menuItemMockToAPI(mock: MenuItemMock): MenuItemAPI {
  const now = new Date().toISOString()

  return {
    // Copy provided fields
    id: mock.id,
    name: mock.name,
    price: mock.price,

    // Convert undefined to null for API compatibility
    description: mock.description ?? null,
    imageUrl: mock.imageUrl ?? null,
    categoryId: mock.categoryId ?? null,

    // Fill in required fields with defaults
    menuId: mock.menuId ?? 'default-menu',
    isActive: mock.isActive ?? true,
    createdAt: mock.createdAt ?? now,
    updatedAt: mock.updatedAt ?? now
  }
}

/**
 * Create a complete MenuItemUI object with default values for missing fields
 * 
 * This helper function creates a complete MenuItemUI object from partial data,
 * filling in all required fields with sensible defaults. Useful for creating
 * MenuItemUI objects in components without having to specify every field.
 * 
 * @param partial - Partial MenuItemUI data (must include id, name, price)
 * @returns A complete MenuItemUI with all required fields populated
 * 
 * @example
 * ```typescript
 * const dish = createMenuItemUI({
 *   id: '123',
 *   name: 'Delicious Burger',
 *   price: 12.99,
 *   description: 'A tasty burger',
 *   calories: 580
 * })
 * // dish now has all required fields including createdAt, updatedAt, etc.
 * ```
 */
export function createMenuItemUI(partial: Partial<MenuItemUI> & { id: string; name: string; price: number }): MenuItemUI {
  const now = new Date().toISOString()

  return {
    // Required API fields with Vue-compatible nullable types
    id: partial.id,
    name: partial.name,
    description: partial.description ?? undefined, // Use undefined for Vue compatibility
    price: partial.price,
    imageUrl: partial.imageUrl ?? undefined, // Use undefined for Vue compatibility
    categoryId: partial.categoryId ?? undefined, // Use undefined for Vue compatibility
    menuId: partial.menuId ?? 'default-menu',
    isActive: partial.isActive ?? true,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,

    // UI-specific fields with defaults
    isAvailable: partial.isAvailable ?? true,
    stockQuantity: partial.stockQuantity ?? 100,
    calories: partial.calories ?? null,
    preparationTime: partial.preparationTime ?? null,
    cookingTime: partial.cookingTime ?? null,
    ingredients: (partial.ingredients as any) ? stringsToIngredientUIs(partial.ingredients as any) : [],
    allergens: partial.allergens ?? [],
    nutritionInfo: partial.nutritionInfo ?? null,
    dietary: partial.dietary ?? [],
    badges: partial.badges ?? [],
    modifierGroups: partial.modifierGroups ?? [],
    isNew: partial.isNew ?? false,
    isPopular: partial.isPopular ?? false,
    category: partial.category ?? null
  }
}

/**
 * Convert API Modifier to UI Modifier
 * 
 * Currently a pass-through since ModifierUI extends ModifierAPI without changes,
 * but allows for future UI-specific extensions.
 * 
 * @param api - The readonly Modifier from API response
 * @returns A mutable ModifierUI
 * 
 * @example
 * ```typescript
 * const apiModifier: ModifierAPI = await fetchModifier(id)
 * const uiModifier: ModifierUI = modifierAPIToUI(apiModifier)
 * ```
 */
export function modifierAPIToUI(api: ModifierAPI): ModifierUI {
  return {
    id: api.id,
    name: api.name,
    priceAdjustment: api.priceAdjustment,
    isDefault: api.isDefault
  }
}

/**
 * Convert UI Modifier back to API format
 * 
 * @param ui - The UI Modifier to convert
 * @returns API-compatible Modifier data
 * 
 * @example
 * ```typescript
 * const uiModifier: ModifierUI = getModifierFromForm()
 * const apiData = modifierUIToAPI(uiModifier)
 * await $apiClient.post('/admin/modifiers', apiData)
 * ```
 */
export function modifierUIToAPI(ui: ModifierUI): ModifierAPI {
  return {
    id: ui.id,
    name: ui.name,
    priceAdjustment: ui.priceAdjustment,
    isDefault: ui.isDefault
  }
}

/**
 * Convert API ModifierGroup to UI ModifierGroup
 * 
 * Transforms a readonly API response ModifierGroup into a mutable UI model ModifierGroup
 * by converting the nested modifiers array to UI format.
 * 
 * @param api - The readonly ModifierGroup from API response
 * @returns A mutable ModifierGroupUI with UI modifiers
 * 
 * @example
 * ```typescript
 * const apiGroup: ModifierGroupAPI = await fetchModifierGroup(id)
 * const uiGroup: ModifierGroupUI = modifierGroupAPIToUI(apiGroup)
 * ```
 */
export function modifierGroupAPIToUI(api: ModifierGroupAPI): ModifierGroupUI {
  return {
    id: api.id,
    name: api.name,
    required: api.required,
    minSelection: api.minSelection,
    maxSelection: api.maxSelection,
    modifiers: api.modifiers.map(modifierAPIToUI),
    type: api.maxSelection === 1 ? 'single' : 'multiple'
  }
}

/**
 * Convert UI ModifierGroup back to API format
 * 
 * @param ui - The UI ModifierGroup to convert
 * @returns API-compatible ModifierGroup data
 * 
 * @example
 * ```typescript
 * const uiGroup: ModifierGroupUI = getModifierGroupFromForm()
 * const apiData = modifierGroupUIToAPI(uiGroup)
 * await $apiClient.post('/admin/modifier-groups', apiData)
 * ```
 */
export function modifierGroupUIToAPI(ui: ModifierGroupUI): ModifierGroupAPI {
  return {
    id: ui.id,
    name: ui.name,
    required: ui.required,
    minSelection: ui.minSelection,
    maxSelection: ui.maxSelection,
    modifiers: ui.modifiers.map(modifierUIToAPI)
  }
}

/**
 * Convert mock Category to API Category
 * 
 * Transforms a minimal mock Category (used in tests) into a complete API Category
 * by filling in required fields with sensible defaults.
 * 
 * @param mock - The minimal mock Category from test data
 * @returns A complete CategoryAPI with all required fields populated
 * 
 * @example
 * ```typescript
 * const mockCategory: CategoryMock = {
 *   id: '123',
 *   name: 'Test Category'
 * }
 * const apiCategory: CategoryAPI = categoryMockToAPI(mockCategory)
 * ```
 */
export function categoryMockToAPI(mock: CategoryMock): CategoryAPI {
  return {
    id: mock.id,
    name: mock.name,
    slug: mock.slug || mock.name.toLowerCase().replace(/\s+/g, '-'),
    // Convert undefined to null for API compatibility
    description: mock.description ?? null,
    imageUrl: mock.imageUrl ?? null,
    icon: mock.icon ?? null,
    sortOrder: mock.sortOrder ?? 0
  }
}

/**
 * Convert mock Order to API Order
 * 
 * Transforms a minimal mock Order (used in tests) into a complete API Order
 * by filling in required fields with sensible defaults.
 * 
 * @param mock - The minimal mock Order from test data
 * @returns A complete OrderAPI with all required fields populated
 * 
 * @example
 * ```typescript
 * const mockOrder: OrderMock = {
 *   id: '123',
 *   orderNumber: 'ORD-001',
 *   status: 'PENDING',
 *   total: 25.99,
 *   items: [],
 *   customerId: 'customer-1',
 *   orderType: 'delivery'
 * }
 * const apiOrder: OrderAPI = orderMockToAPI(mockOrder)
 * ```
 */
export function orderMockToAPI(mock: OrderMock): OrderAPI {
  const now = new Date().toISOString()

  return {
    id: mock.id,
    orderNumber: mock.orderNumber,
    status: mock.status,
    total: mock.total,
    items: mock.items.map(orderItemMockToAPI),
    customerId: mock.customerId,
    createdAt: mock.createdAt ?? now,
    updatedAt: mock.updatedAt ?? now,
    // Convert undefined to null for API compatibility
    estimatedTime: mock.estimatedTime ?? null,
    deliveryAddress: mock.deliveryAddress ?? null,
    orderType: mock.orderType
  }
}

/**
 * Convert mock OrderItem to API OrderItem
 * 
 * Transforms a minimal mock OrderItem (used in tests) into a complete API OrderItem
 * by filling in required fields with sensible defaults.
 * 
 * @param mock - The minimal mock OrderItem from test data
 * @returns A complete OrderItemAPI with all required fields populated
 * 
 * @example
 * ```typescript
 * const mockItem: OrderItemMock = {
 *   id: '123',
 *   menuItemId: 'menu-1',
 *   quantity: 2,
 *   price: 10.99,
 *   subtotal: 21.98
 * }
 * const apiItem: OrderItemAPI = orderItemMockToAPI(mockItem)
 * ```
 */
export function orderItemMockToAPI(mock: OrderItemMock): OrderItemAPI {
  return {
    id: mock.id,
    menuItemId: mock.menuItemId,
    quantity: mock.quantity,
    price: mock.price,
    subtotal: mock.subtotal,
    // Convert undefined to null for API compatibility
    customizations: mock.customizations ?? null
  }
}

// ============================================================================
// MOCK TO UI CONVERSION UTILITIES
// ============================================================================

/**
 * Convert mock MenuItem directly to UI MenuItem
 * 
 * Transforms a minimal mock MenuItem directly into a UI MenuItem without going through API format.
 * This is useful for tests that need UI-compatible mock data without API conversion overhead.
 * 
 * @param mock - The minimal mock MenuItem from test data
 * @returns A complete MenuItemUI with all required fields populated
 * 
 * @example
 * ```typescript
 * const mockItem: MenuItemMock = {
 *   id: '123',
 *   name: 'Test Item',
 *   price: 10.99,
 *   description: 'A test item'
 * }
 * const uiItem: MenuItemUI = menuItemMockToUI(mockItem)
 * // uiItem is ready for use in UI components
 * ```
 */
export function menuItemMockToUI(mock: MenuItemMock): MenuItemUI {
  const now = new Date().toISOString()

  return {
    // Copy provided fields (already using undefined for Vue compatibility)
    id: mock.id,
    name: mock.name,
    description: mock.description,
    price: mock.price,
    imageUrl: mock.imageUrl,
    categoryId: mock.categoryId,

    // Fill in required fields with defaults
    menuId: mock.menuId ?? 'default-menu',
    isActive: mock.isActive ?? true,
    createdAt: mock.createdAt ?? now,
    updatedAt: mock.updatedAt ?? now,

    // Add computed display fields with mock-provided values or defaults
    isAvailable: mock.isActive ?? true,
    stockQuantity: mock.stockQuantity ?? 100,
    calories: mock.calories ?? null,
    preparationTime: mock.preparationTime ?? null,
    cookingTime: mock.cookingTime ?? null,
    ingredients: stringsToIngredientUIs(mock.ingredients ?? []),
    allergens: mock.allergens ?? [],
    nutritionInfo: null,
    dietary: mock.dietary ?? [],
    badges: [],
    modifierGroups: [],
    isNew: mock.isNew ?? false,
    isPopular: mock.isPopular ?? false,
    category: null
  }
}

/**
 * Helper to convert string ingredients to IngredientUI objects
 * 
 * @param ingredients - Array of ingredient names or objects
 * @returns Array of IngredientUI objects
 */
function stringsToIngredientUIs(ingredients: (string | any)[]): IngredientUI[] {
  return ingredients.map((ing, index) => {
    if (typeof ing === 'string') {
      return {
        id: `ing-${index}`,
        name: ing,
        isDefault: true,
        isOptional: true
      }
    }
    return ing as IngredientUI
  })
}

/**
 * Convert mock Category directly to UI Category
 * 
 * Transforms a minimal mock Category directly into a UI Category without going through API format.
 * 
 * @param mock - The minimal mock Category from test data
 * @returns A complete CategoryUI with all required fields populated
 * 
 * @example
 * ```typescript
 * const mockCategory: CategoryMock = {
 *   id: '123',
 *   name: 'Test Category',
 *   count: 5
 * }
 * const uiCategory: CategoryUI = categoryMockToUI(mockCategory)
 * ```
 */
export function categoryMockToUI(mock: CategoryMock): CategoryUI {
  return {
    // Copy provided fields (already using undefined for Vue compatibility)
    id: mock.id,
    name: mock.name,
    slug: mock.slug || mock.name.toLowerCase().replace(/\s+/g, '-'),
    description: mock.description,
    imageUrl: mock.imageUrl,
    icon: mock.icon,

    // Fill in required fields with defaults
    sortOrder: mock.sortOrder ?? 0,
    count: mock.count ?? 0
  }
}

/**
 * Convert mock Order directly to UI Order
 * 
 * Transforms a minimal mock Order directly into a UI Order without going through API format.
 * 
 * @param mock - The minimal mock Order from test data
 * @param customerInfo - Customer information for the order
 * @returns A complete OrderUI with all required fields populated
 * 
 * @example
 * ```typescript
 * const mockOrder: OrderMock = {
 *   id: '123',
 *   orderNumber: 'ORD-001',
 *   status: 'PENDING',
 *   total: 25.99,
 *   items: [],
 *   customerId: 'customer-1',
 *   orderType: 'delivery'
 * }
 * const customerInfo: CustomerInfo = { name: 'John', phone: '123-456-7890' }
 * const uiOrder: OrderUI = orderMockToUI(mockOrder, customerInfo)
 * ```
 */
export function orderMockToUI(mock: OrderMock, customerInfo: CustomerInfo): OrderUI {
  const now = new Date().toISOString()

  return {
    // Copy provided fields
    id: mock.id,
    orderNumber: mock.orderNumber,
    status: mock.status,
    total: mock.total,
    customerId: mock.customerId,
    createdAt: mock.createdAt ?? now,
    updatedAt: mock.updatedAt ?? now,
    estimatedTime: mock.estimatedTime ?? null,
    deliveryAddress: mock.deliveryAddress ?? null,
    orderType: mock.orderType,

    // Convert order items to UI format
    items: mock.items.map(orderItemMockToUI),

    // Add computed fields with mock-provided values or defaults
    subtotal: mock.subtotal ?? mock.total * 0.9, // Estimate if not provided
    deliveryFee: mock.deliveryFee ?? (mock.orderType === 'delivery' ? 5.00 : 0),
    discount: mock.discount ?? 0,
    tax: mock.tax ?? mock.total * 0.1, // Estimate if not provided

    // Add customer information
    customerInfo,

    // Add delivery details if applicable
    deliveryDetails: mock.orderType === 'delivery' && mock.deliveryAddress
      ? {
        address: mock.deliveryAddress,
        estimatedTime: mock.estimatedTime ?? undefined
      }
      : undefined
  }
}

/**
 * Convert mock OrderItem directly to UI OrderItem
 * 
 * Transforms a minimal mock OrderItem directly into a UI OrderItem without going through API format.
 * 
 * @param mock - The minimal mock OrderItem from test data
 * @returns A complete OrderItemUI with placeholder menuItem
 * 
 * @example
 * ```typescript
 * const mockItem: OrderItemMock = {
 *   id: '123',
 *   menuItemId: 'menu-1',
 *   quantity: 2,
 *   price: 10.99,
 *   subtotal: 21.98
 * }
 * const uiItem: OrderItemUI = orderItemMockToUI(mockItem)
 * ```
 */
export function orderItemMockToUI(mock: OrderItemMock): OrderItemUI {
  // Create a placeholder MenuItemUI - in a real implementation, this should be populated from menu store
  const placeholderMenuItem: MenuItemUI = {
    id: mock.menuItemId,
    name: 'Mock Menu Item', // Placeholder name
    description: undefined,
    price: mock.price,
    imageUrl: undefined,
    categoryId: undefined,
    menuId: 'default-menu',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isAvailable: true,
    stockQuantity: 100,
    calories: null,
    preparationTime: null,
    cookingTime: null,
    ingredients: [],
    allergens: [],
    nutritionInfo: null,
    dietary: [],
    badges: [],
    modifierGroups: [],
    isNew: false,
    isPopular: false,
    category: null
  }

  return {
    // Copy provided fields
    id: mock.id,
    menuItemId: mock.menuItemId,
    quantity: mock.quantity,
    price: mock.price,
    subtotal: mock.subtotal,
    customizations: mock.customizations ?? null,

    // Add UI-specific fields
    menuItem: placeholderMenuItem,
    selectedModifiers: [],
    notes: mock.notes
  }
}

// ============================================================================
// MASS CONVERSION UTILITIES
// ============================================================================

/**
 * Convert array of API items to UI items using provided converter function
 * 
 * Utility function for converting arrays of API objects to UI objects.
 * Provides type safety and consistent error handling for mass conversions.
 * 
 * @param apiArray - Array of API objects to convert
 * @param converter - Function to convert single API object to UI object
 * @returns Array of UI objects
 * 
 * @example
 * ```typescript
 * const apiItems: MenuItemAPI[] = await fetchMenuItems()
 * const uiItems: MenuItemUI[] = convertArrayAPIToUI(apiItems, menuItemAPIToUI)
 * ```
 */
export function convertArrayAPIToUI<TApi, TUi>(
  apiArray: readonly TApi[],
  converter: (api: TApi) => TUi
): TUi[] {
  return apiArray.map(converter)
}

/**
 * Convert array of UI items to API items using provided converter function
 * 
 * Utility function for converting arrays of UI objects to API objects.
 * Provides type safety and consistent error handling for mass conversions.
 * 
 * @param uiArray - Array of UI objects to convert
 * @param converter - Function to convert single UI object to API object
 * @returns Array of API objects
 * 
 * @example
 * ```typescript
 * const uiItems: MenuItemUI[] = getMenuItemsFromForm()
 * const apiData = convertArrayUIToAPI(uiItems, menuItemUIToAPI)
 * await $apiClient.post('/admin/menu-items/bulk', { items: apiData })
 * ```
 */
export function convertArrayUIToAPI<TUi, TApi>(
  uiArray: TUi[],
  converter: (ui: TUi) => TApi
): TApi[] {
  return uiArray.map(converter)
}

/**
 * Convert array of mock items to API items using provided converter function
 * 
 * Utility function for converting arrays of mock objects to API objects.
 * Useful for test data preparation and bulk mock data conversion.
 * 
 * @param mockArray - Array of mock objects to convert
 * @param converter - Function to convert single mock object to API object
 * @returns Array of API objects
 * 
 * @example
 * ```typescript
 * const mockItems: MenuItemMock[] = generateMockMenuItems(10)
 * const apiItems: MenuItemAPI[] = convertArrayMockToAPI(mockItems, menuItemMockToAPI)
 * ```
 */
export function convertArrayMockToAPI<TMock, TApi>(
  mockArray: TMock[],
  converter: (mock: TMock) => TApi
): TApi[] {
  return mockArray.map(converter)
}

/**
 * Convert array of mock items to UI items using provided converter function
 * 
 * Utility function for converting arrays of mock objects to UI objects.
 * Useful for test data preparation and bulk mock data conversion to UI format.
 * 
 * @param mockArray - Array of mock objects to convert
 * @param converter - Function to convert single mock object to UI object
 * @returns Array of UI objects
 * 
 * @example
 * ```typescript
 * const mockItems: MenuItemMock[] = generateMockMenuItems(10)
 * const uiItems: MenuItemUI[] = convertArrayMockToUI(mockItems, menuItemMockToUI)
 * ```
 */
export function convertArrayMockToUI<TMock, TUi>(
  mockArray: TMock[],
  converter: (mock: TMock) => TUi
): TUi[] {
  return mockArray.map(converter)
}

// ============================================================================
// NULL ↔ UNDEFINED CONVERSION UTILITIES
// ============================================================================

/**
 * Convert null values to undefined for Vue compatibility
 * 
 * Vue.js works better with undefined for optional properties rather than null.
 * This utility function converts null values to undefined while preserving
 * other values including empty strings and zero.
 * 
 * @param value - Value that might be null
 * @returns The same value if not null, undefined if null
 * 
 * @example
 * ```typescript
 * const apiDescription: string | null = null
 * const uiDescription: string | undefined = nullToUndefined(apiDescription)
 * // uiDescription is undefined
 * 
 * const apiName: string | null = "Pizza"
 * const uiName: string | undefined = nullToUndefined(apiName)
 * // uiName is "Pizza"
 * ```
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value
}

/**
 * Convert undefined values to null for API compatibility
 * 
 * Backend APIs typically expect null for missing values rather than undefined.
 * This utility function converts undefined values to null while preserving
 * other values including empty strings and zero.
 * 
 * @param value - Value that might be undefined
 * @returns The same value if not undefined, null if undefined
 * 
 * @example
 * ```typescript
 * const uiDescription: string | undefined = undefined
 * const apiDescription: string | null = undefinedToNull(uiDescription)
 * // apiDescription is null
 * 
 * const uiName: string | undefined = "Pizza"
 * const apiName: string | null = undefinedToNull(uiName)
 * // apiName is "Pizza"
 * ```
 */
export function undefinedToNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value
}

/**
 * Convert object with null values to object with undefined values
 * 
 * Recursively converts all null values in an object to undefined values.
 * Useful for converting entire API response objects to Vue-compatible format.
 * 
 * @param obj - Object that might contain null values
 * @returns New object with null values converted to undefined
 * 
 * @example
 * ```typescript
 * const apiData = { name: "Pizza", description: null, price: 10.99 }
 * const uiData = convertNullsToUndefined(apiData)
 * // uiData is { name: "Pizza", description: undefined, price: 10.99 }
 * ```
 */
export function convertNullsToUndefined<T extends Record<string, any>>(obj: T): {
  [K in keyof T]: T[K] extends null ? undefined : T[K] extends null | infer U ? U | undefined : T[K]
} {
  const result = {} as any

  for (const [key, value] of Object.entries(obj)) {
    result[key] = nullToUndefined(value)
  }

  return result
}

/**
 * Convert object with undefined values to object with null values
 * 
 * Recursively converts all undefined values in an object to null values.
 * Useful for converting UI objects to API-compatible format before sending.
 * 
 * @param obj - Object that might contain undefined values
 * @returns New object with undefined values converted to null
 * 
 * @example
 * ```typescript
 * const uiData = { name: "Pizza", description: undefined, price: 10.99 }
 * const apiData = convertUndefinedsToNulls(uiData)
 * // apiData is { name: "Pizza", description: null, price: 10.99 }
 * ```
 */
export function convertUndefinedsToNulls<T extends Record<string, any>>(obj: T): {
  [K in keyof T]: T[K] extends undefined ? null : T[K] extends undefined | infer U ? U | null : T[K]
} {
  const result = {} as any

  for (const [key, value] of Object.entries(obj)) {
    result[key] = undefinedToNull(value)
  }

  return result
}

// ============================================================================
// SPECIALIZED CONVERTER HELPERS
// ============================================================================

/**
 * Calculate menu item badges based on API data
 * 
 * Helper function to determine which badges should be displayed for a menu item
 * based on its properties and metadata.
 * 
 * @param api - The API menu item data
 * @returns Array of badges to display
 * 
 * @example
 * ```typescript
 * const badges = calculateMenuItemBadges(apiItem)
 * // Returns badges like [{ type: 'new' }, { type: 'popular' }]
 * ```
 */
export function calculateMenuItemBadges(api: MenuItemAPI): MenuItemBadge[] {
  const badges: MenuItemBadge[] = []

  // Check if item is new (created within last 7 days)
  const createdDate = new Date(api.createdAt)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  if (createdDate > weekAgo) {
    badges.push({ type: 'new' })
  }

  // Additional badge logic can be added here based on:
  // - Sales data (popular items)
  // - Dietary information (vegetarian, vegan, etc.)
  // - Spice level
  // - Allergen information

  return badges
}

/**
 * Calculate order totals and fees
 * 
 * Helper function to calculate various order totals including subtotal,
 * delivery fee, tax, and final total.
 * 
 * @param items - Array of order items
 * @param orderType - Type of order (delivery, pickup, dine-in)
 * @param taxRate - Tax rate (default: 0.1 for 10%)
 * @returns Object with calculated totals
 * 
 * @example
 * ```typescript
 * const totals = calculateOrderTotals(orderItems, 'delivery')
 * // Returns { subtotal: 25.00, deliveryFee: 5.00, tax: 2.50, total: 32.50 }
 * ```
 */
export function calculateOrderTotals(
  items: readonly OrderItemAPI[],
  orderType: 'delivery' | 'pickup' | 'dine-in',
  taxRate: number = 0.1
): {
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
} {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const deliveryFee = orderType === 'delivery' ? 5.00 : 0
  const tax = subtotal * taxRate
  const total = subtotal + deliveryFee + tax

  return {
    subtotal,
    deliveryFee,
    tax,
    total
  }
}
