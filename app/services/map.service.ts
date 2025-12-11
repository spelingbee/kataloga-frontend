import type { Coordinates, DeliveryZone } from '../types/delivery'

/**
 * Map service for handling geocoding, reverse geocoding, and delivery zone detection
 */
export class MapService {
  private geocodeCache = new Map<string, string>()
  private readonly CACHE_EXPIRY = 1000 * 60 * 60 // 1 hour
  private cacheTimestamps = new Map<string, number>()

  /**
   * Reverse geocode coordinates to address with caching
   */
  async reverseGeocode(coords: Coordinates): Promise<string> {
    const cacheKey = this.getCacheKey(coords)

    // Check cache
    if (this.isCacheValid(cacheKey)) {
      return this.geocodeCache.get(cacheKey)!
    }

    try {
      // In production, replace with 2GIS or Yandex API
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
    try {
      // In production, replace with 2GIS or Yandex API
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
  detectDeliveryZone(coords: Coordinates, restaurantCoords: Coordinates): DeliveryZone {
    const distance = this.calculateDistance(
      coords.lat,
      coords.lng,
      restaurantCoords.lat,
      restaurantCoords.lng
    )

    // Simple zone detection - replace with backend API call in production
    if (distance < 3) {
      return {
        id: 'zone-1',
        name: 'Zone 1',
        deliveryFee: 50,
        isAvailable: true
      }
    } else if (distance < 6) {
      return {
        id: 'zone-2',
        name: 'Zone 2',
        deliveryFee: 100,
        isAvailable: true
      }
    } else if (distance < 10) {
      return {
        id: 'zone-3',
        name: 'Zone 3',
        deliveryFee: 150,
        isAvailable: true
      }
    } else {
      return {
        id: 'out-of-range',
        name: 'Out of Range',
        deliveryFee: 0,
        isAvailable: false
      }
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

// Export singleton instance
export const mapService = new MapService()
