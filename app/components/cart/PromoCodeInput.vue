<template>
  <div class="promo-code-input">
    <div v-if="!appliedCode" class="promo-code-input__form">
      <BaseInput
        v-model="promoCode"
        type="text"
        :placeholder="$t('cart.promoPlaceholder')"
        :disabled="loading"
        class="promo-code-input__field"
        @keyup.enter="applyCode"
      />
      <BaseButton
        variant="secondary"
        size="md"
        :loading="loading"
        :disabled="!promoCode.trim() || loading"
        class="promo-code-input__button"
        @click="applyCode"
      >
        {{ $t('cart.apply') }}
      </BaseButton>
    </div>

    <div v-else class="promo-code-input__applied">
      <div class="promo-code-input__applied-content">
        <BaseIcon name="check-circle" size="sm" class="promo-code-input__check-icon" />
        <AppText size="body-sm" class="promo-code-input__applied-text">
          {{ appliedCode }} {{ $t('cart.applied') }}
        </AppText>
      </div>
      <BaseButton
        variant="ghost"
        size="sm"
        :disabled="loading"
        class="promo-code-input__remove-button"
        @click="removeCode"
      >
        <BaseIcon name="x" size="sm" />
      </BaseButton>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="promo-code-input__error">
      <AppText size="caption" class="promo-code-input__error-text">
        {{ errorMessage }}
      </AppText>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="promo-code-input__success">
      <AppText size="caption" class="promo-code-input__success-text">
        {{ successMessage }}
      </AppText>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useI18n } from 'vue-i18n'
import AppText from '../base/AppText.vue'

// I18n
const { t } = useI18n()

// Store
const cartStore = useCartStore()

// State
const promoCode = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Computed
const appliedCode = computed(() => cartStore.promoCode)

// Methods
const applyCode = async () => {
  if (!promoCode.value.trim()) return

  errorMessage.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    const result = await cartStore.applyPromoCode(promoCode.value)
    
    if (result.success) {
      successMessage.value = result.message
      promoCode.value = ''
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message
    }
  } catch (error: any) {
    errorMessage.value = error.message || t('cart.applyError')
  } finally {
    loading.value = false
  }
}

const removeCode = () => {
  cartStore.removePromoCode()
  errorMessage.value = ''
  successMessage.value = ''
}
</script>

<style lang="scss" scoped>


.promo-code-input {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  &__form {
    display: flex;
    gap: $space-2;
  }

  &__field {
    flex: 1;
  }

  &__button {
    flex-shrink: 0;
  }

  &__applied {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-2 $space-4;
    background-color: rgba(var(--color-success), 0.1);
    border: 1px solid rgba(var(--color-success), 0.3);
    border-radius: $radius-md;
  }

  &__applied-content {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  &__check-icon {
    color: var(--color-success);
  }

  &__applied-text {
    color: var(--color-success);
    font-weight: $font-medium;
  }

  &__remove-button {
    color: $color-neutral-20;
    
    &:hover {
      color: $color-error;
    }
  }

  &__error {
    padding: $space-1 $space-2;
    background-color: rgba($color-error, 0.1);
    border: 1px solid rgba($color-error, 0.3);
    border-radius: $radius-sm;
  }

  &__error-text {
    color: $color-error;
  }

  &__success {
    padding: $space-1 $space-2;
    background-color: rgba(var(--color-success), 0.1);
    border: 1px solid rgba(var(--color-success), 0.3);
    border-radius: $radius-sm;
  }

  &__success-text {
    color: var(--color-success);
  }
}
</style>
