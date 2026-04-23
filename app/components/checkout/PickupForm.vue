<template>
  <div class="pickup-form">
    <!-- Location Selection -->
    <div class="pickup-form__field">
      <label class="pickup-form__label">
        {{ $t('checkout.selectLocation', 'Выберите филиал') }} *
      </label>
      
      <!-- Card-based selection for small number of locations -->
      <div v-if="locations.length < 6" class="pickup-form__locations-grid">
        <button
          v-for="location in locations"
          :key="location.id"
          type="button"
          class="pickup-form__location-card"
          :class="{ 'pickup-form__location-card--active': localData.locationId === location.id }"
          @click="selectLocation(location.id)"
        >
          <div class="pickup-form__location-icon">
            <BaseIcon name="store" size="md" />
          </div>
          <div class="pickup-form__location-content">
            <span class="pickup-form__location-name">{{ location.name }}</span>
            <span class="pickup-form__location-address">{{ location.address }}</span>
          </div>
          <div v-if="localData.locationId === location.id" class="pickup-form__location-check">
            <BaseIcon name="check" size="sm" />
          </div>
        </button>
      </div>

      <!-- Dropdown-based selection for large number of locations -->
      <BaseSelect
        v-else
        id="pickup-location-select"
        v-model="localData.locationId"
        :options="locationOptions"
        :placeholder="$t('delivery.selectLocation', 'Выберите точку из списка')"
        :error="errors.locationId"
        @change="handleChange"
      />
      
      <p v-if="errors.locationId" class="pickup-form__error">
        {{ errors.locationId }}
      </p>
    </div>

    <!-- Pickup Time -->
    <div class="form-group form-group--time">
      <BaseSelect
        id="pickup-time"
        v-model="localData.pickupTime"
        :label="$t('delivery.timePickup')"
        :options="timeOptions"
        :error="errors.pickupTime"
        @change="handleChange"
      />
    </div>

    <!-- Custom Time Picker -->
    <div v-if="localData.pickupTime === 'custom'" class="form-group">
      <label class="form-label">
        {{ $t('delivery.customDateTime') }} *
      </label>
      <div class="custom-time-grid">
        <BaseInput
          v-model="localData.customDate"
          type="date"
          :min="today"
          :max="maxDate"
          :error="errors.customDate"
          @input="handleChange"
        />
        <BaseInput
          v-model="localData.customTime"
          type="time"
          :min="minTime"
          :max="maxTime"
          :error="errors.customTime"
          @input="handleChange"
        />
      </div>
    </div>

    <!-- Contact Information -->
    <div class="form-group">
      <label for="pickup-phone" class="form-label">
        {{ $t('form.phone') }} <span v-if="!isTelegram">*</span><span v-else>(Optional)</span>
      </label>
      <div class="phone-input-group">
        <BaseInput
          id="pickup-phone"
          v-model="localData.phone"
          type="tel"
          :placeholder="$t('form.phonePlaceholder')"
          :error="errors.phone"
          @input="handleChange"
        />
        <BaseButton
          v-if="isTelegram"
          variant="secondary"
          size="sm"
          class="phone-request-btn"
          @click="requestTelegramContact"
        >
          <BaseIcon name="smartphone" size="sm" />
          {{ $t('checkout.get_from_tg', 'Из Telegram') }}
        </BaseButton>
      </div>
      <p class="hint-text">
        {{ $t('form.phoneHint', 'Мы перезвоним вам при необходимости') }}
      </p>
    </div>


    <!-- Special Instructions -->
    <div class="form-group">
      <label for="pickup-instructions" class="form-label">
        {{ $t('delivery.instructions') }}
      </label>
      <BaseInput
        id="pickup-instructions"
        v-model="localData.instructions"
        type="textarea"
        :placeholder="$t('delivery.instructionsPlaceholder')"
        :rows="3"
        @input="handleChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTelegram } from '~/composables/useTelegram'
import { useUserStore } from '~/stores/user'
const { t } = useI18n()
const { isTelegram } = useTelegram()
const userStore = useUserStore()

interface PickupLocation {
  id: string
  name: string
  address: string
  phone?: string
}

interface PickupData {
  locationId: string
  pickupTime: string
  customDate: string
  customTime: string
  phone: string
  instructions: string
}

interface Props {
  modelValue: PickupData
  errors?: Record<string, string>
  locations?: PickupLocation[]
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
  locations: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: PickupData]
  'submit': [data: PickupData]
}>()

const localData = ref<PickupData>({ 
  ...props.modelValue,
  phone: props.modelValue.phone || userStore.user?.phone || ''
})

// Pre-fill and auto-select logic
onMounted(() => {
  // Pre-fill phone if missing in modelValue but exists in store
  if (!localData.value.phone && userStore.user?.phone) {
    localData.value.phone = userStore.user.phone
    handleChange()
  }

  // Auto-select location if only one exists
  if (props.locations.length === 1 && !localData.value.locationId) {
    localData.value.locationId = props.locations[0].id
    handleChange()
  }
})

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().split('T')[0]
})

const minTime = computed(() => {
  if (localData.value.customDate === today.value) {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toTimeString().slice(0, 5)
  }
  return '09:00'
})

const maxTime = computed(() => '22:00')

const estimatedTime = computed(() => {
  return '20-30 min'
})

const locationOptions = computed(() => {
  return props.locations.map(loc => ({
    label: `${loc.name} - ${loc.address}`,
    value: loc.id
  }))
})

const timeOptions = computed(() => [
  { label: t('delivery.asap', { time: estimatedTime.value }), value: 'asap' },
  { label: t('delivery.in30min'), value: '30min' },
  { label: t('delivery.in1hour'), value: '1hour' },
  { label: t('delivery.in2hours'), value: '2hours' },
  { label: t('delivery.customTime'), value: 'custom' }
])

const selectLocation = (id: string) => {
  localData.value.locationId = id
  handleChange()
}

const requestTelegramContact = () => {
  if (!isTelegram.value) return

  // @ts-ignore
  const webApp = window.Telegram?.WebApp
  if (webApp?.requestContact) {
    webApp.requestContact(async (status: boolean, data: any) => {
      if (status && data?.contact?.phone_number) {
        const phoneNumber = data.contact.phone_number
        localData.value.phone = phoneNumber
        handleChange()

        // Save to database immediately if user is logged in
        if (userStore.isAuthenticated && userStore.user) {
          try {
            await userStore.updateProfile({
              phone: phoneNumber,
              firstName: userStore.user.firstName,
              lastName: userStore.user.lastName
            })
          } catch (error) {
            console.error('Failed to save phone to profile:', error)
          }
        }
      }
    })
  } else {
    // Fallback if not supported
    alert(t('errors.not_supported', 'Ваш клиент Telegram не поддерживает эту функцию'))
  }
}

const handleChange = () => {
  emit('update:modelValue', { ...localData.value })
}

watch(() => props.modelValue, (newValue) => {
  localData.value = { ...newValue }
}, { deep: true })
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.pickup-form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.pickup-form__field {
  margin-bottom: $space-2;
}

.form-group--time {
  margin-top: $space-4;
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
}

.pickup-form__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: $space-2;
  display: block;
}

.pickup-form__locations-grid {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.pickup-form__location-card {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  position: relative;

  &:hover {
    border-color: var(--color-primary);
    background: var(--bg-secondary);
  }

  &--active {
    background: rgba(var(--color-primary-rgb), 0.05);
    border-color: var(--color-primary);
    border-width: 2px;
  }
}

.pickup-form__location-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: $radius-md;
  color: var(--color-primary);
  flex-shrink: 0;
}

.pickup-form__location-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.pickup-form__location-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
}

.pickup-form__location-address {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.pickup-form__location-check {
  color: var(--color-primary);
}

.custom-time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
}

.checkbox-group {
  margin-top: $space-2;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: $space-3;
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--color-primary);
  }
}

.pickup-form__error {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: $space-1;
}

.hint-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .custom-time-grid {
    grid-template-columns: 1fr;
  }
}
</style>
