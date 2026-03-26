<template>
  <BaseModal
    v-model="isOpen"
    size="lg"
    :closable="true"
  >
    <div class="menu-item-detail">
      <!-- Image Gallery -->
      <div class="menu-item-detail__image-container">
        <LazyImage
          :src="menuItem.imageUrl || '/images/placeholder-dish.webp'"
          :alt="menuItem.name"
          :width="800"
          :height="600"
          aspect-ratio="4/3"
          container-class="w-full h-full"
          image-class="menu-item-detail__image"
          :show-skeleton="true"
        />
        
        <!-- Badges Overlay -->
        <div v-if="menuItem.badges && menuItem.badges.length > 0" class="menu-item-detail__badges">
          <MenuItemBadge
            v-for="badge in menuItem.badges"
            :key="badge.type"
            :type="badge.type"
            :label="badge.label"
            size="md"
          />
        </div>
      </div>
      
      <!-- Content -->
      <div class="menu-item-detail__content">
        <!-- Header -->
        <div class="menu-item-detail__header">
          <AppHeading size="heading-xl" color="white">
            {{ menuItem.name }}
          </AppHeading>
          
          <BaseButton
            variant="ghost"
            size="md"
            :class="[
              'menu-item-detail__favorite-btn',
              { 'menu-item-detail__favorite-btn--active': isFavorite }
            ]"
            @click="toggleFavorite"
          >
            <BaseIcon 
              :name="isFavorite ? 'heart-filled' : 'heart'" 
              size="md"
            />
          </BaseButton>
        </div>
        
        <!-- Description -->
        <AppText size="body-md" color="muted" class="menu-item-detail__description">
          {{ menuItem.description }}
        </AppText>
        
        <!-- Allergen Information -->
        <div v-if="menuItem.allergens && menuItem.allergens.length > 0" class="menu-item-detail__allergens">
          <AppText size="body-sm" color="white" class="font-semibold">
            Allergens:
          </AppText>
          <div class="menu-item-detail__allergen-list">
            <BaseBadge
              v-for="allergen in menuItem.allergens"
              :key="allergen"
              variant="warning"
              size="sm"
            >
              {{ allergen }}
            </BaseBadge>
          </div>
        </div>
        
        <!-- Nutrition Information -->
        <div v-if="menuItem.nutritionInfo" class="menu-item-detail__nutrition">
          <AppText size="body-sm" color="white" class="font-semibold mb-2">
            Nutrition Information:
          </AppText>
          <div class="menu-item-detail__nutrition-grid">
            <div class="menu-item-detail__nutrition-item">
              <AppText size="caption" color="muted">Calories</AppText>
              <AppText size="body-sm" color="white" class="font-medium">
                {{ menuItem.nutritionInfo.calories }} cal
              </AppText>
            </div>
            <div class="menu-item-detail__nutrition-item">
              <AppText size="caption" color="muted">Protein</AppText>
              <AppText size="body-sm" color="white" class="font-medium">
                {{ menuItem.nutritionInfo.protein }}g
              </AppText>
            </div>
            <div class="menu-item-detail__nutrition-item">
              <AppText size="caption" color="muted">Carbs</AppText>
              <AppText size="body-sm" color="white" class="font-medium">
                {{ menuItem.nutritionInfo.carbs }}g
              </AppText>
            </div>
            <div class="menu-item-detail__nutrition-item">
              <AppText size="caption" color="muted">Fat</AppText>
              <AppText size="body-sm" color="white" class="font-medium">
                {{ menuItem.nutritionInfo.fat }}g
              </AppText>
            </div>
          </div>
        </div>
        
        <!-- Modifiers -->
        <ModifierSelector
          v-if="modifierGroups.length > 0"
          :modifier-groups="modifierGroups"
          :selected-modifiers="selectedModifiers"
          :has-validation-errors="hasValidationErrors"
          :validation-errors="validationErrors"
          @update:selected-modifiers="handleModifierChange"
        />
        
        <!-- Quantity Selector -->
        <div class="menu-item-detail__quantity">
          <AppText size="body-sm" color="white" class="font-semibold">
            Quantity:
          </AppText>
          <QuantitySelector
            v-model="quantity"
            :min="1"
            :max="99"
            size="lg"
          />
        </div>
        
        <!-- Price and Add to Cart -->
        <div class="menu-item-detail__footer">
          <div class="menu-item-detail__price-section">
            <AppText size="caption" color="muted">Total Price</AppText>
            <AppPrice :amount="totalPrice" size="xl" />
          </div>
          
          <BaseButton
            variant="primary"
            size="lg"
            :disabled="!canAddToCart"
            class="menu-item-detail__add-btn"
            @click="handleAddToCart"
          >
            <BaseIcon name="shopping-cart" size="sm" />
            Add to Cart
          </BaseButton>
        </div>
        
        <!-- Validation Error Message -->
        <div v-if="hasValidationErrors" class="menu-item-detail__error">
          <AppText size="body-sm" color="red">
            Please select all required options before adding to cart
          </AppText>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import type { MenuItemUI, ModifierGroupUI, ModifierUI } from '~/types'
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'
import { useFavoritesStore } from '~/stores/favorites'

interface Props {
  modelValue: boolean
  menuItem: MenuItemUI
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  addToCart: [item: MenuItemUI, quantity: number, modifiers: ModifierUI[]]
}>()

// Stores
const menuStore = useMenuStore()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()

// Telegram integration
const telegram = useTelegram()

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const quantity = ref(1)
const selectedModifiers = ref<ModifierUI[]>([])
const hasValidationErrors = ref(false)
const validationErrors = ref<string[]>([])

// Telegram MainButton cleanup function
let cleanupMainButton: (() => void) | null = null

// Computed properties
const isFavorite = computed(() => {
  return favoritesStore.isFavorite(props.menuItem.id)
})

// Extract modifier groups from menu item
// In a real implementation, this would come from the API
const modifierGroups = computed<readonly ModifierGroupUI[]>(() => {
  // Use modifier groups from props if available
  return props.menuItem.modifierGroups || []
})

const totalPrice = computed(() => {
  let price = props.menuItem.price
  
  // Add modifier prices
  selectedModifiers.value.forEach(modifier => {
    price += modifier.priceAdjustment
  })
  
  // Multiply by quantity
  return price * quantity.value
})

const canAddToCart = computed(() => {
  return props.menuItem.isActive && !hasValidationErrors.value
})

// Methods
const handleModifierChange = (modifiers: ModifierUI[]) => {
  selectedModifiers.value = modifiers
  validateModifiers()
}

const validateModifiers = () => {
  hasValidationErrors.value = false
  validationErrors.value = []
  
  // Check if all required modifier groups have selections
  modifierGroups.value.forEach(group => {
    if (group.required) {
      const selectedCount = selectedModifiers.value.filter(
        mod => group.modifiers.some(gm => gm.id === mod.id)
      ).length
      
      if (selectedCount < group.minSelection) {
        hasValidationErrors.value = true
        validationErrors.value.push(
          `Please select at least ${group.minSelection} option(s) for ${group.name}`
        )
      }
    }
  })
}

const handleAddToCart = () => {
  // Validate before adding
  validateModifiers()
  
  if (hasValidationErrors.value) {
    // Show error feedback in Telegram
    if (telegram.isTelegram.value) {
      telegram.notificationFeedback('error')
    }
    return
  }
  
  // Add to cart
  cartStore.addItem(props.menuItem, quantity.value, selectedModifiers.value)
  
  // Emit event
  emit('addToCart', props.menuItem, quantity.value, selectedModifiers.value)
  
  // Close modal
  handleClose()
  
  // Add haptic feedback
  if (telegram.isTelegram.value) {
    telegram.notificationFeedback('success')
    telegram.impactFeedback('medium')
  } else if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

const toggleFavorite = () => {
  favoritesStore.toggleFavorite(props.menuItem.id)
  
  // Add haptic feedback
  if (telegram.isTelegram.value) {
    telegram.selectionFeedback()
  } else if ('vibrate' in navigator) {
    navigator.vibrate(30)
  }
}

const handleClose = () => {
  // Reset state
  quantity.value = 1
  selectedModifiers.value = []
  hasValidationErrors.value = false
  validationErrors.value = []
  
  // Close modal using v-model
  isOpen.value = false
  
  emit('close')
}

// Watch for modal open to reset state and setup Telegram MainButton
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    quantity.value = 1
    selectedModifiers.value = []
    hasValidationErrors.value = false
    validationErrors.value = []
    
    // Setup Telegram MainButton if in Telegram
    if (telegram.isTelegram.value) {
      const buttonText = `Add to Cart - $${totalPrice.value.toFixed(2)}`
      cleanupMainButton = telegram.showMainButton(buttonText, handleAddToCart)
    }
  } else {
    // Cleanup Telegram MainButton
    if (cleanupMainButton) {
      cleanupMainButton()
      cleanupMainButton = null
    }
    telegram.hideMainButton()
  }
})

// Watch for price changes to update MainButton text
watch(totalPrice, (newPrice) => {
  if (telegram.isTelegram.value && props.modelValue) {
    const buttonText = `Add to Cart - $${newPrice.toFixed(2)}`
    // Update button text by recreating it
    if (cleanupMainButton) {
      cleanupMainButton()
    }
    cleanupMainButton = telegram.showMainButton(buttonText, handleAddToCart)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (cleanupMainButton) {
    cleanupMainButton()
  }
  telegram.hideMainButton()
})
</script>

<style lang="scss" scoped>
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/shadows' as *;

.menu-item-detail {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.menu-item-detail__image-container {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: $radius-lg;
  overflow: hidden;
  background: var(--bg-secondary);
  box-shadow: var(--shadow-md);
  
  @media (min-width: 768px) {
    height: 400px;
  }
}

.menu-item-detail__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-item-detail__badges {
  position: absolute;
  top: $space-4;
  left: $space-4;
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  z-index: 2;
}

.menu-item-detail__content {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.menu-item-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
}

.menu-item-detail__favorite-btn {
  flex-shrink: 0;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  z-index: 10;
  
  &:hover {
    color: var(--color-error);
    background: rgba(var(--color-error), 0.1);
  }
}

.menu-item-detail__favorite-btn--active {
  color: var(--color-error);
  
  &:hover {
     background: rgba(var(--color-error), 0.15);
  }
}

.menu-item-detail__description {
  line-height: 1.6;
}

.menu-item-detail__allergens {
  padding: $space-4;
  background: rgba($color-warning, 0.1);
  border: 1px solid rgba($color-warning, 0.2);
  border-radius: $radius-md;
}

.menu-item-detail__allergen-list {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-top: $space-2;
}

.menu-item-detail__nutrition {
  padding: $space-4;
  background: var(--bg-secondary);
  border-radius: $radius-md;
  border: 1px solid var(--border-primary);
}

.menu-item-detail__nutrition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.menu-item-detail__nutrition-item {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.menu-item-detail__quantity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-4;
  background: var(--bg-secondary);
  border-radius: $radius-md;
  border: 1px solid var(--border-primary);
}

.menu-item-detail__footer {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding-top: $space-6;
  border-top: 1px solid var(--border-primary);
  
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.menu-item-detail__price-section {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.menu-item-detail__add-btn {
  width: 100%;
  
  @media (min-width: 640px) {
    width: auto;
    min-width: 200px;
  }
}

.menu-item-detail__error {
  padding: $space-4;
  background: rgba($color-error, 0.1);
  border: 1px solid rgba($color-error, 0.2);
  border-radius: $radius-md;
  text-align: center;
}
</style>
