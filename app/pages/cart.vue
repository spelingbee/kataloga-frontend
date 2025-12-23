<template>
  <div class="cart-page">
    <!-- Header -->
    <div class="cart-header">
      <div class="cart-header__content">
        <button class="cart-header__back" @click="$router.back()">
          <BaseIcon name="arrow-left" size="md" />
        </button>
        <h1 class="cart-header__title">Your Cart</h1>
        <button 
          v-if="!cartStore.isEmpty"
          class="cart-header__clear"
          @click="showClearConfirm = true"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Cart Content -->
    <div class="cart-content">
      <!-- Empty State -->
      <div v-if="cartStore.isEmpty" class="cart-empty">
        <div class="cart-empty__icon">
          <BaseIcon name="shopping-cart" size="xl" />
        </div>
        <h2 class="cart-empty__title">Your cart is empty</h2>
        <p class="cart-empty__text">
          Add some delicious items from our menu to get started!
        </p>
        <NuxtLink to="/menu" class="cart-empty__button">
          <BaseButton variant="primary" size="lg">
            Browse Menu
          </BaseButton>
        </NuxtLink>
      </div>

      <!-- Cart Items -->
      <div v-else class="cart-items">
        <div class="cart-items__list">
          <CartItem
            v-for="item in cartStore.items"
            :key="`${item.menuItem.id}-${JSON.stringify(item.customizations)}`"
            :cart-item="item"
            @update-quantity="updateQuantity"
            @remove="removeItem"
          />
        </div>

        <!-- Promo Code Section -->
        <div class="cart-promo">
          <div v-if="!cartStore.promoCode" class="cart-promo__input">
            <input
              v-model="promoCodeInput"
              type="text"
              placeholder="Enter promo code"
              class="cart-promo__field"
              @keyup.enter="applyPromoCode"
            />
            <button 
              class="cart-promo__apply"
              :disabled="!promoCodeInput.trim() || applyingPromo"
              @click="applyPromoCode"
            >
              {{ applyingPromo ? 'Applying...' : 'Apply' }}
            </button>
          </div>
          <div v-else class="cart-promo__applied">
            <div class="cart-promo__success">
              <BaseIcon name="check-circle" size="sm" class="text-green-500" />
              <span>Promo code "{{ cartStore.promoCode }}" applied</span>
            </div>
            <button class="cart-promo__remove" @click="removePromoCode">
              Remove
            </button>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="cart-summary">
          <div class="cart-summary__row">
            <span>Subtotal</span>
            <span>${{ cartStore.subtotal.toFixed(2) }}</span>
          </div>
          <div v-if="cartStore.discount > 0" class="cart-summary__row cart-summary__row--discount">
            <span>Discount</span>
            <span>-${{ cartStore.discount.toFixed(2) }}</span>
          </div>
          <div class="cart-summary__row">
            <span>Delivery Fee</span>
            <span>${{ cartStore.deliveryFee.toFixed(2) }}</span>
          </div>
          <div class="cart-summary__divider"></div>
          <div class="cart-summary__row cart-summary__row--total">
            <span>Total</span>
            <span>${{ cartStore.total.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Minimum Order Warning -->
        <div v-if="cartStore.remainingForMinimum > 0" class="cart-warning">
          <BaseIcon name="info-circle" size="sm" />
          <span>
            Add ${{ cartStore.remainingForMinimum.toFixed(2) }} more to reach the minimum order amount
          </span>
        </div>

        <!-- Checkout Button -->
        <div class="cart-checkout">
          <BaseButton
            variant="primary"
            size="lg"
            class="cart-checkout__button"
            :disabled="!cartStore.canCheckout || isCheckingOut"
            @click="proceedToCheckout"
          >
            <BaseIcon v-if="isCheckingOut" name="spinner" size="sm" class="animate-spin" />
            {{ isCheckingOut ? 'Processing...' : `Checkout • $${cartStore.total.toFixed(2)}` }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Clear Cart Confirmation Modal -->
    <BaseModal
      v-model="showClearConfirm"
      title="Clear Cart"
      closable
    >
      <p class="text-gray-600 mb-6">
        Are you sure you want to remove all items from your cart? This action cannot be undone.
      </p>
      <div class="flex gap-3 justify-end">
        <BaseButton variant="secondary" @click="showClearConfirm = false">
          Cancel
        </BaseButton>
        <BaseButton variant="outline" @click="clearCart">
          Clear Cart
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useNotification } from '~/composables/useNotification'
import type { CartItem as CartItemType } from '~/types'

// Page setup
definePageMeta({
  title: 'Cart - Menu Ordering App'
})

// Stores and composables
const cartStore = useCartStore()
const { showSuccess, showError } = useNotification()
const router = useRouter()

// Local state
const showClearConfirm = ref(false)
const promoCodeInput = ref('')
const applyingPromo = ref(false)
const isCheckingOut = ref(false)

// Methods
const updateQuantity = (menuItemId: string, quantity: number, customizations?: Record<string, any>) => {
  cartStore.updateQuantity(menuItemId, quantity, customizations)
}

const removeItem = (menuItemId: string, customizations?: Record<string, any>) => {
  cartStore.removeItem(menuItemId, customizations)
  showSuccess('Item Removed', 'Item has been removed from your cart')
}

const clearCart = () => {
  cartStore.clearCart()
  showClearConfirm.value = false
  showSuccess('Cart Cleared', 'All items have been removed from your cart')
}

const applyPromoCode = async () => {
  if (!promoCodeInput.value.trim()) return
  
  applyingPromo.value = true
  try {
    const result = await cartStore.applyPromoCode(promoCodeInput.value.trim())
    if (result.success) {
      showSuccess('Promo Applied', result.message)
      promoCodeInput.value = ''
    } else {
      showError('Invalid Promo Code', result.message)
    }
  } catch (error) {
    showError('Error', 'Failed to apply promo code. Please try again.')
  } finally {
    applyingPromo.value = false
  }
}

const removePromoCode = () => {
  cartStore.removePromoCode()
  showSuccess('Promo Removed', 'Promo code has been removed')
}

const proceedToCheckout = () => {
  if (!cartStore.canCheckout) return
  
  isCheckingOut.value = true
  // Navigate to checkout page
  router.push('/checkout')
}

// Initialize cart on mount
onMounted(() => {
  cartStore.restoreCart()
})
</script>

<style scoped lang="scss">
.cart-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: calc(env(safe-area-inset-bottom) + 120px);
}

.cart-header {
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  z-index: 10;
  padding: env(safe-area-inset-top) 0 0;

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
  }

  &__back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--bg-tertiary);
    }
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  &__clear {
    color: var(--color-error);
    font-size: 16px;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(220, 38, 38, 0.1);
    }
  }
}

.cart-content {
  padding: 20px;
}

.cart-empty {
  text-align: center;
  padding: 80px 20px;
  max-width: 400px;
  margin: 0 auto;

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--bg-secondary);
    color: var(--text-tertiary);
    margin-bottom: 24px;
  }

  &__title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 12px 0;
  }

  &__text {
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0 0 32px 0;
  }

  &__button {
    display: inline-block;
  }
}

.cart-items {
  max-width: 600px;
  margin: 0 auto;

  &__list {
    margin-bottom: 24px;
  }
}

.cart-promo {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;

  &__input {
    display: flex;
    gap: 12px;
  }

  &__field {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 16px;

    &::placeholder {
      color: var(--text-tertiary);
    }

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  &__apply {
    padding: 12px 20px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--color-primary-dark);
    }

    &:disabled {
      background: var(--color-neutral-300);
      cursor: not-allowed;
    }
  }

  &__applied {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__success {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-success);
    font-weight: 500;
  }

  &__remove {
    color: var(--color-error);
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(220, 38, 38, 0.1);
    }
  }
}

.cart-summary {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    color: var(--text-primary);

    &--discount {
      color: var(--color-success);
    }

    &--total {
      font-size: 18px;
      font-weight: 600;
      padding-top: 16px;
    }
  }

  &__divider {
    height: 1px;
    background: var(--border-primary);
    margin: 12px 0;
  }
}

.cart-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  color: var(--color-warning);
  font-size: 14px;
  margin-bottom: 20px;
}

.cart-checkout {
  &__button {
    width: 100%;
    height: 56px;
    font-size: 18px;
    font-weight: 600;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
}

// Mobile optimizations
@media (max-width: 640px) {
  .cart-content {
    padding: 16px;
  }

  .cart-empty {
    padding: 60px 16px;

    &__title {
      font-size: 20px;
    }
  }

  .cart-promo {
    padding: 16px;

    &__input {
      flex-direction: column;
      gap: 8px;
    }

    &__field {
      font-size: 16px; // Prevent zoom on iOS
    }
  }

  .cart-summary {
    padding: 16px;
  }
}
</style>