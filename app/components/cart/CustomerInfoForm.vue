<template>
  <div class="customer-info-form">
    <!-- Name Field -->
    <div class="form-group">
      <label for="customer-name" class="form-label">
        {{ $t('form.name') }} *
      </label>
      <BaseInput
        id="customer-name"
        v-model="localCustomerInfo.name"
        type="text"
        :placeholder="$t('form.namePlaceholder')"
        :error="errors.name"
        required
        @blur="validateField('name')"
        @input="clearError('name')"
      />
    </div>

    <!-- Phone Field -->
    <div class="form-group">
      <label for="customer-phone" class="form-label">
        {{ $t('form.phone') }} *
      </label>
      <BaseInput
        id="customer-phone"
        v-model="localCustomerInfo.phone"
        type="tel"
        :placeholder="$t('form.phonePlaceholder')"
        :error="errors.phone"
        required
        @blur="validateField('phone')"
        @input="clearError('phone')"
      />
    </div>

    <!-- Email Field -->
    <div class="form-group">
      <label for="customer-email" class="form-label">
        {{ $t('form.email') }}
      </label>
      <BaseInput
        id="customer-email"
        v-model="localCustomerInfo.email"
        type="email"
        :placeholder="$t('form.emailPlaceholder')"
        :error="errors.email"
        @blur="validateField('email')"
        @input="clearError('email')"
      />
    </div>

    <!-- Address Field -->
    <div v-if="requiresAddress" class="form-group">
      <label for="customer-address" class="form-label">
        {{ $t('form.address') }} *
      </label>
      <BaseInput
        id="customer-address"
        v-model="localCustomerInfo.address"
        type="textarea"
        :placeholder="$t('form.addressPlaceholder')"
        :rows="2"
        :error="errors.address"
        required
        @blur="validateField('address')"
        @input="clearError('address')"
      />
    </div>

    <!-- Notes Field -->
    <div class="form-group">
      <label for="customer-notes" class="form-label">
        {{ $t('form.notes') }}
      </label>
      <BaseInput
        id="customer-notes"
        v-model="localCustomerInfo.notes"
        type="textarea"
        :placeholder="$t('form.notesPlaceholder')"
        :rows="2"
        @input="updateCustomerInfo"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CustomerInfo } from '~/types'

const { t } = useI18n()

// Props & Emits
interface Props {
  modelValue: CustomerInfo
  errors?: Record<string, string>
  requiresAddress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
  requiresAddress: false
})

const emit = defineEmits<{
  'update:modelValue': [value: CustomerInfo]
  validate: [errors: Record<string, string>]
}>()

// Local state
const localCustomerInfo = ref<CustomerInfo>({ ...props.modelValue })
const errors = reactive<Record<string, string>>({ ...props.errors })

// Validation rules
const validateField = (field: keyof CustomerInfo) => {
  switch (field) {
    case 'name':
      if (!localCustomerInfo.value.name?.trim()) {
        errors.name = t('form.required')
      } else if (localCustomerInfo.value.name.trim().length < 2) {
        errors.name = t('form.nameMinLength', { min: 2 }) // Fallback if key missing
      } else {
        delete errors.name
      }
      break

    case 'phone':
      // Basic KG/International phone regex
      const phoneRegex = /^\+?[0-9]{10,15}$/
      const cleanPhone = localCustomerInfo.value.phone?.replace(/[\s\-\(\)]/g, '') || ''
      if (!localCustomerInfo.value.phone?.trim()) {
        errors.phone = t('form.required')
      } else if (!phoneRegex.test(cleanPhone)) {
        errors.phone = t('form.invalidPhone')
      } else {
        delete errors.phone
      }
      break

    case 'email':
      if (localCustomerInfo.value.email?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(localCustomerInfo.value.email)) {
          errors.email = t('form.invalidEmail')
        } else {
          delete errors.email
        }
      } else {
        delete errors.email
      }
      break

    case 'address':
      if (props.requiresAddress) {
        if (!localCustomerInfo.value.address?.trim()) {
          errors.address = t('form.required')
        } else if (localCustomerInfo.value.address.trim().length < 5) {
          errors.address = t('form.addressMinLength', { min: 5 })
        } else {
          delete errors.address
        }
      } else {
        delete errors.address
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

const updateCustomerInfo = () => {
  emit('update:modelValue', { ...localCustomerInfo.value })
}

// Watch for changes and emit updates
watch(localCustomerInfo, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true })

// Watch for external errors
watch(() => props.errors, (newErrors) => {
  Object.assign(errors, newErrors)
}, { deep: true })
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/colors' as *;

.customer-info-form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}
</style>

