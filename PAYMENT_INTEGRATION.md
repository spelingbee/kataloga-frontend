# Payment Gateway Integration

This document describes the payment gateway integration for the customer frontend ordering system.

## Overview

The payment system supports multiple payment gateways:
- **Elsom** - Local Kyrgyz payment gateway
- **O! Money** - Mobile payment service
- **Mega Pay** - Local payment processor
- **Stripe** - International card payments
- **Telegram Payments** - For Telegram Web App users
- **Cash** - Cash on delivery/pickup

## Architecture

### Components

1. **Base Gateway** (`base-gateway.ts`)
   - Abstract class defining the payment gateway interface
   - Common validation and configuration methods

2. **Gateway Implementations**
   - `elsom-gateway.ts` - Elsom integration
   - `o-gateway.ts` - O! Money integration
   - `mega-gateway.ts` - Mega Pay integration
   - `stripe-gateway.ts` - Stripe integration
   - `telegram-gateway.ts` - Telegram Payments integration

3. **Payment Service** (`payment.service.ts`)
   - Manages all payment gateways
   - Provides unified interface for payment operations
   - Handles gateway selection and routing

4. **Composable** (`usePayment.ts`)
   - Vue composable for easy payment integration
   - Reactive state management
   - Error handling

5. **UI Components**
   - `PaymentMethodSelector.vue` - Payment method selection UI
   - `payment/callback.vue` - Payment callback handler page

## Usage

### Basic Payment Flow

```typescript
import { usePayment } from '~/composables/usePayment'

const { 
  availableGateways, 
  createPayment, 
  processPayment,
  loading,
  error 
} = usePayment()

// Create a payment
const session = await createPayment({
  orderId: 'ORDER-123',
  amount: 1500,
  currency: 'KGS',
  gateway: 'elsom',
  returnUrl: 'https://example.com/payment/callback',
  cancelUrl: 'https://example.com/checkout',
  metadata: {
    customerName: 'John Doe',
    customerEmail: 'john@example.com'
  }
})

// Or process payment directly (creates and redirects)
await processPayment({
  orderId: 'ORDER-123',
  amount: 1500,
  currency: 'KGS',
  gateway: 'stripe',
  returnUrl: 'https://example.com/payment/callback',
  cancelUrl: 'https://example.com/checkout'
})
```

### Using Payment Method Selector

```vue
<template>
  <PaymentMethodSelector
    v-model="paymentMethod"
    :order-total="1500"
  />
</template>

<script setup>
import { ref } from 'vue'

const paymentMethod = ref({
  type: 'online',
  gateway: 'elsom'
})
</script>
```

### Handling Payment Callbacks

Payment callbacks are automatically handled by the `/payment/callback` page. The page:
1. Extracts payment data from query parameters
2. Verifies the payment with the gateway
3. Displays success/failure message
4. Redirects to order page or allows retry

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Elsom
NUXT_PUBLIC_PAYMENT_ELSOM_ENABLED=true
NUXT_PUBLIC_PAYMENT_ELSOM_TEST_MODE=true
NUXT_PUBLIC_PAYMENT_ELSOM_PUBLIC_KEY=your_key
NUXT_PUBLIC_PAYMENT_ELSOM_MERCHANT_ID=your_merchant_id

# O! Money
NUXT_PUBLIC_PAYMENT_O_ENABLED=true
NUXT_PUBLIC_PAYMENT_O_TEST_MODE=true
NUXT_PUBLIC_PAYMENT_O_PUBLIC_KEY=your_key
NUXT_PUBLIC_PAYMENT_O_MERCHANT_ID=your_merchant_id

# Mega Pay
NUXT_PUBLIC_PAYMENT_MEGA_ENABLED=true
NUXT_PUBLIC_PAYMENT_MEGA_TEST_MODE=true
NUXT_PUBLIC_PAYMENT_MEGA_PUBLIC_KEY=your_key
NUXT_PUBLIC_PAYMENT_MEGA_MERCHANT_ID=your_merchant_id

# Stripe
NUXT_PUBLIC_PAYMENT_STRIPE_ENABLED=true
NUXT_PUBLIC_PAYMENT_STRIPE_TEST_MODE=true
NUXT_PUBLIC_PAYMENT_STRIPE_PUBLIC_KEY=pk_test_...

# Telegram Payments
NUXT_PUBLIC_PAYMENT_TELEGRAM_ENABLED=true
NUXT_PUBLIC_PAYMENT_TELEGRAM_TEST_MODE=true
```

## Gateway-Specific Implementation

### Elsom

Elsom requires:
- Merchant ID
- Public API key
- Signature verification using merchant secret (server-side)

### O! Money

O! Money requires:
- Merchant ID
- API key
- Transaction reference

### Mega Pay

Mega Pay supports:
- Direct redirect to payment page
- Form-based payment submission
- Webhook callbacks

### Stripe

Stripe integration uses:
- Payment Intents API
- Client-side confirmation with Stripe.js
- Server-side payment intent creation

**Note**: Stripe requires `@stripe/stripe-js` package:
```bash
pnpm add @stripe/stripe-js
```

### Telegram Payments

Telegram Payments:
- Only available in Telegram Web App
- Uses Telegram Bot API for invoice creation
- Handles payment via Telegram native UI

## Security

### Signature Verification

All payment callbacks should verify signatures to prevent tampering:

```typescript
verifySignature(data: Record<string, any>, signature: string): boolean {
  // Implement gateway-specific signature verification
  // Example: HMAC-SHA256 of sorted parameters
  const sortedParams = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('&')
  
  const expectedSignature = crypto
    .createHmac('sha256', merchantSecret)
    .update(sortedParams)
    .digest('hex')
  
  return signature === expectedSignature
}
```

### Best Practices

1. **Never store sensitive data** - Don't store card numbers or CVV
2. **Use HTTPS** - All payment pages must use HTTPS
3. **Verify callbacks** - Always verify payment gateway signatures
4. **Server-side validation** - Validate payment status on server
5. **PCI compliance** - Follow PCI DSS guidelines for card payments
6. **Test mode** - Use test mode for development
7. **Error handling** - Implement proper error handling and logging
8. **Timeout handling** - Handle payment timeouts gracefully

## Error Handling

The payment system includes comprehensive error handling:

```typescript
import { getPaymentErrorMessage, isRetryableError } from '~/utils/payment-errors'

try {
  await processPayment(dto)
} catch (error) {
  const message = getPaymentErrorMessage(error)
  const canRetry = isRetryableError(error)
  
  // Show error to user
  console.error(message)
  
  if (canRetry) {
    // Show retry button
  }
}
```

## Testing

### Test Mode

All gateways support test mode. In test mode:
- No real money is charged
- Test credentials are used
- Signature verification may be relaxed

### Test Cards (Stripe)

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
```

### Mock Responses

For development, the server API endpoints return mock data when gateway credentials are not configured.

## Future Enhancements

1. **Recurring payments** - Subscription support
2. **Refunds** - Automated refund processing
3. **Split payments** - Multiple payment methods per order
4. **Saved cards** - Tokenized card storage
5. **3D Secure** - Enhanced security for card payments
6. **Apple Pay / Google Pay** - Digital wallet support
7. **QR code payments** - QR-based payment methods
8. **Installments** - Buy now, pay later options

## Support

For payment gateway integration issues:
1. Check gateway documentation
2. Verify API credentials
3. Check test mode settings
4. Review server logs
5. Contact gateway support

## References

- [Elsom API Documentation](https://elsom.kg/api-docs)
- [O! Money API Documentation](https://o.kg/developers)
- [Mega Pay Documentation](https://megapay.kg/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Telegram Payments](https://core.telegram.org/bots/payments)
