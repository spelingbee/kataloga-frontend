<template>
  <div class="min-h-screen bg-background-dark p-6">
    <div class="max-w-4xl mx-auto">
      <div class="mb-6">
        <AppHeading level="h1" size="display-md" class="text-white mb-2">
          Map Picker Test
        </AppHeading>
        <AppText size="body-lg" class="text-neutral-20">
          Test the map picker component for delivery address selection
        </AppText>
      </div>

      <div class="bg-background-card rounded-xl p-6 mb-6">
        <AppHeading level="h2" size="heading-lg" class="text-white mb-4">
          Select Delivery Location
        </AppHeading>
        
        <MapPicker
          :initial-coordinates="initialCoords"
          @location-selected="handleLocationSelected"
        />
      </div>

      <div v-if="selectedLocation" class="bg-background-card rounded-xl p-6">
        <AppHeading level="h2" size="heading-lg" class="text-white mb-4">
          Selected Location
        </AppHeading>
        
        <div class="space-y-3">
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-1">Address:</AppText>
            <AppText size="body-md" class="text-white">{{ selectedLocation.address }}</AppText>
          </div>
          
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-1">Coordinates:</AppText>
            <AppText size="body-md" class="text-white">
              {{ selectedLocation.coords.lat.toFixed(6) }}, {{ selectedLocation.coords.lng.toFixed(6) }}
            </AppText>
          </div>
          
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-1">Delivery Zone:</AppText>
            <AppText size="body-md" class="text-white">{{ selectedLocation.zoneId }}</AppText>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MapPicker from '../../components/checkout/MapPicker.vue'
import type { Coordinates } from '../../types/delivery'

definePageMeta({
  title: 'Map Picker Test'
})

const initialCoords = ref<Coordinates>({
  lat: 42.8746,
  lng: 74.5698
})

const selectedLocation = ref<{
  coords: Coordinates
  address: string
  zoneId: string
} | null>(null)

const handleLocationSelected = (coords: Coordinates, address: string, zoneId: string) => {
  selectedLocation.value = {
    coords,
    address,
    zoneId
  }
  
  console.log('Location selected:', { coords, address, zoneId })
}
</script>
