<template>
  <div class="map-picker">
    <div class="map-picker__wrapper">
      <div id="map-container" ref="mapRef" class="map-picker__container"></div>
      
      <!-- Marker overlay (centered) -->
      <div class="map-picker__marker-overlay" v-if="!hasMarker">
        <div class="map-picker__marker-icon">
          <BaseIcon name="location" size="lg" />
        </div>
      </div>

      <!-- Controls -->
      <div class="map-picker__controls">
        <BaseButton 
          variant="secondary" 
          size="sm" 
          class="map-picker__btn"
          :loading="geocoding"
          @click="confirmSelection"
        >
          {{ $t('common.confirm', 'Подтвердить') }}
        </BaseButton>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="map-picker__loading">
        <div class="spinner"></div>
      </div>
    </div>
    
    <div v-if="selectedAddress" class="map-picker__address">
      <BaseIcon name="location" size="xs" class="mr-1" />
      <span>{{ selectedAddress }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMap } from '~/composables/useMap'

interface Coordinates {
  lat: number
  lng: number
}

interface Props {
  initialCoordinates?: Coordinates
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'location-selected': [coordinates: Coordinates, address: string, zoneId: string]
}>()

const { t } = useI18n()
const { reverseGeocode, restaurantCoords } = useMap()

const mapRef = ref<HTMLElement | null>(null)
const map = ref<any>(null)
const marker = ref<any>(null)
const loading = ref(true)
const geocoding = ref(false)
const selectedAddress = ref('')
const hasMarker = ref(false)

const L = ref<any>(null)

onMounted(async () => {
  if (process.server) return

  // Import Leaflet dynamically to avoid SSR issues
  try {
    const leaflet = await import('leaflet')
    import('leaflet/dist/leaflet.css')
    L.value = leaflet.default || leaflet

    initMap()
  } catch (e) {
    console.error('Failed to load Leaflet:', e)
  }
})

const initMap = () => {
  if (!mapRef.value || !L.value) return

  const startCoords = props.initialCoordinates || restaurantCoords

  map.value = L.value.map(mapRef.value, {
    center: [startCoords.lat, startCoords.lng],
    zoom: 15,
    zoomControl: false
  })

  L.value.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map.value)

  // Add zoom control to top right
  L.value.control.zoom({
    position: 'topright'
  }).addTo(map.value)

  loading.value = false

  // Handle map move
  map.value.on('moveend', async () => {
    const center = map.value.getCenter()
    await updateAddress(center.lat, center.lng)
  })

  // Initial address resolution
  updateAddress(startCoords.lat, startCoords.lng)
}

const updateAddress = async (lat: number, lng: number) => {
  geocoding.value = true
  try {
    const address = await reverseGeocode({ lat, lng })
    selectedAddress.value = address
  } catch (e) {
    console.error('Reverse geocoding failed:', e)
    selectedAddress.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } finally {
    geocoding.value = false
  }
}

const confirmSelection = () => {
  const center = map.value.getCenter()
  const coords = { lat: center.lat, lng: center.lng }
  
  // We use a dummy zone ID for now as real zone detection is complex in frontend
  emit('location-selected', coords, selectedAddress.value, 'zone-default')
}

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
})

// Watch for external coordinate changes
watch(() => props.initialCoordinates, (newCoords) => {
  if (newCoords && map.value) {
    map.value.setView([newCoords.lat, newCoords.lng], 15)
  }
}, { deep: true })
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;

.map-picker {
  width: 100%;
  position: relative;
}

.map-picker__wrapper {
  position: relative;
  height: 350px;
  background: var(--bg-secondary);
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.map-picker__container {
  height: 100%;
  width: 100%;
  z-index: 1;
}

.map-picker__marker-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100%);
  z-index: 10;
  pointer-events: none;
  margin-top: -2px; // Visual correction
}

.map-picker__marker-icon {
  color: var(--color-primary);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  animation: bounce 0.5s ease infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-5px); }
}

.map-picker__controls {
  position: absolute;
  bottom: $space-4;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: auto;
}

.map-picker__btn {
  box-shadow: $shadow-md;
  background: white !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-primary) !important;
  padding: $space-2 $space-6 !important;
  white-space: nowrap;

  &:hover {
    background: var(--bg-secondary) !important;
  }
}

.map-picker__loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.map-picker__address {
  margin-top: $space-3;
  padding: $space-3;
  background: var(--bg-tertiary);
  border-radius: $radius-md;
  font-size: 0.875rem;
  color: var(--text-secondary);
  display: flex;
  align-items: flex-start;
  line-height: 1.4;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--border-primary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Adjust leaflet styles to match theme
:deep(.leaflet-bar) {
  border: none;
  box-shadow: $shadow-md;
  
  a {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-primary);

    &:hover {
      background-color: var(--bg-secondary);
    }
  }
}
</style>
