// Stripe payment gateway implementation

import { BasePaymentGateway } from './base-gateway'
import type {
  PaymentSession,
  PaymentResult,
  PaymentCallback,
  CreatePaymentDto,
  PaymentError
} from '~/types/payment'

export class StripeGateway extends BasePaymentGateway {
  private stripe: any
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    // Load Stripe.js dynamically
    if (process.client) {
      try {
        // @ts-ignore
        const { loadStripe } = await import('@stripe/stripe-js')
        this.stripe = await loadStripe(this.config.publicKey!)
        this.initialized = true
      } catch (error) {
        console.error('Failed to load Stripe:', error)
        throw this.createError('INITIALIZATION_FAILED', 'Failed to initialize Stripe')
      }
    }
  }

  async createPayment(dto: CreatePaymentDto): Promise<PaymentSession> {
    await this.initialize()

    // Validate amount
    const validation = this.validateAmount(dto.amount)
    if (!validation.valid) {
      throw this.createError('INVALID_AMOUNT', validation.error!)
    }

    // Validate currency
    if (!this.isCurrencySupported(dto.currency)) {
      throw this.createError('UNSUPPORTED_CURRENCY', `Currency ${dto.currency} is not supported`)
    }

    try {
      // Create payment intent via backend API
      // Note: Stripe requires server-side payment intent creation for security
      const response = await $fetch<{
        client_secret: string
        payment_intent_id: string
        expires_at: string
      }>('/api/payments/stripe/create-intent', {
        method: 'POST',
        body: {
          amount: dto.amount,
          currency: dto.currency,
          orderId: dto.orderId,
          returnUrl: dto.returnUrl,
          metadata: dto.metadata
        }
      })

      return {
        id: response.payment_intent_id,
        orderId: dto.orderId,
        amount: dto.amount,
        currency: dto.currency,
        gateway: 'stripe',
        formData: {
          clientSecret: response.client_secret
        },
        expiresAt: new Date(response.expires_at)
      }
    } catch (error: any) {
      throw this.createError(
        'PAYMENT_CREATION_FAILED',
        error.message || 'Failed to create Stripe payment',
        error
      )
    }
  }

  async confirmPayment(clientSecret: string, paymentMethod?: any): Promise<PaymentResult> {
    if (!this.stripe) {
      throw this.createError('NOT_INITIALIZED', 'Stripe is not initialized')
    }

    try {
      const result = await this.stripe.confirmPayment({
        clientSecret,
        confirmParams: paymentMethod,
        redirect: 'if_required'
      })

      if (result.error) {
        return {
          success: false,
          orderId: '', // Will be filled from context
          amount: 0,
          gateway: 'stripe',
          error: result.error.message,
          errorCode: result.error.code
        }
      }

      return {
        success: result.paymentIntent.status === 'succeeded',
        transactionId: result.paymentIntent.id,
        orderId: result.paymentIntent.metadata.orderId,
        amount: result.paymentIntent.amount / 100, // Stripe uses cents
        gateway: 'stripe'
      }
    } catch (error: any) {
      throw this.createError(
        'PAYMENT_CONFIRMATION_FAILED',
        error.message || 'Failed to confirm Stripe payment',
        error
      )
    }
  }

  async handleCallback(callback: PaymentCallback): Promise<PaymentResult> {
    // Stripe uses webhooks for server-side verification
    // This method handles client-side callback
    return {
      success: callback.status === 'success',
      transactionId: callback.transactionId,
      orderId: callback.orderId,
      amount: callback.amount,
      gateway: 'stripe',
      error: callback.status === 'failed' ? 'Payment failed' : undefined,
      errorCode: callback.status === 'failed' ? callback.data.error_code : undefined
    }
  }

  verifySignature(data: Record<string, any>, signature: string): boolean {
    // Stripe signature verification is handled server-side via webhooks
    // This is a placeholder for client-side validation
    return true
  }

  private createError(code: string, message: string, details?: any): PaymentError {
    const error = new Error(message) as PaymentError
    error.code = code
    error.gateway = 'stripe'
    error.details = details
    return error
  }
}
