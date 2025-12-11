// Payment types

export type PaymentGatewayType = 'elsom' | 'o' | 'mega' | 'stripe' | 'telegram' | 'cash'

export interface PaymentMethod {
  type: 'cash' | 'online'
  gateway?: PaymentGatewayType
  changeFrom?: number // Cash denomination customer will pay with (e.g., 1000 som)
}

export interface PaymentSession {
  id: string
  orderId: string
  amount: number
  currency: string
  gateway: PaymentGatewayType
  redirectUrl?: string
  formData?: Record<string, any>
  expiresAt: Date
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  orderId: string
  amount: number
  gateway: PaymentGatewayType
  error?: string
  errorCode?: string
}

export interface PaymentCallback {
  gateway: PaymentGatewayType
  transactionId: string
  orderId: string
  status: 'success' | 'failed' | 'pending'
  amount: number
  signature?: string
  data: Record<string, any>
}

export interface PaymentGatewayConfig {
  name: string
  displayName: string
  enabled: boolean
  testMode: boolean
  publicKey?: string
  merchantId?: string
  supportedCurrencies: string[]
  minAmount?: number
  maxAmount?: number
}

export interface PaymentError extends Error {
  code: string
  gateway: PaymentGatewayType
  transactionId?: string
  details?: any
}

export interface CreatePaymentDto {
  orderId: string
  amount: number
  currency: string
  gateway: PaymentGatewayType
  returnUrl: string
  cancelUrl: string
  metadata?: Record<string, any>
}
