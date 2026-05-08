<template>
  <Modal
    :is-open="isOpen"
    :title="$t('cart.validation.title')"
    @close="handleClose"
  >
    <div class="cart-validation-modal">
      <!-- Removed Items Section -->
      <div v-if="removedItems.length > 0" class="cart-validation-modal__section">
        <div class="cart-validation-modal__icon cart-validation-modal__icon--error">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 class="cart-validation-modal__heading">{{ $t('cart.validation.itemsRemoved') }}</h3>
        <p class="cart-validation-modal__description">
          {{ $t('cart.validation.itemsRemovedDesc') }}
        </p>
        <ul class="cart-validation-modal__list">
          <li v-for="item in removedItems" :key="item.menuItem.id" class="cart-validation-modal__list-item">
            {{ item.menuItem.name }}
          </li>
        </ul>
      </div>

      <!-- Price Changes Section -->
      <div v-if="priceChanges.length > 0" class="cart-validation-modal__section">
        <div class="cart-validation-modal__icon cart-validation-modal__icon--warning">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="cart-validation-modal__heading">{{ $t('cart.validation.priceChanges') }}</h3>
        <p class="cart-validation-modal__description">
          {{ $t('cart.validation.priceChangesDesc') }}
        </p>
        <ul class="cart-validation-modal__list">
          <li v-for="change in priceChanges" :key="change.item.menuItem.id" class="cart-validation-modal__list-item">
            <span class="cart-validation-modal__item-name">{{ change.item.menuItem.name }}</span>
            <span class="cart-validation-modal__price-change">
              <span class="cart-validation-modal__old-price">{{ $n(change.oldPrice, 'currency') }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="cart-validation-modal__arrow">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span class="cart-validation-modal__new-price" :class="{ 'cart-validation-modal__new-price--increase': change.newPrice > change.oldPrice }">
                {{ $n(change.newPrice, 'currency') }}
              </span>
            </span>
          </li>
        </ul>
      </div>

      <!-- Acknowledgment Message -->
      <div class="cart-validation-modal__acknowledgment">
        <p class="cart-validation-modal__acknowledgment-text">
          {{ $t('cart.validation.reviewBeforePayment') }}
        </p>
      </div>

      <!-- Actions -->
      <div class="cart-validation-modal__actions">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          {{ $t('cart.validation.reviewCart') }}
        </Button>
        <Button
          variant="primary"
          @click="handleAcknowledge"
        >
          {{ $t('cart.validation.continueToPayment') }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from '~/components/base/Modal.vue'
import Button from '~/components/base/Button.vue'
import type { CartItem } from '~/types'

interface Props {
  isOpen: boolean
  removedItems: CartItem[]
  priceChanges: Array<{
    item: CartItem
    oldPrice: number
    newPrice: number
  }>
}

interface Emits {
  (e: 'close'): void
  (e: 'acknowledge'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClose = () => {
  emit('close')
}

const handleAcknowledge = () => {
  emit('acknowledge')
}
</script>

<style scoped lang="scss">


.cart-validation-modal {
  padding: $space-4;
}

.cart-validation-modal__section {
  margin-bottom: $space-8;

  &:last-of-type {
    margin-bottom: $space-6;
  }
}

.cart-validation-modal__icon {
  width: 48px;
  height: 48px;
  margin: 0 auto $space-4;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
  }
}

.cart-validation-modal__icon--error {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.cart-validation-modal__icon--warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.cart-validation-modal__heading {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-2;
  text-align: center;
}

.cart-validation-modal__description {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin-bottom: $space-4;
  text-align: center;
}

.cart-validation-modal__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.cart-validation-modal__list-item {
  padding: $space-2 $space-4;
  background-color: $color-neutral-20;
  border-radius: $radius-md;
  margin-bottom: $space-2;
  font-size: $text-sm;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:last-child {
    margin-bottom: 0;
  }
}

.cart-validation-modal__item-name {
  flex: 1;
}

.cart-validation-modal__price-change {
  display: flex;
  align-items: center;
  gap: $space-1;
  font-weight: $font-medium;
}

.cart-validation-modal__old-price {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.cart-validation-modal__arrow {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.cart-validation-modal__new-price {
  color: var(--color-success);

  &--increase {
    color: var(--color-error);
  }
}

.cart-validation-modal__acknowledgment {
  padding: $space-4;
  background-color: $color-neutral-20;
  border-radius: $radius-md;
  margin-bottom: $space-6;
}

.cart-validation-modal__acknowledgment-text {
  font-size: $text-sm;
  color: var(--text-primary);
  text-align: center;
  margin: 0;
}

.cart-validation-modal__actions {
  display: flex;
  gap: $space-4;
  justify-content: flex-end;

  @media (max-width: $breakpoint-sm) {
    flex-direction: column-reverse;

    button {
      width: 100%;
    }
  }
}
</style>
