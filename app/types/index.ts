// Export tenant types
export * from './tenant'

// Export payment types
export * from './payment'

// User types
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
export interface Category {
  id: string
  name: string
  description?: string
  imageUrl?: string
  sortOrder: number
  icon?: string
  count?: number
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  categoryId?: string
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
  isPopular?: boolean
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
  menuItem: MenuItem
  quantity: number
  selectedModifiers: Modifier[]
  subtotal: number
  notes?: string
  customizations?: Record<string, any>
}

// Order types
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
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface CreateOrderDto {
  items: {
    productId: string
    quantity: number
    price: number
    customizations?: Record<string, any>
  }[]
  customerInfo: CustomerInfo
  notes?: string
  deliveryAddress?: string
}

// Promotion types
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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
  tenantId?: string // For tenant-aware responses
}

export interface ApiError extends Error {
  status?: number
  code?: string
  details?: any
  tenantSlug?: string // For tenant-specific errors
}

// Enhanced request configuration for tenant support
export interface RequestConfig {
  headers?: Record<string, string>
  params?: Record<string, any>
  timeout?: number
  bypassTenant?: boolean // For system-wide requests
  targetTenant?: string  // Override current tenant
}