<template>
  <div class="payment-method-selector">
    <h3 class="payment-method-selector__title">Select Payment Method</h3>

    <!-- Payment Type Selection -->
    <div class="payment-method-selector__types">
      <button
        class="payment-method-selector__type"
        :class="{ 'payment-method-selector__type--active': selectedType === 'cash' }"
        @click="selectType('cash')"
      >
        <BaseIcon name="banknote" size="md" />
        <span>Cash</span>
      </button>
      <button
        class="payment-method-selector__type"
        :class="{ 'payment-method-selector__type--active': selectedType === 'online' }"
        @click="selectType('online')"
      >
        <BaseIcon name="credit-card" size="md" />
        <span>Online Payment</span>
      </button>
    </div>

    <!-- Cash Payment Options -->
    <div v-if="selectedType === 'cash'" class="payment-method-selector__cash">
      <label class="payment-method-selector__label">
        Change from (optional)
      </label>
      <p class="payment-method-selector__help">
        Enter the cash denomination you'll pay with if you need change
      </p>
      <input
        v-model.number="changeFrom"
        type="number"
        class="payment-method-selector__input"
        :class="{ 'payment-method-selector__input--error': changeFromError }"
        placeholder="e.g., 1000"
        min="0"
        @input="handleChangeFromInput"
      />
      <p v-if="changeFromError" class="payment-method-selector__error">
        {{ changeFromError }}
      </p>
      <p v-if="changeAmount > 0" class="payment-method-selector__change">
        Change: {{ formatAmount(changeAmount) }}
      </p>
    </div>

    <!-- Online Payment Gateways -->
    <div v-if="selectedType === 'online'" class="payment-method-selector__gateways">
      <!-- Telegram Payments (if in Telegram) -->
      <button
        v-if="isTelegram && availableGateways.includes('telegram')"
        class="payment-method-selector__gateway"
        :class="{ 'payment-method-selector__gateway--active': selectedGateway === 'telegram' }"
        @click="selectGateway('telegram')"
      >
        <div class="payment-method-selector__gateway-icon">
          <BaseIcon name="send" size="md" />
        </div>
        <div class="payment-method-selector__gateway-info">
          <span class="payment-method-selector__gateway-name">Telegram Payments</span>
          <span class="payment-method-selector__gateway-desc">Pay via Telegram</span>
        </div>
      </button>

      <!-- Elsom -->
      <button
        v-if="availableGateways.includes('elsom')"
        class="payment-method-selector__gateway"
        :class="{ 'payment-method-selector__gateway--active': selectedGateway === 'elsom' }"
        @click="selectGateway('elsom')"
      >
        <div class="payment-method-selector__gateway-icon">
          <BaseIcon name="credit-card" size="md" />
        </div>
        <div class="payment-method-selector__gateway-info">
          <span class="payment-method-selector__gateway-name">Elsom</span>
          <span class="payment-method-selector__gateway-desc">Pay with Elsom wallet</span>
        </div>
      </button>

      <!-- O! -->
      <button
        v-if="availableGateways.includes('o')"
        class="payment-method-selector__gateway"
        :class="{ 'payment-method-selector__gateway--active': selectedGateway === 'o' }"
        @click="selectGateway('o')"
      >
        <div class="payment-method-selector__gateway-icon">
          <BaseIcon name="smartphone" size="md" />
        </div>
        <div class="payment-method-selector__gateway-info">
          <span class="payment-method-selector__gateway-name">O!</span>
          <span class="payment-method-selector__gateway-desc">Pay with O! Money</span>
        </div>
      </button>

      <!-- Mega -->
      <button
        v-if="availableGateways.includes('mega')"
        class="payment-method-selector__gateway"
        :class="{ 'payment-method-selector__gateway--active': selectedGateway === 'mega' }"
        @click="selectGateway('mega')"
      >
        <div class="payment-method-selector__gateway-icon">
          <BaseIcon name="credit-card" size="md" />
        </div>
        <div class="payment-method-selector__gateway-info">
          <span class="payment-method-selector__gateway-name">Mega</span>
          <span class="payment-method-selector__gateway-desc">Pay with Mega Pay</span>
        </div>
      </button>

      <!-- Stripe -->
      <button
        v-if="availableGateways.includes('stripe')"
        class="payment-method-selector__gateway"
        :class="{ 'payment-method-selector__gateway--active': selectedGateway === 'stripe' }"
        @click="selectGateway('stripe')"
      >
        <div class="payment-method-selector__gateway-icon">
          <BaseIcon name="credit-card" size="md" />
        </div>
        <div class="payment-method-selector__gateway-info">
          <span class="payment-method-selector__gateway-name">Stripe</span>
          <span class="payment-method-selector__gateway-desc">Pay with card (Visa, Mastercard)</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePayment } from '~/composables/usePayment'
import { useTelegram } from '~/composables/useTelegram'
import type { PaymentMethod, PaymentGatewayType } from '~/types/payment'

interface Props {
  modelValue: PaymentMethod
  orderTotal: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: PaymentMethod]
}>()

const { availableGateways } = usePayment()
const { isTelegramWebApp } = useTelegram()

const selectedType = ref<'cash' | 'online'>(props.modelValue.type)
const selectedGateway = ref<PaymentGatewayType | undefined>(props.modelValue.gateway)
const changeFrom = ref<number | undefined>(props.modelValue.changeFrom)
const changeFromError = ref<string>('')

const isTelegram = computed(() => isTelegramWebApp.value)

const changeAmount = computed(() => {
  if (selectedType.value === 'cash' && changeFrom.value && changeFrom.value > props.orderTotal) {
    return changeFrom.value - props.orderTotal
  }
  return 0
})

const selectType = (type: 'cash' | 'online') => {
  selectedType.value = type
  changeFromError.value = ''
  
  if (type === 'online') {
    // Auto-select first available gateway
    if (isTelegram.value && availableGateways.value.includes('telegram')) {
      selectedGateway.value = 'telegram'
    } else if (availableGateways.value.length > 0) {
      selectedGateway.value = availableGateways.value[0]
    }
  } else {
    selectedGateway.value = undefined
  }
  
  emitValue()
}

const selectGateway = (gateway: PaymentGatewayType) => {
  selectedGateway.value = gateway
  emitValue()
}

const handleChangeFromInput = () => {
  changeFromError.value = ''
  
  if (changeFrom.value && changeFrom.value < props.orderTotal) {
    changeFromError.value = `Amount must be at least ${formatAmount(props.orderTotal)}`
  }
  
  emitValue()
}

const emitValue = () => {
  const value: PaymentMethod = {
    type: selectedType.value,
    gateway: selectedGateway.value,
    changeFrom: selectedType.value === 'cash' ? changeFrom.value : undefined
  }
  emit('update:modelValue', value)
}

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KGS'
  }).format(amount)
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  selectedType.value = newValue.type
  selectedGateway.value = newValue.gateway
  changeFrom.value = newValue.changeFrom
}, { deep: true })
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

.payment-method-selector__types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;
  margin-bottom: $space-8;
}

.payment-method-selector__type {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  padding: $space-6;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: $radius-card;
  cursor: pointer;
  transition: $transition-card;
  font-size: $text-base;
  font-weight: $font-medium;
  color: var(--text-secondary);
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

.payment-method-selector__type--active {
  border-color: var(--color-primary);
  background: rgba(255, 107, 53, 0.1);
  color: var(--color-primary);
  box-shadow: $shadow-md;
}

.payment-method-selector__cash {
  padding: $space-6;
  background: var(--bg-secondary);
  border-radius: $radius-card;
  border: 1px solid var(--border-primary);
}

.payment-method-selector__label {
  display: block;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.payment-method-selector__help {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin-bottom: $space-4;
}

.payment-method-selector__input {
  width: 100%;
  padding: $input-padding;
  border: 1px solid var(--border-primary);
  border-radius: $radius-input;
  font-size: $text-base;
  font-family: $font-primary;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: $transition-base-ease;
  min-height: $touch-target-min;

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-color: var(--color-primary);
  }

  &::placeholder {
    color: var(--text-tertiary);
  }
}

.payment-method-selector__input--error {
  border-color: var(--color-error);
}

.payment-method-selector__error {
  font-size: $text-sm;
  color: var(--color-error);
  margin-top: $space-1;
}

.payment-method-selector__change {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--color-success);
  margin-top: $space-4;
}

.payment-method-selector__gateways {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.payment-method-selector__gateway {
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

.payment-method-selector__gateway--active {
  border-color: var(--color-primary);
  background: rgba(255, 107, 53, 0.1);
  box-shadow: $shadow-md;
}

.payment-method-selector__gateway-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: $radius-md;
  color: var(--color-primary);
  box-shadow: $shadow-sm;
}

.payment-method-selector__gateway-info {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.payment-method-selector__gateway-name {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--text-primary);
}

.payment-method-selector__gateway-desc {
  font-size: $text-sm;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .payment-method-selector__types {
    grid-template-columns: 1fr;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .payment-method-selector__type,
  .payment-method-selector__gateway {
    transition: none;
    
    &:hover {
      transform: none;
    }
  }
}
</style>
