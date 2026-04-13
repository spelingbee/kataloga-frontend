<template>
  <div class="checkout-page">
    <!-- Header -->
    <div class="checkout-header">
      <h1 class="checkout-title">{{ $t('checkout.title', 'Оформление заказа') }}</h1>
      <p class="checkout-subtitle">{{ $t('checkout.subtitle', 'Пожалуйста, заполните данные для доставки') }}</p>
    </div>

    <form class="checkout-form" @submit.prevent="handleSubmit">
      <div class="checkout-layout">
        <!-- Main Content -->
        <div class="checkout-main">
          <!-- Customer Information -->
          <section class="checkout-section">
            <h2 class="section-title">
              <BaseIcon name="user" size="sm" class="mr-2" />
              {{ $t('checkout.customerInfo', 'Контактные данные') }}
            </h2>
            <CustomerInfoForm
              v-model="customerInfo"
              :errors="errors.customerInfo"
              @validate="validateCustomerInfo"
            />
          </section>

          <!-- Delivery Information -->
          <section class="checkout-section">
            <h2 class="section-title">
              <BaseIcon name="truck" size="sm" class="mr-2" />
              {{ $t('checkout.deliveryInfo', 'Доставка') }}
            </h2>
            <DeliveryForm
              v-model="deliveryInfo"
              :errors="errors.deliveryInfo"
              @validate="validateDeliveryInfo"
            />
          </section>

          <!-- Payment Information -->
          <section class="checkout-section">
            <h2 class="section-title">
              <BaseIcon name="credit-card" size="sm" class="mr-2" />
              {{ $t('checkout.paymentMethod', 'Способ оплаты') }}
            </h2>
            <PaymentForm
              v-model="paymentInfo"
              :errors="errors.paymentInfo"
              @validate="validatePaymentInfo"
            />
          </section>
        </div>

        <!-- Sidebar / Summary -->
        <aside class="checkout-sidebar">
          <div class="summary-card">
            <h2 class="summary-title">{{ $t('checkout.summary', 'Ваш заказ') }}</h2>
            
            <CartSummary
              :total="orderTotal"
              :item-count="itemCount"
              :subtotal="subtotal"
              :delivery-fee="deliveryFee"
              :service-fee="serviceFee"
              :discount="discount"
              :min-order-amount="minOrderAmount"
            />

            <!-- Terms and Conditions -->
            <div class="terms-acceptance">
              <label class="terms-label">
                <input 
                  type="checkbox" 
                  v-model="acceptTerms" 
                  class="terms-checkbox"
                >
                <span class="terms-text">
                  {{ $t('checkout.acceptTerms', 'Я согласен с') }}
                  <a href="/terms" class="terms-link" target="_blank">{{ $t('checkout.termsLink', 'условиями использования') }}</a>
                </span>
              </label>
              <p v-if="errors.terms" class="error-text">{{ errors.terms }}</p>
            </div>

            <!-- Submit Button -->
            <BaseButton
              type="submit"
              variant="primary"
              size="lg"
              :loading="loading"
              :disabled="!isFormValid || loading"
              class="submit-button"
            >
              {{ loading ? $t('checkout.processing', 'Обработка...') : `${$t('checkout.placeOrder', 'Оформить заказ')} • ${formatPrice(orderTotal)}` }}
            </BaseButton>

            <p v-if="submitError" class="submit-error">
              {{ submitError }}
            </p>
          </div>
        </aside>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CustomerInfo, CreateOrderDto } from '~/types'
import { useCartStore } from '~/stores/cart'
import { useTenantStore } from '~/stores/tenant'

const { t } = useI18n()
const cartStore = useCartStore()
const tenantStore = useTenantStore()

const emit = defineEmits<{
  submit: [orderData: CreateOrderDto]
  'validation-change': [isValid: boolean]
}>()

// Reactive state
const customerInfo = ref<CustomerInfo>({
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: ''
})

const deliveryInfo = ref({
  type: 'delivery',
  address: '',
  pickupLocation: '',
  deliveryTime: 'asap',
  customDate: '',
  customTime: '',
  instructions: ''
})

const paymentInfo = ref({
  method: 'CASH',
  cashAmount: ''
})

const acceptTerms = ref(false)
const loading = ref(false)
const submitError = ref('')

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
const deliveryFee = computed(() => 0) // TODO: Dynamic calculation
const serviceFee = computed(() => 0)
const discount = computed(() => 0)
const minOrderAmount = computed(() => tenantStore.currentTenant?.settings?.deliverySettings?.minOrderAmount || 0)
const orderTotal = computed(() => subtotal.value + deliveryFee.value + serviceFee.value - discount.value)

const isFormValid = computed(() => {
  return (
    Object.keys(errors.customerInfo).length === 0 &&
    Object.keys(errors.deliveryInfo).length === 0 &&
    Object.keys(errors.paymentInfo).length === 0 &&
    acceptTerms.value &&
    customerInfo.value.name &&
    customerInfo.value.phone &&
    (deliveryInfo.value.type === 'pickup' ? deliveryInfo.value.pickupLocation : deliveryInfo.value.address)
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
  submitError.value = ''
  
  if (!acceptTerms.value) {
    errors.terms = t('checkout.termsRequired', 'Необходимо принять условия')
    return
  }

  if (!isFormValid.value) {
    return
  }

  loading.value = true

  try {
    const orderData: CreateOrderDto = {
      items: items.value.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.menuItem.price,
        customizations: item.customizations
      })),
      customerInfo: {
        ...customerInfo.value,
        address: deliveryInfo.value.address,
        notes: deliveryInfo.value.instructions
      },
      paymentMethod: paymentInfo.value.method as any,
      notes: deliveryInfo.value.instructions,
      deliveryAddress: deliveryInfo.value.type === 'delivery' ? deliveryInfo.value.address : `PICKUP: ${deliveryInfo.value.pickupLocation}`
    }

    emit('submit', orderData)
  } catch (error: any) {
    console.error('Order submission error:', error)
    submitError.value = error.message || t('checkout.errorGeneric', 'Не удалось создать заказ. Пожалуйста, попробуйте позже.')
  } finally {
    loading.value = false
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-KG', {
    style: 'currency',
    currency: 'KGS',
    minimumFractionDigits: 0
  }).format(price)
}

watch(acceptTerms, (value) => {
  if (value) errors.terms = ''
  emit('validation-change', isFormValid.value)
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/radius' as *;

.checkout-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: $space-6 $space-4;
}

.checkout-header {
  text-align: center;
  margin-bottom: $space-8;

  .checkout-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: $space-2;
  }

  .checkout-subtitle {
    color: var(--text-secondary);
    font-size: 1rem;
  }
}

.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: $space-8;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.checkout-main {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.checkout-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-xl;
  padding: $space-6;

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: $space-6;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border-primary);
    padding-bottom: $space-3;
  }
}

.checkout-sidebar {
  @media (min-width: 1025px) {
    position: sticky;
    top: $space-6;
    height: fit-content;
  }
}

.summary-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-xl;
  padding: $space-6;

  .summary-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: $space-4;
  }
}

.terms-acceptance {
  margin: $space-6 0;

  .terms-label {
    display: flex;
    gap: $space-3;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .terms-checkbox {
    width: 18px;
    height: 18px;
    accent-color: var(--color-success);
    cursor: pointer;
    margin-top: 2px;
  }

  .terms-link {
    color: var(--color-success);
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }

  .error-text {
    color: var(--color-error);
    font-size: 0.75rem;
    margin-top: $space-2;
  }
}

.submit-button {
  width: 100%;
}

.submit-error {
  margin-top: $space-4;
  padding: $space-3;
  background: rgba(var(--color-error-rgb), 0.1);
  border: 1px solid var(--color-error);
  border-radius: $radius-md;
  color: var(--color-error);
  font-size: 0.875rem;
  text-align: center;
}

.mr-2 {
  margin-right: $space-2;
}
</style>

