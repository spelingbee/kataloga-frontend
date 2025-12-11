// Payment error handling utilities

import type { PaymentError, PaymentGatewayType } from '~/types/payment'

/**
 * Get user-friendly error message for payment errors
 */
export function getPaymentErrorMessage(error: PaymentError | Error): string {
  if ('code' in error && error.code) {
    const paymentError = error as PaymentError
    
    switch (paymentError.code) {
      case 'GATEWAY_NOT_FOUND':
        return 'Payment method not available. Please try another payment method.'
      
      case 'GATEWAY_UNAVAILABLE':
        return 'This payment method is temporarily unavailable. Please try another method.'
      
      case 'INVALID_AMOUNT':
        return paymentError.message || 'Invalid payment amount.'
      
      case 'UNSUPPORTED_CURRENCY':
        return 'This payment method does not support the selected currency.'
      
      case 'PAYMENT_CREATION_FAILED':
        return 'Failed to initiate payment. Please try again.'
      
      case 'PAYMENT_CONFIRMATION_FAILED':
        return 'Failed to confirm payment. Please check your payment details.'
      
      case 'INVALID_SIGNATURE':
        return 'Payment verification failed. Please contact support.'
      
      case 'NOT_INITIALIZED':
        return 'Payment system not ready. Please refresh the page.'
      
      case 'NOT_AVAILABLE':
        return 'This payment method is not available in your current environment.'
      
      case 'INITIALIZATION_FAILED':
        return 'Failed to initialize payment system. Please try again.'
      
      case 'INVOICE_OPEN_FAILED':
        return 'Failed to open payment invoice. Please try again.'
      
      default:
        return paymentError.message || 'Payment failed. Please try again.'
    }
  }
  
  return error.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Get gateway display name
 */
export function getGatewayDisplayName(gateway: PaymentGatewayType): string {
  const names: Record<PaymentGatewayType, string> = {
    elsom: 'Elsom',
    o: 'O! Money',
    mega: 'Mega Pay',
    stripe: 'Stripe',
    telegram: 'Telegram Payments',
    cash: 'Cash'
  }
  
  return names[gateway] || gateway
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: PaymentError | Error): boolean {
  if ('code' in error && error.code) {
    const paymentError = error as PaymentError
    
    const retryableCodes = [
      'PAYMENT_CREATION_FAILED',
      'PAYMENT_CONFIRMATION_FAILED',
      'INITIALIZATION_FAILED',
      'INVOICE_OPEN_FAILED'
    ]
    
    return retryableCodes.includes(paymentError.code)
  }
  
  return true // By default, allow retry
}

/**
 * Log payment error for debugging
 */
export function logPaymentError(error: PaymentError | Error, context?: Record<string, any>): void {
  if (process.dev) {
    console.error('Payment Error:', {
      message: error.message,
      code: 'code' in error ? error.code : undefined,
      gateway: 'gateway' in error ? error.gateway : undefined,
      transactionId: 'transactionId' in error ? error.transactionId : undefined,
      details: 'details' in error ? error.details : undefined,
      context
    })
  }
  
  // In production, send to error tracking service (e.g., Sentry)
  // if (process.client && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context })
  // }
}
