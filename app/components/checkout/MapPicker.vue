<template>
  <div class="map-picker-placeholder">
    <div class="map-picker-placeholder__content">
      <BaseIcon name="map" size="xl" class="mb-4 text-primary opacity-50" />
      <h3 class="text-lg font-semibold mb-2">{{ $t('delivery.pickOnMap') }}</h3>
      <p class="text-secondary text-sm mb-6 text-center">
        Map selection functionality is currently being tuned. 
        Please use the address field for now.
      </p>
      
      <BaseButton variant="primary" @click="simulateLocationSelection">
        Simulate Current Location
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue'

interface Coordinates {
  lat: number
  lng: number
}

const emit = defineEmits<{
  'location-selected': [coordinates: Coordinates, address: string, zoneId: string]
}>()

const simulateLocationSelection = () => {
  // Mock data for simulation
  const coords = {
    lat: 42.8746,
    lng: 74.5919
  }
  const address = 'Bishkek, Chuy Avenue 114'
  const zoneId = 'zone-primary-1'
  
  emit('location-selected', coords, address, zoneId)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;

.map-picker-placeholder {
  width: 100%;
  height: 300px;
  background: var(--bg-secondary);
  border: 2px dashed var(--border-primary);
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-6;
}

.map-picker-placeholder__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 250px;
}
</style>
