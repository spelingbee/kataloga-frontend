<template>
  <div class="checkout-page">
    <div class="checkout-page__container">
      <!-- Header -->
      <div class="checkout-page__header">
        <BaseButton
          variant="ghost"
          @click="handleBack"
        >
          <BaseIcon name="arrow-left" size="sm" />
          Back to Cart
        </BaseButton>
        <h1 class="checkout-page__title">Checkout</h1>
      </div>

      <!-- Empty Cart State -->
      <div v-if="cartStore.isEmpty" class="checkout-page__empty">
        <EmptyCart />
        <BaseButton
          variant="primary"
          @click="navigateTo('/menu/browse')"
        >
          Browse Menu
        </BaseButton>
      </div>

      <!-- Offline Warning -->
      <div v-if="!isOnline" class="checkout-page__offline-warning">
        <BaseIcon name="wifi-off" size="md" />
        <div class="checkout-page__offline-text">
          <h3>You're Offline</h3>
          <p>You need an internet connection to complete checkout. Your cart is saved and will be available when you're back online.</p>
        </div>
      </div>

      <!-- Checkout Flow -->
      <div v-else class="checkout-page__content">
        <CheckoutFlow
          :cart="cartStore.items"
          @complete="handleOrderComplete"
          @cancel="handleCancel"
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
import { ref } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useOfflineCheckout } from '~/composables/useOfflineCheckout'
import { useNetworkStatus } from '~/composables/useNetworkStatus'
import CheckoutFlow from '~/components/checkout/CheckoutFlow.vue'

definePageMeta({
  layout: 'default',
  middleware: ['cart-not-empty']
})

const cartStore = useCartStore()
const router = useRouter()
const { canCheckout, validateNetworkForCheckout } = useOfflineCheckout()
const { isOnline } = useNetworkStatus()

const handleBack = () => {
  router.back()
}

const creatingOrder = ref(false)
const showErrorModal = ref(false)
const errorMessage = ref('')
const lastOrderData = ref<any>(null)

const handleOrderComplete = async (orderData: any) => {
  // Validate network connection before proceeding
  const networkValid = await validateNetworkForCheckout()
  if (!networkValid) {
    return
  }

  // Store order data for potential retry
  lastOrderData.value = orderData

  creatingOrder.value = true
  errorMessage.value = ''

  try {
    // Prepare order DTO
    const createOrderDto = {
      items: orderData.items.map((item: any) => ({
        productId: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price,
        customizations: {
          modifiers: item.selectedModifiers,
          notes: item.notes,
          ...item.customizations
        }
      })),
      customerInfo: {
        name: '', // Will be filled from user profile or form
        phone: orderData.deliveryDetails?.phone || orderData.pickupDetails?.phone || '',
        email: '', // Optional
        address: orderData.deliveryDetails?.address || '',
        notes: orderData.deliveryDetails?.instructions || orderData.pickupDetails?.instructions || orderData.dineInDetails?.instructions || ''
      },
      deliveryAddress: orderData.deliveryDetails?.address || undefined,
      notes: orderData.deliveryDetails?.instructions || orderData.pickupDetails?.instructions || orderData.dineInDetails?.instructions || undefined
    }

    // Create order through cart store
    const response = await cartStore.createOrder(createOrderDto)
    
    if (response.success && response.data) {
      // Order created successfully - cart is already cleared by cartStore.createOrder
      
      // Navigate to order confirmation page
      navigateTo({
        path: '/orders/confirmation',
        query: { orderId: response.data.id }
      })
    } else {
      // Order creation failed - cart is preserved
      throw new Error(response.message || 'Failed to create order')
    }
  } catch (error: any) {
    console.error('Order creation error:', error)
    
    // Cart is preserved automatically (not cleared on error)
    errorMessage.value = error.message || 'An unexpected error occurred while creating your order. Please try again.'
    showErrorModal.value = true
  } finally {
    creatingOrder.value = false
  }
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
  router.push('/cart')
}
</script>

<style scoped lang="scss">
@use '../assets/scss/tokens/colors' as *;
@use '../assets/scss/tokens/spacing' as *;
@use '../assets/scss/tokens/typography' as *;
@use '../assets/scss/tokens/radius' as *;
@use '../assets/scss/tokens/shadows' as *;
@use '../assets/scss/tokens/transitions' as *;

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
    padding: $space-4;
  }

  .checkout-page__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .checkout-page__title {
    font-size: $text-xl;
  }

  .checkout-page__content {
    padding: $space-6;
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
