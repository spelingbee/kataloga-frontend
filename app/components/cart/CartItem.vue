<template>
  <div class="cart-item">
    <!-- Item Image -->
    <BaseImage
      :src="item.menuItem.imageUrl"
      :alt="item.menuItem.name"
      class="cart-item__image"
    />

    <!-- Item Info -->
    <div class="cart-item__content">
      <AppText size="body-md" class="cart-item__name">
        {{ item.menuItem.name }}
      </AppText>
      <div class="cart-item__price-info">
        <AppPrice :price="item.menuItem.price" size="sm" />
        <span class="cart-item__quantity">×{{ item.quantity }}</span>
      </div>
      
      <!-- Customizations -->
      <div v-if="item.customizations && Object.keys(item.customizations).length > 0" class="cart-item__customizations">
        <AppText size="caption" class="cart-item__customizations-text">
          {{ formatCustomizations(item.customizations) }}
        </AppText>
      </div>
      
      <!-- Notes -->
      <div v-if="item.notes" class="cart-item__notes">
        <AppText size="caption" class="cart-item__notes-text">
          {{ item.notes }}
        </AppText>
      </div>
    </div>

    <!-- Quantity Controls -->
    <div class="cart-item__controls">
      <QuantitySelector
        :quantity="item.quantity"
        :min="0"
        :max="10"
        @update="updateQuantity"
        size="sm"
      />
    </div>

    <!-- Remove Button -->
    <BaseButton
      variant="ghost"
      size="sm"
      @click="removeItem"
      class="cart-item__remove-btn"
      aria-label="Remove item"
    >
      <BaseIcon name="trash" size="sm" />
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '~/types'

// Props & Emits
interface Props {
  item: CartItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-quantity': [itemId: string, quantity: number]
  remove: [itemId: string]
}>()

// Methods
const updateQuantity = (quantity: number) => {
  if (quantity === 0) {
    removeItem()
  } else {
    emit('update-quantity', props.item.menuItem.id, quantity)
  }
}

const removeItem = () => {
  emit('remove', props.item.menuItem.id)
}

const formatCustomizations = (customizations: Record<string, any>) => {
  return Object.entries(customizations)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
}
</script>

<style lang="scss" scoped>
.cart-item {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  background-color: rgba($color-background-card, 0.5);
  border-radius: 0.5rem;
  border: 1px solid $color-border-subtle;
  gap: $spacing-md;

  &__image {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid white;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-weight: $font-weight-medium;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__price-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-top: $spacing-xs;
  }

  &__quantity {
    color: $color-neutral-20;
    font-size: $font-size-caption;
  }

  &__customizations,
  &__notes {
    margin-top: $spacing-xs;
  }

  &__customizations-text,
  &__notes-text {
    color: $color-neutral-20;
  }

  &__notes-text {
    font-style: italic;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__remove-btn {
    color: $color-neutral-20;
    transition: color 0.2s ease;

    &:hover {
      color: $color-primary-red;
    }
  }
}
</style>