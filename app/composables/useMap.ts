import type { UserLocation, Restaurant, DeliveryZone } from '~/types'

export interface MapOptions {
  center?: UserLocation
  zoom?: number
  style?: 'default' | 'satellite' | 'terrain'
  controls?: boolean
  scrollWheelZoom?: boolean
  doubleClickZoom?: boolean
  dragging?: boolean
}

export interface MapMarker {
  id: string
  position: UserLocation
  title?: string
  description?: string
  icon?: string
  type?: 'restaurant' | 'user' | 'delivery' | 'custom'
  data?: any
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export const useMap = () => {
  // Map instance reference
  const mapInstance = ref<any>(null)
  const mapContainer = ref<HTMLElement | null>(null)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Map state
  const center = ref<UserLocation>({ latitude: 40.7128, longitude: -74.0060 }) // Default to NYC
  const zoom = ref(13)
  const markers = ref<MapMarker[]>([])
  const selectedMarker = ref<MapMarker | null>(null)

  // Initialize map (using Leaflet as a free alternative to Google Maps)
  const initializeMap = async (container: HTMLElement, options: MapOptions = {}) => {
    if (import.meta.server) return

    isLoading.value = true
    error.value = null

    try {
      // Dynamically import Leaflet
      const L = await import('leaflet')
      
      // Set default options
      const mapOptions = {
        center: options.center || center.value,
        zoom: options.zoom || zoom.value,
        scrollWheelZoom: options.scrollWheelZoom ?? true,
        doubleClickZoom: options.doubleClickZoom ?? true,
        dragging: options.dragging ?? true,
        zoomControl: options.controls ?? true
      }

      // Create map instance
      const map = L.map(container, {
        center: [mapOptions.center.latitude, mapOptions.center.longitude],
        zoom: mapOptions.zoom,
        scrollWheelZoom: mapOptions.scrollWheelZoom,
        doubleClickZoom: mapOptions.doubleClickZoom,
        dragging: mapOptions.dragging,
        zoomControl: mapOptions.zoomControl
      })

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)

      mapInstance.value = map
      mapContainer.value = container
      isLoaded.value = true

      // Update center and zoom when map moves
      map.on('moveend', () => {
        const mapCenter = map.getCenter()
        center.value = {
          latitude: mapCenter.lat,
          longitude: mapCenter.lng
        }
        zoom.value = map.getZoom()
      })

      // Handle marker clicks
      map.on('click', (e: any) => {
        selectedMarker.value = null
      })

    } catch (err) {
      console.error('Map initialization error:', err)
      error.value = 'Failed to initialize map'
    } finally {
      isLoading.value = false
    }
  }

  // Add marker to map
  const addMarker = async (marker: MapMarker) => {
    if (!mapInstance.value || import.meta.server) return

    try {
      const L = await import('leaflet')
      
      // Create marker icon based on type
      let icon
      switch (marker.type) {
        case 'restaurant':
          icon = L.divIcon({
            html: '<div class="w-8 h-8 bg-primary-red rounded-full flex items-center justify-center text-white text-sm font-bold">🍽️</div>',
            className: 'custom-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
          break
        case 'user':
          icon = L.divIcon({
            html: '<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
            className: 'custom-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
          break
        case 'delivery':
          icon = L.divIcon({
            html: '<div class="w-8 h-8 bg-primary-green rounded-full flex items-center justify-center text-white text-sm">🚚</div>',
            className: 'custom-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
          break
        default:
          icon = L.marker([0, 0]).getIcon() // Default icon
      }

      const leafletMarker = L.marker(
        [marker.position.latitude, marker.position.longitude],
        { icon }
      ).addTo(mapInstance.value)

      // Add popup if title or description provided
      if (marker.title || marker.description) {
        const popupContent = `
          <div class="p-2">
            ${marker.title ? `<h3 class="font-semibold text-sm mb-1">${marker.title}</h3>` : ''}
            ${marker.description ? `<p class="text-xs text-gray-600">${marker.description}</p>` : ''}
          </div>
        `
        leafletMarker.bindPopup(popupContent)
      }

      // Handle marker click
      leafletMarker.on('click', () => {
        selectedMarker.value = marker
      })

      // Store marker reference
      ;(leafletMarker as any)._customId = marker.id
      markers.value.push(marker)

    } catch (err) {
      console.error('Error adding marker:', err)
    }
  }

  // Remove marker from map
  const removeMarker = (markerId: string) => {
    if (!mapInstance.value) return

    mapInstance.value.eachLayer((layer: any) => {
      if (layer._customId === markerId) {
        mapInstance.value.removeLayer(layer)
      }
    })

    markers.value = markers.value.filter(m => m.id !== markerId)
    
    if (selectedMarker.value?.id === markerId) {
      selectedMarker.value = null
    }
  }

  // Clear all markers
  const clearMarkers = () => {
    if (!mapInstance.value) return

    mapInstance.value.eachLayer((layer: any) => {
      if (layer._customId) {
        mapInstance.value.removeLayer(layer)
      }
    })

    markers.value = []
    selectedMarker.value = null
  }

  // Set map center
  const setCenter = (location: UserLocation, zoomLevel?: number) => {
    if (!mapInstance.value) return

    mapInstance.value.setView(
      [location.latitude, location.longitude],
      zoomLevel || zoom.value
    )
    center.value = location
  }

  // Fit map to show all markers
  const fitToMarkers = (padding: number = 20) => {
    if (!mapInstance.value || markers.value.length === 0) return

    const L = require('leaflet')
    const group = new L.featureGroup()

    mapInstance.value.eachLayer((layer: any) => {
      if (layer._customId) {
        group.addLayer(layer)
      }
    })

    if (group.getLayers().length > 0) {
      mapInstance.value.fitBounds(group.getBounds(), { padding: [padding, padding] })
    }
  }

  // Get map bounds
  const getBounds = (): MapBounds | null => {
    if (!mapInstance.value) return null

    const bounds = mapInstance.value.getBounds()
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    }
  }

  // Add restaurants to map
  const addRestaurants = (restaurants: Restaurant[]) => {
    restaurants.forEach(restaurant => {
      addMarker({
        id: `restaurant-${restaurant.id}`,
        position: {
          latitude: restaurant.location.latitude,
          longitude: restaurant.location.longitude,
          address: restaurant.address
        },
        title: restaurant.name,
        description: restaurant.address,
        type: 'restaurant',
        data: restaurant
      })
    })
  }

  // Add user location marker
  const addUserLocation = (location: UserLocation) => {
    // Remove existing user marker
    removeMarker('user-location')

    addMarker({
      id: 'user-location',
      position: location,
      title: 'Your Location',
      description: location.address || 'Current location',
      type: 'user'
    })
  }

  // Add delivery tracking
  const addDeliveryTracking = (courierLocation: UserLocation, deliveryAddress: UserLocation) => {
    // Remove existing delivery markers
    removeMarker('courier-location')
    removeMarker('delivery-address')

    // Add courier marker
    addMarker({
      id: 'courier-location',
      position: courierLocation,
      title: 'Courier',
      description: 'Delivery in progress',
      type: 'delivery'
    })

    // Add delivery address marker
    addMarker({
      id: 'delivery-address',
      position: deliveryAddress,
      title: 'Delivery Address',
      description: deliveryAddress.address || 'Delivery destination',
      type: 'custom'
    })

    // Fit map to show both markers
    setTimeout(() => fitToMarkers(), 100)
  }

  // Draw delivery zone
  const addDeliveryZone = async (zone: DeliveryZone) => {
    if (!mapInstance.value) return

    try {
      const L = await import('leaflet')
      
      const polygon = L.polygon(
        zone.polygon.map(point => [point.lat, point.lng]),
        {
          color: '#20ab47',
          fillColor: '#20ab47',
          fillOpacity: 0.2,
          weight: 2
        }
      ).addTo(mapInstance.value)

      polygon.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-sm mb-1">${zone.name}</h3>
          <p class="text-xs text-gray-600">Delivery Fee: $${zone.deliveryFee}</p>
          <p class="text-xs text-gray-600">Min Order: $${zone.minOrderAmount}</p>
        </div>
      `)

      ;(polygon as any)._customId = `zone-${zone.id}`

    } catch (err) {
      console.error('Error adding delivery zone:', err)
    }
  }

  // Find nearest restaurant
  const findNearestRestaurant = (userLocation: UserLocation, restaurants: Restaurant[]): Restaurant | null => {
    if (restaurants.length === 0) return null

    const { calculateDistance } = useGeolocation()
    
    let nearest = restaurants[0]
    let minDistance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      nearest.location.latitude,
      nearest.location.longitude
    )

    for (let i = 1; i < restaurants.length; i++) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        restaurants[i].location.latitude,
        restaurants[i].location.longitude
      )

      if (distance < minDistance) {
        minDistance = distance
        nearest = restaurants[i]
      }
    }

    return nearest
  }

  // Cleanup map
  const destroyMap = () => {
    if (mapInstance.value) {
      mapInstance.value.remove()
      mapInstance.value = null
    }
    mapContainer.value = null
    isLoaded.value = false
    markers.value = []
    selectedMarker.value = null
  }

  // Load required CSS for Leaflet
  const loadMapStyles = () => {
    if (import.meta.server) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }

  // Initialize styles on client
  if (import.meta.client) {
    loadMapStyles()
  }

  return {
    // State
    mapInstance: readonly(mapInstance),
    isLoaded: readonly(isLoaded),
    isLoading: readonly(isLoading),
    error: readonly(error),
    center: readonly(center),
    zoom: readonly(zoom),
    markers: readonly(markers),
    selectedMarker: readonly(selectedMarker),

    // Actions
    initializeMap,
    addMarker,
    removeMarker,
    clearMarkers,
    setCenter,
    fitToMarkers,
    getBounds,
    addRestaurants,
    addUserLocation,
    addDeliveryTracking,
    addDeliveryZone,
    findNearestRestaurant,
    destroyMap
  }
}