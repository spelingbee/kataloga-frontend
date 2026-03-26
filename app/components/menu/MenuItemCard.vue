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
        <BaseIcon name="utensils" size="lg" class="text-neutral-400" />
      </div>
      
      <!-- Popular Badge -->
      <div v-if="isPopular" class="product-card__badge">
        <BaseIcon name="fire" size="xs" class="text-orange-500" />
        <span class="text-xs font-medium text-white">Popular</span>
      </div>
      
      <!-- Unavailable Overlay -->
      <div v-if="!menuItem.isActive" class="product-card__unavailable-overlay">
        <span class="text-sm font-medium text-white">Unavailable</span>
      </div>
    </div>
    
    <!-- Content -->
    <div class="product-card__content">
      <div class="product-card__info">
        <h3 class="product-card__name">{{ menuItem.name }}</h3>
        <p v-if="menuItem.description" class="product-card__description">{{ menuItem.description }}</p>
      </div>
      
      <!-- Footer with Price and Button -->
      <div class="product-card__footer">
        <AppPrice :price="menuItem.price" class="product-card__price" />
        <div v-if="quantity > 0" class="product-card__controls">
          <button 
            class="product-card__control-btn"
            @click.stop="decreaseQuantity"
          >
            <BaseIcon name="minus" size="sm" />
          </button>
          
          <span class="product-card__quantity">{{ quantity }}</span>
          
          <button 
            class="product-card__control-btn"
            @click.stop="increaseQuantity"
          >
            <BaseIcon name="plus" size="sm" />
          </button>
        </div>

        <button 
          v-else
          class="product-card__add-btn"
          :class="{ 'product-card__add-btn--disabled': !menuItem.isActive }"
          :disabled="!menuItem.isActive"
          @click.stop="addToCart"
        >
          <BaseIcon name="plus" size="sm" class="product-card__add-icon" />
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useNotification } from '~/composables/useNotification'
import type { MenuItemUI } from '~/types/ui'
import AppPrice from '../base/AppPrice.vue'

interface Props {
  menuItem: MenuItemUI
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [menuItem: MenuItemUI]
  addToCart: [menuItem: MenuItemUI]
}>()

// Stores and composables
const cartStore = useCartStore()
const { showSuccess } = useNotification()

// Local state
const imageError = ref(false)

// Computed properties
const isPopular = computed(() => {
  return props.menuItem.isPopular || false
})

const imageUrl = computed(() => {
  return props.menuItem.imageUrl || '/images/placeholder-dish.svg'
})

// Find quantity in cart (only for items without special modifiers for now)
const cartItem = computed(() => {
  return cartStore.items.find(item => 
    item.menuItem.id === props.menuItem.id && 
    (!item.selectedModifiers || item.selectedModifiers.length === 0) &&
    (!item.customizations || Object.keys(item.customizations).length === 0)
  )
})

const quantity = computed(() => {
  return cartItem.value?.quantity || 0
})

// Methods
const handleClick = () => {
  emit('click', props.menuItem)
}

const handleImageError = () => {
  imageError.value = true
}

const addToCart = async () => {
  if (!props.menuItem.isActive) return
  
  try {
    cartStore.addItem(props.menuItem, 1)
    
    // Only show notification if it's the first add
    if (quantity.value === 1) {
      showSuccess('Added to Cart', `${props.menuItem.name} has been added to your cart`)
    }
    
    emit('addToCart', props.menuItem)
  } catch (error) {
    console.error('Failed to add item to cart:', error)
  }
}

const decreaseQuantity = async () => {
  if (!cartItem.value) return
  
  try {
    cartStore.updateQuantity(
      props.menuItem.id, 
      cartItem.value.quantity - 1,
      cartItem.value.customizations
    )
  } catch (error) {
    console.error('Failed to decrease quantity:', error)
  }
}

const increaseQuantity = () => {
  addToCart()
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/radius' as *;

.product-card {
  background: var(--bg-primary);
  border: 1px solid transparent; // Cleaner look without border unless necessary
  border-radius: $radius-card;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  box-shadow: var(--shadow-card);
  height: 100%; // Ensure uniform height in grid
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--hover-shadow-card);
    border-color: rgba(var(--color-primary-rgb), 0.3);
  }
  
  &--unavailable {
    opacity: 0.8;
    filter: grayscale(0.8);
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: var(--shadow-card);
    }
  }
}

.product-card__image-container {
  position: relative;
  width: 100%;
  padding-bottom: 75%; // 4:3 Aspect Ratio
  background: var(--bg-secondary);
  overflow: hidden;
  
  @media (max-width: 640px) {
    padding-bottom: 60%; // More compact on mobile
  }
}

.product-card__image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
  
  .product-card:hover & {
    transform: scale(1.08); // Slightly stronger zoom
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

.product-card__badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--gradient-primary); // Use gradient for badges
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  border-radius: $radius-badge;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
  
  // Custom glass effect if supported
  @supports (backdrop-filter: blur(10px)) {
     background: rgba(255, 107, 0, 0.9);
     backdrop-filter: blur(4px);
  }
}

.product-card__unavailable-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px); // Glass effect for unavailable overlay
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.product-card__content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  background: var(--bg-primary);
}

.product-card__info {
  flex: 1;
  margin-bottom: 12px;
}

.product-card__name {
  font-size: 17px; // Optimization for readability
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__description {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
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
  gap: 12px;
}

.product-card__price {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.product-card__add-btn {
  background: var(--bg-secondary);
  color: var(--color-primary);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: $radius-full;
  padding: 6px 12px; // Reduced padding
  font-size: 13px; // Slightly smaller quantity text
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px; // Reduced gap
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
  
  // Make the button more tappable/obvious
  min-height: 36px; 
  
  &:hover:not(&--disabled) {
    background: var(--gradient-primary-hover);
    border-color: transparent;
    color: white;
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow-primary); // Glow effect on hover
  }
  
  &:active:not(&--disabled) {
    transform: scale(0.95);
  }
  
  &--added {
    background: var(--color-success);
    color: white;
    border-color: transparent;
    box-shadow: var(--shadow-glow-success);
    
    &:hover {
      background: var(--color-success);
      transform: none;
    }
  }
  
  &--disabled {
    background: var(--color-neutral-200);
    color: var(--color-neutral-400);
    border-color: transparent;
    box-shadow: none;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
    }
  }
}

.product-card__add-icon {
  transition: transform 0.2s ease;
}

// Dark theme adjustments
@media (prefers-color-scheme: dark) {
  .product-card {
    background: var(--bg-secondary); // Slightly lighter than pure black bg
    border: 1px solid rgba(255,255,255,0.05); // Subtle border in dark mode
    
    &:hover {
      background: var(--bg-tertiary);
      border-color: rgba(var(--color-primary-rgb), 0.4);
    }
  }
  
  .product-card__add-btn {
    background: rgba(255,255,255,0.05);
  }
}

// Mobile optimizations
@media (max-width: 640px) {
  .product-card__content {
    padding: 10px;
  }
  
  .product-card__name {
    font-size: 16px;
  }
  
  .product-card__price {
    font-size: 17px;
  }
  
  // Make the button fill available space or be larger on mobile
  .product-card__add-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .product-card,
  .product-card__image,
  .product-card__add-btn {
    transition: none;
    transform: none !important;
  }
  
  .product-card:hover {
     transform: none;
  }
}
// ... existing styles ...

.product-card__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  border-radius: $radius-full;
  padding: 4px;
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
}

.product-card__control-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
}

.product-card__quantity {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 20px;
  text-align: center;
}

// ... media queries ...
@media (max-width: 640px) {
  .product-card__content {
    padding: 10px;
  }
  
  .product-card__name {
    font-size: 16px;
  }
  
  .product-card__price {
    font-size: 17px;
  }

  .product-card__footer {
    flex-wrap: wrap; // Allow wrapping on very small screens
  }
  
  // Make the button fill available space or be larger on mobile
  .product-card__add-btn {
    padding: 8px 14px;
    font-size: 13px;
    // On small screens, if it wraps, make it full width if needed, or keep it manageable
    flex-shrink: 0; 
  }

  .product-card__controls {
    // Ensure controls don't overflow
    max-width: 100%; 
  }
}
</style>