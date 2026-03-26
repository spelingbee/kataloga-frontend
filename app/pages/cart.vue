<template>
  <div class="cart-view">
    <div class="cart-view__header">
      <BaseButton variant="ghost" @click="router.go(-1)">
        <BaseIcon name="arrow-left" size="md" />
      </BaseButton>
      <h1 class="cart-view__title">Your Cart</h1>
    </div>

    <div v-if="cartStore.isEmpty" class="cart-view__empty">
      <p>Your cart is empty.</p>
      <BaseButton @click="router.push('/menu')">
        Continue Shopping
      </BaseButton>
    </div>

    <div v-else class="cart-view__content">
      <div class="cart-view__items">
        <CartItem
          v-for="item in cartStore.items"
          :key="item.menuItem.id"
          :cart-item="item"
          @update-quantity="updateQuantity"
          @remove="removeItem"
        />
      </div>

      <CartSummary
        :subtotal="cartStore.subtotal"
        :total="cartStore.total"
        :item-count="cartStore.itemCount"
        :delivery-fee="cartStore.deliveryFee"
        show-delivery-fee
        @checkout="handleCheckout"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import CartItem from '~/components/cart/CartItem.vue'
import CartSummary from '~/components/cart/CartSummary.vue'

const cartStore = useCartStore()
const router = useRouter()

const updateQuantity = (menuItemId: string, quantity: number, customizations?: Record<string, any>) => {
  cartStore.updateQuantity(menuItemId, quantity, customizations)
}

const removeItem = (menuItemId: string, customizations?: Record<string, any>) => {
  cartStore.removeItem(menuItemId, customizations)
}

const handleCheckout = () => {
  router.push('/checkout')
}
</script>

<style scoped lang="scss">
@use '../assets/scss/tokens/spacing' as *;
@use '../assets/scss/tokens/typography' as *;
@use '../assets/scss/tokens/colors' as *;

.cart-view {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.cart-view__header {
  display: flex;
  align-items: center;
  padding: $space-4;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
}

.cart-view__title {
  font-size: $text-xl;
  font-weight: $font-semibold;
  margin-left: $space-4;
}

.cart-view__empty {
  text-align: center;
  padding: $space-10;
}

.cart-view__content {
  display: flex;
  flex-direction: column;
  /* Natural height */
  min-height: calc(100vh - 73px);
}

.cart-view__items {
  /* flex: 1; Removed to prevent "Abyss" - summary should follow items directly */
  width: 100%;
  overflow-y: visible;
  padding: $space-4;
}
</style>
