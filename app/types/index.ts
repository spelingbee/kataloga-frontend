/**
 * Main Type Index
 * 
 * This file serves as the central export point for all type definitions in the application.
 * It maintains backward compatibility while providing a clear separation between:
 * - API types (readonly, backend-aligned)
 * - UI types (mutable, frontend-specific)
 * - Mock types (minimal, testing)
 * - Utility types and functions
 * 
 * @module types
 */

// ============================================================================
// API Response Types (Readonly, Backend-Aligned)
// ============================================================================
// These types match backend responses exactly and are readonly to prevent mutations
export * from './api'

// ============================================================================
// UI Model Types (Mutable, Frontend-Specific)
// ============================================================================
// These types are used in Vue components and include computed/display fields
export * from './ui'

// ============================================================================
// Mock Types (Minimal, Testing)
// ============================================================================
// These types have optional fields for easier test data creation
export * from './mocks'

// ============================================================================
// API Client Types
// ============================================================================
// Type-safe API client interface with generic support and query parameters
export * from './api-client'

// ============================================================================
// Type Utilities and Converters
// ============================================================================
// Type guards, converters, and utility functions for type safety
export * from './utils'

// ============================================================================
// Domain-Specific Types
// ============================================================================
// Export tenant types
export * from './tenant'

// Export payment types
export * from './payment'

// Export delivery types (legacy, consider using ./api/delivery.api.ts instead)
// Note: DeliveryDetails is also exported from './ui' - the UI version is preferred for order-related usage
// Note: DeliveryZone is also exported from './tenant' - the tenant version is preferred
export type {
  Coordinates,
  DeliveryAddress,
  MapConfig,
  GeocodingResult
} from './delivery'

// ============================================================================
// Constants
// ============================================================================
export * from '../constants/error-codes'

// ============================================================================
// User Types
// ============================================================================
// User-related types that are not yet migrated to the api/ui structure

export interface User {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  phone?: string
  telegramId?: string
  role: UserRole
  tenantId: string
  isActive: boolean
  emailVerified: boolean
  preferences?: UserPreferences
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export interface UserPreferences {
  favoriteItems: string[]
  dietaryRestrictions: string[]
}

export interface UserLocation {
  latitude: number
  longitude: number
  address?: string
}

export interface UpdateProfileDto {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  preferences?: Partial<UserPreferences>
}

export interface UserAddressDto {
  name: string
  address: string
  latitude: number
  longitude: number
  type: 'home' | 'work' | 'other'
  isDefault?: boolean
}

export interface UserPreferencesDto {
  dietary?: string[]
  allergies?: string[]
  spiceLevel?: number
  notifications?: {
    orderUpdates?: boolean
    promotions?: boolean
    newsletter?: boolean
  }
  delivery?: {
    defaultAddress?: string
    preferredTimeSlots?: string[]
  }
}

// ============================================================================
// Platform Types
// ============================================================================

export enum Platform {
  WEB = 'web',
  TELEGRAM = 'telegram'
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string
  type: 'order' | 'promotion' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

// ============================================================================
// Restaurant Types
// ============================================================================

export interface Restaurant {
  id: string
  name: string
  address: string
  location: UserLocation
  phone?: string
  deliveryTime?: number
  deliveryRadius?: number
  isActive: boolean
}

// ============================================================================
// Delivery Types (Legacy)
// ============================================================================
// @deprecated Consider using types from './api/delivery.api' instead

export interface DeliveryZone {
  id: string
  name: string
  polygon: Array<{ lat: number; lng: number }>
  deliveryFee: string
  minOrderAmount: string
}

export interface Delivery {
  id: string
  orderId: string
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered'
  courierLocation?: UserLocation
  estimatedTime?: number
  courierInfo?: CourierInfo
}

export interface CourierInfo {
  id: string
  name: string
  phone: string
  photo?: string
  location: UserLocation
}

export interface TrackingUpdate {
  id: string
  timestamp: string
  status: string
  message: string
  location?: UserLocation
}

// ============================================================================
// DEPRECATED TYPES - Maintained for Backward Compatibility
// ============================================================================
// These types are deprecated and will be removed in a future version.
// Please migrate to the new type structure:
// - Use types from './api' for API responses
// - Use types from './ui' for UI components
// - Use types from './mocks' for test data
//
// Migration Guide: See docs/TYPE_MIGRATION.md
// ============================================================================

/**
 * @deprecated Use CategoryUI from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 * 
 * Migration:
 * ```typescript
 * // Old
 * import type { Category } from '~/types'
 * 
 * // New
 * import type { CategoryUI } from '~/types/ui'
 * // or
 * import type { Category } from '~/types/ui' // alias available
 * ```
 */
export interface Category {
  id: string
  name: string
  description?: string
  imageUrl?: string
  sortOrder: number
  icon?: string
  count?: number
}

/**
 * @deprecated Use MenuItemUI from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 * 
 * Migration:
 * ```typescript
 * // Old
 * import type { MenuItem } from '~/types'
 * 
 * // New
 * import type { MenuItemUI } from '~/types/ui'
 * // or
 * import type { MenuItem } from '~/types/ui' // alias available
 * ```
 */
export interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  categoryId?: string
  category?: Category
  menuId: string // Added to match backend
  isActive: boolean
  createdAt: string // Added to match backend
  updatedAt: string // Added to match backend
  // Frontend specific / future fields (kept as optional to avoid breaking UI if not in backend yet)
  isAvailable?: boolean
  stockQuantity?: number
  calories?: number
  preparationTime?: number
  cookingTime?: number
  ingredients?: string[]
  allergens?: string[]
  nutritionInfo?: NutritionInfo
  dietary?: string[]
  badges?: MenuItemBadge[]
  modifierGroups?: ModifierGroup[]
  isNew?: boolean
  isPopular?: boolean
}

/**
 * @deprecated Use ModifierGroupUI from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 */
export interface ModifierGroup {
  id: string
  name: string
  required: boolean
  minSelection: number
  maxSelection: number
  modifiers: Modifier[]
}

/**
 * @deprecated Use ModifierUI from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 */
export interface Modifier {
  id: string
  name: string
  priceAdjustment: number
  isDefault: boolean
}

/**
 * @deprecated Use MenuItemBadge from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 */
export interface MenuItemBadge {
  type: 'new' | 'popular' | 'spicy' | 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free'
  label?: string
}

/**
 * @deprecated Use NutritionInfo from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 */
export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
}

/**
 * @deprecated Use MenuFilters from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 */
export interface MenuFilters {
  priceRange?: [number, number]
  calories?: [number, number]
  dietary?: string[]
  cookingTime?: number
  availability?: boolean
}

/**
 * @deprecated Use CartItem from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 * 
 * Migration:
 * ```typescript
 * // Old
 * import type { CartItem } from '~/types'
 * 
 * // New
 * import type { CartItem } from '~/types/ui'
 * ```
 */
/**
 * @deprecated Use OrderUI from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 * 
 * Migration:
 * ```typescript
 * // Old
 * import type { Order } from '~/types'
 * 
 * // New
 * import type { OrderUI } from '~/types/ui'
 * // or
 * import type { Order } from '~/types/ui' // alias available
 * ```
 */
export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  total: number
  items: OrderItem[]
  customerInfo: CustomerInfo
  customerId: string
  createdAt: string
  estimatedTime?: number
  deliveryAddress?: string
  orderType: 'delivery' | 'pickup' | 'dine-in'
  deliveryDetails?: any
  pickupDetails?: any
  dineInDetails?: any
}

/**
 * @deprecated Use OrderItemUI from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 * 
 * Migration:
 * ```typescript
 * // Old
 * import type { OrderItem } from '~/types'
 * 
 * // New
 * import type { OrderItemUI } from '~/types/ui'
 * // or
 * import type { OrderItem } from '~/types/ui' // alias available
 * ```
 */
export interface OrderItem {
  id: string
  menuItemId: string
  menuItem: MenuItem
  quantity: number
  price: number
  subtotal: number
  customizations?: Record<string, any>
  selectedModifiers?: Modifier[]
}

/**
 * @deprecated Use CustomerInfo from './ui' instead
 * This type is kept for backward compatibility and will be removed in v2.0
 */
export interface CustomerInfo {
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

/**
 * @deprecated Use OrderStatus from './ui' or './api' instead
 * This enum is kept for backward compatibility and will be removed in v2.0
 * 
 * Migration:
 * ```typescript
 * // Old
 * import { OrderStatus } from '~/types'
 * 
 * // New
 * import { OrderStatus } from '~/types/ui'
 * // or
 * import { OrderStatus } from '~/types/api'
 * ```
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

// ============================================================================
// DTO Types
// ============================================================================

export interface CreateOrderDto {
  items: {
    productId: string
    quantity: number
    price: number
    customizations?: Record<string, any>
  }[]
  customerInfo: CustomerInfo
  paymentMethod: 'STRIPE' | 'CASH' | 'TRANSFER'
  notes?: string
  deliveryAddress?: string
}

// ============================================================================
// Promotion Types
// ============================================================================

export interface Promotion {
  id: string
  title: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  validFrom: string
  validTo: string
  isActive: boolean
}