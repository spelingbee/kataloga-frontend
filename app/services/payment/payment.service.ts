// Payment service - manages all payment gateways

import { ElsomGateway } from './elsom-gateway'
import { OGateway } from './o-gateway'
import { MegaGateway } from './mega-gateway'
import { StripeGateway } from './stripe-gateway'
import { TelegramGateway } from './telegram-gateway'
import type { BasePaymentGateway } from './base-gateway'
import type {
  PaymentGatewayType,
  PaymentSession,
  PaymentResult,
  PaymentCallback,
  PaymentGatewayConfig,
  CreatePaymentDto,
  PaymentError
} from '~/types/payment'

export class PaymentService {
  private gateways: Map<PaymentGatewayType, BasePaymentGateway> = new Map()
  private initialized = false

  constructor() {
    this.initializeGateways()
  }

  private initializeGateways(): void {
    const config = useRuntimeConfig()

    // Initialize Elsom gateway
    const elsomConfig: PaymentGatewayConfig = {
      name: 'elsom',
      displayName: 'Elsom',
      enabled: config.public.payment?.elsom?.enabled ?? true,
      testMode: config.public.payment?.elsom?.testMode ?? true,
      publicKey: config.public.payment?.elsom?.publicKey,
      merchantId: config.public.payment?.elsom?.merchantId,
      supportedCurrencies: ['KGS'],
      minAmount: 10,
      maxAmount: 1000000
    }
    this.gateways.set('elsom', new ElsomGateway(elsomConfig))

    // Initialize O! gateway
    const oConfig: PaymentGatewayConfig = {
      name: 'o',
      displayName: 'O!',
      enabled: config.public.payment?.o?.enabled ?? true,
      testMode: config.public.payment?.o?.testMode ?? true,
      publicKey: config.public.payment?.o?.publicKey,
      merchantId: config.public.payment?.o?.merchantId,
      supportedCurrencies: ['KGS'],
      minAmount: 10,
      maxAmount: 1000000
    }
    this.gateways.set('o', new OGateway(oConfig))

    // Initialize Mega gateway
    const megaConfig: PaymentGatewayConfig = {
      name: 'mega',
      displayName: 'Mega',
      enabled: config.public.payment?.mega?.enabled ?? true,
      testMode: config.public.payment?.mega?.testMode ?? true,
      publicKey: config.public.payment?.mega?.publicKey,
      merchantId: config.public.payment?.mega?.merchantId,
      supportedCurrencies: ['KGS'],
      minAmount: 10,
      maxAmount: 1000000
    }
    this.gateways.set('mega', new MegaGateway(megaConfig))

    // Initialize Stripe gateway
    const stripeConfig: PaymentGatewayConfig = {
      name: 'stripe',
      displayName: 'Stripe',
      enabled: config.public.payment?.stripe?.enabled ?? true,
      testMode: config.public.payment?.stripe?.testMode ?? true,
      publicKey: config.public.payment?.stripe?.publicKey,
      supportedCurrencies: ['USD', 'EUR', 'KGS'],
      minAmount: 0.5,
      maxAmount: 999999
    }
    this.gateways.set('stripe', new StripeGateway(stripeConfig))

    // Initialize Telegram gateway
    const telegramConfig: PaymentGatewayConfig = {
      name: 'telegram',
      displayName: 'Telegram Payments',
      enabled: config.public.payment?.telegram?.enabled ?? true,
      testMode: config.public.payment?.telegram?.testMode ?? true,
      supportedCurrencies: ['KGS', 'USD', 'EUR'],
      minAmount: 1,
      maxAmount: 100000
    }
    this.gateways.set('telegram', new TelegramGateway(telegramConfig))

    this.initialized = true
  }

  /**
   * Get available payment gateways
   */
  getAvailableGateways(): PaymentGatewayType[] {
    return Array.from(this.gateways.entries())
      .filter(([_, gateway]) => gateway.isAvailable())
      .map(([type]) => type)
  }

  /**
   * Get gateway configuration
   */
  getGatewayConfig(gateway: PaymentGatewayType): PaymentGatewayConfig | null {
    const gatewayInstance = this.gateways.get(gateway)
    return gatewayInstance ? gatewayInstance.getConfig() : null
  }

  /**
   * Get gateway instance
   */
  private getGateway(gateway: PaymentGatewayType): BasePaymentGateway {
    const gatewayInstance = this.gateways.get(gateway)
    if (!gatewayInstance) {
      throw this.createError(gateway, 'GATEWAY_NOT_FOUND', `Payment gateway ${gateway} not found`)
    }
    if (!gatewayInstance.isAvailable()) {
      throw this.createError(gateway, 'GATEWAY_UNAVAILABLE', `Payment gateway ${gateway} is not available`)
    }
    return gatewayInstance
  }

  /**
   * Create a payment
   */
  async createPayment(dto: CreatePaymentDto): Promise<PaymentSession> {
    const gateway = this.getGateway(dto.gateway)
    
    try {
      return await gateway.createPayment(dto)
    } catch (error: any) {
      console.error(`Payment creation failed for ${dto.gateway}:`, error)
      throw error
    }
  }

  /**
   * Handle payment callback
   */
  async handleCallback(callback: PaymentCallback): Promise<PaymentResult> {
    const gateway = this.getGateway(callback.gateway)
    
    try {
      return await gateway.handleCallback(callback)
    } catch (error: any) {
      console.error(`Payment callback handling failed for ${callback.gateway}:`, error)
      throw error
    }
  }

  /**
   * Process payment (create and redirect)
   */
  async processPayment(dto: CreatePaymentDto): Promise<void> {
    const session = await this.createPayment(dto)

    if (session.redirectUrl) {
      // Redirect to payment gateway
      if (process.client) {
        window.location.href = session.redirectUrl
      }
    } else if (session.formData) {
      // Handle form-based payment (e.g., Stripe Elements)
      console.log('Payment requires form submission:', session.formData)
    }
  }

  /**
   * Validate payment amount for gateway
   */
  validateAmount(gateway: PaymentGatewayType, amount: number): { valid: boolean; error?: string } {
    const gatewayInstance = this.getGateway(gateway)
    return gatewayInstance.validateAmount(amount)
  }

  /**
   * Check if currency is supported by gateway
   */
  isCurrencySupported(gateway: PaymentGatewayType, currency: string): boolean {
    const gatewayInstance = this.getGateway(gateway)
    return gatewayInstance.isCurrencySupported(currency)
  }

  private createError(gateway: PaymentGatewayType, code: string, message: string): PaymentError {
    const error = new Error(message) as PaymentError
    error.code = code
    error.gateway = gateway
    return error
  }
}

// Export singleton instance
let paymentServiceInstance: PaymentService | null = null

export function usePaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService()
  }
  return paymentServiceInstance
}
