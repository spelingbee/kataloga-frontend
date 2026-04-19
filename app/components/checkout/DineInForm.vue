<template>
  <div class="dine-in-form">
    <!-- Table Number -->
    <div class="dine-in-form__field">
      <label for="table-number" class="dine-in-form__label">
        {{ $t('checkout.tableNumber', 'Номер стола') }} *
      </label>
      <BaseInput
        id="table-number"
        v-model="localData.tableNumber"
        type="text"
        :placeholder="$t('checkout.tableNumberPlaceholder', 'Введите номер стола')"
        :error="errors.tableNumber"
        @input="handleChange"
      />
      <p class="dine-in-form__hint">
        {{ $t('checkout.tableNumberHint', 'Вы можете найти номер на карточке столика') }}
      </p>
    </div>

    <!-- Location (if multiple locations) -->
    <div v-if="locations.length > 1" class="dine-in-form__field">
      <BaseSelect
        id="location"
        v-model="localData.locationId"
        :label="$t('delivery.selectLocation', 'Выберите филиал') + ' *'"
        :options="locationOptions"
        :error="errors.locationId"
        @change="handleChange"
      />
    </div>

    <!-- Number of Guests (Optional) -->
    <div class="dine-in-form__field">
      <label for="guest-count" class="dine-in-form__label">
        {{ $t('checkout.guestCount', 'Количество гостей (опционально)') }}
      </label>
      <BaseInput
        id="guest-count"
        v-model.number="localData.guestCount"
        type="number"
        min="1"
        max="20"
        :placeholder="$t('checkout.guestCountPlaceholder', 'Сколько человек?')"
        @input="handleChange"
      />
    </div>

    <!-- Special Instructions -->
    <div class="dine-in-form__field">
      <label for="dine-in-instructions" class="dine-in-form__label">
        {{ $t('delivery.instructions', 'Пожелания к заказу') }}
      </label>
      <BaseInput
        id="dine-in-instructions"
        v-model="localData.instructions"
        type="textarea"
        :placeholder="$t('delivery.instructionsPlaceholder', 'Например: не добавлять лук')"
        :rows="3"
        @input="handleChange"
      />
    </div>

    <!-- QR Code Scanner (Optional Feature) -->
    <div v-if="showQrScanner" class="dine-in-form__qr-section">
      <div class="dine-in-form__qr-divider">
        <span class="dine-in-form__qr-divider-text">{{ $t('common.or', 'ИЛИ') }}</span>
      </div>
      
      <BaseButton
        variant="secondary"
        class="dine-in-form__qr-button"
        @click="openQrScanner"
      >
        <BaseIcon name="qrcode" size="md" />
        {{ $t('checkout.scanQr', 'Сканировать QR-код стола') }}
      </BaseButton>
    </div>

    <!-- Info Box -->
    <div class="dine-in-form__info">
      <BaseIcon name="info" size="sm" />
      <div class="dine-in-form__info-content">
        <p class="dine-in-form__info-text">
          {{ $t('checkout.dineInInfoMsg', 'Ваш заказ будет приготовлен и подан к вашему столу. Пожалуйста, оставайтесь на месте.') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface DineInLocation {
  id: string
  name: string
}

interface DineInData {
  tableNumber: string
  locationId: string
  guestCount: number | null
  instructions: string
}

interface Props {
  modelValue: DineInData
  errors?: Record<string, string>
  locations?: DineInLocation[]
  showQrScanner?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
  locations: () => [],
  showQrScanner: false
})

const emit = defineEmits<{
  'update:modelValue': [value: DineInData]
  'scan-qr': []
}>()

const locationOptions = computed(() => {
  return props.locations.map(loc => ({
    label: loc.name,
    value: loc.id
  }))
})

const localData = ref<DineInData>({ ...props.modelValue })

const handleChange = () => {
  emit('update:modelValue', { ...localData.value })
}

const openQrScanner = () => {
  emit('scan-qr')
}

watch(() => props.modelValue, (newValue) => {
  localData.value = { ...newValue }
}, { deep: true })
</script>

<style scoped lang="scss">
@use '~/assets/scss/abstracts/variables' as *;

.dine-in-form {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.dine-in-form__field {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.dine-in-form__label {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
}

.dine-in-form__select {
  width: 100%;
  padding: $space-2 $space-4;
  font-size: $text-base;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  transition: $transition-base;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right $space-2 center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;

  &:focus {
    outline: none;
    border-color: var(--color-success);
    box-shadow: 0 0 0 3px rgba(var(--color-success), 0.1);
  }
}

.dine-in-form__select--error {
  border-color: var(--color-error);
}

.dine-in-form__error {
  font-size: $text-xs;
  color: var(--color-error);
  margin: 0;
}

.dine-in-form__hint {
  font-size: $text-xs;
  color: var(--text-secondary);
  margin: 0;
}

.dine-in-form__qr-section {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.dine-in-form__qr-divider {
  position: relative;
  text-align: center;
  margin: $space-4 0;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--border-primary);
  }
}

.dine-in-form__qr-divider-text {
  position: relative;
  display: inline-block;
  padding: 0 $space-4;
  background: var(--bg-primary);
  font-size: $text-sm;
  color: var(--text-secondary);
  font-weight: $font-medium;
}

.dine-in-form__qr-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
}

.dine-in-form__info {
  display: flex;
  gap: $space-2;
  padding: $space-4;
  background: rgba(var(--color-info), 0.1);
  border: 1px solid rgba(var(--color-info), 0.2);
  border-radius: $radius-md;
}

.dine-in-form__info-content {
  flex: 1;
}

.dine-in-form__info-text {
  font-size: $text-sm;
  color: var(--text-primary);
  margin: 0;
  line-height: $leading-normal;
}
</style>
