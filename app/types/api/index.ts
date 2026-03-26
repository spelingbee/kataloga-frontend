/**
 * API Response Types
 * 
 * This module exports all API response types that match backend responses exactly.
 * All API types are readonly to prevent accidental mutations.
 * 
 * Usage:
 * ```typescript
 * import type { MenuItemAPI, OrderAPI } from '~/types/api'
 * ```
 */

// Menu-related API types
export type {
  MenuItemAPI,
  CategoryAPI,
  ModifierAPI,
  ModifierGroupAPI
} from './menu.api'

// Order-related API types
export type {
  OrderAPI,
  OrderItemAPI
} from './order.api'

export { OrderStatus } from './order.api'

// User-related API types
export type {
  UserAPI,
  UserProfileAPI,
  UserAddressAPI
} from './user.api'

// Delivery-related API types
export type {
  DeliveryAPI,
  DriverAPI,
  DeliveryTrackingAPI
} from './delivery.api'

export { DeliveryStatus } from './delivery.api'
