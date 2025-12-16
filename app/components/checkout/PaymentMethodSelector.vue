<template>
  <div class="payment-method-selector">
    <h3 class="payment-method-selector__title">Select Payment Method</h3>

    <!-- Payment Method Selection -->
    <div class="payment-method-selector__methods">
      <!-- Stripe Payment -->
      <button
        class="payment-method-selector__method"
        :class="{ 'payment-method-selector__method--active': selectedMethod === 'STRIPE' }"
        @click="selectMethod('STRIPE')"
      >
        <div class="payment-method-selector__method-icon">
          <BaseIcon name="credit-card" size="md" />
        </div>
        <div class="payment-method-selector__method-info">
          <span class="payment-method-selector__method-name">Card Payment</span>
          <span class="payment-method-selector__method-desc">Pay securely with Visa, Mastercard</span>
        </div>
      </button>

      <!-- Cash Payment -->
      <button
        class="payment-method-selector__method"
        :class="{ 'payment-method-selector__method--active': selectedMethod === 'CASH' }"
        @click="selectMethod('CASH')"
      >
        <div class="payment-method-selector__method-icon">
          <BaseIcon name="banknote" size="md" />
        </div>
        <div class="payment-method-selector__method-info">
          <span class="payment-method-selector__method-name">Cash Payment</span>
          <span class="payment-method-selector__method-desc">Pay with cash on delivery</span>
        </div>
      </button>

      <!-- Transfer Payment -->
      <button
        class="payment-method-selector__method"
        :class="{ 'payment-method-selector__method--active': selectedMethod === 'TRANSFER' }"
        @click="selectMethod('TRANSFER')"
      >
        <div class="payment-method-selector__method-icon">
          <BaseIcon name="smartphone" size="md" />
        </div>
        <div class="payment-method-selector__method-info">
          <span class="payment-method-selector__method-name">Bank Transfer</span>
          <span class="payment-method-selector__method-desc">Transfer to WhatsApp and confirm</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

type PaymentMethodType = 'STRIPE' | 'CASH' | 'TRANSFER'

interface Props {
  modelValue: PaymentMethodType
  orderTotal: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: PaymentMethodType]
}>()

const selectedMethod = ref<PaymentMethodType>(props.modelValue || 'STRIPE')

const selectMethod = (method: PaymentMethodType) => {
  selectedMethod.value = method
  emit('update:modelValue', method)
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedMethod.value = newValue
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.payment-method-selector {
  width: 100%;
}

.payment-method-selector__title {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-6;
}

.payment-method-selector__methods {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.payment-method-selector__method {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-6;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: $radius-card;
  cursor: pointer;
  transition: $transition-card;
  text-align: left;
  min-height: $touch-target-min;
  box-shadow: $shadow-sm;

  &:hover {
    border-color: var(--color-primary);
    background: rgba(255, 107, 53, 0.05);
    box-shadow: $shadow-md;
    transform: translateY(-1px);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.payment-method-selector__method--active {
  border-color: var(--color-primary);
  background: rgba(255, 107, 53, 0.1);
  box-shadow: $shadow-md;
}

.payment-method-selector__method-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: $radius-md;
  color: var(--color-primary);
  box-shadow: $shadow-sm;
  flex-shrink: 0;
}

.payment-method-selector__method-info {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  flex: 1;
}

.payment-method-selector__method-name {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--text-primary);
}

.payment-method-selector__method-desc {
  font-size: $text-sm;
  color: var(--text-secondary);
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .payment-method-selector__method {
    transition: none;
    
    &:hover {
      transform: none;
    }
  }
}
</style>
