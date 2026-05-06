<template>
  <div class="delivery-form">
    <!-- Delivery Address (only for delivery) -->
    <div v-if="localDeliveryInfo.type === 'delivery'" class="form-group">
      <label for="delivery-address" class="form-label">{{ $t('delivery.address') }} *</label>

      <!-- Address input mode toggle -->
      <div class="input-mode-toggle">
        <BaseButton
          variant="ghost"
          size="sm"
          :class="['mode-button', !showMap ? 'active' : '']"
          @click="showMap = false"
        >
          <BaseIcon name="edit" size="sm" class="mr-1" />
          {{ $t('delivery.typeAddress') }}
        </BaseButton>
        <BaseButton
          variant="ghost"
          size="sm"
          :class="['mode-button', showMap ? 'active' : '']"
          @click="showMap = true"
        >
          <BaseIcon name="map" size="sm" class="mr-1" />
          {{ $t('delivery.pickOnMap') }}
        </BaseButton>
      </div>

      <!-- Text input mode -->
      <div v-if="!showMap">
        <BaseInput
          id="delivery-address"
          v-model="localDeliveryInfo.address"
          type="textarea"
          :placeholder="$t('delivery.addressPlaceholder')"
          :rows="3"
          :error="errors.address"
          required
          @blur="validateField('address')"
          @input="clearError('address')"
        />

        <div class="mt-2">
          <BaseButton
            variant="ghost"
            size="sm"
            class="location-button"
            :loading="gettingLocation"
            @click="getCurrentLocation"
          >
            <BaseIcon name="location" size="sm" class="mr-2" />
            {{ $t('delivery.useCurrentLocation') }}
          </BaseButton>
        </div>
      </div>

      <!-- Map picker mode -->
      <div v-else class="map-container">
        <ClientOnly>
          <MapPicker
            :initial-coordinates="deliveryCoordinates"
            @location-selected="handleLocationSelected"
          />
          <template #fallback>
            <div class="map-placeholder">
              <div class="text-center">
                <BaseIcon name="map" size="xl" class="mx-auto mb-2 opacity-50" />
                <p>{{ $t('delivery.loadingMap') }}</p>
              </div>
            </div>
          </template>
        </ClientOnly>
        <AppText v-if="errors.address" size="caption" class="text-error mt-2">
          {{ errors.address }}
        </AppText>
      </div>
    </div>

    <!-- Pickup Location (only for pickup) -->
    <div v-if="localDeliveryInfo.type === 'pickup'" class="form-group">
      <BaseSelect
        id="pickup-location"
        v-model="localDeliveryInfo.pickupLocation"
        :label="$t('delivery.selectLocation')"
        :options="locationOptions"
        :error="errors.pickupLocation"
        required
        @change="validateField('pickupLocation')"
      />
    </div>

    <!-- Delivery Time -->
    <div class="form-group">
      <BaseSelect
        id="delivery-time"
        v-model="localDeliveryInfo.deliveryTime"
        :label="
          localDeliveryInfo.type === 'delivery' ? $t('delivery.time') : $t('delivery.timePickup')
        "
        :options="timeOptions"
        @change="updateDeliveryInfo"
      />
    </div>

    <!-- Custom Time Picker -->
    <div v-if="localDeliveryInfo.deliveryTime === 'custom'" class="form-group">
      <label class="form-label">
        {{ $t('delivery.customDateTime') }}
      </label>
      <div class="custom-time-grid">
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
    <div class="form-group">
      <label for="delivery-instructions" class="form-label">
        {{ $t('delivery.instructions') }}
      </label>
      <BaseInput
        id="delivery-instructions"
        v-model="localDeliveryInfo.instructions"
        type="textarea"
        :placeholder="$t('delivery.instructionsPlaceholder')"
        :rows="2"
        @input="updateDeliveryInfo"
      />
    </div>

    <!-- Contact Information -->
    <div class="form-group">
      <label for="delivery-phone" class="form-label">
        {{ $t('form.phone') }}
        <span v-if="!isTelegram">*</span>
        <span v-else>(Optional)</span>
      </label>
      <div class="phone-input-group">
        <BaseInput
          id="delivery-phone"
          v-model="localDeliveryInfo.phone"
          type="tel"
          :placeholder="$t('form.phonePlaceholder')"
          :error="errors.phone"
          @input="updateDeliveryInfo"
        />
        <BaseButton
          v-if="isTelegram"
          variant="primary"
          size="sm"
          class="phone-request-btn phone-request-btn--telegram"
          @click="requestTelegramContact"
        >
          <BaseIcon name="telegram" size="sm" />
          {{ $t('checkout.get_from_tg', 'Из Telegram') }}
        </BaseButton>
      </div>
      <p class="hint-text">
        {{ $t('form.phoneHint', 'Мы перезвоним вам при необходимости') }}
      </p>
    </div>

    <div v-if="localDeliveryInfo.type === 'delivery' && deliveryFee !== undefined" class="fee-card">
      <div class="fee-row">
        <span>{{ $t('delivery.fee') }}</span>
        <span class="fee-amount">
          {{ deliveryFee === 0 ? $t('delivery.free') : formatPrice(deliveryFee) }}
        </span>
      </div>
      <p v-if="deliveryFee === 0" class="fee-hint">
        {{ $t('delivery.freeThreshold', { amount: formatPrice(500) }) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTenantStore } from '~/stores/tenant'
import { useUserStore } from '~/stores/user'
import { useTelegram } from '~/composables/useTelegram'
import type { Coordinates } from '../../types/delivery'
import AppText from '../base/AppText.vue'
import MapPicker from '../checkout/MapPicker.vue'

const { t } = useI18n()
const tenantStore = useTenantStore()
const userStore = useUserStore()
const { isTelegram } = useTelegram()

// Props & Emits
interface DeliveryInfo {
  type: 'delivery' | 'pickup'
  address: string
  pickupLocation: string
  deliveryTime: string
  customDate: string
  customTime: string
  instructions: string
  phone: string
  coordinates?: Coordinates
  deliveryZone?: string
  deliveryFeeAmount?: number
}

interface Props {
  modelValue: DeliveryInfo
  errors?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
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
  phone: props.modelValue.phone || userStore.user?.phone || '',
  ...props.modelValue,
})

const errors = reactive<Record<string, string>>({ ...props.errors })
const gettingLocation = ref(false)
const showMap = ref(false)
const deliveryCoordinates = ref<Coordinates | undefined>(props.modelValue.coordinates)

// Computed properties
const today = computed(() => new Date().toISOString().split('T')[0])
const maxDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().split('T')[0]
})

const minTime = computed(() => {
  if (localDeliveryInfo.value.customDate === today.value) {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toTimeString().slice(0, 5)
  }
  return '09:00'
})

const maxTime = computed(() => '22:00')

const estimatedTime = computed(() => {
  const baseTime = localDeliveryInfo.value.type === 'delivery' ? 45 : 25
  return `${baseTime}-${baseTime + 15} min`
})

const deliveryFee = computed(() => {
  return localDeliveryInfo.value.type === 'delivery' ? 0 : 0
})

const locationOptions = computed(() => {
  return tenantStore.locations.map(loc => ({
    label: `${loc.name} - ${loc.address}`,
    value: loc.id,
  }))
})

const timeOptions = computed(() => [
  { label: t('delivery.asap', { time: estimatedTime.value }), value: 'asap' },
  { label: t('delivery.in30min'), value: '30min' },
  { label: t('delivery.in1hour'), value: '1hour' },
  { label: t('delivery.in2hours'), value: '2hours' },
  { label: t('delivery.customTime'), value: 'custom' },
])

// Methods
const setDeliveryType = (type: 'delivery' | 'pickup') => {
  localDeliveryInfo.value.type = type
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
          errors.address = t('form.required')
        } else if (localDeliveryInfo.value.address.trim().length < 5) {
          errors.address = t('form.addressMinLength', { min: 5 })
        } else {
          delete errors.address
        }
      }
      break

    case 'pickupLocation':
      if (localDeliveryInfo.value.type === 'pickup') {
        if (!localDeliveryInfo.value.pickupLocation) {
          errors.pickupLocation = t('delivery.selectLocation')
        } else {
          delete errors.pickupLocation
        }
      }
      break

    case 'phone':
      if (!isTelegram.value && !localDeliveryInfo.value.phone?.trim()) {
        errors.phone = t('form.required')
      } else if (localDeliveryInfo.value.phone?.trim()) {
        const phoneRegex = /^\+?[\d\s\-()]{10,}$/
        if (!phoneRegex.test(localDeliveryInfo.value.phone)) {
          errors.phone = t('form.phoneInvalid', 'Некорректный номер')
        } else {
          delete errors.phone
        }
      } else {
        delete errors.phone
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

const requestTelegramContact = () => {
  if (!isTelegram.value) return

  // @ts-ignore
  const webApp = window.Telegram?.WebApp
  if (webApp?.requestContact) {
    webApp.requestContact(async (status: boolean, data: any) => {
      if (status && data?.contact?.phone_number) {
        const phoneNumber = data.contact.phone_number
        localDeliveryInfo.value.phone = phoneNumber
        updateDeliveryInfo()

        // Wait a bit for backend to process the message and refresh profile
        setTimeout(async () => {
          try {
            await userStore.fetchUserProfile()
            if (userStore.user?.phone) {
              localDeliveryInfo.value.phone = userStore.user.phone
              updateDeliveryInfo()
            }
          } catch (e) {
            console.error('Failed to refresh profile:', e)
          }
        }, 1000)
      }
    })
  } else {
    // Fallback if not supported
    alert(t('errors.not_supported', 'Ваш клиент Telegram не поддерживает эту функцию'))
  }
}

const getCurrentLocation = async () => {
  if (!navigator.geolocation) return
  gettingLocation.value = true
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
    })
    const { latitude, longitude } = position.coords
    const coords = { lat: latitude, lng: longitude }
    deliveryCoordinates.value = coords
    
    // Resolve address from coordinates
    const address = await reverseGeocode(coords)
    localDeliveryInfo.value.address = address
    localDeliveryInfo.value.coordinates = coords
    
    showMap.value = true
    updateDeliveryInfo()
  } catch (error) {
    console.error('Error getting location:', error)
  } finally {
    gettingLocation.value = false
  }
}

const handleLocationSelected = (coords: Coordinates, address: string, zoneId: string) => {
  localDeliveryInfo.value.address = address
  localDeliveryInfo.value.coordinates = coords
  localDeliveryInfo.value.deliveryZone = zoneId
  deliveryCoordinates.value = coords
  delete errors.address
  emit('delivery-fee-calculated', 0, zoneId)
  updateDeliveryInfo()
  emit('validate', { ...errors })
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-KG', {
    style: 'currency',
    currency: 'KGS',
    minimumFractionDigits: 0,
  }).format(price)
}

// Lifecycle
onMounted(() => {
  if (tenantStore.locations.length === 0) {
    tenantStore.fetchLocations()
  }
})

// Watchers
watch(
  localDeliveryInfo,
  newValue => {
    // Prevent infinite loop by checking if data actually changed
    const hasChanged = JSON.stringify(newValue) !== JSON.stringify(props.modelValue)
    if (hasChanged) {
      emit('update:modelValue', { ...newValue })
    }
  },
  { deep: true }
)

watch(
  () => props.errors,
  newErrors => {
    Object.assign(errors, newErrors)
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/radius' as *;

.delivery-form {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.phone-input-group {
  display: flex;
  gap: $space-2;
  align-items: flex-start;

  :deep(.base-input) {
    flex: 1;
  }
}

.phone-request-btn {
  white-space: nowrap;
  height: 44px; // Align with input height
  margin-top: 0;

  &--telegram {
    background: linear-gradient(135deg, #2aabee 0%, #229ed9 100%);
    border: none;
    color: white;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(34, 158, 217, 0.2);

    &:hover {
      background: linear-gradient(135deg, #229ed9 0%, #1c8cc2 100%);
      box-shadow: 0 4px 8px rgba(34, 158, 217, 0.3);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.delivery-type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
}

.type-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-4;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-primary);
  border-radius: $radius-lg;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
  text-align: center;

  svg {
    margin-bottom: $space-2;
    opacity: 0.7;
  }

  &.active {
    background: rgba(16, 185, 129, 0.1);
    border-color: var(--color-success);
    color: var(--color-success);

    svg {
      opacity: 1;
    }
  }

  .type-info {
    display: flex;
    flex-direction: column;
  }

  .type-name {
    font-weight: 600;
    font-size: 1rem;
  }

  .type-hint {
    font-size: 0.75rem;
    opacity: 0.8;
  }
}

.input-mode-toggle {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-2;

  .mode-button {
    flex: 1;
    background: var(--bg-tertiary);

    &.active {
      background: rgba(16, 185, 129, 0.1);
      color: var(--color-success);
    }
  }
}

.location-button {
  color: var(--color-success);
}

.map-container {
  border-radius: $radius-lg;
  overflow: hidden;
  border: 1px solid var(--border-primary);
}

.map-placeholder {
  height: 300px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.custom-time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
}

.fee-card {
  padding: $space-3;
  background: var(--bg-tertiary);
  border-radius: $radius-md;
  border: 1px solid var(--border-primary);

  .fee-row {
    display: flex;
    justify-content: space-between;
    font-weight: 500;
  }

  .fee-amount {
    color: var(--text-primary);
  }

  .fee-hint {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: $space-1;
  }
}

.text-error {
  color: var(--color-error);
}
</style>
