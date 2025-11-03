<template>
  <div class="space-y-4">
    <!-- Payment Method Selection -->
    <div>
      <label class="block text-sm font-medium text-neutral-20 mb-3">
        Payment Method *
      </label>
      <div class="space-y-3">
        <!-- Cash Payment -->
        <div
          class="p-4 border-2 rounded-lg cursor-pointer transition-all"
          :class="[
            localPaymentInfo.method === 'cash'
              ? 'border-primary-green bg-primary-green/10'
              : 'border-border-subtle hover:border-neutral-20'
          ]"
          @click="setPaymentMethod('cash')"
        >
          <div class="flex items-center space-x-3">
            <BaseIcon 
              name="cash" 
              size="lg" 
              :class="localPaymentInfo.method === 'cash' ? 'text-primary-green' : 'text-neutral-20'"
            />
            <div class="flex-1">
              <div class="font-medium text-white">Cash on Delivery</div>
              <div class="text-sm text-neutral-20">Pay with cash when your order arrives</div>
            </div>
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              :class="[
                localPaymentInfo.method === 'cash'
                  ? 'border-primary-green bg-primary-green'
                  : 'border-neutral-20'
              ]"
            >
              <div
                v-if="localPaymentInfo.method === 'cash'"
                class="w-2 h-2 bg-white rounded-full"
              />
            </div>
          </div>
        </div>

        <!-- Card Payment -->
        <div
          class="p-4 border-2 rounded-lg cursor-pointer transition-all"
          :class="[
            localPaymentInfo.method === 'card'
              ? 'border-primary-green bg-primary-green/10'
              : 'border-border-subtle hover:border-neutral-20'
          ]"
          @click="setPaymentMethod('card')"
        >
          <div class="flex items-center space-x-3">
            <BaseIcon 
              name="credit-card" 
              size="lg" 
              :class="localPaymentInfo.method === 'card' ? 'text-primary-green' : 'text-neutral-20'"
            />
            <div class="flex-1">
              <div class="font-medium text-white">Credit/Debit Card</div>
              <div class="text-sm text-neutral-20">Pay securely with your card</div>
            </div>
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              :class="[
                localPaymentInfo.method === 'card'
                  ? 'border-primary-green bg-primary-green'
                  : 'border-neutral-20'
              ]"
            >
              <div
                v-if="localPaymentInfo.method === 'card'"
                class="w-2 h-2 bg-white rounded-full"
              />
            </div>
          </div>
        </div>

        <!-- Online Payment -->
        <div
          class="p-4 border-2 rounded-lg cursor-pointer transition-all"
          :class="[
            localPaymentInfo.method === 'online'
              ? 'border-primary-green bg-primary-green/10'
              : 'border-border-subtle hover:border-neutral-20'
          ]"
          @click="setPaymentMethod('online')"
        >
          <div class="flex items-center space-x-3">
            <BaseIcon 
              name="smartphone" 
              size="lg" 
              :class="localPaymentInfo.method === 'online' ? 'text-primary-green' : 'text-neutral-20'"
            />
            <div class="flex-1">
              <div class="font-medium text-white">Online Payment</div>
              <div class="text-sm text-neutral-20">Pay now with SberPay, YooMoney, or other services</div>
            </div>
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              :class="[
                localPaymentInfo.method === 'online'
                  ? 'border-primary-green bg-primary-green'
                  : 'border-neutral-20'
              ]"
            >
              <div
                v-if="localPaymentInfo.method === 'online'"
                class="w-2 h-2 bg-white rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cash Payment Details -->
    <div v-if="localPaymentInfo.method === 'cash'" class="p-4 bg-background-dark/50 rounded-lg border border-border-subtle">
      <div class="space-y-3">
        <div class="flex items-center space-x-2">
          <BaseIcon name="info" size="sm" class="text-primary-orange" />
          <AppText size="body-sm" class="text-white font-medium">
            Cash Payment Information
          </AppText>
        </div>
        
        <div>
          <label for="cash-amount" class="block text-sm font-medium text-neutral-20 mb-2">
            Do you need change? (Optional)
          </label>
          <BaseInput
            id="cash-amount"
            v-model="localPaymentInfo.cashAmount"
            type="number"
            placeholder="Enter amount you'll pay with"
            min="0"
            step="1"
            @input="updatePaymentInfo"
          />
          <AppText size="caption" class="text-neutral-20 mt-1">
            Leave empty if you have exact change
          </AppText>
        </div>
      </div>
    </div>

    <!-- Card Payment Details -->
    <div v-if="localPaymentInfo.method === 'card'" class="space-y-4">
      <!-- Card Number -->
      <div>
        <label for="card-number" class="block text-sm font-medium text-neutral-20 mb-2">
          Card Number *
        </label>
        <BaseInput
          id="card-number"
          v-model="localPaymentInfo.cardNumber"
          type="text"
          placeholder="1234 5678 9012 3456"
          :error="errors.cardNumber"
          maxlength="19"
          @input="formatCardNumber"
          @blur="validateField('cardNumber')"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <!-- Expiry Date -->
        <div>
          <label for="expiry-date" class="block text-sm font-medium text-neutral-20 mb-2">
            Expiry Date *
          </label>
          <BaseInput
            id="expiry-date"
            v-model="localPaymentInfo.expiryDate"
            type="text"
            placeholder="MM/YY"
            :error="errors.expiryDate"
            maxlength="5"
            @input="formatExpiryDate"
            @blur="validateField('expiryDate')"
          />
        </div>

        <!-- CVV -->
        <div>
          <label for="cvv" class="block text-sm font-medium text-neutral-20 mb-2">
            CVV *
          </label>
          <BaseInput
            id="cvv"
            v-model="localPaymentInfo.cvv"
            type="text"
            placeholder="123"
            :error="errors.cvv"
            maxlength="4"
            @input="formatCVV"
            @blur="validateField('cvv')"
          />
        </div>
      </div>

      <!-- Cardholder Name -->
      <div>
        <label for="cardholder-name" class="block text-sm font-medium text-neutral-20 mb-2">
          Cardholder Name *
        </label>
        <BaseInput
          id="cardholder-name"
          v-model="localPaymentInfo.cardholderName"
          type="text"
          placeholder="Name as it appears on card"
          :error="errors.cardholderName"
          @blur="validateField('cardholderName')"
          @input="clearError('cardholderName')"
        />
      </div>

      <!-- Security Notice -->
      <div class="p-3 bg-background-dark/50 rounded-lg border border-border-subtle">
        <div class="flex items-start space-x-2">
          <BaseIcon name="shield" size="sm" class="text-primary-green mt-0.5" />
          <div>
            <AppText size="body-sm" class="text-white font-medium">
              Secure Payment
            </AppText>
            <AppText size="caption" class="text-neutral-20">
              Your payment information is encrypted and secure. We don't store your card details.
            </AppText>
          </div>
        </div>
      </div>
    </div>

    <!-- Online Payment Details -->
    <div v-if="localPaymentInfo.method === 'online'" class="space-y-4">
      <!-- Payment Service Selection -->
      <div>
        <label class="block text-sm font-medium text-neutral-20 mb-3">
          Choose Payment Service
        </label>
        <div class="grid grid-cols-2 gap-3">
          <BaseButton
            variant="ghost"
            :class="[
              'p-3 border-2 transition-all',
              localPaymentInfo.onlineService === 'sberpay'
                ? 'border-primary-green bg-primary-green/10'
                : 'border-border-subtle hover:border-neutral-20'
            ]"
            @click="setOnlineService('sberpay')"
          >
            <div class="text-center">
              <div class="font-medium text-white">SberPay</div>
              <div class="text-xs text-neutral-20">Sberbank</div>
            </div>
          </BaseButton>

          <BaseButton
            variant="ghost"
            :class="[
              'p-3 border-2 transition-all',
              localPaymentInfo.onlineService === 'yoomoney'
                ? 'border-primary-green bg-primary-green/10'
                : 'border-border-subtle hover:border-neutral-20'
            ]"
            @click="setOnlineService('yoomoney')"
          >
            <div class="text-center">
              <div class="font-medium text-white">YooMoney</div>
              <div class="text-xs text-neutral-20">Yandex</div>
            </div>
          </BaseButton>
        </div>
      </div>

      <!-- Online Payment Notice -->
      <div class="p-3 bg-background-dark/50 rounded-lg border border-border-subtle">
        <div class="flex items-start space-x-2">
          <BaseIcon name="info" size="sm" class="text-primary-orange mt-0.5" />
          <div>
            <AppText size="body-sm" class="text-white font-medium">
              Online Payment Process
            </AppText>
            <AppText size="caption" class="text-neutral-20">
              You'll be redirected to the payment service to complete your transaction securely.
            </AppText>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

// Props & Emits
interface PaymentInfo {
  method: 'cash' | 'card' | 'online'
  cashAmount?: string
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardholderName?: string
  onlineService?: 'sberpay' | 'yoomoney'
}

interface Props {
  modelValue: PaymentInfo
  errors?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: PaymentInfo]
  validate: [errors: Record<string, string>]
}>()

// Local state
const localPaymentInfo = ref<PaymentInfo>({ 
  method: 'cash',
  ...props.modelValue 
})

const errors = reactive<Record<string, string>>({ ...props.errors })

// Methods
const setPaymentMethod = (method: 'cash' | 'card' | 'online') => {
  localPaymentInfo.value.method = method
  
  // Clear method-specific errors
  if (method !== 'card') {
    delete errors.cardNumber
    delete errors.expiryDate
    delete errors.cvv
    delete errors.cardholderName
  }
  
  updatePaymentInfo()
  emit('validate', { ...errors })
}

const setOnlineService = (service: 'sberpay' | 'yoomoney') => {
  localPaymentInfo.value.onlineService = service
  updatePaymentInfo()
}

const validateField = (field: keyof PaymentInfo) => {
  switch (field) {
    case 'cardNumber':
      if (localPaymentInfo.value.method === 'card') {
        const cardNumber = localPaymentInfo.value.cardNumber?.replace(/\s/g, '') || ''
        if (!cardNumber) {
          errors.cardNumber = 'Card number is required'
        } else if (cardNumber.length < 13 || cardNumber.length > 19) {
          errors.cardNumber = 'Please enter a valid card number'
        } else if (!isValidCardNumber(cardNumber)) {
          errors.cardNumber = 'Please enter a valid card number'
        } else {
          delete errors.cardNumber
        }
      }
      break

    case 'expiryDate':
      if (localPaymentInfo.value.method === 'card') {
        const expiry = localPaymentInfo.value.expiryDate || ''
        if (!expiry) {
          errors.expiryDate = 'Expiry date is required'
        } else if (!/^\d{2}\/\d{2}$/.test(expiry)) {
          errors.expiryDate = 'Please enter a valid expiry date (MM/YY)'
        } else {
          const [month, year] = expiry.split('/').map(Number)
          const currentDate = new Date()
          const currentYear = currentDate.getFullYear() % 100
          const currentMonth = currentDate.getMonth() + 1
          
          if (month < 1 || month > 12) {
            errors.expiryDate = 'Please enter a valid month (01-12)'
          } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
            errors.expiryDate = 'Card has expired'
          } else {
            delete errors.expiryDate
          }
        }
      }
      break

    case 'cvv':
      if (localPaymentInfo.value.method === 'card') {
        const cvv = localPaymentInfo.value.cvv || ''
        if (!cvv) {
          errors.cvv = 'CVV is required'
        } else if (!/^\d{3,4}$/.test(cvv)) {
          errors.cvv = 'Please enter a valid CVV (3-4 digits)'
        } else {
          delete errors.cvv
        }
      }
      break

    case 'cardholderName':
      if (localPaymentInfo.value.method === 'card') {
        const name = localPaymentInfo.value.cardholderName?.trim() || ''
        if (!name) {
          errors.cardholderName = 'Cardholder name is required'
        } else if (name.length < 2) {
          errors.cardholderName = 'Please enter a valid name'
        } else {
          delete errors.cardholderName
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

const updatePaymentInfo = () => {
  emit('update:modelValue', { ...localPaymentInfo.value })
}

// Formatting methods
const formatCardNumber = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\s/g, '').replace(/\D/g, '')
  
  // Add spaces every 4 digits
  value = value.replace(/(\d{4})(?=\d)/g, '$1 ')
  
  localPaymentInfo.value.cardNumber = value
  updatePaymentInfo()
}

const formatExpiryDate = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '')
  
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4)
  }
  
  localPaymentInfo.value.expiryDate = value
  updatePaymentInfo()
}

const formatCVV = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')
  
  localPaymentInfo.value.cvv = value
  updatePaymentInfo()
}

// Card validation using Luhn algorithm
const isValidCardNumber = (cardNumber: string): boolean => {
  let sum = 0
  let isEven = false
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

// Watch for changes and emit updates
watch(localPaymentInfo, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true })

// Watch for external errors
watch(() => props.errors, (newErrors) => {
  Object.assign(errors, newErrors)
}, { deep: true })

// Validate card fields when payment method changes
watch(() => localPaymentInfo.value.method, (newMethod) => {
  if (newMethod === 'card') {
    // Validate all card fields
    validateField('cardNumber')
    validateField('expiryDate')
    validateField('cvv')
    validateField('cardholderName')
  }
})
</script>

<style scoped>
/* Form field spacing */
.space-y-4 > * + * {
  margin-top: 1rem;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

/* Grid styling */
.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gap-3 {
  gap: 0.75rem;
}

/* Payment method selection styling */
.cursor-pointer {
  cursor: pointer;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Radio button styling */
.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.w-2 {
  width: 0.5rem;
}

.h-2 {
  height: 0.5rem;
}

.rounded-full {
  border-radius: 9999px;
}

/* Input focus styles */
input:focus {
  outline: none;
  ring: 2px;
  ring-color: theme('colors.primary.green');
}
</style>