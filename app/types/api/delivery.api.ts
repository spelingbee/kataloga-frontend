/**
 * API response types for delivery-related endpoints
 * These types are readonly and match backend responses exactly
 */

export interface DeliveryAPI {
  readonly id: string
  readonly orderId: string
  readonly status: DeliveryStatus
  readonly driverId: string | null
  readonly estimatedTime: number | null
  readonly actualTime: number | null
  readonly pickupAddress: string
  readonly deliveryAddress: string
  readonly distance: number | null
  readonly fee: number
  readonly createdAt: string
  readonly updatedAt: string
}

export interface DriverAPI {
  readonly id: string
  readonly name: string
  readonly phoneNumber: string
  readonly vehicleType: string
  readonly vehicleNumber: string
  readonly rating: number
  readonly photoUrl: string | null
  readonly currentLocation: readonly [number, number] | null
  readonly isAvailable: boolean
}

export interface DeliveryTrackingAPI {
  readonly deliveryId: string
  readonly currentLocation: readonly [number, number]
  readonly estimatedArrival: string
  readonly status: DeliveryStatus
  readonly lastUpdated: string
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}
