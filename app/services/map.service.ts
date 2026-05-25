import type { Coordinates, DeliveryZone } from '../types/delivery'
import { useTenantStore } from '~/stores/tenant'

/**
 * Map service for handling geocoding, reverse geocoding, and delivery zone detection
 */
export class MapService {
  private geocodeCache = new Map<string, string>()
  private readonly CACHE_EXPIRY = 1000 * 60 * 60 // 1 hour
  private cacheTimestamps = new Map<string, number>()

  constructor(private apiClient?: any) {}

  private getTenantSlug(): string | null {
    if (!this.apiClient) return null

    // 1. Try to get from API client
    const currentTenant = this.apiClient.getCurrentTenant?.()
    if (currentTenant) {
      return currentTenant
    }

    // 2. Fall back to tenant store
    try {
      const tenantStore = useTenantStore()
      if (tenantStore.tenantSlug) {
        return tenantStore.tenantSlug
      }
    } catch (e) {
      // Ignored if called outside Nuxt/Pinia context
    }

    return null
  }

  /**
   * Reverse geocode coordinates to address with caching
   */
  async reverseGeocode(coords: Coordinates): Promise<string> {
    const cacheKey = this.getCacheKey(coords)

    // Check cache
    if (this.isCacheValid(cacheKey)) {
      return this.geocodeCache.get(cacheKey)!
    }

    const tenantSlug = this.getTenantSlug()
    if (this.apiClient && tenantSlug) {
      try {
        const data = await this.apiClient.get<{ address: string }>(
          `/tenants/${tenantSlug}/maps/reverse-geocode`,
          {
            params: {
              lat: coords.lat,
              lng: coords.lng
            }
          }
        )
        const address = data?.address || 'Unknown address'

        // Cache the result
        this.geocodeCache.set(cacheKey, address)
        this.cacheTimestamps.set(cacheKey, Date.now())

        return address
      } catch (error) {
        console.warn('Backend reverse geocoding proxy failed, falling back to direct OSM:', error)
      }
    }

    try {
      // In production fallback, replace with 2GIS or Yandex API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch address')
      }

      const data = await response.json()
      const address = data.display_name || 'Unknown address'

      // Cache the result
      this.geocodeCache.set(cacheKey, address)
      this.cacheTimestamps.set(cacheKey, Date.now())

      return address
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      throw new Error('Failed to load address')
    }
  }

  /**
   * Forward geocode address to coordinates
   */
  async geocode(address: string): Promise<Coordinates | null> {
    const tenantSlug = this.getTenantSlug()
    if (this.apiClient && tenantSlug) {
      try {
        const data = await this.apiClient.get<Coordinates | null>(
          `/tenants/${tenantSlug}/maps/geocode`,
          {
            params: {
              address
            }
          }
        )
        return data
      } catch (error) {
        console.warn('Backend geocoding proxy failed, falling back to direct OSM:', error)
      }
    }

    try {
      // In production fallback, replace with 2GIS or Yandex API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to geocode address')
      }

      const data = await response.json()
      if (data.length === 0) {
        return null
      }

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  /**
   * Detect delivery zone based on coordinates
   * In production, this should call the backend API to check against actual delivery zones
   */
  detectDeliveryZone(coords: Coordinates, restaurantCoords: Coordinates, defaultFee: number = 0): DeliveryZone {
    // Distance calculation can be kept for info, but we don't use it for zones anymore as requested by user.
    // Just return a default zone with the default fee.
    return {
      id: 'default',
      name: 'Standard Delivery',
      deliveryFee: defaultFee,
      isAvailable: true
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLng = this.toRad(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Clear geocoding cache
   */
  clearCache(): void {
    this.geocodeCache.clear()
    this.cacheTimestamps.clear()
  }

  /**
   * Get cache key for coordinates
   */
  private getCacheKey(coords: Coordinates): string {
    return `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(key: string): boolean {
    if (!this.geocodeCache.has(key)) {
      return false
    }

    const timestamp = this.cacheTimestamps.get(key)
    if (!timestamp) {
      return false
    }

    return Date.now() - timestamp < this.CACHE_EXPIRY
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export const mapService = new MapService()
