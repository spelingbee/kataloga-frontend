/**
 * UI model types for order-related components
 * These types are mutable and include computed fields
 */

import type { OrderAPI, OrderItemAPI } from '../api/order.api'
import { OrderStatus } from '../api/order.api'
import type { MenuItemUI } from './menu.ui'
import type { ModifierUI } from './menu.ui'

export interface OrderUI extends Omit<OrderAPI, 'items'> {
  items: OrderItemUI[]
  
  // Computed fields
  subtotal: number
  deliveryFee: number
  discount: number
  tax: number
  
  // UI-specific fields
  customerInfo: CustomerInfo
  deliveryDetails?: DeliveryDetails
  pickupDetails?: PickupDetails
  dineInDetails?: DineInDetails
  
  // Tracking fields
  trackingInfo?: TrackingInfo
  courierInfo?: CourierInfo
}

export interface TrackingInfo {
  currentLocation?: {
    latitude: number
    longitude: number
  }
  estimatedArrival?: string
  updates: TrackingUpdate[]
}

export interface CourierInfo {
  id: string
  name: string
  phone: string
  rating?: number
  vehicleType?: string
}

export interface TrackingUpdate {
  id: string
  timestamp: string
  status: string
  message: string
  location?: {
    latitude: number
    longitude: number
  }
}

export interface OrderItemUI {
  // Core fields from API (made mutable)
  id: string
  menuItemId: string
  quantity: number
  price: number
  subtotal: number
  customizations: Record<string, any> | null
  
  // UI-specific fields
  menuItem: MenuItemUI
  selectedModifiers: ModifierUI[]
  notes?: string
}

export interface CustomerInfo {
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

export interface DeliveryDetails {
  address: string
  instructions?: string
  estimatedTime?: number
}

export interface PickupDetails {
  location: string
  estimatedTime?: number
}

export interface DineInDetails {
  tableNumber: string
  guestCount: number
}

// Cart types (UI-only)
export interface CartItem {
  menuItem: MenuItemUI
  quantity: number
  selectedModifiers: ModifierUI[]
  subtotal: number
  notes?: string
  customizations?: Record<string, any>
}

// Type aliases for backward compatibility
export type Order = OrderUI
export type OrderItem = OrderItemUI
export { OrderStatus }
