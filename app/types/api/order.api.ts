/**
 * API response types for order-related endpoints
 * 
 * These types are readonly and match backend responses exactly.
 * They represent the order data as it comes from the API and should
 * be converted to UI types for component usage.
 * 
 * @module types/api/order
 */

/**
 * Order as returned by the API
 * 
 * Represents a customer order exactly as it comes from the backend API.
 * All fields are readonly to prevent accidental mutations.
 * 
 * @interface OrderAPI
 * @example
 * ```typescript
 * const apiOrder: OrderAPI = await fetchOrder('order-123')
 * const uiOrder = orderAPIToUI(apiOrder, customerInfo) // Convert for UI use
 * ```
 */
export interface OrderAPI {
  /** Unique identifier for the order */
  readonly id: string
  /** Human-readable order number */
  readonly orderNumber: string
  /** Current status of the order */
  readonly status: OrderStatus
  /** Total amount for the order */
  readonly total: number
  /** Array of items in the order */
  readonly items: readonly OrderItemAPI[]
  /** ID of the customer who placed the order */
  readonly customerId: string
  /** ISO timestamp when the order was created */
  readonly createdAt: string
  /** ISO timestamp when the order was last updated */
  readonly updatedAt: string
  /** Estimated preparation time in minutes */
  readonly estimatedTime: number | null
  /** Delivery address if order type is delivery */
  readonly deliveryAddress: string | null
  /** Type of order fulfillment */
  readonly orderType: 'delivery' | 'pickup' | 'dine-in'
  /** Payment method used for the order */
  readonly paymentMethod?: 'CASH' | 'TRANSFER' | 'STRIPE'
  /** Special instructions or notes */
  readonly notes?: string
}

/**
 * Order item as returned by the API
 * 
 * Represents a single item within an order as returned by the backend API.
 * Contains the menu item reference and quantity/pricing information.
 * 
 * @interface OrderItemAPI
 * @example
 * ```typescript
 * const orderItem: OrderItemAPI = {
 *   id: 'item-1',
 *   menuItemId: 'menu-item-123',
 *   quantity: 2,
 *   price: 12.50,
 *   subtotal: 25.00,
 *   customizations: { size: 'large', spice: 'medium' }
 * }
 * ```
 */
export interface OrderItemAPI {
  /** Unique identifier for the order item */
  readonly id: string
  /** ID of the menu item being ordered */
  readonly menuItemId: string
  /** Quantity of this item ordered */
  readonly quantity: number
  /** Unit price of the item at time of order */
  readonly price: number
  /** Total price for this item (price × quantity + modifiers) */
  readonly subtotal: number
  /** Custom modifications or special instructions */
  readonly customizations: Readonly<Record<string, any>> | null
}

/**
 * Order status enumeration
 * 
 * Represents all possible states an order can be in during its lifecycle.
 * Used for tracking order progress and determining available actions.
 * 
 * @enum OrderStatus
 * @example
 * ```typescript
 * // Check order status
 * if (order.status === OrderStatus.PENDING) {
 *   // Show cancel option
 * }
 * 
 * // Update order status
 * await updateOrderStatus(orderId, OrderStatus.CONFIRMED)
 * ```
 */
export enum OrderStatus {
  /** Order has been placed but not yet confirmed */
  PENDING = 'PENDING',
  /** Order has been confirmed by the restaurant */
  CONFIRMED = 'CONFIRMED',
  /** Order is being prepared */
  PREPARING = 'PREPARING',
  /** Order is ready for pickup/delivery */
  READY = 'READY',
  /** Order is out for delivery (delivery orders only) */
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  /** Order has been delivered/completed */
  DELIVERED = 'DELIVERED',
  /** Order has been cancelled */
  CANCELLED = 'CANCELLED'
}
