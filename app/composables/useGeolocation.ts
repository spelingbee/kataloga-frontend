import type { UserLocation } from '~/types'

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export interface GeolocationError {
  code: number
  message: string
  type: 'permission_denied' | 'position_unavailable' | 'timeout' | 'not_supported'
}

export const useGeolocation = () => {
  // Reactive state
  const currentLocation = ref<UserLocation | null>(null)
  const isLoading = ref(false)
  const error = ref<GeolocationError | null>(null)
  const isSupported = ref(false)
  const permissionStatus = ref<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')

  // Check if geolocation is supported
  const checkSupport = () => {
    isSupported.value = 'geolocation' in navigator
    return isSupported.value
  }

  // Check permission status
  const checkPermission = async (): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> => {
    if (!checkSupport()) {
      permissionStatus.value = 'unknown'
      return 'unknown'
    }

    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        permissionStatus.value = permission.state
        
        // Listen for permission changes
        permission.addEventListener('change', () => {
          permissionStatus.value = permission.state
        })
        
        return permission.state
      }
    } catch (err) {
      console.warn('Permission API not supported')
    }

    permissionStatus.value = 'unknown'
    return 'unknown'
  }

  // Get current position
  const getCurrentPosition = async (options: GeolocationOptions = {}): Promise<UserLocation | null> => {
    if (!checkSupport()) {
      error.value = {
        code: 0,
        message: 'Geolocation is not supported by this browser',
        type: 'not_supported'
      }
      return null
    }

    isLoading.value = true
    error.value = null

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 300000 // 5 minutes
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }

          // Try to get address from coordinates
          try {
            const address = await reverseGeocode(location.latitude, location.longitude)
            if (address) {
              location.address = address
            }
          } catch (err) {
            console.warn('Reverse geocoding failed:', err)
          }

          currentLocation.value = location
          isLoading.value = false
          
          // Store location in localStorage
          if (import.meta.client) {
            localStorage.setItem('last_known_location', JSON.stringify(location))
          }

          resolve(location)
        },
        (err) => {
          isLoading.value = false
          
          let errorType: GeolocationError['type']
          let message: string

          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorType = 'permission_denied'
              message = 'Location access denied by user'
              break
            case err.POSITION_UNAVAILABLE:
              errorType = 'position_unavailable'
              message = 'Location information is unavailable'
              break
            case err.TIMEOUT:
              errorType = 'timeout'
              message = 'Location request timed out'
              break
            default:
              errorType = 'position_unavailable'
              message = 'An unknown error occurred'
              break
          }

          error.value = {
            code: err.code,
            message,
            type: errorType
          }

          resolve(null)
        },
        defaultOptions
      )
    })
  }

  // Watch position changes
  const watchPosition = (options: GeolocationOptions = {}): (() => void) | null => {
    if (!checkSupport()) return null

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000 // 1 minute for watching
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }

        // Try to get address from coordinates
        try {
          const address = await reverseGeocode(location.latitude, location.longitude)
          if (address) {
            location.address = address
          }
        } catch (err) {
          console.warn('Reverse geocoding failed:', err)
        }

        currentLocation.value = location
        
        // Store location in localStorage
        if (import.meta.client) {
          localStorage.setItem('last_known_location', JSON.stringify(location))
        }
      },
      (err) => {
        console.error('Position watch error:', err)
      },
      defaultOptions
    )

    // Return cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  // Reverse geocoding (convert coordinates to address)
  const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      // Using OpenStreetMap Nominatim API (free alternative to Google Maps)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MenuOrderingApp/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Geocoding request failed')
      }

      const data = await response.json()
      
      if (data && data.display_name) {
        return data.display_name
      }

      return null
    } catch (err) {
      console.error('Reverse geocoding error:', err)
      return null
    }
  }

  // Forward geocoding (convert address to coordinates)
  const geocode = async (address: string): Promise<UserLocation | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'MenuOrderingApp/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Geocoding request failed')
      }

      const data = await response.json()
      
      if (data && data.length > 0) {
        const result = data[0]
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name
        }
      }

      return null
    } catch (err) {
      console.error('Geocoding error:', err)
      return null
    }
  }

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Get stored location from localStorage
  const getStoredLocation = (): UserLocation | null => {
    if (import.meta.server) return null

    try {
      const stored = localStorage.getItem('last_known_location')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (err) {
      console.error('Error reading stored location:', err)
    }

    return null
  }

  // Clear stored location
  const clearStoredLocation = () => {
    if (import.meta.client) {
      localStorage.removeItem('last_known_location')
    }
    currentLocation.value = null
  }

  // Initialize geolocation
  const initialize = async () => {
    await checkPermission()
    
    // Try to load stored location first
    const stored = getStoredLocation()
    if (stored) {
      currentLocation.value = stored
    }
  }

  // Request location with user-friendly error handling
  const requestLocation = async (options: GeolocationOptions = {}): Promise<UserLocation | null> => {
    // Check permission first
    const permission = await checkPermission()
    
    if (permission === 'denied') {
      error.value = {
        code: 1,
        message: 'Location access is denied. Please enable location services in your browser settings.',
        type: 'permission_denied'
      }
      return null
    }

    return await getCurrentPosition(options)
  }

  // Initialize on composable creation
  if (import.meta.client) {
    initialize()
  }

  return {
    // State
    currentLocation: readonly(currentLocation),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isSupported: readonly(isSupported),
    permissionStatus: readonly(permissionStatus),

    // Actions
    getCurrentPosition,
    requestLocation,
    watchPosition,
    reverseGeocode,
    geocode,
    calculateDistance,
    getStoredLocation,
    clearStoredLocation,
    checkPermission,
    checkSupport
  }
}