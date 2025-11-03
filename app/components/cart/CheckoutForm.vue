<template>
  <div class="max-w-2xl mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="text-center mb-6">
      <AppHeading level="h1" size="heading-xl" class="text-white mb-2">
        Checkout
      </AppHeading>
      <AppText class="text-neutral-20">
        Complete your order details
      </AppText>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Customer Information -->
      <div class="bg-background-card/50 rounded-lg p-4 border border-border-subtle">
        <AppHeading level="h2" size="heading-md" class="text-white mb-4">
          Contact Information
        </AppHeading>
        <CustomerInfoForm
          v-model="customerInfo"
          :errors="errors.customerInfo"
          @validate="validateCustomerInfo"
        />
      </div>

      <!-- Delivery Information -->
      <div class="bg-background-card/50 rounded-lg p-4 border border-border-subtle">
        <AppHeading level="h2" size="heading-md" class="text-white mb-4">
          Delivery Details
        </AppHeading>
        <DeliveryForm
          v-model="deliveryInfo"
          :errors="errors.deliveryInfo"
          @validate="validateDeliveryInfo"
        />
      </div>

      <!-- Payment Information -->
      <div class="bg-background-card/50 rounded-lg p-4 border border-border-subtle">
        <AppHeading level="h2" size="heading-md" class="text-white mb-4">
          Payment Method
        </AppHeading>
        <PaymentForm
          v-model="paymentInfo"
          :errors="errors.paymentInfo"
          @validate="validatePaymentInfo"
        />
      </div>

      <!-- Order Summary -->
      <div class="bg-background-card/50 rounded-lg p-4 border border-border-subtle">
        <AppHeading level="h2" size="heading-md" class="text-white mb-4">
          Order Summary
        </AppHeading>
        <CartSummary
          :total="orderTotal"
          :item-count="itemCount"
          :subtotal="subtotal"
          :delivery-fee="deliveryFee"
          :service-fee="serviceFee"
          :discount="discount"
          :min-order-amount="minOrderAmount"
        />
      </div>

      <!-- Order Notes -->
      <div class="bg-background-card/50 rounded-lg p-4 border border-border-subtle">
        <AppHeading level="h3" size="heading-sm" class="text-white mb-3">
          Special Instructions (Optional)
        </AppHeading>
        <BaseInput
          v-model="orderNotes"
          type="textarea"
          placeholder="Any special requests or delivery instructions..."
          :rows="3"
          class="w-full"
        />
      </div>

      <!-- Terms and Conditions -->
      <div class="flex items-start space-x-3">
        <BaseToggle
          v-model="acceptTerms"
          :error="errors.terms"
        />
        <div class="flex-1">
          <AppText size="body-sm" class="text-neutral-20">
            I agree to the 
            <a href="/terms" class="text-primary-green hover:underline" target="_blank">
              Terms of Service
            </a>
            and 
            <a href="/privacy" class="text-primary-green hover:underline" target="_blank">
              Privacy Policy
            </a>
          </AppText>
          <AppText v-if="errors.terms" size="caption" class="text-primary-red mt-1">
            {{ errors.terms }}
          </AppText>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="pt-4">
        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          :loading="loading"
          :disabled="!isFormValid || loading"
          class="w-full bg-primary-green hover:bg-green-600 text-white font-semibold"
        >
          <template v-if="loading">
            Processing Order...
          </template>
          <template v-else>
            Place Order • {{ formatPrice(orderTotal) }}
          </template>
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import type { CustomerInfo, CreateOrderDto } from '~/types'
import { useCartStore } from '~/stores/cart'

// Props & Emits
const emit = defineEmits<{
  submit: [orderData: CreateOrderDto]
  'validation-change': [isValid: boolean]
}>()

// Stores
const cartStore = useCartStore()

// Reactive state
const customerInfo = ref<CustomerInfo>({
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: ''
})

const deliveryInfo = ref({
  address: '',
  city: '',
  postalCode: '',
  deliveryTime: 'asap',
  instructions: ''
})

const paymentInfo = ref({
  method: 'cash',
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  cardholderName: ''
})

const orderNotes = ref('')
const acceptTerms = ref(false)
const loading = ref(false)

// Validation errors
const errors = reactive({
  customerInfo: {} as Record<string, string>,
  deliveryInfo: {} as Record<string, string>,
  paymentInfo: {} as Record<string, string>,
  terms: ''
})

// Computed properties
const items = computed(() => cartStore.items)
const subtotal = computed(() => cartStore.total)
const itemCount = computed(() => cartStore.itemCount)
const deliveryFee = computed(() => 0) // TODO: Calculate based on location
const serviceFee = computed(() => 0)
const discount = computed(() => 0)
const minOrderAmount = computed(() => 500) // 500 rubles minimum
const orderTotal = computed(() => subtotal.value + deliveryFee.value + serviceFee.value - discount.value)

const isFormValid = computed(() => {
  return (
    Object.keys(errors.customerInfo).length === 0 &&
    Object.keys(errors.deliveryInfo).length === 0 &&
    Object.keys(errors.paymentInfo).length === 0 &&
    acceptTerms.value &&
    customerInfo.value.name &&
    customerInfo.value.phone &&
    deliveryInfo.value.address
  )
})

// Validation methods
const validateCustomerInfo = (validationErrors: Record<string, string>) => {
  errors.customerInfo = validationErrors
  emit('validation-change', isFormValid.value)
}

const validateDeliveryInfo = (validationErrors: Record<string, string>) => {
  errors.deliveryInfo = validationErrors
  emit('validation-change', isFormValid.value)
}

const validatePaymentInfo = (validationErrors: Record<string, string>) => {
  errors.paymentInfo = validationErrors
  emit('validation-change', isFormValid.value)
}

// Form submission
const handleSubmit = async () => {
  // Validate terms acceptance
  if (!acceptTerms.value) {
    errors.terms = 'You must accept the terms and conditions'
    return
  } else {
    errors.terms = ''
  }

  if (!isFormValid.value) {
    return
  }

  loading.value = true

  try {
    const orderData: CreateOrderDto = {
      items: items.value.map(item => ({
        productId: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price,
        customizations: item.customizations
      })),
      customerInfo: customerInfo.value,
      notes: orderNotes.value,
      deliveryAddress: deliveryInfo.value.address
    }

    emit('submit', orderData)
  } catch (error) {
    console.error('Order submission error:', error)
  } finally {
    loading.value = false
  }
}

// Helper methods
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Watch for terms acceptance
watch(acceptTerms, (value) => {
  if (value) {
    errors.terms = ''
  }
  emit('validation-change', isFormValid.value)
})
</script>
</template>

<style scoped>
/* Form styling */
.space-y-6 > * + * {
  margin-top: 1.5rem;
}

/* Smooth transitions */
.transition-colors {
  transition: color 0.2s ease-in-out;
}

/* Focus styles */
input:focus,
textarea:focus,
select:focus {
  outline: none;
  ring: 2px;
  ring-color: theme('colors.primary.green');
}
</style>