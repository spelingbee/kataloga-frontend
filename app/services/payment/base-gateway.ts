// Base payment gateway interface

import type {
  PaymentSession,
  PaymentResult,
  PaymentCallback,
  PaymentGatewayConfig,
  CreatePaymentDto
} from '~/types/payment'

export abstract class BasePaymentGateway {
  protected config: PaymentGatewayConfig

  constructor(config: PaymentGatewayConfig) {
    this.config = config
  }

  /**
   * Initialize the payment gateway
   */
  abstract initialize(): Promise<void>

  /**
   * Create a payment session
   */
  abstract createPayment(dto: CreatePaymentDto): Promise<PaymentSession>

  /**
   * Handle payment callback from gateway
   */
  abstract handleCallback(callback: PaymentCallback): Promise<PaymentResult>

  /**
   * Verify payment signature/authenticity
   */
  abstract verifySignature(data: Record<string, any>, signature: string): boolean

  /**
   * Check if gateway is available
   */
  isAvailable(): boolean {
    return this.config.enabled
  }

  /**
   * Get gateway configuration
   */
  getConfig(): PaymentGatewayConfig {
    return { ...this.config }
  }

  /**
   * Validate payment amount
   */
  validateAmount(amount: number): { valid: boolean; error?: string } {
    if (this.config.minAmount && amount < this.config.minAmount) {
      return {
        valid: false,
        error: `Minimum amount is ${this.config.minAmount}`
      }
    }

    if (this.config.maxAmount && amount > this.config.maxAmount) {
      return {
        valid: false,
        error: `Maximum amount is ${this.config.maxAmount}`
      }
    }

    return { valid: true }
  }

  /**
   * Check if currency is supported
   */
  isCurrencySupported(currency: string): boolean {
    return this.config.supportedCurrencies.includes(currency.toUpperCase())
  }
}
