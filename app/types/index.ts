import type {
  UserResponseDto,
  CategoryDto,
  ProductVariantDto,
  RegisterDto,
} from '@kataloga/api-types'

// Local DTO interfaces to match backend schemas not exported as named DTOs
export interface ProductResponseDto {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface OrderResponseDto {
  id: string
  tenantId: string
  status: OrderStatus
  total: number
  createdAt: string
  updatedAt: string
  notes?: string
  paymentMethod: 'CASH' | 'TRANSFER' | 'STRIPE'
  paymentStatus: string
  deliveryAddress?: string
  latitude?: number
  longitude?: number
}

export interface OrderItemResponseDto {
  id: string
  orderId: string
  productId: string
  variantId?: string
  quantity: number
  price: number
  notes?: string
}

export interface PromotionResponseDto {
  id: string
  title: string
  description?: string
  discountType: string
  discountValue: number
  validFrom: string
  validTo: string
  isActive: boolean
  tenantId: string

  /**
   * NOTE: Backend model (schema.prisma) does not define a promo code.
   * Keep optional for UI experiments; see D33 for product decision.
   */
  code?: string
}


// Export API types
export * from './api'

// Export tenant types
export * from './tenant'

// Export payment types
export * from './payment'

// Export constants
export * from '../constants/error-codes'

// User types
export type User = UserResponseDto & {
  name: string
  avatarUrl?: string
  preferences?: UserPreferences
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  TENANT_ADMIN = 'TENANT_ADMIN',
  ADMIN = 'ADMIN',
  TENANT_STAFF = 'TENANT_STAFF',
  MEMBER = 'MEMBER',
  CLIENT = 'CLIENT'
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

// Platform types
export enum Platform {
  WEB = 'web',
  TELEGRAM = 'telegram'
}

// Notification types
export interface Notification {
  id: string
  type: 'order' | 'promotion' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

// Restaurant types
export interface Restaurant {
  id: string
  name: string
  address: string
  location: UserLocation
  phone?: string
  deliveryTime?: number
  isActive: boolean
}

// Delivery types
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
}

export interface CourierInfo {
  id: string
  name: string
  phone: string
  location: UserLocation
}

export interface TrackingUpdate {
  id: string
  timestamp: string
  status: string
  message: string
  location?: UserLocation
}

// Menu types
export type Category = CategoryDto & {
  imageUrl?: string
  count?: number
}

export type ProductVariant = ProductVariantDto

export type Product = ProductResponseDto & {
  variants?: ProductVariant[]
}

export interface MenuItem {
  id: string;
  productId: string; // Master product ID
  name: string;
  description: string;
  price: number; // Resolved price (override ?? basePrice)
  imageUrl?: string;
  categoryId?: string;
  category?: Category
  isActive: boolean
  isAvailable?: boolean  // Stop list check - false if item is temporarily unavailable
  stockQuantity?: number  // Available quantity (null/undefined = unlimited)
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
  isPopular?: boolean;
  product?: Product; // Linked master product details
}

export interface ModifierGroup {
  id: string
  name: string
  required: boolean
  minSelection: number
  maxSelection: number
  modifiers: Modifier[]
}

export interface Modifier {
  id: string
  name: string
  priceAdjustment: number
  isDefault: boolean
}

export interface MenuItemBadge {
  type: 'new' | 'popular' | 'spicy' | 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free'
  label?: string
}

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
}

export interface MenuFilters {
  priceRange?: [number, number]
  calories?: [number, number]
  dietary?: string[]
  cookingTime?: number
  availability?: boolean
}

// Cart types
export interface CartItem {
  productId: string
  variantId?: string
  variant?: ProductVariant
  menuItem: MenuItem
  quantity: number
  selectedModifiers: Modifier[]
  subtotal: number
  notes?: string
  customizations?: Record<string, any>
}

// Order types
export type Order = OrderResponseDto & {
  items: OrderItem[]
  customerInfo: CustomerInfo
  estimatedTime?: number
  deliveryAddress?: string
  orderType: 'delivery' | 'pickup' | 'dine-in'
  deliveryDetails?: any
  pickupDetails?: any
  dineInDetails?: any
}

export type OrderItem = OrderItemResponseDto & {
  menuItem: MenuItem
  selectedModifiers?: Modifier[]
}

export interface CustomerInfo {
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',

  /**
   * Deprecated UI-only status (no backend enum value in schema.prisma).
   * Treat as READY on the client when mapping to backend values.
   */
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY'
}

export interface CreateOrderDto {
  userId?: string
  tenantId: string
  items: {
    productId: string
    variantId?: string
    quantity: number
    price: number
    customizations?: Record<string, any>
  }[]
  customerInfo: CustomerInfo
  paymentMethod: 'STRIPE' | 'CASH' | 'TRANSFER'
  deliveryType: 'PICKUP' | 'DELIVERY'
  notes?: string
  deliveryAddress?: string
  latitude?: number
  longitude?: number
  total: number
}

// Promotion types
export type Promotion = PromotionResponseDto

export type { RegisterDto }
