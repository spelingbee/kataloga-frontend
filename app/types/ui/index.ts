/**
 * UI model types - mutable types for frontend components
 * Re-exports all UI types for convenient importing
 */

// Menu UI types
export type {
  MenuItemUI,
  CategoryUI,
  ModifierUI,
  ModifierGroupUI,
  IngredientUI,
  MenuItemBadge,
  NutritionInfo,
  MenuFilters,
  // Backward compatibility aliases
  MenuItem,
  Category,
  Modifier,
  ModifierGroup
} from './menu.ui'

// Order UI types
export type {
  OrderUI,
  OrderItemUI,
  CustomerInfo,
  DeliveryDetails,
  PickupDetails,
  DineInDetails,
  CartItem,
  // Backward compatibility aliases
  Order,
  OrderItem
} from './order.ui'

// Modal UI types
export type {
  BaseModalProps,
  BaseModalEmits,
  ModalConfig,
  ModalSize
} from './modal.ui'

export { MODAL_SIZES } from './modal.ui'

// Re-export OrderStatus enum
export { OrderStatus } from './order.ui'
