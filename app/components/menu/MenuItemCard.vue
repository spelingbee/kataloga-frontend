<template>
  <BaseCard
    :class="[
      'menu-item-card',
      {
        'menu-item-card--selected': isSelected,
        'menu-item-card--inactive': !menuItem.isActive
      }
    ]"
    role="button"
    :tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Card Content -->
    <div class="menu-item-card__content">
      <!-- Image and Basic Info -->
      <div class="menu-item-card__header">
        <!-- Menu Item Image -->
        <div class="menu-item-card__image-container">
          <LazyImage
            :src="menuItem.imageUrl || '/images/placeholder-dish.webp'"
            :alt="menuItem.name"
            :width="80"
            :height="80"
            aspect-ratio="1/1"
            container-class="w-full h-full"
            image-class="menu-item-card__image"
            :show-skeleton="true"
            :threshold="0.1"
            root-margin="100px"
          />
        </div>
        
        <!-- Item Details -->
        <div class="menu-item-card__details">
          <!-- Name and Popular Indicator -->
          <div class="menu-item-card__title-row">
            <h3 class="menu-item-card__title">
              {{ menuItem.name }}
            </h3>
            
            <FireIcon 
              v-if="isPopular" 
              size="sm" 
              :animated="true"
              class="menu-item-card__popular-indicator"
            />
          </div>
          
          <!-- Description -->
          <p class="menu-item-card__description">
            {{ menuItem.description }}
          </p>
          
          <!-- Calories (if available) -->
          <div 
            v-if="menuItem.calories" 
            class="menu-item-card__calories"
          >
            <BaseIcon name="fire" size="xs" class="u-text-primary-orange" />
            <span class="menu-item-card__calories-text">
              {{ menuItem.calories }} cal
            </span>
          </div>
        </div>
      </div>
      
      <!-- Price and Actions -->
      <div class="menu-item-card__footer">
        <!-- Price -->
        <div class="menu-item-card__price">
          {{ formattedPrice }}
        </div>
        
        <!-- Action Buttons -->
        <div class="menu-item-card__actions">
          <!-- Favorite Button -->
          <BaseButton
            variant="ghost"
            size="sm"
            :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
            :class="[
              'menu-item-card__favorite-btn',
              { 'menu-item-card__favorite-btn--active': isFavorite }
            ]"
            @click.stop="toggleFavorite"
          >
            <BaseIcon 
              :name="isFavorite ? 'heart-filled' : 'heart'" 
              size="sm"
            />
          </BaseButton>
          
          <!-- Add to Cart Button -->
          <AddToCartButton
            :disabled="!menuItem.isActive"
            size="sm"
            @click.stop="addToCart"
          />
        </div>
      </div>
    </div>
    
    <!-- Hover Overlay -->
    <div class="menu-item-card__overlay" />
    
    <!-- Unavailable Overlay -->
    <div
      v-if="!menuItem.isActive"
      class="menu-item-card__unavailable-overlay"
    >
      <BaseBadge variant="secondary" size="sm">
        Unavailable
      </BaseBadge>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MenuItem } from '~/types'
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'
import { useTenant } from '~/composables/useTenant'

interface Props {
  menuItem: MenuItem
  isSelected?: boolean
  showPopularIndicator?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  showPopularIndicator: true
})

const emit = defineEmits<{
  click: [menuItem: MenuItem]
  addToCart: [menuItem: MenuItem]
  toggleFavorite: [menuItem: MenuItem]
}>()

// Stores
const menuStore = useMenuStore()
const cartStore = useCartStore()

// Tenant context
const { currentTenant, tenantSettings } = useTenant()

// Computed properties
const isPopular = computed(() => {
  if (!props.showPopularIndicator) return false
  // This would typically be determined by backend analytics
  // For now, we'll use a simple heuristic
  return menuStore.popularItems.some(item => item.id === props.menuItem.id)
})

const isFavorite = computed(() => {
  return menuStore.favourites.some(item => item.id === props.menuItem.id)
})

// Format price with tenant currency
const formattedPrice = computed(() => {
  const currency = tenantSettings.value?.currency || 'USD'
  const price = props.menuItem.price
  
  // Simple currency formatting
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    RUB: '₽'
  }
  
  const symbol = currencySymbols[currency] || currency
  return `${symbol}${price.toFixed(2)}`
})

// Methods
const handleClick = () => {
  emit('click', props.menuItem)
  
  // Set as selected dish in store
  menuStore.setSelectedDish(props.menuItem)
  
  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(30)
  }
}

const addToCart = () => {
  if (!props.menuItem.isActive) return
  
  emit('addToCart', props.menuItem)
  
  // Add to cart store
  cartStore.addItem(props.menuItem, 1)
  
  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

const toggleFavorite = () => {
  emit('toggleFavorite', props.menuItem)
  
  // Toggle in store
  menuStore.toggleFavourite(props.menuItem.id)
  
  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(30)
  }
}
</script>

<style lang="scss" scoped>
// Component-specific animations and transitions
.menu-item-card {
  // Enhanced hover animation with spring effect
  &:hover {
    animation: cardHoverBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  // Staggered animation for card elements on hover
  &:hover .menu-item-card__image {
    animation-delay: 0.1s;
  }
  
  &:hover .menu-item-card__title {
    animation: titleGlow 0.3s ease-out;
  }
}

// Custom keyframe animations
@keyframes cardHoverBounce {
  0% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-4px) scale(1.02);
  }
  100% {
    transform: translateY(-2px) scale(1);
  }
}

@keyframes titleGlow {
  0% {
    text-shadow: none;
  }
  50% {
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  }
  100% {
    text-shadow: none;
  }
}

// Pulse animation for favorite button when active
.menu-item-card__favorite-btn--active {
  animation: heartPulse 0.6s ease-in-out;
}

@keyframes heartPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

// Loading state animation for images
.menu-item-card__image-container {
  &:has(.lazy-image--loading) {
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>