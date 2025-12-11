// Telegram Payments gateway implementation

import { BasePaymentGateway } from './base-gateway'
import type {
  PaymentSession,
  PaymentResult,
  PaymentCallback,
  CreatePaymentDto,
  PaymentError
} from '~/types/payment'

export class TelegramGateway extends BasePaymentGateway {
  private telegramWebApp: any
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    // Check if running in Telegram Web App
    if (process.client && window.Telegram?.WebApp) {
      this.telegramWebApp = window.Telegram.WebApp
      this.initialized = true
    } else {
      throw this.createError('NOT_AVAILABLE', 'Telegram Web App is not available')
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
      // Create invoice via backend API
      // Telegram requires server-side invoice creation
      const response = await $fetch<{
        invoice_link: string
        payment_id: string
        expires_at: string
      }>('/api/payments/telegram/create-invoice', {
        method: 'POST',
        body: {
          amount: dto.amount,
          currency: dto.currency,
          orderId: dto.orderId,
          description: `Order #${dto.orderId}`,
          metadata: dto.metadata
        }
      })

      return {
        id: response.payment_id,
        orderId: dto.orderId,
        amount: dto.amount,
        currency: dto.currency,
        gateway: 'telegram',
        redirectUrl: response.invoice_link,
        expiresAt: new Date(response.expires_at)
      }
    } catch (error: any) {
      throw this.createError(
        'PAYMENT_CREATION_FAILED',
        error.message || 'Failed to create Telegram payment',
        error
      )
    }
  }

  async openInvoice(invoiceLink: string): Promise<void> {
    if (!this.telegramWebApp) {
      throw this.createError('NOT_INITIALIZED', 'Telegram Web App is not initialized')
    }

    try {
      // Open invoice in Telegram
      this.telegramWebApp.openInvoice(invoiceLink, (status: string) => {
        // Handle invoice status
        console.log('Invoice status:', status)
      })
    } catch (error: any) {
      throw this.createError(
        'INVOICE_OPEN_FAILED',
        error.message || 'Failed to open Telegram invoice',
        error
      )
    }
  }

  async handleCallback(callback: PaymentCallback): Promise<PaymentResult> {
    // Telegram payment callbacks are handled via bot webhooks
    // This method processes the result on client side
    return {
      success: callback.status === 'success',
      transactionId: callback.transactionId,
      orderId: callback.orderId,
      amount: callback.amount,
      gateway: 'telegram',
      error: callback.status === 'failed' ? 'Payment failed' : undefined,
      errorCode: callback.status === 'failed' ? callback.data.error_code : undefined
    }
  }

  verifySignature(data: Record<string, any>, signature: string): boolean {
    // Telegram signature verification is handled server-side
    // via bot API and webhook verification
    return true
  }

  isAvailable(): boolean {
    return super.isAvailable() && process.client && !!window.Telegram?.WebApp
  }

  private createError(code: string, message: string, details?: any): PaymentError {
    const error = new Error(message) as PaymentError
    error.code = code
    error.gateway = 'telegram'
    error.details = details
    return error
  }
}
