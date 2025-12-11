<template>
  <div class="payment-form">
    <!-- Payment Method Selection -->
    <div class="payment-form__section">
      <label class="payment-form__label">
        Payment Method *
      </label>
      <div class="payment-form__methods">
        <!-- Cash Payment -->
        <div
          class="payment-form__method"
          :class="{ 'payment-form__method--selected': localPaymentInfo.method === 'cash' }"
          @click="setPaymentMethod('cash')"
        >
          <div class="payment-form__method-content">
            <div class="payment-form__method-info">
              <div class="payment-form__method-title">Cash on Delivery</div>
              <div class="payment-form__method-description">Pay with cash when your order arrives</div>
            </div>
            <div class="payment-form__radio">
              <div
                v-if="localPaymentInfo.method === 'cash'"
                class="payment-form__radio-dot"
              />
            </div>
          </div>
        </div>

        <!-- Card Payment -->
        <div
          class="payment-form__method"
          :class="{ 'payment-form__method--selected': localPaymentInfo.method === 'card' }"
          @click="setPaymentMethod('card')"
        >
          <div class="payment-form__method-content">
            <div class="payment-form__method-info">
              <div class="payment-form__method-title">Credit/Debit Card</div>
              <div class="payment-form__method-description">Pay securely with your card</div>
            </div>
            <div class="payment-form__radio">
              <div
                v-if="localPaymentInfo.method === 'card'"
                class="payment-form__radio-dot"
              />
            </div>
          </div>
        </div>

        <!-- Online Payment -->
        <div
          class="payment-form__method"
          :class="{ 'payment-form__method--selected': localPaymentInfo.method === 'online' }"
          @click="setPaymentMethod('online')"
        >
          <div class="payment-form__method-content">
            <div class="payment-form__method-info">
              <div class="payment-form__method-title">Online Payment</div>
              <div class="payment-form__method-description">Pay now with digital wallet</div>
            </div>
            <div class="payment-form__radio">
              <div
                v-if="localPaymentInfo.method === 'online'"
                class="payment-form__radio-dot"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cash Payment Details -->
    <div v-if="localPaymentInfo.method === 'cash'" class="payment-form__section">
      <div class="payment-form__notice">
        <div class="payment-form__notice-content">
          <h4 class="payment-form__notice-title">Cash Payment Information</h4>
          <div class="payment-form__field">
            <label for="cash-amount" class="payment-form__field-label">
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
            <span class="payment-form__field-help">
              Leave empty if you have exact change
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card Payment Details -->
    <div v-if="localPaymentInfo.method === 'card'" class="payment-form__section">
      <!-- Card Number -->
      <div class="payment-form__field">
        <label for="card-number" class="payment-form__field-label">
          Card Number *
        </label>
        <BaseInput
          id="card-number"
          v-model="localPaymentInfo.cardNumber"
          type="text"
          placeholder="1234 5678 9012 3456"
          maxlength="19"
          @input="formatCardNumber"
          @blur="validateField('cardNumber')"
        />
      </div>

      <div class="payment-form__field-group">
        <!-- Expiry Date -->
        <div class="payment-form__field">
          <label for="expiry-date" class="payment-form__field-label">
            Expiry Date *
          </label>
          <BaseInput
            id="expiry-date"
            v-model="localPaymentInfo.expiryDate"
            type="text"
            placeholder="MM/YY"
            maxlength="5"
            @input="formatExpiryDate"
            @blur="validateField('expiryDate')"
          />
        </div>

        <!-- CVV -->
        <div class="payment-form__field">
          <label for="cvv" class="payment-form__field-label">
            CVV *
          </label>
          <BaseInput
            id="cvv"
            v-model="localPaymentInfo.cvv"
            type="text"
            placeholder="123"
            maxlength="4"
            @input="formatCVV"
            @blur="validateField('cvv')"
          />
        </div>
      </div>

      <!-- Cardholder Name -->
      <div class="payment-form__field">
        <label for="cardholder-name" class="payment-form__field-label">
          Cardholder Name *
        </label>
        <BaseInput
          id="cardholder-name"
          v-model="localPaymentInfo.cardholderName"
          type="text"
          placeholder="Name as it appears on card"
          @blur="validateField('cardholderName')"
          @input="clearError('cardholderName')"
        />
      </div>

      <!-- Security Notice -->
      <div class="payment-form__notice">
        <div class="payment-form__notice-content">
          <h4 class="payment-form__notice-title">Secure Payment</h4>
          <p class="payment-form__notice-text">
            Your payment information is encrypted and secure. We don't store your card details.
          </p>
        </div>
      </div>
    </div>

    <!-- Online Payment Details -->
    <div v-if="localPaymentInfo.method === 'online'" class="payment-form__section">
      <!-- Payment Service Selection -->
      <div class="payment-form__field">
        <label class="payment-form__field-label">
          Choose Payment Service
        </label>
        <div class="payment-form__services">
          <BaseButton
            variant="outline"
            :class="[
              'payment-form__service',
              { 'payment-form__service--selected': localPaymentInfo.onlineService === 'apple' }
            ]"
            @click="setOnlineService('apple')"
          >
            Apple Pay
          </BaseButton>

          <BaseButton
            variant="outline"
            :class="[
              'payment-form__service',
              { 'payment-form__service--selected': localPaymentInfo.onlineService === 'google' }
            ]"
            @click="setOnlineService('google')"
          >
            Google Pay
          </BaseButton>
        </div>
      </div>

      <!-- Online Payment Notice -->
      <div class="payment-form__notice">
        <div class="payment-form__notice-content">
          <h4 class="payment-form__notice-title">Online Payment Process</h4>
          <p class="payment-form__notice-text">
            You'll be redirected to the payment service to complete your transaction securely.
          </p>
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
  onlineService?: 'apple' | 'google'
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

const setOnlineService = (service: 'apple' | 'google') => {
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

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;

.payment-form {
  max-width: 500px;
}

.payment-form__section {
  margin-bottom: $space-6;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.payment-form__label {
  display: block;
  font-family: $font-primary;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
  margin-bottom: $space-3;
}

.payment-form__methods {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.payment-form__method {
  border: 2px solid var(--border-primary);
  border-radius: $radius-md;
  padding: $space-4;
  cursor: pointer;
  transition: $transition-base;
  
  &:hover {
    border-color: var(--border-secondary);
  }
  
  &--selected {
    border-color: var(--color-primary);
    background-color: rgba(255, 107, 53, 0.05);
  }
}

.payment-form__method-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.payment-form__method-info {
  flex: 1;
}

.payment-form__method-title {
  font-family: $font-primary;
  font-size: $text-base;
  font-weight: $font-medium;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.payment-form__method-description {
  font-family: $font-primary;
  font-size: $text-sm;
  color: var(--text-secondary);
}

.payment-form__radio {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-fast;
}

.payment-form__method--selected .payment-form__radio {
  border-color: var(--color-primary);
}

.payment-form__radio-dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-primary);
  border-radius: 50%;
}

.payment-form__field {
  margin-bottom: $space-4;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.payment-form__field-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
}

.payment-form__field-label {
  display: block;
  font-family: $font-primary;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.payment-form__field-help {
  display: block;
  font-family: $font-primary;
  font-size: $text-xs;
  color: var(--text-tertiary);
  margin-top: $space-1;
}

.payment-form__services {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-3;
}

.payment-form__service {
  padding: $space-3;
  
  &--selected {
    border-color: var(--color-primary);
    background-color: rgba(255, 107, 53, 0.05);
    color: var(--color-primary);
  }
}

.payment-form__notice {
  background-color: var(--bg-secondary);
  border-radius: $radius-md;
  padding: $space-4;
  border: 1px solid var(--border-primary);
}

.payment-form__notice-content {
  // Content styles
}

.payment-form__notice-title {
  font-family: $font-primary;
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.payment-form__notice-text {
  font-family: $font-primary;
  font-size: $text-sm;
  color: var(--text-secondary);
  line-height: $leading-relaxed;
  margin: 0;
}
</style>