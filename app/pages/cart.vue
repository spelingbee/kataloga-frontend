<template>
  <div class="cart-view">
    <div class="cart-view__header">
      <BaseButton variant="ghost" @click="$router.go(-1)">
        <BaseIcon name="arrow-left" size="md" />
      </BaseButton>
      <h1 class="cart-view__title">Your Cart</h1>
    </div>

    <div v-if="cartStore.isEmpty" class="cart-view__empty">
      <p>Your cart is empty.</p>
      <BaseButton @click="$router.push('/menu')">
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
        :delivery-fee="5"
        show-delivery-fee
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import CartItem from '~/components/cart/CartItem.vue'
import CartSummary from '~/components/cart/CartSummary.vue'

const cartStore = useCartStore()

const updateQuantity = (menuItemId: string, quantity: number, customizations?: Record<string, any>) => {
  cartStore.updateItemQuantity(menuItemId, quantity, customizations)
}

const removeItem = (menuItemId: string, customizations?: Record<string, any>) => {
  cartStore.removeItem(menuItemId, customizations)
}
</script>

<style scoped lang="scss">
.cart-view {
  min-height: 100vh;
  background: var(--bg-secondary);
}

.cart-view__header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
}

.cart-view__title {
  font-size: 20px;
  font-weight: 600;
  margin-left: 16px;
}

.cart-view__empty {
  text-align: center;
  padding: 40px;
}

.cart-view__content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100vh - 73px); /* 73px is the height of the header */
}

.cart-view__items {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
}
</style>
