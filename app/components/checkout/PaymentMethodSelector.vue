<template>
  <div class="payment-method-selector">
    <h3 class="payment-method-selector__title">{{ $t('payment.selectMethod') }}</h3>

    <!-- Payment Method Selection -->
    <div class="payment-method-selector__methods">

      <!-- Cash Payment -->
      <button
        class="payment-method-selector__method"
        :class="{ 'payment-method-selector__method--active': selectedMethod === 'CASH' }"
        @click="selectMethod('CASH')"
      >
        <div class="payment-method-selector__method-icon">
          <BaseIcon name="banknotes" size="md" />
        </div>
        <div class="payment-method-selector__method-info">
          <span class="payment-method-selector__method-name">{{ $t('payment.methods.CASH') }}</span>
          <span class="payment-method-selector__method-desc">{{ $t('payment.methods.CASH_DESC') }}</span>
        </div>
        <div v-if="selectedMethod === 'CASH'" class="payment-method-selector__method-check">
          <BaseIcon name="check" size="sm" />
        </div>
      </button>

      <!-- Transfer Payment -->
      <button
        class="payment-method-selector__method"
        :class="{ 'payment-method-selector__method--active': selectedMethod === 'TRANSFER' }"
        @click="selectMethod('TRANSFER')"
      >
        <div class="payment-method-selector__method-icon">
          <BaseIcon name="phone" size="md" />
        </div>
        <div class="payment-method-selector__method-info">
          <span class="payment-method-selector__method-name">{{ $t('payment.methods.TRANSFER') }}</span>
          <span class="payment-method-selector__method-desc">{{ $t('payment.methods.TRANSFER_DESC') }}</span>
        </div>
        <div v-if="selectedMethod === 'TRANSFER'" class="payment-method-selector__method-check">
          <BaseIcon name="check" size="sm" />
        </div>
      </button>

    </div>

    <!-- Optional: Payment Info Banner -->
    <div v-if="selectedMethodInfo" class="payment-method-selector__info-banner">
      <BaseIcon name="info" size="md" class="info-icon" />
      <div class="info-content">
        <p class="info-text">{{ selectedMethodInfo.bannerText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

type PaymentMethodType = 'CASH' | 'TRANSFER'

interface Props {
  modelValue: PaymentMethodType
  orderTotal: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: PaymentMethodType]
}>()

const { t } = useI18n()
const selectedMethod = ref<PaymentMethodType>(props.modelValue || 'CASH')

const selectMethod = (method: PaymentMethodType) => {
  selectedMethod.value = method
  emit('update:modelValue', method)
}

const selectedMethodInfo = computed(() => {
  if (selectedMethod.value === 'CASH') {
    return { bannerText: t('payment.methods.CASH_INFO') }
  }
  if (selectedMethod.value === 'TRANSFER') {
    return { bannerText: t('payment.methods.TRANSFER_INFO') }
  }
  return null
})

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
  padding: $space-5;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  min-height: $touch-target-min;
  position: relative;

  &:hover {
    border-color: var(--color-primary);
    background: var(--bg-tertiary);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }
}

.payment-method-selector__method--active {
  border-color: var(--color-primary);
  background: rgba(255, 107, 53, 0.05) !important;
  border-width: 2px;
}

.payment-method-selector__method-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: $radius-md;
  color: var(--color-primary);
  flex-shrink: 0;
}

.payment-method-selector__method-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.payment-method-selector__method-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.payment-method-selector__method-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.payment-method-selector__method-check {
  color: var(--color-primary);
  background: rgba(255, 107, 53, 0.1);
  padding: 4px;
  border-radius: 50%;
}

.payment-method-selector__info-banner {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  margin-top: $space-6;
  padding: $space-4;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-lg;
  color: var(--text-secondary);
  font-size: $text-sm;
  line-height: $leading-relaxed;

  .info-icon {
    color: var(--color-primary);
    margin-top: 2px;
    flex-shrink: 0;
  }

  .info-content {
    flex: 1;
  }

  .info-text {
    margin: 0;
  }
}

// Mobile overrides
@media (max-width: 640px) {
  .payment-method-selector__method {
    padding: $space-4;
  }
}
</style>
