<template>
  <div
    class="product-card"
    :class="{ 'product-card--unavailable': !menuItem.isActive }"
    @click="handleClick"
  >
    <!-- Image Container with Fallback -->
    <div class="product-card__image-container">
      <img
        :src="imageUrl"
        :alt="menuItem.name"
        class="product-card__image"
        loading="lazy"
        @error="handleImageError"
      />

      <!-- Fallback Icon -->
      <div v-if="imageError" class="product-card__image-fallback">
        <BaseIcon name="utensils" size="lg" class="product-card__fallback-icon" />
      </div>

      <!-- Popular Badge -->
      <div v-if="isPopular" class="product-card__badge">
        <BaseIcon name="fire" size="xs" class="product-card__badge-icon" />
        <span class="product-card__badge-text">Popular</span>
      </div>

      <!-- Unavailable Overlay -->
      <div v-if="!menuItem.isActive" class="product-card__unavailable-overlay">
        <span class="product-card__unavailable-text">Unavailable</span>
      </div>
    </div>

    <!-- Content -->
    <div class="product-card__content">
      <div class="product-card__info">
        <h3 class="product-card__name">{{ menuItem.name }}</h3>
        <p class="product-card__description">{{ menuItem.description }}</p>
      </div>

      <!-- Footer with Price and Button -->
      <div class="product-card__footer">
        <div class="product-card__price-wrapper">
          <AppPrice :amount="menuItem.price" class="product-card__price" />
        </div>
        
        <div v-if="qtyInCart > 0" class="product-card__qty-control" @click.stop>
          <button class="product-card__qty-btn product-card__qty-btn--minus" @click="decreaseQty">
            <BaseIcon name="minus" size="sm" />
          </button>
          <span class="product-card__qty-text">{{ qtyInCart }}</span>
          <button class="product-card__qty-btn product-card__qty-btn--plus" @click="increaseQty">
            <BaseIcon name="plus" size="sm" />
          </button>
        </div>
        <button
          v-else
          class="product-card__add-btn"
          :class="{
            'product-card__add-btn--added': isAdded,
            'product-card__add-btn--disabled': !menuItem.isActive,
          }"
          :disabled="!menuItem.isActive"
          @click.stop="addToCart"
        >
          <BaseIcon :name="isAdded ? 'check' : 'plus'" size="sm" class="product-card__add-icon" />
          <span class="product-card__add-text">{{ isAdded ? $t('common.added', 'В корзине') : $t('common.add', 'Добавить') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useNotification } from '~/composables/useNotification'
import type { MenuItem } from '~/types'
import AppPrice from '../base/AppPrice.vue'

interface Props {
  menuItem: MenuItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [menuItem: MenuItem]
  addToCart: [menuItem: MenuItem]
}>()

// Stores and composables
const cartStore = useCartStore()
const { showSuccess } = useNotification()

// Local state
const imageError = ref(false)
const isAdded = ref(false)

// Computed properties
const isPopular = computed(() => {
  return props.menuItem.isPopular || false
})

const imageUrl = computed(() => {
  return props.menuItem.imageUrl || '/images/placeholder-dish.svg'
})

const cartItem = computed(() => {
  return cartStore.items.find((i) => i.menuItem.id === props.menuItem.id)
})

const qtyInCart = computed(() => {
  return cartItem.value ? cartItem.value.quantity : 0
})

// Methods
const handleClick = () => {
  emit('click', props.menuItem)
}

const handleImageError = () => {
  imageError.value = true
}

const increaseQty = () => {
  if (!props.menuItem.isActive) return
  if (cartItem.value) {
    cartStore.updateQuantity(props.menuItem.id, cartItem.value.quantity + 1)
  } else {
    addToCart()
  }
}

const decreaseQty = () => {
  if (cartItem.value) {
    cartStore.updateQuantity(props.menuItem.id, cartItem.value.quantity - 1)
  }
}

const addToCart = async () => {
  if (!props.menuItem.isActive) return

  try {
    // Add to cart
    cartStore.addItem(props.menuItem, 1)
    console.log(props.menuItem, 'added to cart', cartStore.items.length, 'items in cart')

    // Show feedback
    isAdded.value = true
    showSuccess('Added to Cart', `${props.menuItem.name} has been added to your cart`)

    // Reset button state after 2 seconds
    setTimeout(() => {
      isAdded.value = false
    }, 2000)

    emit('addToCart', props.menuItem)
  } catch (error) {
    console.error('Failed to add item to cart:', error)
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/radius' as *;

.product-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-xl;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  cursor: pointer;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  }

  &--unavailable {
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(80%);

    &:hover {
      transform: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
  }
}

.product-card__image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  height: auto;
  background: var(--bg-secondary);
  overflow: hidden;
}

.product-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);

  .product-card:hover & {
    transform: scale(1.08);
  }
}

.product-card__image-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
}

.product-card__fallback-icon {
  color: var(--text-tertiary);
  opacity: 0.5;
}

.product-card__badge {
  position: absolute;
  top: $space-3;
  left: $space-3;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: $radius-full;
  padding: $space-1 $space-2;
  display: flex;
  align-items: center;
  gap: $space-1;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-card__badge-icon {
  color: var(--color-primary);
}

.product-card__badge-text {
  font-size: $text-xs;
  font-weight: $font-bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.product-card__unavailable-overlay {
  position: absolute;
  inset: 0;
  background: rgba(var(--bg-primary-rgb), 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.product-card__unavailable-text {
  font-size: $text-sm;
  font-weight: $font-bold;
  color: var(--text-primary);
  background: var(--bg-primary);
  padding: $space-2 $space-4;
  border-radius: $radius-full;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-card__content {
  padding: $space-4;
  display: flex;
  flex-direction: column;
  min-height: 156px;
}

.product-card__info {
  flex: 1;
  margin-bottom: $space-3;
}

.product-card__name {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin: 0 0 $space-1 0;
  line-height: $leading-tight;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__description {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin: 0;
  line-height: $leading-relaxed;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.product-card__price-wrapper {
  display: flex;
  flex-direction: column;
}

.product-card__price {
  font-size: $text-lg;
  font-weight: $font-bold;
  color: var(--text-primary);
}

.product-card__add-btn {
  background: var(--bg-secondary);
  color: var(--color-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-full;
  padding: $space-2 $space-5;
  height: 40px;
  font-size: $text-sm;
  font-weight: $font-bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  cursor: pointer;
  transition: all $transition-base;
  
  &:hover:not(&--disabled) {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
  }

  &--added {
    background: var(--color-success);
    border-color: var(--color-success);
    color: white;
  }
}

.product-card__qty-control {
  display: flex;
  align-items: center;
  gap: $space-4;
  background: transparent;

  .product-card__qty-btn {
    width: 36px;
    height: 36px;
    border-radius: $radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all $transition-base;
    border: 1px solid var(--border-primary);
    background: var(--bg-secondary);
    color: var(--text-primary);

    &:hover {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      transform: scale(1.1);
    }

    &--plus {
      color: var(--color-primary);
    }
  }

  .product-card__qty-text {
    font-size: $text-base;
    font-weight: $font-bold;
    color: var(--text-primary);
    min-width: 24px;
    text-align: center;
  }
}


// Mobile optimizations
@media (max-width: 640px) {
  .product-card__content {
    padding: $space-3;
    min-height: 130px;
  }

  .product-card__info {
    margin-bottom: $space-2;
  }

  .product-card__name {
    font-size: $text-base;
    margin-bottom: $space-1;
  }

  .product-card__description {
    font-size: $text-xs;
    -webkit-line-clamp: 2;
  }

  .product-card__price {
    font-size: $text-base;
  }

  .product-card__add-btn {
    padding: $space-2 $space-3;
    height: 36px;
    font-size: $text-xs;
  }
  
  .product-card__add-text {
    display: none; // Collapse to icon only on very small screens if needed, or keep smaller text
  }
  
  .product-card__add-btn {
    .product-card__add-text {
      display: inline; // Actually, keeping text is better for CTA. Let's override hide.
    }
  }

  .product-card__qty-control {
    height: 36px;

    .product-card__qty-btn {
      width: 32px;
    }

    .product-card__qty-text {
      font-size: $text-sm;
      min-width: 20px;
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .product-card {
    transition: none;

    &:hover {
      transform: none;
    }
  }

  .product-card__image {
    transition: none;

    .product-card:hover & {
      transform: none;
    }
  }

  .product-card__add-btn {
    transition: none;

    &:hover:not(&--disabled) {
      transform: none;
    }
  }
}
</style>
