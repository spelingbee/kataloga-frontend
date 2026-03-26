<template>
  <BaseModal
    v-model="show"
    title="Bank Transfer Payment"
    :size="MODAL_SIZES.MD"
  >
    <div class="transfer-payment-modal">
      <!-- WhatsApp Phone Display -->
      <div class="transfer-payment-modal__phone-section">
        <div class="transfer-payment-modal__phone-label">
          Send payment receipt to WhatsApp:
        </div>
        <div class="transfer-payment-modal__phone-display">
          <div class="transfer-payment-modal__phone-icon">
            <BaseIcon name="smartphone" size="lg" />
          </div>
          <div class="transfer-payment-modal__phone-number">
            {{ whatsappPhone || 'Not available' }}
          </div>
          <button
            v-if="whatsappPhone"
            class="transfer-payment-modal__copy-button"
            @click="copyPhoneNumber"
          >
            <BaseIcon name="copy" size="sm" />
          </button>
        </div>
      </div>

      <!-- Instructions -->
      <div class="transfer-payment-modal__instructions">
        <h4 class="transfer-payment-modal__instructions-title">
          Payment Instructions:
        </h4>
        <ol class="transfer-payment-modal__instructions-list">
          <li>Make a bank transfer for the order amount</li>
          <li>Take a screenshot of the transfer receipt</li>
          <li>Send the receipt to the WhatsApp number above</li>
          <li>Click "I Paid" below to confirm your payment</li>
        </ol>
      </div>

      <!-- Order Summary -->
      <div class="transfer-payment-modal__summary">
        <div class="transfer-payment-modal__summary-row">
          <span class="transfer-payment-modal__summary-label">Order Total:</span>
          <span class="transfer-payment-modal__summary-amount">{{ formatAmount(orderTotal) }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="transfer-payment-modal__actions">
        <BaseButton
          variant="secondary"
          @click="$emit('close')"
        >
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          :disabled="!whatsappPhone"
          @click="confirmPayment"
        >
          I Paid
        </BaseButton>
      </div>

      <!-- Copy Success Toast -->
      <div
        v-if="showCopySuccess"
        class="transfer-payment-modal__toast"
      >
        Phone number copied to clipboard!
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MODAL_SIZES } from '~/types/ui'

interface Props {
  modelValue: boolean
  whatsappPhone?: string
  orderTotal: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  close: []
}>()

const show = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const showCopySuccess = ref(false)

const copyPhoneNumber = async () => {
  if (!props.whatsappPhone) return
  
  try {
    await navigator.clipboard.writeText(props.whatsappPhone)
    showCopySuccess.value = true
    setTimeout(() => {
      showCopySuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy phone number:', error)
  }
}

const confirmPayment = () => {
  emit('confirm')
}

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KGS'
  }).format(amount)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.transfer-payment-modal {
  padding: $space-6;
}

.transfer-payment-modal__phone-section {
  margin-bottom: $space-8;
}

.transfer-payment-modal__phone-label {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-secondary);
  margin-bottom: $space-4;
}

.transfer-payment-modal__phone-display {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-6;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-card;
}

.transfer-payment-modal__phone-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  border-radius: $radius-md;
  flex-shrink: 0;
}

.transfer-payment-modal__phone-number {
  flex: 1;
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  font-family: monospace;
}

.transfer-payment-modal__copy-button {
  padding: $space-2;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-sm;
  cursor: pointer;
  transition: $transition-base-ease;
  color: var(--text-secondary);

  &:hover {
    background: var(--bg-secondary);
    color: var(--color-primary);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.transfer-payment-modal__instructions {
  margin-bottom: $space-8;
}

.transfer-payment-modal__instructions-title {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-4;
}

.transfer-payment-modal__instructions-list {
  padding-left: $space-6;
  margin: 0;
}

.transfer-payment-modal__instructions-list li {
  font-size: $text-sm;
  color: var(--text-secondary);
  line-height: $leading-relaxed;
  margin-bottom: $space-2;

  &:last-child {
    margin-bottom: 0;
  }
}

.transfer-payment-modal__summary {
  padding: $space-6;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-card;
  margin-bottom: $space-8;
}

.transfer-payment-modal__summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transfer-payment-modal__summary-label {
  font-size: $text-base;
  font-weight: $font-medium;
  color: var(--text-primary);
}

.transfer-payment-modal__summary-amount {
  font-size: $text-lg;
  font-weight: $font-bold;
  color: var(--color-primary);
}

.transfer-payment-modal__actions {
  display: flex;
  gap: $space-4;
  justify-content: flex-end;
}

.transfer-payment-modal__toast {
  position: fixed;
  bottom: $space-6;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-success);
  color: white;
  padding: $space-3 $space-6;
  border-radius: $radius-full;
  font-size: $text-sm;
  font-weight: $font-medium;
  box-shadow: $shadow-lg;
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (max-width: 768px) {
  .transfer-payment-modal {
    padding: $space-4;
  }

  .transfer-payment-modal__phone-display {
    flex-direction: column;
    text-align: center;
    gap: $space-3;
  }

  .transfer-payment-modal__phone-number {
    font-size: $text-base;
  }

  .transfer-payment-modal__actions {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .transfer-payment-modal__toast {
    animation: none;
  }
  
  .transfer-payment-modal__copy-button {
    transition: none;
  }
}
</style>