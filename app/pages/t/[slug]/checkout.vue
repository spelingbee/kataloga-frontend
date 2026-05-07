<template>
  <div class="checkout-page">
    <div class="checkout-page__container">
      <!-- Header -->
      <div class="checkout-page__header">
        <BaseButton
          v-if="!isTelegram"
          variant="ghost"
          @click="handleBack"
        >
          <BaseIcon name="arrow-left" size="sm" />
          {{ $t('checkout.backToCart', 'Вернуться в корзину') }}
        </BaseButton>
        <h1 class="checkout-page__title">{{ $t('checkout.title', 'Оформление заказа') }}</h1>
      </div>

      <!-- Empty Cart State -->
      <div v-if="cartStore.isEmpty && !orderCompleted" class="checkout-page__empty">
        <EmptyCart />
        <BaseButton
          variant="primary"
          @click="navigateTo(tPath('/menu'))"
        >
          Browse Menu
        </BaseButton>
      </div>

      <!-- Offline Warning -->
<!--      <div v-if="!isOnline" class="checkout-page__offline-warning">-->
<!--        <BaseIcon name="wifi-off" size="md" />-->
<!--        <div class="checkout-page__offline-text">-->
<!--          <h3>You're Offline</h3>-->
<!--          <p>You need an internet connection to complete checkout. Your cart is saved and will be available when you're back online.</p>-->
<!--        </div>-->
<!--      </div>-->

      <!-- Checkout Flow -->
      <div v-else class="checkout-page__content">
        <CheckoutFlow
          :cart="checkoutCartItems"
          :cart-total="cartStore.total"
          @complete="handleOrderComplete"
          @cancel="handleCancel"
          @track-order="handleTrackOrder"
          @continue-shopping="handleContinueShopping"
          @view-orders="handleViewOrders"
        />
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="creatingOrder" class="checkout-page__loading-overlay">
      <div class="checkout-page__loading-content">
        <div class="checkout-page__loading-spinner">
          <BaseIcon name="loader" size="xl" />
        </div>
        <p class="checkout-page__loading-text">Creating your order...</p>
        <p class="checkout-page__loading-subtext">Please don't close this page</p>
      </div>
    </div>

    <!-- Error Modal -->
    <div v-if="showErrorModal" class="checkout-page__error-overlay" @click="closeErrorModal">
      <div class="checkout-page__error-modal" @click.stop>
        <div class="checkout-page__error-icon">
          <BaseIcon name="alert-circle" size="xl" />
        </div>
        <h2 class="checkout-page__error-title">Order Creation Failed</h2>
        <p class="checkout-page__error-message">{{ errorMessage }}</p>
        <p class="checkout-page__error-info">
          Don't worry, your cart has been preserved. You can try again or contact support if the problem persists.
        </p>
        <div class="checkout-page__error-actions">
          <BaseButton variant="primary" @click="retryOrderCreation">
            <BaseIcon name="refresh" size="sm" />
            Try Again
          </BaseButton>
          <BaseButton variant="secondary" @click="closeErrorModal">
            Go Back
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import { useI18n } from 'vue-i18n'
import CheckoutFlow from '~/components/checkout/CheckoutFlow.vue'
import EmptyCart from '~/components/base/EmptyCart.vue'
import { useTenant } from '~/composables/useTenant'
import { useNavigation } from '~/composables/useNavigation'
import { useTelegram } from '~/composables/useTelegram'

definePageMeta({
  layout: 'default',
  middleware: ['cart-not-empty']
})

const { t } = useI18n()
const cartStore = useCartStore()
const router = useRouter()
const { tPath } = useTenant()
const { goBack } = useNavigation()
const { isTelegram } = useTelegram()

let timeoutId: ReturnType<typeof setTimeout> | null = null

function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('CHECKOUT_TIMEOUT')), ms)
  })
}

const TIMEOUT_MS = 30_000

const handleBack = () => {
  goBack()
}

const creatingOrder = ref(false)
const showErrorModal = ref(false)
const errorMessage = ref('')
const lastOrderData = ref<any>(null)

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
})

const orderCompleted = ref(false)
const checkoutCartItems = ref([...cartStore.items]) // freeze items so checkout doesn't unmount OrderConfirmation on clear cart

const handleOrderComplete = async (createdOrder: any) => {
  orderCompleted.value = true
  lastOrderData.value = createdOrder

  // Order is already created by CheckoutFlow. 
  // We just clear the cart and let the inline OrderConfirmation display.
  cartStore.clearCart()
}

const handleTrackOrder = () => {
  navigateTo({
    path: tPath('/orders/confirmation'),
    query: { orderId: lastOrderData.value?.id }
  })
}

const handleContinueShopping = () => {
  navigateTo(tPath('/menu'))
}

const handleViewOrders = () => {
  navigateTo(tPath('/orders'))
}

const retryOrderCreation = () => {
  showErrorModal.value = false
  if (lastOrderData.value) {
    handleOrderComplete(lastOrderData.value)
  }
}

const closeErrorModal = () => {
  showErrorModal.value = false
  errorMessage.value = ''
}

const handleCancel = () => {
  router.push(tPath('/checkout'))
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/typography' as *;
@use '~/assets/scss/tokens/radius' as *;
@use '~/assets/scss/tokens/shadows' as *;
@use '~/assets/scss/tokens/transitions' as *;

.checkout-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: $space-8 $space-4;
}

.checkout-page__container {
  max-width: 1200px;
  margin: 0 auto;
}

.checkout-page__header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-4;
  margin-bottom: $space-12;
}

.checkout-page__title {
  font-family: $font-secondary;
  font-size: $text-2xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin: 0;
}

.checkout-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-8;
  padding: $space-12;
  background: var(--bg-primary);
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
}

.checkout-page__offline-warning {
  background: var(--color-warning);
  color: white;
  padding: $space-6;
  border-radius: $radius-lg;
  display: flex;
  align-items: flex-start;
  gap: $space-4;
  margin-bottom: $space-8;
  box-shadow: $shadow-md;

  h3 {
    font-size: $text-lg;
    font-weight: $font-semibold;
    margin: 0 0 $space-2 0;
  }

  p {
    font-size: $text-sm;
    margin: 0;
    opacity: 0.9;
    line-height: $leading-relaxed;
  }
}

.checkout-page__offline-text {
  flex: 1;
}

.checkout-page__content {
  background: var(--bg-primary);
  border-radius: $radius-lg;
  padding: $space-8;
  box-shadow: $shadow-md;
}

.checkout-page__loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.checkout-page__loading-content {
  background: var(--bg-primary);
  padding: $space-8;
  border-radius: $radius-lg;
  text-align: center;
  max-width: 400px;
  box-shadow: $shadow-lg;
}

.checkout-page__loading-spinner {
  display: flex;
  justify-content: center;
  margin-bottom: $space-6;
  color: var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.checkout-page__loading-text {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.checkout-page__loading-subtext {
  font-size: $text-sm;
  color: var(--text-secondary);
}

.checkout-page__error-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: $space-4;
}

.checkout-page__error-modal {
  background: var(--bg-primary);
  padding: $space-8;
  border-radius: $radius-lg;
  max-width: 500px;
  width: 100%;
  box-shadow: $shadow-lg;
  text-align: center;
}

.checkout-page__error-icon {
  display: flex;
  justify-content: center;
  margin-bottom: $space-6;
  color: var(--color-error);
}

.checkout-page__error-title {
  font-size: $text-xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-4;
}

.checkout-page__error-message {
  font-size: $text-base;
  color: var(--color-error);
  margin-bottom: $space-4;
  font-weight: $font-medium;
}

.checkout-page__error-info {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin-bottom: $space-8;
  line-height: $leading-relaxed;
}

.checkout-page__error-actions {
  display: flex;
  gap: $space-4;
  justify-content: center;
}

// Responsive design
@media (max-width: 768px) {
  .checkout-page {
    padding: 0; // Remove outer padding on mobile
    background: var(--bg-primary); // Use primary bg for better mobile look
  }

  .checkout-page__container {
    width: 100%;
  }

  .checkout-page__header {
    padding: $space-4 $space-4 0;
    margin-bottom: $space-4;
  }

  .checkout-page__title {
    font-size: $text-xl;
  }

  .checkout-page__content {
    padding: $space-4;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  .checkout-page__error-actions {
    flex-direction: column;

    :deep(button) {
      width: 100%;
    }
  }

  .checkout-page__loading-content {
    margin: $space-4;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .checkout-page__loading-spinner {
    animation: none;
  }
}
</style>

