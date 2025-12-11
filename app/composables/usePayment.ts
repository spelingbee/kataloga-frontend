// Payment composable

import { ref, computed } from 'vue'
import { usePaymentService } from '~/services/payment/payment.service'
import type {
  PaymentGatewayType,
  PaymentSession,
  PaymentResult,
  CreatePaymentDto,
  PaymentError
} from '~/types/payment'

export function usePayment() {
  const paymentService = usePaymentService()
  
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentSession = ref<PaymentSession | null>(null)

  /**
   * Get available payment gateways
   */
  const availableGateways = computed(() => {
    return paymentService.getAvailableGateways()
  })

  /**
   * Get gateway configuration
   */
  const getGatewayConfig = (gateway: PaymentGatewayType) => {
    return paymentService.getGatewayConfig(gateway)
  }

  /**
   * Create a payment session
   */
  const createPayment = async (dto: CreatePaymentDto): Promise<PaymentSession | null> => {
    loading.value = true
    error.value = null

    try {
      const session = await paymentService.createPayment(dto)
      currentSession.value = session
      return session
    } catch (err: any) {
      error.value = err.message || 'Failed to create payment'
      console.error('Payment creation error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Process payment (create and redirect)
   */
  const processPayment = async (dto: CreatePaymentDto): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      await paymentService.processPayment(dto)
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to process payment'
      console.error('Payment processing error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Handle payment callback
   */
  const handleCallback = async (
    gateway: PaymentGatewayType,
    transactionId: string,
    orderId: string,
    status: 'success' | 'failed' | 'pending',
    amount: number,
    data: Record<string, any>,
    signature?: string
  ): Promise<PaymentResult | null> => {
    loading.value = true
    error.value = null

    try {
      const result = await paymentService.handleCallback({
        gateway,
        transactionId,
        orderId,
        status,
        amount,
        signature,
        data
      })
      return result
    } catch (err: any) {
      error.value = err.message || 'Failed to handle payment callback'
      console.error('Payment callback error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Validate payment amount
   */
  const validateAmount = (gateway: PaymentGatewayType, amount: number) => {
    return paymentService.validateAmount(gateway, amount)
  }

  /**
   * Check if currency is supported
   */
  const isCurrencySupported = (gateway: PaymentGatewayType, currency: string) => {
    return paymentService.isCurrencySupported(gateway, currency)
  }

  /**
   * Clear error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Reset state
   */
  const reset = () => {
    loading.value = false
    error.value = null
    currentSession.value = null
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    currentSession: readonly(currentSession),
    availableGateways,

    // Methods
    getGatewayConfig,
    createPayment,
    processPayment,
    handleCallback,
    validateAmount,
    isCurrencySupported,
    clearError,
    reset
  }
}
