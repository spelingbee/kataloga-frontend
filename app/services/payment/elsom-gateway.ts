// Elsom payment gateway implementation

import { BasePaymentGateway } from './base-gateway'
import type {
  PaymentSession,
  PaymentResult,
  PaymentCallback,
  CreatePaymentDto,
  PaymentError
} from '~/types/payment'

export class ElsomGateway extends BasePaymentGateway {
  private apiUrl: string
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    // Set API URL based on test mode
    this.apiUrl = this.config.testMode
      ? 'https://test-api.elsom.kg/api/v1'
      : 'https://api.elsom.kg/api/v1'

    this.initialized = true
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
      // Create payment request to Elsom API
      const response = await $fetch<{
        payment_id: string
        redirect_url: string
        expires_at: string
      }>(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.publicKey}`
        },
        body: {
          merchant_id: this.config.merchantId,
          amount: dto.amount,
          currency: dto.currency,
          order_id: dto.orderId,
          return_url: dto.returnUrl,
          cancel_url: dto.cancelUrl,
          description: `Order #${dto.orderId}`,
          metadata: dto.metadata
        }
      })

      return {
        id: response.payment_id,
        orderId: dto.orderId,
        amount: dto.amount,
        currency: dto.currency,
        gateway: 'elsom',
        redirectUrl: response.redirect_url,
        expiresAt: new Date(response.expires_at)
      }
    } catch (error: any) {
      throw this.createError(
        'PAYMENT_CREATION_FAILED',
        error.message || 'Failed to create Elsom payment',
        error
      )
    }
  }

  async handleCallback(callback: PaymentCallback): Promise<PaymentResult> {
    // Verify signature
    if (callback.signature && !this.verifySignature(callback.data, callback.signature)) {
      throw this.createError('INVALID_SIGNATURE', 'Payment callback signature verification failed')
    }

    return {
      success: callback.status === 'success',
      transactionId: callback.transactionId,
      orderId: callback.orderId,
      amount: callback.amount,
      gateway: 'elsom',
      error: callback.status === 'failed' ? 'Payment failed' : undefined,
      errorCode: callback.status === 'failed' ? callback.data.error_code : undefined
    }
  }

  verifySignature(data: Record<string, any>, signature: string): boolean {
    // In production, implement proper signature verification
    // This is a placeholder implementation
    if (this.config.testMode) {
      return true
    }

    // TODO: Implement actual signature verification using merchant secret key
    // Example: HMAC-SHA256 of sorted parameters
    return true
  }

  private createError(code: string, message: string, details?: any): PaymentError {
    const error = new Error(message) as PaymentError
    error.code = code
    error.gateway = 'elsom'
    error.details = details
    return error
  }
}
