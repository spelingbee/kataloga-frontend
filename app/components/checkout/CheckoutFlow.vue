<template>
  <div class="checkout-single-page">
    <!-- Success State -->
    <div v-if="isSuccess" class="checkout-single-page__success">
      <OrderConfirmation
        :order-number="orderNumber"
        :order-type="orderData.orderType"
        :order-items="mappedOrderItems"
        :total-amount="finalTotal"
        :estimated-time="estimatedDeliveryTime"
        :delivery-info="getDeliveryInfo()"
        @track-order="handleTrackOrder"
        @continue-shopping="handleContinueShopping"
        @view-orders="handleViewOrders"
      />
    </div>

    <!-- Form State -->
    <div v-else class="checkout-single-page__form">
      <h2 class="checkout-single-page__title">{{ $t('checkout.title', 'Оформление заказа') }}</h2>

      <!-- Validation Warning -->
      <div v-if="showValidationWarning" class="checkout-flow__validation-warning mb-6">
        <div class="checkout-flow__validation-icon">
          <BaseIcon name="alert" size="md" />
        </div>
        <div class="checkout-flow__validation-content">
          <h4 class="checkout-flow__validation-title">
            {{ $t('checkout.validation.title', 'Обнаружены изменения') }}
          </h4>
          <p class="checkout-flow__validation-message">
            {{ validationMessage }}
          </p>
          <div class="checkout-flow__validation-actions mt-2 flex gap-2">
            <BaseButton variant="secondary" size="sm" @click="handleReviewCart">
              {{ $t('common.review_cart', 'Проверить корзину') }}
            </BaseButton>
            <BaseButton variant="primary" size="sm" @click="handleAcknowledgeValidation">
              {{ $t('common.continue_anyway', 'Продолжить') }}
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Section: Order Type -->
      <section class="checkout-section">
        <h3 class="checkout-section__title">{{ $t('delivery.title', 'Способ получения') }}</h3>
        <OrderTypeSelector
          v-model="orderData.orderType"
          @update:model-value="handleOrderTypeChange"
        />
      </section>

      <!-- Section: Details (Delivery/Pickup/Dine-in) -->
      <section class="checkout-section">
        <!-- Delivery Form -->
        <div v-if="orderData.orderType === 'delivery'">
          <h3 class="checkout-section__title">{{ $t('checkout.deliveryInfo', 'Детали доставки') }}</h3>
          <DeliveryForm
            v-model="orderData.deliveryDetails"
            :errors="validationErrors"
            @delivery-fee-calculated="handleDeliveryFeeCalculated"
            @validate="handleValidation"
          />
        </div>

        <!-- Pickup Form -->
        <div v-if="orderData.orderType === 'pickup'">
          <h3 class="checkout-section__title">{{ $t('checkout.pickupInfo', 'Детали самовывоза') }}</h3>
          <PickupForm
            v-model="orderData.pickupDetails"
            :errors="validationErrors"
            :locations="pickupLocations"
          />
        </div>

        <!-- Dine-in Form -->
        <div v-if="orderData.orderType === 'dine-in'">
          <h3 class="checkout-section__title">{{ $t('checkout.dineInInfo', 'В заведении') }}</h3>
          <DineInForm
            v-model="orderData.dineInDetails"
            :errors="validationErrors"
            :locations="dineInLocations"
            :show-qr-scanner="true"
            @scan-qr="handleQrScan"
          />
        </div>
      </section>

      <!-- Section: Payment Method -->
      <section class="checkout-section">
        <h3 class="checkout-section__title">{{ $t('checkout.paymentMethod', 'Способ оплаты') }}</h3>
        <PaymentMethodSelector v-model="orderData.paymentMethod" :order-total="cartTotal" />
      </section>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="checkout-section__error mt-4 text-red-500 text-sm font-medium flex items-center gap-2"
      >
        <BaseIcon name="alert" size="sm" />
        {{ errorMessage }}
      </div>

      <!-- Action Buttons for Non-Telegram environments -->
      <div v-if="!isTelegramApp" class="checkout-single-page__actions mt-8">
        <BaseButton variant="secondary" @click="emit('cancel')">
          {{ $t('checkout.backToCart', 'Назад в корзину') }}
        </BaseButton>

        <BaseButton
          variant="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ $t('checkout.placeOrder', 'Оформить заказ') }} • {{ formatCurrency(totalWithDelivery) }}
        </BaseButton>
      </div>
    </div>

    <TransferPaymentModal
      v-model="showTransferModal"
      :whatsapp-phone="tenantWhatsappPhone"
      :order-total="cartTotal"
      :order-number="orderNumber"
      @confirm="handleTransferConfirm"
      @close="handleTransferCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import OrderTypeSelector from './OrderTypeSelector.vue'
import PickupForm from './PickupForm.vue'
import DineInForm from './DineInForm.vue'
import DeliveryForm from '../cart/DeliveryForm.vue'
import PaymentMethodSelector from './PaymentMethodSelector.vue'
import TransferPaymentModal from './TransferPaymentModal.vue'
import OrderConfirmation from './OrderConfirmation.vue'
import { useCartValidation } from '~/composables/useCartValidation'
import { useOrders } from '~/composables/useOrders'
import { useTelegram } from '~/composables/useTelegram'
import { useTenantSettings } from '~/composables/useTenant'
import { useTenantStore } from '~/stores/tenant'
import type { CartItem, CreateOrderDto } from '~/types'

const tenantStore = useTenantStore()
const telegram = useTelegram()
const { formatCurrency, contactInfo, deliverySettings } = useTenantSettings()

type OrderType = 'delivery' | 'pickup' | 'dine-in'
type PaymentMethodType = 'CASH' | 'TRANSFER'

interface Props {
  cart: CartItem[]
  cartTotal?: number
}

const props = withDefaults(defineProps<Props>(), {
  cartTotal: 0,
})

const emit = defineEmits<{
  complete: [order: any]
  cancel: []
  'track-order': []
  'continue-shopping': []
  'view-orders': []
}>()

// Telegram integration
const isTelegramApp = computed(() => telegram.isTelegram.value)

// Cart validation
const {
  requiresAcknowledgment,
  acknowledged,
  validateBeforeCheckout,
  acknowledgeValidation,
} = useCartValidation()

const mappedOrderItems = computed(() => {
  return props.cart.map(item => ({
    id: item.menuItem.id,
    name: item.menuItem.name,
    quantity: item.quantity,
    price: item.menuItem.price,
  }))
})

// State
const isSuccess = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const validationErrors = ref<Record<string, string>>({})
const showValidationWarning = ref(false)
const validationMessage = ref('')
const finalTotal = ref(0)

let isMainButtonVisible = false

const orderData = ref({
  orderType: 'delivery' as OrderType,
  deliveryDetails: {
    type: 'delivery',
    address: '',
    pickupLocation: '',
    deliveryTime: 'asap',
    customDate: '',
    customTime: '',
    instructions: '',
    coordinates: undefined as { lat: number; lng: number } | undefined,
    deliveryZone: undefined as string | undefined,
    deliveryFeeAmount: 0 as number,
    phone: '',
  },
  pickupDetails: {
    locationId: '',
    pickupTime: 'asap',
    customDate: '',
    customTime: '',
    phone: '',
    writeToTelegram: false,
    instructions: '',
  },
  dineInDetails: {
    tableNumber: '',
    locationId: '',
    guestCount: null as number | null,
    instructions: '',
  },
  paymentMethod: 'CASH' as PaymentMethodType,
})
// Transfer modal state
const showTransferModal = ref(false)
const tenantWhatsappPhone = computed(() => contactInfo.value?.phone || '+996 555 123 456')

// Confirmation state
const orderNumber = ref('')
const estimatedDeliveryTime = computed(
  () => `${deliverySettings.value?.estimatedDeliveryTime || 30} мин`
)

// Locations
const pickupLocations = computed(() => tenantStore.locations)
const dineInLocations = computed(() => tenantStore.locations)

// Computed
const totalWithDelivery = computed(() => {
  const deliveryFee =
    orderData.value.orderType === 'delivery'
      ? orderData.value.deliveryDetails.deliveryFeeAmount || 0
      : 0
  return props.cartTotal + deliveryFee
})

const canSubmit = computed(() => {
  return validateForm(false)
})

// Methods
const handleOrderTypeChange = (type: OrderType) => {
  orderData.value.orderType = type
  if (type === 'delivery' || type === 'pickup') {
    orderData.value.deliveryDetails.type = type === 'delivery' ? 'delivery' : 'pickup'
  }
  validationErrors.value = {}
  errorMessage.value = ''
  updateMainButtonState()
}

const handleDeliveryFeeCalculated = (fee: number, zoneId: string) => {
  orderData.value.deliveryDetails.deliveryFeeAmount = fee
  orderData.value.deliveryDetails.deliveryZone = zoneId
  updateMainButtonState()
}

const handleValidation = (errors: Record<string, string>) => {
  validationErrors.value = errors
  updateMainButtonState()
}

const validateForm = (showErrors = true): boolean => {
  const errors: Record<string, string> = {}
  let isValid = true

  if (orderData.value.orderType === 'delivery') {
    if (!orderData.value.deliveryDetails.address?.trim()) {
      errors.address = 'Адрес доставки обязателен'
      isValid = false
    } else if (orderData.value.deliveryDetails.address.trim().length < 5) {
      errors.address = 'Введите полный адрес доставки'
      isValid = false
    }

    if (!isTelegramApp.value && !orderData.value.deliveryDetails.phone?.trim()) {
      errors.phone = 'Номер телефона обязателен'
      isValid = false
    } else if (orderData.value.deliveryDetails.phone?.trim()) {
      const phoneRegex = /^\+?[\d\s\-()]{10,}$/
      if (!phoneRegex.test(orderData.value.deliveryDetails.phone)) {
        errors.phone = 'Введите корректный номер телефона'
        isValid = false
      }
    }
  }

  if (orderData.value.orderType === 'pickup') {
    if (!orderData.value.pickupDetails.locationId) {
      errors.locationId = 'Выберите точку самовывоза'
      isValid = false
    }
    
    if (!isTelegramApp.value && !orderData.value.pickupDetails.phone?.trim()) {
      errors.phone = 'Номер телефона обязателен'
      isValid = false
    } else if (orderData.value.pickupDetails.phone?.trim()) {
      const phoneRegex = /^\+?[\d\s\-()]{10,}$/
      if (!phoneRegex.test(orderData.value.pickupDetails.phone)) {
        errors.phone = 'Введите корректный номер телефона'
        isValid = false
      }
    }
  }

  if (orderData.value.orderType === 'dine-in') {
    if (!orderData.value.dineInDetails.tableNumber?.trim()) {
      errors.tableNumber = 'Укажите номер стола'
      isValid = false
    }
  }

  if (showErrors && !isValid) {
    validationErrors.value = errors
  }

  return isValid
}

const handleQrScan = () => {
  console.log('QR scan requested')
}

const validateCartBeforePayment = async () => {
  try {
    const result = await validateBeforeCheckout()

    if (!result.isValid) {
      errorMessage.value = 'Некоторые товары стали недоступны. Проверьте корзину.'
      showValidationWarning.value = true
      validationMessage.value = 'Недоступные товары были удалены.'
      return false
    }

    if (result.requiresAcknowledgment) {
      showValidationWarning.value = true
      if (result.result.priceChanges.length > 0) {
        validationMessage.value = `Изменились цены на ${result.result.priceChanges.length} товар(ов).`
      } else {
        validationMessage.value = 'Корзина обновлена. Пожалуйста, проверьте изменения.'
      }
      return false
    }
    return true
  } catch (error) {
    console.error('Cart validation failed:', error)
    errorMessage.value = 'Ошибка проверки корзины.'
    return false
  }
}

const handleAcknowledgeValidation = () => {
  acknowledgeValidation()
  showValidationWarning.value = false
  validationMessage.value = ''
  updateMainButtonState()
}

const handleReviewCart = () => {
  emit('cancel')
}

const handleSubmit = async () => {
  if (!validateForm(true)) {
    errorMessage.value = 'Пожалуйста, заполните необходимые поля корректно.'
    return
  }

  if (requiresAcknowledgment.value && !acknowledged.value) {
    errorMessage.value = 'Пожалуйста, подтвердите изменения в корзине.'
    showValidationWarning.value = true
    return
  }

  const isCartValid = await validateCartBeforePayment()
  if (!isCartValid) return

  await submitOrder()
}

const submitOrder = async () => {
  submitting.value = true
  errorMessage.value = ''
  updateMainButtonState()

  try {

    const finalPhone =
      orderData.value.pickupDetails.phone ||
      orderData.value.deliveryDetails.phone ||
      (orderData.value.pickupDetails.writeToTelegram ? 'via Telegram' : '')

    const customerInfo = {
      name:
        telegram.isTelegram.value && telegram.user.value
          ? [telegram.user.value.firstName, telegram.user.value.lastName].filter(Boolean).join(' ')
          : 'Telegram User',
      phone: finalPhone,
      email: '',
    }

    const createOrderDto: CreateOrderDto = {
      items: props.cart.map(cartItem => ({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.menuItem.price,
        customizations: cartItem.customizations,
      })),
      customerInfo,
      paymentMethod: orderData.value.paymentMethod,
      notes:
        orderData.value.deliveryDetails?.instructions ||
        orderData.value.pickupDetails?.instructions ||
        orderData.value.dineInDetails?.instructions,
      deliveryAddress:
        orderData.value.orderType === 'delivery'
          ? orderData.value.deliveryDetails.address
          : undefined,
      total: totalWithDelivery.value,
    }

    const { createOrder } = useOrders()
    const createdOrder = await createOrder(createOrderDto)

    if (createdOrder) {
      // Set the order number from the created order
      orderNumber.value = createdOrder.id.slice(-8).toUpperCase()
      finalTotal.value = createdOrder.total

      // Store in localStorage for guest tracking if not logged in
      if (!telegram.user.value) {
        try {
          const guestOrders = JSON.parse(localStorage.getItem('guest_orders') || '[]')
          guestOrders.push({
            id: createdOrder.id,
            number: orderNumber.value,
            total: createdOrder.total,
            createdAt: new Date().toISOString(),
          })
          // Keep only last 10 guest orders
          localStorage.setItem('guest_orders', JSON.stringify(guestOrders.slice(-10)))
        } catch (e) {
          console.error('Failed to save guest order to localStorage', e)
        }
      }

      if (orderData.value.paymentMethod === 'TRANSFER') {
        showTransferModal.value = true
        emit('complete', createdOrder)
      } else {
        isSuccess.value = true
        emit('complete', createdOrder)
        if (telegram.isTelegram.value) {
          telegram.hideMainButton()
        }
      }
    } else {
      throw new Error('Не удалось создать заказ.')
    }
  } catch (error: any) {
    console.error('Order creation failed:', error)
    
    // Specifically handle "Product not found" during checkout
    const errorMessageStr = error.message || ''
    const isProductError = 
      errorMessageStr.toLowerCase().includes('product') || 
      errorMessageStr.toLowerCase().includes('not found') ||
      error.statusCode === 404 ||
      error.code === 'USER_NOT_FOUND' // Backend quirk

    if (isProductError) {
      errorMessage.value = 'Некоторые товары в вашей корзине стали недоступны. Сейчас мы обновим корзину.'
      
      // Trigger a forced validation to clean up the cart
      setTimeout(async () => {
        const result = await validateCartBeforePayment()
        if (!result) {
          errorMessage.value = 'Корзина обновлена. Пожалуйста, проверьте изменения перед оформлением заказа.'
        }
      }, 1500)
    } else {
      errorMessage.value = error.message || 'Ошибка оформления заказа.'
    }
  } finally {
    submitting.value = false
    updateMainButtonState()
  }
}

const handleTransferConfirm = () => {
  showTransferModal.value = false
  isSuccess.value = true
  // Note: complete was not emitted yet specifically to separate the steps
  // but we should probably do it now if we need tracking
}

const handleTransferCancel = () => {
  showTransferModal.value = false
  // Order is already created, so we go to success anyway
  isSuccess.value = true
}

const handleTrackOrder = () => emit('track-order')
const handleContinueShopping = () => emit('continue-shopping')
const handleViewOrders = () => emit('view-orders')

const getDeliveryInfo = () => {
  switch (orderData.value.orderType) {
    case 'delivery':
      return {
        address: orderData.value.deliveryDetails.address,
        instructions: orderData.value.deliveryDetails.instructions,
      }
    case 'pickup':
      const location = pickupLocations.value.find(
        loc => loc.id === orderData.value.pickupDetails.locationId
      )
      return {
        location: location?.name,
        phone: orderData.value.pickupDetails.phone,
        instructions: orderData.value.pickupDetails.instructions,
      }
    case 'dine-in':
      return {
        tableNumber: orderData.value.dineInDetails.tableNumber,
        instructions: orderData.value.dineInDetails.instructions,
      }
    default:
      return undefined
  }
}

// Watchers and lifecycle
watch(
  () => props.cart,
  newCart => {
    if (newCart.length === 0 && !isSuccess.value) {
      errorMessage.value = 'Корзина пуста.'
    }
    updateMainButtonState()
  },
  { immediate: true }
)

watch(
  orderData,
  () => {
    updateMainButtonState()
  },
  { deep: true }
)

function updateMainButtonState() {
  if (!telegram.isTelegram.value || isSuccess.value) return

  const disabled = !canSubmit.value
  const text = `Оформить заказ • ${formatCurrency(totalWithDelivery.value)}`

  if (!isMainButtonVisible) {
    telegram.showMainButton(text, handleSubmit)
    isMainButtonVisible = true
  } else {
    // Only update if text actually changed to reduce redundant API calls
    telegram.setMainButtonText(text)
  }

  if (submitting.value) {
    telegram.setMainButtonLoading(true)
  } else {
    telegram.setMainButtonLoading(false)
    if (disabled) {
      // In WebApp API, disabling it slightly grays it out
      telegram.setMainButtonParams({ is_active: false })
    } else {
      telegram.setMainButtonParams({ is_active: true })
    }
  }
}

let cleanupBackBtn: (() => void) | null = null

onMounted(async () => {
  // Fetch locations if they are not already loaded
  if (tenantStore.locations.length === 0) {
    await tenantStore.fetchLocations()
  }

  if (telegram.isTelegram.value) {
    cleanupBackBtn = telegram.showBackButton(() => {
      emit('cancel')
    })
    updateMainButtonState()
  }
})

onUnmounted(() => {
  if (telegram.isTelegram.value) {
    telegram.hideMainButton()
    if (cleanupBackBtn) cleanupBackBtn()
    telegram.hideBackButton()
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;

.checkout-single-page {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: $space-4;
  padding-bottom: $space-8;

  @media (max-width: 480px) {
    padding-left: $space-2;
    padding-right: $space-2;
  }
}

.checkout-single-page__title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: $space-6;
  color: var(--text-primary);
}

.checkout-section {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-card;
  padding: $space-4;
  margin-bottom: $space-4;
  box-shadow: 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.checkout-section__title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: $space-4;
  color: var(--text-primary);
}

.checkout-single-page__actions {
  display: flex;
  gap: $space-4;
  justify-content: space-between;
  padding-top: $space-6;
  border-top: 1px solid var(--border-primary);

  :deep(button) {
    flex: 1;
    min-height: 48px;
    font-size: 16px;
    font-weight: 600;
  }
}

@media (max-width: 480px) {
  .checkout-single-page__actions {
    flex-direction: column;

    :deep(button) {
      width: 100%;
    }
  }
}
</style>
