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
        <p class="product-card__description">{{ menuItem.description }}</p>
      </div>
      
      <!-- Footer with Price and Button -->
      <div class="product-card__footer">
        <span class="product-card__price">${{ menuItem.price.toFixed(2) }}</span>
        <button 
          class="product-card__add-btn"
          :class="{ 
            'product-card__add-btn--added': isAdded,
            'product-card__add-btn--disabled': !menuItem.isActive 
          }"
          :disabled="!menuItem.isActive"
          @click.stop="addToCart"
        >
          <BaseIcon 
            v-if="isAdded" 
            name="check" 
            size="sm" 
            class="product-card__add-icon" 
          />
          <BaseIcon 
            v-else 
            name="plus" 
            size="sm" 
            class="product-card__add-icon" 
          />
          {{ isAdded ? 'Added' : 'Add' }}
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
    // Add to cart
    cartStore.addItem(props.menuItem, 1)
    
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

.product-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    border-color: var(--color-primary);
  }
  
  &--unavailable {
    opacity: 0.7;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

.product-card__image-container {
  position: relative;
  width: 100%;
  height: 200px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.product-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  .product-card:hover & {
    transform: scale(1.05);
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
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
}

.product-card__unavailable-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.product-card__content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 140px;
}

.product-card__info {
  flex: 1;
  margin-bottom: 16px;
}

.product-card__name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__description {
  font-size: 14px;
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
}

.product-card__price {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.product-card__add-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  justify-content: center;
  
  &:hover:not(&--disabled) {
    background: var(--color-primary-dark);
    transform: translateY(-1px);
  }
  
  &:active:not(&--disabled) {
    transform: translateY(0);
  }
  
  &--added {
    background: var(--color-success);
    
    &:hover {
      background: var(--color-success);
    }
  }
  
  &--disabled {
    background: var(--color-neutral-300);
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
    background: var(--color-neutral-800);
    border-color: var(--color-neutral-700);
    
    &:hover {
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
    }
  }
}

// Mobile optimizations
@media (max-width: 640px) {
  .product-card__content {
    padding: 16px;
    height: 120px;
  }
  
  .product-card__name {
    font-size: 16px;
  }
  
  .product-card__description {
    font-size: 13px;
  }
  
  .product-card__price {
    font-size: 18px;
  }
  
  .product-card__add-btn {
    padding: 8px 12px;
    font-size: 13px;
    min-width: 70px;
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