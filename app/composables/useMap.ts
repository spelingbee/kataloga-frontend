import { ref, computed } from 'vue'
import { useTenantStore } from '~/stores/tenant'
import type { Coordinates, DeliveryZone } from '../types/delivery'

export const useMap = () => {
  const { $mapService } = useNuxtApp() as any
  const isGeocoding = ref(false)
  const error = ref<string | null>(null)
  const selectedCoordinates = ref<Coordinates | null>(null)
  const selectedAddress = ref<string>('')
  const deliveryZone = ref<DeliveryZone | null>(null)

  // Default restaurant location (Bishkek, Kyrgyzstan)
  const restaurantCoords: Coordinates = {
    lat: 42.8746,
    lng: 74.5698
  }

  /**
   * Reverse geocode coordinates to address
   */
  const reverseGeocode = async (coords: Coordinates) => {
    isGeocoding.value = true
    error.value = null

    try {
      const address = await $mapService.reverseGeocode(coords)
      selectedAddress.value = address
      selectedCoordinates.value = coords

      // Detect delivery zone
      const settings = useTenantStore().currentTenant?.settings?.deliverySettings
      const defaultFee = settings?.deliveryFee !== undefined ? settings.deliveryFee : 0
      const zone = $mapService.detectDeliveryZone(coords, restaurantCoords, defaultFee)
      deliveryZone.value = zone

      if (!zone.isAvailable) {
        error.value = 'This location is outside our delivery area'
      }

      return address
    } catch (err) {
      error.value = 'Failed to load address. Please try again.'
      selectedAddress.value = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
      throw err
    } finally {
      isGeocoding.value = false
    }
  }

  /**
   * Forward geocode address to coordinates
   */
  const geocode = async (address: string) => {
    isGeocoding.value = true
    error.value = null

    try {
      const coords = await $mapService.geocode(address)
      if (!coords) {
        error.value = 'Address not found'
        return null
      }

      selectedCoordinates.value = coords
      selectedAddress.value = address

      // Detect delivery zone
      const settings = useTenantStore().currentTenant?.settings?.deliverySettings
      const defaultFee = settings?.deliveryFee !== undefined ? settings.deliveryFee : 0
      const zone = $mapService.detectDeliveryZone(coords, restaurantCoords, defaultFee)
      deliveryZone.value = zone

      if (!zone.isAvailable) {
        error.value = 'This location is outside our delivery area'
      }

      return coords
    } catch (err) {
      error.value = 'Failed to find address. Please try again.'
      throw err
    } finally {
      isGeocoding.value = false
    }
  }

  /**
   * Calculate distance between two points
   */
  const calculateDistance = (coords1: Coordinates, coords2: Coordinates): number => {
    return $mapService.calculateDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng)
  }

  /**
   * Clear geocoding cache
   */
  const clearCache = () => {
    $mapService.clearCache()
  }

  /**
   * Reset state
   */
  const reset = () => {
    selectedCoordinates.value = null
    selectedAddress.value = ''
    deliveryZone.value = null
    error.value = null
    isGeocoding.value = false
  }

  // Computed properties
  const isDeliveryAvailable = computed(() => {
    return deliveryZone.value?.isAvailable ?? false
  })

  const deliveryFee = computed(() => {
    return deliveryZone.value?.deliveryFee ?? 0
  })

  const hasValidLocation = computed(() => {
    return selectedCoordinates.value !== null && isDeliveryAvailable.value
  })

  return {
    // State
    isGeocoding,
    error,
    selectedCoordinates,
    selectedAddress,
    deliveryZone,
    restaurantCoords,

    // Computed
    isDeliveryAvailable,
    deliveryFee,
    hasValidLocation,

    // Methods
    reverseGeocode,
    geocode,
    calculateDistance,
    clearCache,
    reset
  }
}
