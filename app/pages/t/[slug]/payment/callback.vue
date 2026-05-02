<template>
  <div class="payment-callback">
    <div class="payment-callback__container">
      <!-- Loading State -->
      <div v-if="processing" class="payment-callback__loading">
        <div class="payment-callback__spinner"/>
        <h2 class="payment-callback__title">Processing Payment...</h2>
        <p class="payment-callback__message">Please wait while we verify your payment.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="result && result.success" class="payment-callback__success">
        <div class="payment-callback__icon payment-callback__icon--success">
          <BaseIcon name="check-circle" size="xl" />
        </div>
        <h2 class="payment-callback__title">Payment Successful!</h2>
        <p class="payment-callback__message">
          Your payment has been processed successfully.
        </p>
        <div class="payment-callback__details">
          <div class="payment-callback__detail">
            <span class="payment-callback__detail-label">Order ID:</span>
            <span class="payment-callback__detail-value">{{ result.orderId }}</span>
          </div>
          <div v-if="result.transactionId" class="payment-callback__detail">
            <span class="payment-callback__detail-label">Transaction ID:</span>
            <span class="payment-callback__detail-value">{{ result.transactionId }}</span>
          </div>
          <div class="payment-callback__detail">
            <span class="payment-callback__detail-label">Amount:</span>
            <span class="payment-callback__detail-value">{{ formatAmount(result.amount) }}</span>
          </div>
        </div>
        <BaseButton variant="primary" @click="goToOrder">
          View Order
        </BaseButton>
      </div>

      <!-- Error State -->
      <div v-else-if="result && !result.success" class="payment-callback__error">
        <div class="payment-callback__icon payment-callback__icon--error">
          <BaseIcon name="x-circle" size="xl" />
        </div>
        <h2 class="payment-callback__title">Payment Failed</h2>
        <p class="payment-callback__message">
          {{ result.error || 'Your payment could not be processed.' }}
        </p>
        <div v-if="result.errorCode" class="payment-callback__error-code">
          Error Code: {{ result.errorCode }}
        </div>
        <div class="payment-callback__actions">
          <BaseButton variant="primary" @click="retryPayment">
            Try Again
          </BaseButton>
          <BaseButton variant="secondary" @click="goToCart">
            Back to Cart
          </BaseButton>
        </div>
      </div>

      <!-- Invalid State -->
      <div v-else class="payment-callback__invalid">
        <div class="payment-callback__icon payment-callback__icon--warning">
          <BaseIcon name="alert-triangle" size="xl" />
        </div>
        <h2 class="payment-callback__title">Invalid Payment</h2>
        <p class="payment-callback__message">
          We couldn't verify your payment. Please contact support if you were charged.
        </p>
        <BaseButton variant="secondary" @click="goToHome">
          Go to Home
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePayment } from '~/composables/usePayment'
import type { PaymentResult, PaymentGatewayType } from '~/types/payment'

const route = useRoute()
const router = useRouter()
const { handleCallback } = usePayment()

const processing = ref(true)
const result = ref<PaymentResult | null>(null)

onMounted(async () => {
  await processCallback()
})

const processCallback = async () => {
  try {
    // Extract payment data from query parameters
    const gateway = route.query.gateway as PaymentGatewayType
    const transactionId = route.query.transaction_id as string
    const orderId = route.query.order_id as string
    const status = route.query.status as 'success' | 'failed' | 'pending'
    const amount = parseFloat(route.query.amount as string)
    const signature = route.query.signature as string

    if (!gateway || !transactionId || !orderId || !status || !amount) {
      console.error('Missing required payment callback parameters')
      processing.value = false
      return
    }

    // Handle the callback
    const callbackResult = await handleCallback(
      gateway,
      transactionId,
      orderId,
      status,
      amount,
      route.query as Record<string, any>,
      signature
    )

    result.value = callbackResult
  } catch (error) {
    console.error('Payment callback processing error:', error)
    result.value = {
      success: false,
      orderId: route.query.order_id as string || '',
      amount: parseFloat(route.query.amount as string) || 0,
      gateway: route.query.gateway as PaymentGatewayType,
      error: 'Failed to process payment callback'
    }
  } finally {
    processing.value = false
  }
}

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KGS'
  }).format(amount)
}

const goToOrder = () => {
  if (result.value?.orderId) {
    router.push(`/orders/${result.value.orderId}`)
  }
}

const retryPayment = () => {
  router.push('/checkout')
}

const goToCart = () => {
  router.push('/checkout')
}

const goToHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;


.payment-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-8;
  background: var(--bg-secondary);
}

.payment-callback__container {
  max-width: 600px;
  width: 100%;
  background: var(--bg-primary);
  border-radius: $radius-lg;
  padding: $space-12;
  text-align: center;
  box-shadow: $shadow-lg;
}

.payment-callback__loading,
.payment-callback__success,
.payment-callback__error,
.payment-callback__invalid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-6;
}

.payment-callback__spinner {
  width: 64px;
  height: 64px;
  border: 4px solid var(--color-neutral-300);
  border-top-color: var(--color-success);
  border-radius: $radius-full;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.payment-callback__icon {
  width: 80px;
  height: 80px;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-callback__icon--success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.payment-callback__icon--error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.payment-callback__icon--warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.payment-callback__title {
  font-size: $text-2xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin: 0;
}

.payment-callback__message {
  font-size: $text-lg;
  color: var(--text-secondary);
  margin: 0;
}

.payment-callback__details {
  width: 100%;
  background: var(--bg-secondary);
  border-radius: $radius-md;
  padding: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.payment-callback__detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-callback__detail-label {
  font-size: $text-sm;
  color: var(--text-secondary);
  font-weight: $font-medium;
}

.payment-callback__detail-value {
  font-size: $text-base;
  color: var(--text-primary);
  font-weight: $font-semibold;
}

.payment-callback__error-code {
  font-size: $text-sm;
  color: var(--text-secondary);
  padding: $space-2 $space-4;
  background: var(--bg-secondary);
  border-radius: $radius-sm;
  font-family: monospace;
}

.payment-callback__actions {
  display: flex;
  gap: $space-4;
  width: 100%;
}

@media (max-width: 768px) {
  .payment-callback {
    padding: $space-4;
  }

  .payment-callback__container {
    padding: $space-8;
  }

  .payment-callback__title {
    font-size: $text-xl;
  }

  .payment-callback__actions {
    flex-direction: column;
  }
}
</style>

