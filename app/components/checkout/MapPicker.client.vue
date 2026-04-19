<template>
  <div class="map-picker">
    <div class="map-picker__container">
      <div ref="mapContainer" class="map-picker__map"/>
      
      <!-- Pin icon overlay -->
      <div class="map-picker__pin">
        <BaseIcon name="map-pin" size="32" color="primary-red" />
      </div>
      
      <!-- Address display -->
      <div v-if="selectedAddress" class="map-picker__address">
        <div class="map-picker__address-text">
          {{ selectedAddress }}
        </div>
        <BaseButton
          v-if="deliveryZone && deliveryZone.isAvailable"
          variant="primary"
          size="sm"
          @click="handleConfirmLocation"
        >
          Confirm Location
        </BaseButton>
      </div>
      
      <!-- Loading state -->
      <div v-if="isGeocoding" class="map-picker__loading">
        <BaseLoader size="sm" />
        <span>Loading address...</span>
      </div>
      
      <!-- Error state -->
      <div v-if="error" class="map-picker__error">
        <ErrorMessage :message="error" />
      </div>
      
      <!-- Zone info -->
      <div v-if="deliveryZone && deliveryZone.isAvailable" class="map-picker__zone-info">
        <BaseIcon name="info" size="16" />
        <span>{{ deliveryZone.name }} - Delivery Fee: {{ deliveryZone.deliveryFee }} som</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMap } from '../../composables/useMap'
import type { Coordinates } from '../../types/delivery'

interface Props {
  initialCoordinates?: Coordinates
  center?: Coordinates
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  center: () => ({ lat: 42.8746, lng: 74.5698 }), // Bishkek, Kyrgyzstan
  zoom: 13
})

const emit = defineEmits<{
  'location-selected': [coords: Coordinates, address: string, zoneId: string]
}>()

const mapContainer = ref<HTMLElement | null>(null)
const map = ref<L.Map | null>(null)

// Use map composable
const {
  isGeocoding,
  error,
  selectedCoordinates,
  selectedAddress,
  deliveryZone,
  reverseGeocode
} = useMap()

// Throttle geocoding requests
let geocodeTimeout: NodeJS.Timeout | null = null
const GEOCODE_DELAY = 500 // ms

// Initialize map
onMounted(() => {
  if (!mapContainer.value) return

  // Create map instance
  map.value = L.map(mapContainer.value, {
    center: [props.center.lat, props.center.lng],
    zoom: props.zoom,
    zoomControl: true
  })

  // Add tile layer - using OpenStreetMap as default
  // In production, you would use 2GIS or Yandex tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map.value)

  // Handle map movement
  map.value.on('moveend', handleMapMove)

  // Set initial position if provided
  if (props.initialCoordinates) {
    map.value.setView([props.initialCoordinates.lat, props.initialCoordinates.lng], props.zoom)
    handleMapMove()
  }
})

// Cleanup
onUnmounted(() => {
  if (geocodeTimeout) {
    clearTimeout(geocodeTimeout)
  }
  if (map.value) {
    map.value.remove()
  }
})

// Handle map movement
const handleMapMove = () => {
  if (!map.value) return

  const center = map.value.getCenter()
  const coords: Coordinates = {
    lat: center.lat,
    lng: center.lng
  }

  // Throttle geocoding
  if (geocodeTimeout) {
    clearTimeout(geocodeTimeout)
  }

  geocodeTimeout = setTimeout(() => {
    reverseGeocode(coords)
  }, GEOCODE_DELAY)
}

// Handle location confirmation
const handleConfirmLocation = () => {
  if (selectedCoordinates.value && selectedAddress.value && deliveryZone.value) {
    emit('location-selected', selectedCoordinates.value, selectedAddress.value, deliveryZone.value.id)
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/abstracts/variables' as *;

.map-picker {
  width: 100%;
  height: 100%;
}

.map-picker__container {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: $radius-lg;
  overflow: hidden;

  @media (max-width: 768px) {
    height: 300px;
  }
}

.map-picker__map {
  width: 100%;
  height: 100%;
}

.map-picker__pin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
  pointer-events: none;
  z-index: 1000;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.map-picker__address {
  position: absolute;
  bottom: $space-4;
  left: $space-4;
  right: $space-4;
  background: var(--bg-primary);
  padding: $space-4;
  border-radius: $radius-md;
  box-shadow: $shadow-lg;
  z-index: 1000;
}

.map-picker__address-text {
  font-size: $text-sm;
  color: var(--text-primary);
  margin-bottom: $space-2;
  line-height: $leading-normal;
}

.map-picker__loading {
  position: absolute;
  top: $space-4;
  right: $space-4;
  background: var(--bg-primary);
  padding: $space-2 $space-4;
  border-radius: $radius-md;
  box-shadow: $shadow-md;
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-sm;
  color: var(--text-secondary);
  z-index: 1000;
}

.map-picker__error {
  position: absolute;
  top: $space-4;
  left: $space-4;
  right: $space-4;
  z-index: 1000;
}

.map-picker__zone-info {
  position: absolute;
  top: $space-4;
  left: $space-4;
  background: var(--color-success);
  color: white;
  padding: $space-1 $space-2;
  border-radius: $radius-sm;
  font-size: $text-xs;
  display: flex;
  align-items: center;
  gap: $space-1;
  z-index: 1000;
}
</style>
