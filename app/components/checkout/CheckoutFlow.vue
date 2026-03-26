<template>
  <div class="checkout-flow">
    <!-- Progress Indicator -->
    <div class="checkout-flow__progress">
      <button 
        v-if="currentStep > 0"
        class="checkout-flow__back-btn-mobile"
        @click="previousStep"
      >
        <BaseIcon name="arrow-left" size="sm" />
      </button>
      
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="checkout-flow__progress-step"
        :class="{
          'checkout-flow__progress-step--active': currentStep === index,
          'checkout-flow__progress-step--completed': currentStep > index
        }"
      >
        <div class="checkout-flow__progress-circle">
          <BaseIcon
            v-if="currentStep > index"
            name="check"
            size="sm"
          />
          <span v-else>{{ index + 1 }}</span>
        </div>
        <span class="checkout-flow__progress-label">{{ step.label }}</span>
      </div>
    </div>

    <!-- Step Content -->
    <div class="checkout-flow__content">
      <!-- Step 1: Order Type Selection -->
      <div v-if="currentStep === 0" class="checkout-flow__step">
        <OrderTypeSelector
          v-model="orderData.orderType"
          @update:model-value="handleOrderTypeChange"
        />
      </div>

      <!-- Step 2: Order Details -->
      <div v-if="currentStep === 1" class="checkout-flow__step">
        <!-- Delivery Form -->
        <div v-if="orderData.orderType === 'delivery'">
          <h3 class="checkout-flow__step-title">Delivery Details</h3>
          <DeliveryForm
            v-model="orderData.deliveryDetails"
            :errors="validationErrors"
            @delivery-fee-calculated="handleDeliveryFeeCalculated"
            @validate="handleValidation"
          />
        </div>

        <!-- Pickup Form -->
        <div v-if="orderData.orderType === 'pickup'">
          <h3 class="checkout-flow__step-title">Pickup Details</h3>
          <PickupForm
            v-model="orderData.pickupDetails"
            :errors="validationErrors"
            :locations="pickupLocations"
          />
        </div>

        <!-- Dine-in Form -->
        <div v-if="orderData.orderType === 'dine-in'">
          <h3 class="checkout-flow__step-title">Dine-in Details</h3>
          <DineInForm
            v-model="orderData.dineInDetails"
            :errors="validationErrors"
            :locations="dineInLocations"
            :show-qr-scanner="true"
            @scan-qr="handleQrScan"
          />
        </div>
      </div>

      <!-- Step 3: Payment Method -->
      <div v-if="currentStep === 2" class="checkout-flow__step">
        <h3 class="checkout-flow__step-title">Payment Method</h3>
        
        <!-- Validation Warning -->
        <div v-if="showValidationWarning" class="checkout-flow__validation-warning">
          <div class="checkout-flow__validation-icon">
            <BaseIcon name="alert" size="md" />
          </div>
          <div class="checkout-flow__validation-content">
            <h4 class="checkout-flow__validation-title">Cart Changes Detected</h4>
            <p class="checkout-flow__validation-message">
              {{ validationMessage }}
            </p>
            <div class="checkout-flow__validation-actions">
              <BaseButton
                variant="secondary"
                size="sm"
                @click="handleReviewCart"
              >
                Review Cart
              </BaseButton>
              <BaseButton
                variant="primary"
                size="sm"
                @click="handleAcknowledgeValidation"
              >
                Continue Anyway
              </BaseButton>
            </div>
          </div>
        </div>
        
        <PaymentMethodSelector
          v-model="orderData.paymentMethod"
          :order-total="cartTotal"
        />
        
        <!-- Payment Method Specific Information -->
        <div v-if="orderData.paymentMethod === 'CASH'" class="checkout-flow__payment-info">
          <div class="checkout-flow__payment-notice">
            <BaseIcon name="info" size="sm" />
            <span>You will pay with cash when your order is delivered.</span>
          </div>
        </div>
        
        <div v-if="orderData.paymentMethod === 'TRANSFER'" class="checkout-flow__payment-info">
          <div class="checkout-flow__payment-notice">
            <BaseIcon name="info" size="sm" />
            <span>You will be asked to send payment receipt via WhatsApp after placing the order.</span>
          </div>
        </div>
      </div>

      <!-- Step 4: Order Confirmation -->
      <div v-if="currentStep === 3" class="checkout-flow__step">
        <OrderConfirmation
          :order-number="orderNumber"
          :order-type="orderData.orderType"
          :order-items="orderItemsForConfirmation"
          :total-amount="cartTotal"
          :estimated-time="estimatedDeliveryTime"
          :delivery-info="getDeliveryInfo()"
          @track-order="handleTrackOrder"
          @continue-shopping="handleContinueShopping"
          @view-orders="handleViewOrders"
        />
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="checkout-flow__actions">
      <BaseButton
        v-if="currentStep > 0"
        variant="secondary"
        @click="previousStep"
      >
        <BaseIcon name="arrow-left" size="sm" />
        Back
      </BaseButton>

      <BaseButton
        v-if="currentStep < steps.length - 2"
        variant="primary"
        :disabled="!canProceed || isNavigating"
        :loading="isNavigating"
        @click="nextStep"
      >
        Continue
        <BaseIcon name="arrow-right" size="sm" />
      </BaseButton>

      <BaseButton
        v-if="currentStep === steps.length - 2"
        variant="primary"
        :loading="submitting"
        :disabled="!canProceed"
        @click="handleSubmit"
      >
        Place Order
      </BaseButton>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="checkout-flow__error">
      <BaseIcon name="alert" size="sm" />
      {{ errorMessage }}
    </div>

    <!-- Transfer Payment Modal -->
    <TransferPaymentModal
      v-model="showTransferModal"
      :whatsapp-phone="tenantWhatsappPhone"
      :order-total="cartTotal"
      @confirm="handleTransferConfirm"
      @close="handleTransferCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import OrderTypeSelector from './OrderTypeSelector.vue'
import PickupForm from './PickupForm.vue'
import DineInForm from './DineInForm.vue'
import DeliveryForm from '../cart/DeliveryForm.vue'
import PaymentMethodSelector from './PaymentMethodSelector.vue'
import TransferPaymentModal from './TransferPaymentModal.vue'
import OrderConfirmation from './OrderConfirmation.vue'
import { useCartValidation } from '~/composables/useCartValidation'
import { useOrders } from '~/composables/useOrders'
import type { CartItem, CreateOrderDto } from '~/types'

type OrderType = 'delivery' | 'pickup' | 'dine-in'
type PaymentMethodType = 'STRIPE' | 'CASH' | 'TRANSFER'

interface DeliveryDetails {
  type: 'delivery' | 'pickup'
  address: string
  pickupLocation: string
  deliveryTime: string
  customDate: string
  customTime: string
  instructions: string
  coordinates?: { lat: number; lng: number }
  deliveryZone?: string
  deliveryFeeAmount?: number
}

interface PickupDetails {
  locationId: string
  pickupTime: string
  customDate: string
  customTime: string
  phone: string
  instructions: string
}

interface DineInDetails {
  tableNumber: string
  locationId: string
  guestCount: number | null
  instructions: string
}

interface OrderData {
  orderType: OrderType
  deliveryDetails: DeliveryDetails
  pickupDetails: PickupDetails
  dineInDetails: DineInDetails
  paymentMethod: PaymentMethodType
}

interface Props {
  cart: CartItem[]
  cartTotal?: number
}

const props = withDefaults(defineProps<Props>(), {
  cartTotal: 0
})

const emit = defineEmits<{
  'complete': [order: any]
  'cancel': []
  'track-order': []
  'continue-shopping': []
  'view-orders': []
}>()

// Telegram integration
const telegram = useTelegram()

// Cart validation
const {
  validating,
  requiresAcknowledgment,
  acknowledged,
  canProceedToPayment,
  validateBeforeCheckout,
  acknowledgeValidation,
  resetValidation
} = useCartValidation()

// State
const currentStep = ref(0)
const submitting = ref(false)
const errorMessage = ref('')
const validationErrors = ref<Record<string, string>>({})
const showValidationWarning = ref(false)
const validationMessage = ref('')

// Telegram MainButton cleanup function
let cleanupMainButton: (() => void) | null = null

const orderData = ref<OrderData>({
  orderType: 'delivery',
  deliveryDetails: {
    type: 'delivery',
    address: '',
    pickupLocation: '',
    deliveryTime: 'asap',
    customDate: '',
    customTime: '',
    instructions: ''
  },
  pickupDetails: {
    locationId: '',
    pickupTime: 'asap',
    customDate: '',
    customTime: '',
    phone: '',
    instructions: ''
  },
  dineInDetails: {
    tableNumber: '',
    locationId: '',
    guestCount: null,
    instructions: ''
  },
  paymentMethod: 'STRIPE'
})

// Transfer payment modal state
const showTransferModal = ref(false)
const tenantWhatsappPhone = ref('+996 555 123 456') // This should come from tenant settings

// Additional state for order confirmation
const orderNumber = ref('')
const estimatedDeliveryTime = ref('25-35 min')

const orderItemsForConfirmation = computed(() => {
  return props.cart.map(item => ({
    id: item.menuItem.id,
    name: item.menuItem.name,
    quantity: item.quantity,
    price: item.menuItem.price
  }))
})

// Steps configuration
const steps = computed(() => [
  { id: 'type', label: 'Order Type' },
  { id: 'details', label: 'Details' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirmation', label: 'Confirmation' }
])

// Mock locations (in real app, these would come from API)
const pickupLocations = ref([
  {
    id: 'main',
    name: 'Main Restaurant',
    address: 'Nevsky Prospect 123, St. Petersburg',
    phone: '+7 (812) 123-45-67'
  },
  {
    id: 'mall',
    name: 'Mall Location',
    address: 'Galeria Shopping Center, St. Petersburg',
    phone: '+7 (812) 234-56-78'
  }
])

const dineInLocations = ref([
  { id: 'main', name: 'Main Restaurant' },
  { id: 'mall', name: 'Mall Location' }
])

// Computed
const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return !!orderData.value.orderType
  }

  if (currentStep.value === 1) {
    // Only check validity, don't show errors yet
    const errors = getStepErrors()
    return Object.keys(errors).length === 0
  }

  if (currentStep.value === 2) {
    return !!orderData.value.paymentMethod
  }

  return true
})

// Methods
const handleOrderTypeChange = (type: OrderType) => {
  orderData.value.orderType = type

  // Update delivery form type if needed
  if (type === 'delivery' || type === 'pickup') {
    orderData.value.deliveryDetails.type = type === 'delivery' ? 'delivery' : 'pickup'
  }

  // Clear validation errors when changing type
  validationErrors.value = {}
  errorMessage.value = ''
}

const handleDeliveryFeeCalculated = (fee: number, zoneId: string) => {
  orderData.value.deliveryDetails.deliveryFeeAmount = fee
  orderData.value.deliveryDetails.deliveryZone = zoneId
}

const handleValidation = (errors: Record<string, string>) => {
  validationErrors.value = errors
}

const getStepErrors = (): Record<string, string> => {
  const errors: Record<string, string> = {}

  if (currentStep.value === 1) {
    if (orderData.value.orderType === 'delivery') {
      if (!orderData.value.deliveryDetails.address?.trim()) {
        errors.address = 'Delivery address is required'
      } else if (orderData.value.deliveryDetails.address.trim().length < 10) {
        errors.address = 'Please provide a more detailed address'
      }
    }

    if (orderData.value.orderType === 'pickup') {
      if (!orderData.value.pickupDetails.locationId) {
        errors.locationId = 'Please select a pickup location'
      }
      if (!orderData.value.pickupDetails.phone?.trim()) {
        errors.phone = 'Phone number is required'
      } else {
        // Basic phone validation
        const phoneRegex = /^\+?[\d\s\-()]+$/
        if (!phoneRegex.test(orderData.value.pickupDetails.phone)) {
          errors.phone = 'Please enter a valid phone number'
        }
      }
    }

    if (orderData.value.orderType === 'dine-in') {
      if (!orderData.value.dineInDetails.tableNumber?.trim()) {
        errors.tableNumber = 'Table number is required'
      }
    }
  }

  return errors
}

const validateCurrentStep = (): boolean => {
  const errors = getStepErrors()
  validationErrors.value = errors
  errorMessage.value = ''

  return Object.keys(errors).length === 0
}

// isNavigating is defined below

const isNavigating = ref(false)

const nextStep = async () => {
  if (isNavigating.value) return

  if (!validateCurrentStep()) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }

  // If moving to payment step (step 2), validate cart first
  if (currentStep.value === 1) {
    isNavigating.value = true
    try {
      await validateCartBeforePayment()
    } finally {
      isNavigating.value = false
    }
  }

  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
    errorMessage.value = ''
  }
}

const validateCartBeforePayment = async () => {
  try {
    const result = await validateBeforeCheckout()

    if (!result.isValid) {
      // Cart validation failed - items were removed
      errorMessage.value = 'Some items in your cart are no longer available. Please review your cart.'
      showValidationWarning.value = true
      validationMessage.value = 'Some items were removed from your cart because they are no longer available.'
      return
    }

    if (result.requiresAcknowledgment) {
      // Show warning about changes
      showValidationWarning.value = true

      if (result.result.priceChanges.length > 0) {
        validationMessage.value = `Prices have changed for ${result.result.priceChanges.length} item(s) in your cart.`
      } else {
        validationMessage.value = 'Your cart has been updated. Please review the changes.'
      }
    }
  } catch (error) {
    console.error('Cart validation failed:', error)
    errorMessage.value = 'Unable to validate cart. Please try again.'
  }
}

const handleAcknowledgeValidation = () => {
  acknowledgeValidation()
  showValidationWarning.value = false
  validationMessage.value = ''
}

const handleReviewCart = () => {
  // Go back to cart page
  emit('cancel')
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    errorMessage.value = ''
    validationErrors.value = {}
  }
}

const handleQrScan = () => {
  // Placeholder for QR code scanning functionality
  console.log('QR scan requested')
}

const handleSubmit = async () => {
  if (!validateCurrentStep()) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }

  // Check if validation requires acknowledgment and hasn't been acknowledged
  if (requiresAcknowledgment.value && !acknowledged.value) {
    errorMessage.value = 'Please acknowledge the cart changes before proceeding'
    showValidationWarning.value = true
    return
  }

  // Final validation check before submitting
  if (!canProceedToPayment.value) {
    errorMessage.value = 'Unable to proceed with payment. Please review your cart.'
    return
  }

  // Handle different payment methods
  if (orderData.value.paymentMethod === 'TRANSFER') {
    // Show transfer modal instead of submitting immediately
    showTransferModal.value = true
    return
  }

  // For STRIPE and CASH, proceed with order submission
  await submitOrder()
}



  const handleTransferConfirm = () => {
  showTransferModal.value = false
  submitOrder()
}

const handleTransferCancel = () => {
  showTransferModal.value = false
}

// Order confirmation handlers
const handleTrackOrder = () => {
  emit('track-order')
}

const handleContinueShopping = () => {
  emit('continue-shopping')
}

const handleViewOrders = () => {
  emit('view-orders')
}

// --- Persistence & Idempotency ---
import { useStorageState } from '~/composables/useStorage'

// Persist Order Data (Survivable across reloads/auth redirects)
const { value: storedOrderData, setValue: saveOrderData, removeValue: clearOrderData } = useStorageState('checkout_order_data', orderData.value)
// Persist Idempotency Key
const { value: storedIdempotencyKey, setValue: saveIdempotencyKey, removeValue: clearIdempotencyKey } = useStorageState('checkout_idempotency_key', '')

// Initialize Persistence
onMounted(() => {
  // Restore order data if exists
  if (storedOrderData.value && Object.keys(storedOrderData.value).length > 0) {
    // Deep merge or just overwrite carefully
    orderData.value = {
      ...orderData.value,
      ...storedOrderData.value,
      // Ensure nested objects are merged correctly if needed, but simple overwrite is usually fine for this structure
      deliveryDetails: { ...orderData.value.deliveryDetails, ...storedOrderData.value.deliveryDetails },
      pickupDetails: { ...orderData.value.pickupDetails, ...storedOrderData.value.pickupDetails },
      dineInDetails: { ...orderData.value.dineInDetails, ...storedOrderData.value.dineInDetails },
    }
  }

  // Restore or Generate Idempotency Key
  if (storedIdempotencyKey.value) {
    // Keep existing key to prevent double charge on retry
    console.log('Restored idempotency key:', storedIdempotencyKey.value)
  } else {
    // Generate new key
    const newKey = crypto.randomUUID ? crypto.randomUUID() : `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    saveIdempotencyKey(newKey)
  }
})

// Watch for changes to save state
watch(orderData, (newVal) => {
  saveOrderData(newVal)
}, { deep: true })

const submitOrder = async () => {
  submitting.value = true
  errorMessage.value = ''

  try {
    // Generate order number
    orderNumber.value = `ORD${Date.now().toString().slice(-6)}`

    // Uses the PERSISTED idempotency key
    const currentIdempotencyKey = storedIdempotencyKey.value || (() => {
       const key = crypto.randomUUID ? crypto.randomUUID() : `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
       saveIdempotencyKey(key)
       return key
    })()

    // Prepare order data according to CreateOrderDto interface
    const createOrderDto: CreateOrderDto & { idempotencyKey?: string } = {
      items: props.cart.map(cartItem => ({
        productId: cartItem.menuItem.id,
        quantity: cartItem.quantity,
        price: cartItem.menuItem.price,
        customizations: cartItem.customizations
      })),
      customerInfo: {
        name: 'Customer', // This should come from user input or auth
        phone: '+996 555 000 000', // This should come from user input
        email: 'customer@example.com' // This should come from user input or auth
      },
      paymentMethod: orderData.value.paymentMethod,
      notes: orderData.value.deliveryDetails?.instructions ||
             orderData.value.pickupDetails?.instructions ||
             orderData.value.dineInDetails?.instructions,
      deliveryAddress: orderData.value.orderType === 'delivery' ?
                      orderData.value.deliveryDetails.address : undefined,
      idempotencyKey: currentIdempotencyKey // Pass key to backend
    }

    // Create the order using the order service
    const { createOrder } = useOrders()
    const createdOrder = await createOrder(createOrderDto)

    if (createdOrder) {
      // CLEAR Persisted Data on Success
      clearOrderData()
      clearIdempotencyKey()

      // Move to confirmation step
      currentStep.value++

      // Emit complete event with the created order
      emit('complete', createdOrder)
    } else {
      throw new Error('Failed to create order')
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to place order. Please try again.'
    // Do NOT clear idempotency key on error. 
    // If it was a network timeout, the server might have processed it.
    // Retrying with SAME key ensures we get the original order back.
  } finally {
    submitting.value = false
  }
}

const getDeliveryInfo = () => {
  switch (orderData.value.orderType) {
    case 'delivery':
      return {
        address: orderData.value.deliveryDetails.address,
        instructions: orderData.value.deliveryDetails.instructions
      }
    case 'pickup':
      const location = pickupLocations.value.find(loc => loc.id === orderData.value.pickupDetails.locationId)
      return {
        location: location?.name,
        phone: orderData.value.pickupDetails.phone,
        instructions: orderData.value.pickupDetails.instructions
      }
    case 'dine-in':
      return {
        tableNumber: orderData.value.dineInDetails.tableNumber,
        instructions: orderData.value.dineInDetails.instructions
      }
    default:
      return undefined
  }
}

// Watch for cart changes
watch(() => props.cart, (newCart) => {
  if (newCart.length === 0) {
    errorMessage.value = 'Your cart is empty'
  }
}, { immediate: true })

// Setup Telegram MainButton based on current step
const setupTelegramMainButton = () => {
  if (!telegram.isTelegram.value) return

  // Cleanup previous button
  if (cleanupMainButton) {
    cleanupMainButton()
    cleanupMainButton = null
  }

  let buttonText = ''
  let buttonAction: (() => void) | null = null

  if (currentStep.value < steps.value.length - 1) {
    buttonText = 'Continue'
    buttonAction = nextStep
  } else if (currentStep.value === steps.value.length - 1) {
    buttonText = 'Place Order'
    buttonAction = handleSubmit
  }

  if (buttonText && buttonAction) {
    cleanupMainButton = telegram.showMainButton(buttonText, buttonAction)

    // Disable button if can't proceed
    if (!canProceed.value) {
      telegram.setMainButtonLoading(false)
    }
  }
}

// Watch for step changes to update MainButton
watch(currentStep, () => {
  setupTelegramMainButton()
})

// Watch for canProceed changes to enable/disable button
watch(canProceed, (can) => {
  if (telegram.isTelegram.value) {
    telegram.setMainButtonLoading(!can)
  }
})

// Watch for submitting state to show loading
watch(submitting, (isSubmitting) => {
  if (telegram.isTelegram.value) {
    telegram.setMainButtonLoading(isSubmitting)
  }
})

// Setup Telegram BackButton
onMounted(() => {
  if (telegram.isTelegram.value) {
    setupTelegramMainButton()

    // Setup back button
    const cleanupBackButton = telegram.showBackButton(() => {
      if (currentStep.value > 0) {
        previousStep()
      } else {
        emit('cancel')
      }
    })

    // Cleanup on unmount
    onUnmounted(() => {
      if (cleanupMainButton) {
        cleanupMainButton()
      }
      cleanupBackButton()
      telegram.hideMainButton()
      telegram.hideBackButton()
    })
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/radius' as *;
@use '~/assets/scss/tokens/shadows' as *;
@use '~/assets/scss/tokens/transitions' as *;
@use '~/assets/scss/tokens/typography' as *;

.checkout-flow {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.checkout-flow__progress {
  display: flex;
  justify-content: space-between;
  margin-bottom: $space-12;
  position: relative;
  padding: 0 $space-4; // Add padding to ensure connection line doesn't visually overflow

  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 40px; // Adjust to start after the first circle center approx
    right: 40px;
    height: 2px;
    background: var(--color-neutral-300);
    z-index: 0;
  }
}

.checkout-flow__back-btn-mobile {
  position: absolute;
  left: -40px; // Move outside the flow
  top: 50%;
  transform: translateY(-50%);
  // styles for button
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  
  @media (max-width: 640px) {
    left: 0;
    top: -40px; // Move above on mobile
    transform: none;
  }
}


.checkout-flow__progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  flex: 1;
  position: relative;
  z-index: 1;
}

.checkout-flow__progress-circle {
  width: 40px;
  height: 40px;
  border-radius: $radius-full;
  background: var(--bg-primary);
  border: 2px solid var(--color-neutral-300);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: $font-semibold;
  color: var(--color-neutral-600);
  transition: $transition-base-ease;
}

// ... existing styles ...

.checkout-flow__back-btn-mobile {
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--text-primary);
  }
  
  @media (min-width: 768px) {
    display: none; // Hide on desktop as they have the main back button
  }
}

.checkout-flow__progress-step--active .checkout-flow__progress-circle {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.checkout-flow__progress-step--completed .checkout-flow__progress-circle {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.checkout-flow__progress-label {
  font-size: $text-sm;
  color: var(--text-secondary);
  text-align: center;
  transition: $transition-base-ease;
}

.checkout-flow__progress-step--active .checkout-flow__progress-label {
  color: var(--color-primary);
  font-weight: $font-semibold;
}

.checkout-flow__content {
  min-height: 400px;
  margin-bottom: $space-8;
}

.checkout-flow__step {
  animation: fadeIn 0.3s ease-in-out;
}

.checkout-flow__step-title {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-6;
}

.checkout-flow__review {
  padding: $space-8;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-card;
  text-align: center;
}

.checkout-flow__review-text {
  font-size: $text-base;
  color: var(--text-secondary);
  margin: 0;
}

.checkout-flow__actions {
  display: flex;
  gap: $space-4;
  justify-content: space-between;
  padding-top: $space-6;
  border-top: 1px solid var(--border-primary);
}

.checkout-flow__validation-warning {
  display: flex;
  gap: $space-4;
  padding: $space-6;
  margin-bottom: $space-8;
  background: rgba(255, 107, 53, 0.1);
  border: 1px solid rgba(255, 107, 53, 0.3);
  border-radius: $radius-card;
}

.checkout-flow__validation-icon {
  flex-shrink: 0;
  color: var(--color-primary);
}

.checkout-flow__validation-content {
  flex: 1;
}

.checkout-flow__validation-title {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin: 0 0 $space-2 0;
}

.checkout-flow__validation-message {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin: 0 0 $space-4 0;
  line-height: $leading-relaxed;
}

.checkout-flow__validation-actions {
  display: flex;
  gap: $space-2;
}

.checkout-flow__payment-info {
  margin-top: $space-6;
}

.checkout-flow__payment-notice {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: $radius-md;
  color: var(--color-info);
  font-size: $text-sm;
}

.checkout-flow__error {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-4;
  margin-top: $space-4;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: $radius-md;
  color: var(--color-error);
  font-size: $text-sm;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .checkout-flow__progress {
    margin-bottom: $space-8;
  }

  .checkout-flow__progress-label {
    font-size: $text-xs;
  }

  .checkout-flow__progress-circle {
    width: 32px;
    height: 32px;
    font-size: $text-sm;
  }

  .checkout-flow__actions {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .checkout-flow__step {
    animation: none;
  }
  
  .checkout-flow__progress-circle,
  .checkout-flow__progress-label {
    transition: none;
  }
}
</style>
