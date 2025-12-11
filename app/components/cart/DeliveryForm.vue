<template>
  <div class="space-y-4">
    <!-- Delivery Type -->
    <div>
      <label class="block text-sm font-medium text-neutral-20 mb-3">
        Delivery Option *
      </label>
      <div class="grid grid-cols-2 gap-3">
        <BaseButton
          variant="ghost"
          :class="[
            'p-4 border-2 transition-all',
            localDeliveryInfo.type === 'delivery' 
              ? 'border-primary-green bg-primary-green/10 text-primary-green' 
              : 'border-border-subtle text-neutral-20 hover:border-neutral-20'
          ]"
          @click="setDeliveryType('delivery')"
        >
          <div class="text-center">
            <BaseIcon name="truck" size="lg" class="mx-auto mb-2" />
            <div class="font-medium">Delivery</div>
            <div class="text-xs opacity-75">To your address</div>
          </div>
        </BaseButton>
        
        <BaseButton
          variant="ghost"
          :class="[
            'p-4 border-2 transition-all',
            localDeliveryInfo.type === 'pickup' 
              ? 'border-primary-green bg-primary-green/10 text-primary-green' 
              : 'border-border-subtle text-neutral-20 hover:border-neutral-20'
          ]"
          @click="setDeliveryType('pickup')"
        >
          <div class="text-center">
            <BaseIcon name="store" size="lg" class="mx-auto mb-2" />
            <div class="font-medium">Pickup</div>
            <div class="text-xs opacity-75">From restaurant</div>
          </div>
        </BaseButton>
      </div>
    </div>

    <!-- Delivery Address (only for delivery) -->
    <div v-if="localDeliveryInfo.type === 'delivery'">
      <label for="delivery-address" class="block text-sm font-medium text-neutral-20 mb-2">
        Delivery Address *
      </label>
      
      <!-- Address input mode toggle -->
      <div class="mb-3 flex gap-2">
        <BaseButton
          variant="ghost"
          size="sm"
          :class="[
            'flex-1',
            !showMap ? 'bg-primary-green/10 text-primary-green' : 'text-neutral-20'
          ]"
          @click="showMap = false"
        >
          <BaseIcon name="edit" size="sm" class="mr-1" />
          Type Address
        </BaseButton>
        <BaseButton
          variant="ghost"
          size="sm"
          :class="[
            'flex-1',
            showMap ? 'bg-primary-green/10 text-primary-green' : 'text-neutral-20'
          ]"
          @click="showMap = true"
        >
          <BaseIcon name="map" size="sm" class="mr-1" />
          Pick on Map
        </BaseButton>
      </div>

      <!-- Text input mode -->
      <div v-if="!showMap">
        <BaseInput
          id="delivery-address"
          v-model="localDeliveryInfo.address"
          type="textarea"
          placeholder="Enter full delivery address including apartment/office number"
          :rows="3"
          :error="errors.address"
          required
          @blur="validateField('address')"
          @input="clearError('address')"
        />
        
        <div class="mt-2 flex items-center space-x-2">
          <BaseButton
            variant="ghost"
            size="sm"
            class="text-primary-green hover:text-green-400"
            :loading="gettingLocation"
            @click="getCurrentLocation"
          >
            <BaseIcon name="location" size="sm" class="mr-1" />
            Use Current Location
          </BaseButton>
        </div>
      </div>

      <!-- Map picker mode -->
      <div v-else>
        <MapPicker
          :initial-coordinates="deliveryCoordinates"
          @location-selected="handleLocationSelected"
        />
        <AppText v-if="errors.address" size="caption" class="text-primary-red mt-2">
          {{ errors.address }}
        </AppText>
      </div>
    </div>

    <!-- Pickup Location (only for pickup) -->
    <div v-if="localDeliveryInfo.type === 'pickup'">
      <label for="pickup-location" class="block text-sm font-medium text-neutral-20 mb-2">
        Pickup Location *
      </label>
      <select
        id="pickup-location"
        v-model="localDeliveryInfo.pickupLocation"
        class="w-full px-3 py-2 bg-background-dark border border-border-subtle rounded-lg text-white focus:ring-2 focus:ring-primary-green focus:border-transparent"
        :class="{ 'border-primary-red': errors.pickupLocation }"
        @change="validateField('pickupLocation')"
      >
        <option value="">Select pickup location</option>
        <option value="main-restaurant">Main Restaurant - Nevsky Prospect 123</option>
        <option value="mall-location">Mall Location - Galeria Shopping Center</option>
        <option value="downtown">Downtown Branch - Sadovaya Street 45</option>
      </select>
      <AppText v-if="errors.pickupLocation" size="caption" class="text-primary-red mt-1">
        {{ errors.pickupLocation }}
      </AppText>
    </div>

    <!-- Delivery Time -->
    <div>
      <label for="delivery-time" class="block text-sm font-medium text-neutral-20 mb-2">
        {{ localDeliveryInfo.type === 'delivery' ? 'Delivery' : 'Pickup' }} Time *
      </label>
      <select
        id="delivery-time"
        v-model="localDeliveryInfo.deliveryTime"
        class="w-full px-3 py-2 bg-background-dark border border-border-subtle rounded-lg text-white focus:ring-2 focus:ring-primary-green focus:border-transparent"
        @change="updateDeliveryInfo"
      >
        <option value="asap">As soon as possible ({{ estimatedTime }})</option>
        <option value="30min">In 30 minutes</option>
        <option value="1hour">In 1 hour</option>
        <option value="2hours">In 2 hours</option>
        <option value="custom">Choose specific time</option>
      </select>
    </div>

    <!-- Custom Time Picker (Combined to stay under 5 field limit) -->
    <div v-if="localDeliveryInfo.deliveryTime === 'custom'">
      <label class="block text-sm font-medium text-neutral-20 mb-2">
        Custom Date & Time
      </label>
      <div class="grid grid-cols-2 gap-3">
        <BaseInput
          v-model="localDeliveryInfo.customDate"
          type="date"
          :min="today"
          :max="maxDate"
          @change="updateDeliveryInfo"
        />
        <BaseInput
          v-model="localDeliveryInfo.customTime"
          type="time"
          :min="minTime"
          :max="maxTime"
          @change="updateDeliveryInfo"
        />
      </div>
    </div>

    <!-- Special Instructions -->
    <div>
      <label for="delivery-instructions" class="block text-sm font-medium text-neutral-20 mb-2">
        Special Instructions
      </label>
      <BaseInput
        id="delivery-instructions"
        v-model="localDeliveryInfo.instructions"
        type="textarea"
        placeholder="Building entrance, floor, apartment number, or any special delivery instructions..."
        :rows="2"
        @input="updateDeliveryInfo"
      />
    </div>

    <!-- Delivery Fee Info -->
    <div v-if="localDeliveryInfo.type === 'delivery'" class="p-3 bg-background-dark/50 rounded-lg border border-border-subtle">
      <div class="flex items-center justify-between">
        <AppText size="body-sm" class="text-neutral-20">
          Delivery Fee
        </AppText>
        <AppText size="body-sm" class="text-white font-medium">
          {{ deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee) }}
        </AppText>
      </div>
      <AppText size="caption" class="text-neutral-20 mt-1">
        {{ deliveryFee === 0 ? 'Free delivery on orders over 500₽' : 'Standard delivery fee applies' }}
      </AppText>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import MapPicker from '../checkout/MapPicker.vue'
import type { Coordinates } from '../../types/delivery'

// Props & Emits
interface DeliveryInfo {
  type: 'delivery' | 'pickup'
  address: string
  pickupLocation: string
  deliveryTime: string
  customDate: string
  customTime: string
  instructions: string
  coordinates?: Coordinates
  deliveryZone?: string
  deliveryFeeAmount?: number
}

interface Props {
  modelValue: DeliveryInfo
  errors?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: DeliveryInfo]
  'delivery-fee-calculated': [fee: number, zoneId: string]
  validate: [errors: Record<string, string>]
}>()

// Local state
const localDeliveryInfo = ref<DeliveryInfo>({ 
  type: 'delivery',
  address: '',
  pickupLocation: '',
  deliveryTime: 'asap',
  customDate: '',
  customTime: '',
  instructions: '',
  ...props.modelValue 
})

const errors = reactive<Record<string, string>>({ ...props.errors })
const gettingLocation = ref(false)
const showMap = ref(false)
const deliveryCoordinates = ref<Coordinates | undefined>(props.modelValue.coordinates)

// Computed properties
const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 7) // Allow booking up to 7 days ahead
  return date.toISOString().split('T')[0]
})

const minTime = computed(() => {
  if (localDeliveryInfo.value.customDate === today.value) {
    const now = new Date()
    now.setHours(now.getHours() + 1) // Minimum 1 hour from now
    return now.toTimeString().slice(0, 5)
  }
  return '09:00' // Restaurant opening time
})

const maxTime = computed(() => '22:00') // Restaurant closing time

const estimatedTime = computed(() => {
  const baseTime = localDeliveryInfo.value.type === 'delivery' ? 45 : 25
  return `${baseTime}-${baseTime + 15} min`
})

const deliveryFee = computed(() => {
  // Calculate delivery fee based on location, order total, etc.
  return localDeliveryInfo.value.type === 'delivery' ? 0 : 0 // Free for now
})

// Methods
const setDeliveryType = (type: 'delivery' | 'pickup') => {
  localDeliveryInfo.value.type = type
  
  // Clear type-specific errors
  if (type === 'delivery') {
    delete errors.pickupLocation
  } else {
    delete errors.address
  }
  
  updateDeliveryInfo()
  emit('validate', { ...errors })
}

const validateField = (field: keyof DeliveryInfo) => {
  switch (field) {
    case 'address':
      if (localDeliveryInfo.value.type === 'delivery') {
        if (!localDeliveryInfo.value.address?.trim()) {
          errors.address = 'Delivery address is required'
        } else if (localDeliveryInfo.value.address.trim().length < 10) {
          errors.address = 'Please provide a more detailed address'
        } else {
          delete errors.address
        }
      }
      break

    case 'pickupLocation':
      if (localDeliveryInfo.value.type === 'pickup') {
        if (!localDeliveryInfo.value.pickupLocation) {
          errors.pickupLocation = 'Please select a pickup location'
        } else {
          delete errors.pickupLocation
        }
      }
      break
  }

  emit('validate', { ...errors })
}

const clearError = (field: string) => {
  if (errors[field]) {
    delete errors[field]
    emit('validate', { ...errors })
  }
}

const updateDeliveryInfo = () => {
  emit('update:modelValue', { ...localDeliveryInfo.value })
}

const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser')
    return
  }

  gettingLocation.value = true

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      })
    })

    // Set coordinates and switch to map view
    const { latitude, longitude } = position.coords
    deliveryCoordinates.value = { lat: latitude, lng: longitude }
    showMap.value = true
    
  } catch (error) {
    console.error('Error getting location:', error)
    alert('Unable to get your location. Please enter your address manually.')
  } finally {
    gettingLocation.value = false
  }
}

const handleLocationSelected = (coords: Coordinates, address: string, zoneId: string) => {
  localDeliveryInfo.value.address = address
  localDeliveryInfo.value.coordinates = coords
  localDeliveryInfo.value.deliveryZone = zoneId
  deliveryCoordinates.value = coords
  
  // Clear address error if it exists
  delete errors.address
  
  // Emit delivery fee calculation event
  // The parent component or cart store should handle the actual fee calculation
  emit('delivery-fee-calculated', 0, zoneId) // Fee will be calculated by parent
  
  updateDeliveryInfo()
  emit('validate', { ...errors })
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Watch for changes and emit updates
watch(localDeliveryInfo, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true })

// Watch for external errors
watch(() => props.errors, (newErrors) => {
  Object.assign(errors, newErrors)
}, { deep: true })

// Validate on delivery type change
watch(() => localDeliveryInfo.value.type, () => {
  if (localDeliveryInfo.value.type === 'delivery') {
    validateField('address')
  } else {
    validateField('pickupLocation')
  }
})
</script>

<style scoped>
/* Form field spacing */
.space-y-4 > * + * {
  margin-top: 1rem;
}

/* Grid spacing */
.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gap-3 {
  gap: 0.75rem;
}

/* Select styling */
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

/* Button transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>