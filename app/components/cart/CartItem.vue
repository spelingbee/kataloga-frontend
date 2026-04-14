<template>
  <div class="cart-item">
    <!-- Item Image -->
    <div class="cart-item__image">
      <img
        :src="imageUrl"
        :alt="cartItem.menuItem.name"
        class="cart-item__img"
        @error="handleImageError"
      />
      <div v-if="imageError" class="cart-item__image-fallback">
        <BaseIcon name="utensils" size="md" class="text-neutral-400" />
      </div>
    </div>

    <!-- Item Details -->
    <div class="cart-item__details">
      <div class="cart-item__info">
        <h3 class="cart-item__name">{{ cartItem.menuItem.name }}</h3>
        <div class="cart-item__price">
          <AppPrice :amount="cartItem.subtotal" />
        </div>
      </div>

      <!-- Quantity Controls -->
      <div class="cart-item__controls">
        <div class="cart-item__quantity">
          <button
            class="cart-item__quantity-btn"
            :disabled="cartItem.quantity <= 1"
            @click="decreaseQuantity"
          >
            <BaseIcon name="minus" size="sm" />
          </button>
          <span class="cart-item__quantity-value">{{ cartItem.quantity }}</span>
          <button class="cart-item__quantity-btn" @click="increaseQuantity">
            <BaseIcon name="plus" size="sm" />
          </button>
        </div>
      </div>
    </div>
    <!-- Remove Button -->
    <button class="cart-item__remove" @click="removeItem" title="Remove item">
      <BaseIcon name="trash" size="sm" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CartItem } from '~/types'

interface Props {
  cartItem: CartItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-quantity': [menuItemId: string, quantity: number, customizations?: Record<string, any>]
  remove: [menuItemId: string, customizations?: Record<string, any>]
}>()

// Local state
const imageError = ref(false)

// Computed
const imageUrl = computed(() => {
  return props.cartItem.menuItem.imageUrl || '/images/placeholder-dish.svg'
})

// Methods
const handleImageError = () => {
  imageError.value = true
}

const increaseQuantity = () => {
  const newQuantity = props.cartItem.quantity + 1
  emit('update-quantity', props.cartItem.menuItem.id, newQuantity, props.cartItem.customizations)
}

const decreaseQuantity = () => {
  if (props.cartItem.quantity <= 1) return
  const newQuantity = props.cartItem.quantity - 1
  emit('update-quantity', props.cartItem.menuItem.id, newQuantity, props.cartItem.customizations)
}

const removeItem = () => {
  emit('remove', props.cartItem.menuItem.id, props.cartItem.customizations)
}
</script>

<style scoped lang="scss">
.cart-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: 12px;
  margin-bottom: 16px;
}

.cart-item__image {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.cart-item__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item__image-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
}

.cart-item__details {
  flex: 1;
  min-width: 0;
}

.cart-item__info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.cart-item__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.cart-item__price {
  flex-shrink: 0;
  min-width: 80px;
  white-space: nowrap;
  font-weight: 600;
  font-size: 16px;
  color: var(--color-primary);
  margin-left: 16px;
}

@media (max-width: 400px) {
  .cart-item__price {
    font-size: 14px;
    min-width: 70px;
  }
}

.cart-item__controls {
  display: flex;
  align-items: center;
}

.cart-item__quantity {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-item__quantity-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.cart-item__quantity-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  min-width: 24px;
  text-align: center;
}

.cart-item__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.1);
  color: var(--color-error);
  cursor: pointer;
  margin-left: auto;
}
</style>
