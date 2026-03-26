import { defineStore } from 'pinia'
import type { UserLocation } from '~/types'

interface LocationState {
  currentLocation: UserLocation | null
  savedAddresses: Array<{
    id: string
    name: string
    address: string
    location: UserLocation
    isDefault: boolean
  }>
  deliveryZones: Array<{
    id: string
    name: string
    coordinates: UserLocation[]
    isActive: boolean
    minOrderAmount: string
    deliveryFee: string
  }>
  restaurants: Array<{
    id: string
    name: string
    address: string
    location: UserLocation
    phone?: string
    deliveryTime?: number
    isActive: boolean
    deliveryRadius: number
  }>
  loading: boolean
  error: string | null
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown'
}

export const useLocationStore = defineStore('location', {
  state: (): LocationState => ({
    currentLocation: null,
    savedAddresses: [],
    deliveryZones: [],
    restaurants: [],
    loading: false,
    error: null,
    permissionStatus: 'unknown',
  }),

  getters: {
    hasLocation: (state) => state.currentLocation !== null,
    userLocation: (state) => state.currentLocation,
    defaultAddress: (state) => state.savedAddresses.find(addr => addr.isDefault),
  },

  actions: {
    async getCurrentLocation(): Promise<UserLocation | null> {
      this.loading = true
      this.error = null

      try {
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this browser')
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes
            }
          )
        })

        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        this.currentLocation = location
        this.permissionStatus = 'granted'

        // Save to localStorage
        if (import.meta.client) {
          localStorage.setItem('currentLocation', JSON.stringify(location))
        }

        return location
      } catch (error: any) {
        this.error = error.message || 'Failed to get current location'

        if (error.code === 1) {
          this.permissionStatus = 'denied'
        }

        console.error('Geolocation error:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    setCurrentLocation(location: UserLocation) {
      this.currentLocation = location

      // Save to localStorage
      if (import.meta.client) {
        localStorage.setItem('currentLocation', JSON.stringify(location))
      }
    },

    restoreLocation() {
      if (import.meta.client) {
        const saved = localStorage.getItem('currentLocation')
        if (saved) {
          try {
            this.currentLocation = JSON.parse(saved)
          } catch (error) {
            console.error('Failed to restore location:', error)
          }
        }
      }
    },

    clearLocation() {
      this.currentLocation = null

      if (import.meta.client) {
        localStorage.removeItem('currentLocation')
      }
    },

    async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
      if (!navigator.permissions) {
        return 'unknown' as any
      }

      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        this.permissionStatus = result.state as any
        return result.state as any
      } catch (error) {
        console.error('Failed to check geolocation permission:', error)
        return 'unknown' as any
      }
    },

    checkDeliveryAvailability(userLocation: UserLocation): boolean {
      return this.deliveryZones.some(zone => {
        // Simple distance check - in real app would use proper geofencing
        const firstCoord = zone.coordinates[0]
        if (!firstCoord) return false

        const distance = Math.sqrt(
          Math.pow(firstCoord.latitude - userLocation.latitude, 2) +
          Math.pow(firstCoord.longitude - userLocation.longitude, 2)
        )
        return distance < 0.1 // Rough approximation
      })
    },

    async findNearestRestaurants() {
      const location = this.currentLocation
      if (!location) {
        return []
      }

      // Sort restaurants by distance
      return this.restaurants
        .filter(r => r.isActive)
        .sort((a, b) => {
          const distanceA = Math.sqrt(
            Math.pow(a.location.latitude - location.latitude, 2) +
            Math.pow(a.location.longitude - location.longitude, 2)
          )
          const distanceB = Math.sqrt(
            Math.pow(b.location.latitude - location.latitude, 2) +
            Math.pow(b.location.longitude - location.longitude, 2)
          )
          return distanceA - distanceB
        })
    },

    selectRestaurant(restaurantId: string) {
      const restaurant = this.restaurants.find(r => r.id === restaurantId)
      if (restaurant) {
        // Store selected restaurant logic here
        console.log('Selected restaurant:', restaurant)
      }
    },
  },
})