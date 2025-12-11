export interface Coordinates {
  lat: number
  lng: number
}

export interface DeliveryZone {
  id: string
  name: string
  deliveryFee: number
  isAvailable: boolean
  minOrderAmount?: number
  estimatedTime?: number // in minutes
}

export interface DeliveryAddress {
  address: string
  coordinates: Coordinates
  zoneId: string
  deliveryFee: number
}

export interface DeliveryDetails {
  address: string
  coordinates: Coordinates
  phone: string
  instructions?: string
  deliveryZone: string
  deliveryFee: number
}

export interface MapConfig {
  provider: '2gis' | 'yandex' | 'openstreetmap'
  center: Coordinates
  zoom: number
  apiKey?: string
}

export interface GeocodingResult {
  address: string
  coordinates: Coordinates
  confidence: number
}
