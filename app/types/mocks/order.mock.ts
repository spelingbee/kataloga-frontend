/**
 * Minimal types for mock order data in tests
 * These types have optional fields that are required in API types
 * Uses undefined for nullable fields to match UI standard for better compatibility
 */

import type { OrderStatus } from '../api/order.api'

export interface OrderMock {
  id: string
  orderNumber: string
  status: OrderStatus
  total: number
  items: OrderItemMock[]
  customerId: string
  createdAt?: string  // Optional for mocks
  updatedAt?: string  // Optional for mocks
  estimatedTime?: number | undefined  // Match UI standard (undefined)
  deliveryAddress?: string | undefined  // Match UI standard (undefined)
  orderType: 'delivery' | 'pickup' | 'dine-in'
  // Additional UI-compatible fields for testing
  subtotal?: number
  deliveryFee?: number
  discount?: number
  tax?: number
}

export interface OrderItemMock {
  id: string
  menuItemId: string
  quantity: number
  price: number
  subtotal: number
  customizations?: Record<string, any> | undefined  // Match UI standard (undefined)
  notes?: string | undefined  // UI-specific field
}
