<template>
  <div class="cart-item">
    <!-- Item Image -->
    <img
      :src="item.menuItem.imageUrl || '/images/placeholder-dish.webp'"
      :alt="item.menuItem.name"
      class="cart-item__image"
      loading="lazy"
    />

    <!-- Item Info -->
    <div class="cart-item__content">
      <h4 class="cart-item__name">
        {{ item.menuItem.name }}
      </h4>
      <div class="cart-item__price-info">
        <span class="cart-item__price">${{ item.menuItem.price.toFixed(2) }}</span>
        <span class="cart-item__quantity">×{{ item.quantity }}</span>
      </div>
      
      <!-- Modifiers -->
      <div v-if="item.selectedModifiers && item.selectedModifiers.length > 0" class="cart-item__modifiers">
        <span class="cart-item__modifiers-text">
          {{ formatModifiers(item.selectedModifiers) }}
        </span>
      </div>
      
      <!-- Notes -->
      <div v-if="item.notes" class="cart-item__notes">
        <span class="cart-item__notes-text">
          {{ item.notes }}
        </span>
      </div>
    </div>

    <!-- Quantity Controls -->
    <div class="cart-item__controls">
      <BaseButton
        variant="outline"
        size="sm"
        :disabled="item.quantity <= 1"
        @click="decreaseQuantity"
      >
        -
      </BaseButton>
      <span class="cart-item__quantity-display">{{ item.quantity }}</span>
      <BaseButton
        variant="outline"
        size="sm"
        @click="increaseQuantity"
      >
        +
      </BaseButton>
    </div>

    <!-- Remove Button -->
    <BaseButton
      variant="ghost"
      size="sm"
      class="cart-item__remove-btn"
      aria-label="Remove item"
      @click="removeItem"
    >
      ×
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
interface MenuItem {
  id: string
  name: string
  price: number
  imageUrl?: string
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
  selectedModifiers?: any[]
  notes?: string
}

interface Props {
  item: CartItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-quantity': [itemId: string, quantity: number]
  remove: [itemId: string]
}>()

// Methods
const increaseQuantity = () => {
  emit('update-quantity', props.item.menuItem.id, props.item.quantity + 1)
}

const decreaseQuantity = () => {
  if (props.item.quantity > 1) {
    emit('update-quantity', props.item.menuItem.id, props.item.quantity - 1)
  }
}

const removeItem = () => {
  emit('remove', props.item.menuItem.id)
}

const formatModifiers = (modifiers: any[]) => {
  return modifiers
    .map(mod => {
      if (mod.priceAdjustment > 0) {
        return `${mod.name} (+$${mod.priceAdjustment.toFixed(2)})`
      }
      return mod.name
    })
    .join(', ')
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;

.cart-item {
  display: flex;
  align-items: center;
  padding: $space-4;
  background-color: var(--bg-primary);
  border-radius: $radius-md;
  border: 1px solid var(--border-primary);
  gap: $space-4;
  transition: $transition-base;

  &:hover {
    border-color: var(--border-secondary);
  }
}

.cart-item__image {
  width: 60px;
  height: 60px;
  border-radius: $radius-md;
  object-fit: cover;
  flex-shrink: 0;
}

.cart-item__content {
  flex: 1;
  min-width: 0;
}

.cart-item__name {
  font-family: $font-primary;
  font-size: $text-base;
  font-weight: $font-medium;
  color: var(--text-primary);
  margin: 0 0 $space-1 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-item__price-info {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-1;
}

.cart-item__price {
  font-family: $font-primary;
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: var(--text-primary);
}

.cart-item__quantity {
  font-family: $font-primary;
  font-size: $text-sm;
  color: var(--text-secondary);
}

.cart-item__modifiers,
.cart-item__notes {
  margin-top: $space-1;
}

.cart-item__modifiers-text,
.cart-item__notes-text {
  font-family: $font-primary;
  font-size: $text-xs;
  color: var(--text-tertiary);
}

.cart-item__notes-text {
  font-style: italic;
}

.cart-item__controls {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.cart-item__quantity-display {
  font-family: $font-primary;
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
  min-width: 24px;
  text-align: center;
}

.cart-item__remove-btn {
  color: var(--text-tertiary);
  font-size: $text-lg;
  font-weight: $font-bold;
  transition: $transition-fast;

  &:hover {
    color: var(--color-error);
  }
}
</style>