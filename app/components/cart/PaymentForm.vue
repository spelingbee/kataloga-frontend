<template>
  <div class="payment-form">
    <label class="form-label">
      {{ $t('payment.selectMethod') }} *
    </label>
    
    <div class="payment-methods">
      <!-- Stripe / Credit Card -->
      <button
        type="button"
        :class="['payment-method', localPaymentInfo.method === 'STRIPE' ? 'active' : '']"
        @click="setPaymentMethod('STRIPE')"
      >
        <div class="method-icon">
          <BaseIcon name="credit-card" size="lg" />
        </div>
        <div class="method-info">
          <span class="method-name">{{ $t('payment.methods.STRIPE') }}</span>
          <span class="method-hint">{{ $t('payment.methods.STRIPE_HINT') }}</span>
        </div>
        <div class="method-check">
          <div v-if="localPaymentInfo.method === 'STRIPE'" class="check-dot" />
        </div>
      </button>

      <!-- Transfer / MBank -->
      <button
        type="button"
        :class="['payment-method', localPaymentInfo.method === 'TRANSFER' ? 'active' : '']"
        @click="setPaymentMethod('TRANSFER')"
      >
        <div class="method-icon">
          <BaseIcon name="wallet" size="lg" />
        </div>
        <div class="method-info">
          <span class="method-name">{{ $t('payment.methods.TRANSFER') }}</span>
          <span class="method-hint">{{ $t('payment.methods.TRANSFER_HINT') }}</span>
        </div>
        <div class="method-check">
          <div v-if="localPaymentInfo.method === 'TRANSFER'" class="check-dot" />
        </div>
      </button>

      <!-- Cash -->
      <button
        type="button"
        :class="['payment-method', localPaymentInfo.method === 'CASH' ? 'active' : '']"
        @click="setPaymentMethod('CASH')"
      >
        <div class="method-icon">
          <BaseIcon name="banknotes" size="lg" />
        </div>
        <div class="method-info">
          <span class="method-name">{{ $t('payment.methods.CASH') }}</span>
          <span class="method-hint">{{ $t('payment.methods.CASH_HINT') }}</span>
        </div>
        <div class="method-check">
          <div v-if="localPaymentInfo.method === 'CASH'" class="check-dot" />
        </div>
      </button>
    </div>

    <!-- Cash change details -->
    <div v-if="localPaymentInfo.method === 'CASH'" class="payment-details">
      <div class="form-group">
        <label for="cash-amount" class="form-label">
          {{ $t('payment.cashAmount') }}
        </label>
        <BaseInput
          id="cash-amount"
          v-model="localPaymentInfo.cashAmount"
          type="number"
          :placeholder="$t('payment.cashAmountPlaceholder')"
          min="0"
          step="1"
          @input="updatePaymentInfo"
        />
      </div>
    </div>

    <!-- Stripe notice etc could be here -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Props & Emits
interface PaymentInfo {
  method: 'CASH' | 'TRANSFER' | 'STRIPE'
  cashAmount?: string
}

interface Props {
  modelValue: PaymentInfo
  errors?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: PaymentInfo]
  validate: [errors: Record<string, string>]
}>()

// Local state
const localPaymentInfo = ref<PaymentInfo>({ 
  method: 'CASH',
  ...props.modelValue 
})

const errors = reactive<Record<string, string>>({ ...props.errors })

// Methods
const setPaymentMethod = (method: 'CASH' | 'TRANSFER' | 'STRIPE') => {
  localPaymentInfo.value.method = method
  updatePaymentInfo()
  emit('validate', { ...errors })
}

const updatePaymentInfo = () => {
  emit('update:modelValue', { ...localPaymentInfo.value })
}

// Watchers
watch(localPaymentInfo, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true })

watch(() => props.errors, (newErrors) => {
  Object.assign(errors, newErrors)
}, { deep: true })
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/radius' as *;

.payment-form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
  color: var(--text-primary);
  transition: all 0.2s ease;
  cursor: pointer;
  text-align: left;
  width: 100%;

  &:hover {
    border-color: var(--text-tertiary);
  }

  &.active {
    background: rgba(16, 185, 129, 0.1);
    border-color: var(--color-success);
    
    .method-icon {
      color: var(--color-success);
    }

    .method-check {
      border-color: var(--color-success);
    }
  }
}

.method-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.method-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.method-name {
  font-weight: 600;
  font-size: 1rem;
}

.method-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.method-check {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-dot {
  width: 10px;
  height: 10px;
  background: var(--color-success);
  border-radius: 50%;
}

.payment-details {
  padding: $space-4;
  background: var(--bg-tertiary);
  border-radius: $radius-lg;
  border: 1px solid var(--border-primary);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}
</style>

