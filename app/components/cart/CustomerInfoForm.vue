<template>
  <div class="space-y-4">
    <!-- Name Field -->
    <div>
      <label for="customer-name" class="block text-sm font-medium text-neutral-20 mb-2">
        Full Name *
      </label>
      <BaseInput
        id="customer-name"
        v-model="localCustomerInfo.name"
        type="text"
        placeholder="Enter your full name"
        :error="errors.name"
        required
        @blur="validateField('name')"
        @input="clearError('name')"
      />
    </div>

    <!-- Phone Field -->
    <div>
      <label for="customer-phone" class="block text-sm font-medium text-neutral-20 mb-2">
        Phone Number *
      </label>
      <BaseInput
        id="customer-phone"
        v-model="localCustomerInfo.phone"
        type="tel"
        placeholder="+7 (999) 123-45-67"
        :error="errors.phone"
        required
        @blur="validateField('phone')"
        @input="clearError('phone')"
      />
    </div>

    <!-- Email Field -->
    <div>
      <label for="customer-email" class="block text-sm font-medium text-neutral-20 mb-2">
        Email Address
      </label>
      <BaseInput
        id="customer-email"
        v-model="localCustomerInfo.email"
        type="email"
        placeholder="your.email@example.com"
        :error="errors.email"
        @blur="validateField('email')"
        @input="clearError('email')"
      />
      <AppText size="caption" class="text-neutral-20 mt-1">
        Optional - for order confirmations and updates
      </AppText>
    </div>

    <!-- Address Field -->
    <div>
      <label for="customer-address" class="block text-sm font-medium text-neutral-20 mb-2">
        Address
      </label>
      <BaseInput
        id="customer-address"
        v-model="localCustomerInfo.address"
        type="textarea"
        placeholder="Enter your address"
        :rows="2"
        :error="errors.address"
        @blur="validateField('address')"
        @input="clearError('address')"
      />
    </div>

    <!-- Notes Field -->
    <div>
      <label for="customer-notes" class="block text-sm font-medium text-neutral-20 mb-2">
        Additional Notes
      </label>
      <BaseInput
        id="customer-notes"
        v-model="localCustomerInfo.notes"
        type="textarea"
        placeholder="Any special requests or information..."
        :rows="2"
        @input="updateCustomerInfo"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { CustomerInfo } from '~/types'

// Props & Emits
interface Props {
  modelValue: CustomerInfo
  errors?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({})
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
        errors.name = 'Name is required'
      } else if (localCustomerInfo.value.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters'
      } else {
        delete errors.name
      }
      break

    case 'phone':
      const phoneRegex = /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/
      if (!localCustomerInfo.value.phone?.trim()) {
        errors.phone = 'Phone number is required'
      } else if (!phoneRegex.test(localCustomerInfo.value.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.phone = 'Please enter a valid Russian phone number'
      } else {
        delete errors.phone
      }
      break

    case 'email':
      if (localCustomerInfo.value.email?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(localCustomerInfo.value.email)) {
          errors.email = 'Please enter a valid email address'
        } else {
          delete errors.email
        }
      } else {
        delete errors.email
      }
      break

    case 'address':
      if (localCustomerInfo.value.address?.trim() && localCustomerInfo.value.address.trim().length < 10) {
        errors.address = 'Please provide a more detailed address'
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

// Format phone number on input
watch(() => localCustomerInfo.value.phone, (newPhone) => {
  if (newPhone) {
    // Auto-format phone number
    const cleaned = newPhone.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      let formatted = cleaned
      if (cleaned.length >= 1) {
        if (cleaned.startsWith('8')) {
          formatted = '+7' + cleaned.slice(1)
        } else if (cleaned.startsWith('7')) {
          formatted = '+' + cleaned
        } else if (!cleaned.startsWith('+7')) {
          formatted = '+7' + cleaned
        }
      }
      
      // Apply formatting: +7 (999) 123-45-67
      if (formatted.length >= 2) {
        formatted = formatted.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5')
      }
      
      if (formatted !== newPhone) {
        localCustomerInfo.value.phone = formatted
      }
    }
  }
})
</script>

<style scoped>
/* Form field spacing */
.space-y-4 > * + * {
  margin-top: 1rem;
}

/* Label styling */
label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

/* Required field indicator */
label::after {
  content: '';
}

label:has(+ input[required])::after,
label:has(+ textarea[required])::after {
  content: ' *';
  color: theme('colors.primary.red');
}
</style>