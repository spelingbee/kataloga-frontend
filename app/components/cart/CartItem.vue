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
        <p v-if="cartItem.menuItem.description" class="cart-item__description">
          {{ cartItem.menuItem.description }}
        </p>
        
        <!-- Modifiers -->
        <div v-if="cartItem.selectedModifiers.length > 0" class="cart-item__modifiers">
          <span 
            v-for="modifier in cartItem.selectedModifiers" 
            :key="modifier.id"
            class="cart-item__modifier"
          >
            {{ modifier.name }}
            <span v-if="modifier.priceAdjustment > 0" class="cart-item__modifier-price">
              +${{ modifier.priceAdjustment.toFixed(2) }}
            </span>
          </span>
        </div>

        <!-- Customizations -->
        <div v-if="cartItem.customizations" class="cart-item__customizations">
          <span 
            v-for="(value, key) in cartItem.customizations" 
            :key="key"
            class="cart-item__customization"
          >
            {{ key }}: {{ value }}
          </span>
        </div>
      </div>

      <!-- Price and Controls -->
      <div class="cart-item__controls">
        <div class="cart-item__price">
          ${{ cartItem.subtotal.toFixed(2) }}
        </div>
        
        <!-- Quantity Controls -->
        <div class="cart-item__quantity">
          <button 
            class="cart-item__quantity-btn"
            :disabled="cartItem.quantity <= 1"
            @click="decreaseQuantity"
          >
            <BaseIcon name="minus" size="sm" />
          </button>
          <span class="cart-item__quantity-value">{{ cartItem.quantity }}</span>
          <button 
            class="cart-item__quantity-btn"
            @click="increaseQuantity"
          >
            <BaseIcon name="plus" size="sm" />
          </button>
        </div>

        <!-- Remove Button -->
        <button 
          class="cart-item__remove"
          @click="removeItem"
          title="Remove item"
        >
          <BaseIcon name="trash" size="sm" />
        </button>
      </div>
    </div>
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
  'remove': [menuItemId: string, customizations?: Record<string, any>]
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
  gap: 16px;
  padding: 20px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  margin-bottom: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.cart-item__image {
  position: relative;
  width: 80px;
  height: 80px;
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0; // Allow text truncation
}

.cart-item__info {
  margin-bottom: 12px;
}

.cart-item__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.cart-item__description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cart-item__modifiers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.cart-item__modifier {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cart-item__modifier-price {
  color: var(--color-primary);
  font-weight: 500;
}

.cart-item__customizations {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cart-item__customization {
  font-size: 12px;
  color: var(--text-tertiary);
  font-style: italic;
}

.cart-item__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cart-item__price {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
  min-width: 60px;
}

.cart-item__quantity {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 4px;
}

.cart-item__quantity-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

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
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.2);
  color: var(--color-error);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(220, 38, 38, 0.2);
    border-color: var(--color-error);
  }
}

// Mobile optimizations
@media (max-width: 640px) {
  .cart-item {
    padding: 16px;
    gap: 12px;
  }

  .cart-item__image {
    width: 60px;
    height: 60px;
  }

  .cart-item__name {
    font-size: 15px;
  }

  .cart-item__description {
    font-size: 13px;
  }

  .cart-item__controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .cart-item__price {
    font-size: 16px;
  }

  .cart-item__quantity-btn {
    width: 28px;
    height: 28px;
  }

  .cart-item__remove {
    width: 32px;
    height: 32px;
    align-self: flex-end;
  }
}

// Very small screens
@media (max-width: 480px) {
  .cart-item {
    flex-direction: column;
    gap: 12px;
  }

  .cart-item__image {
    width: 100%;
    height: 120px;
    align-self: center;
    max-width: 200px;
  }

  .cart-item__controls {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>