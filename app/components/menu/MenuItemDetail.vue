<template>
  <BaseModal
    v-model="isOpen"
    size="lg"
    :closable="true"
    @close="handleClose"
  >
    <div class="menu-item-detail">
      <!-- Image Gallery -->
      <div class="menu-item-detail__image-container">
        <LazyImage
          :src="menuItem.imageUrl || '/images/placeholder-dish.svg'"
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
        <div v-if="isFoodBusiness && menuItem.allergens && menuItem.allergens.length > 0" class="menu-item-detail__allergens">
          <AppText size="body-sm" color="white" class="font-semibold">
            {{ $t('menu.allergens', 'Аллергены') }}:
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
        <div v-if="isFoodBusiness && menuItem.nutritionInfo" class="menu-item-detail__nutrition">
          <AppText size="body-sm" color="white" class="font-semibold mb-2">
            {{ $t('menu.nutrition', 'Пищевая ценность') }}:
          </AppText>
          <div class="menu-item-detail__nutrition-grid">
            <div class="menu-item-detail__nutrition-item">
              <AppText size="caption" color="muted">{{ $t('menu.calories', 'Калории') }}</AppText>
              <AppText size="body-sm" color="white" class="font-medium">
                {{ menuItem.nutritionInfo.calories }} cal
              </AppText>
            </div>
            <div class="menu-item-detail__nutrition-item">
              <AppText size="caption" color="muted">{{ $t('menu.protein', 'Белки') }}</AppText>
              <AppText size="body-sm" color="white" class="font-medium">
                {{ menuItem.nutritionInfo.protein }}g
              </AppText>
            </div>
            <div class="menu-item-detail__nutrition-item">
              <AppText size="caption" color="muted">{{ $t('menu.carbs', 'Углеводы') }}</AppText>
              <AppText size="body-sm" color="white" class="font-medium">
                {{ menuItem.nutritionInfo.carbs }}g
              </AppText>
            </div>
            <div class="menu-item-detail__nutrition-item">
              <AppText size="caption" color="muted">{{ $t('menu.fat', 'Жиры') }}</AppText>
              <AppText size="body-sm" color="white" class="font-medium">
                {{ menuItem.nutritionInfo.fat }}g
              </AppText>
            </div>
          </div>
        </div>

        <!-- Variants -->
        <div v-if="variants.length > 0" class="menu-item-detail__variants">
          <AppText size="body-sm" color="white" class="font-semibold mb-2">
            {{ $t('menu.variants', 'Варианты') }}:
          </AppText>
          <div class="u-flex u-flex-wrap u-gap-2">
            <BaseButton
              v-for="variant in variants"
              :key="variant.id"
              :variant="selectedVariant?.id === variant.id ? 'primary' : 'outline'"
              size="sm"
              class="u-flex-1"
              @click="handleVariantSelect(variant)"
            >
              {{ variant.name }}
              <span v-if="variant.price" class="u-ml-1 u-opacity-70">
                ({{ variant.price }})
              </span>
            </BaseButton>
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
            {{ $t('menu.quantity', 'Количество') }}:
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
            <AppText size="caption" color="muted">{{ $t('cart.total', 'Итого') }}</AppText>
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
            {{ $t('cart.checkout', 'Оформить заказ') }}
          </BaseButton>
        </div>
        
        <!-- Validation Error Message -->
        <div v-if="hasValidationErrors" class="menu-item-detail__error">
          <AppText size="body-sm" color="red">
            {{ $t('menu.selectRequired', 'Пожалуйста, выберите все обязательные опции') }}
          </AppText>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import type { MenuItem, ModifierGroup, Modifier, ProductVariant } from '~/types'
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'
import { useTerminology } from '~/composables/useTerminology'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue: boolean
  menuItem: MenuItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  addToCart: [item: MenuItem, quantity: number, modifiers: Modifier[]]
}>()

// Stores
const menuStore = useMenuStore()
const cartStore = useCartStore()
const { t } = useI18n()

// Telegram integration
const telegram = useTelegram()

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const quantity = ref(1)
const selectedModifiers = ref<Modifier[]>([])
const selectedVariant = ref<ProductVariant | null>(null)
const hasValidationErrors = ref(false)
const validationErrors = ref<string[]>([])

const variants = computed(() => props.menuItem.product?.variants || [])

// Telegram integration
let cleanupMainButton: (() => void) | null = null
let cleanupBackButton: (() => void) | null = null

const { isFoodBusiness } = useTerminology()

// Computed properties
const isFavorite = computed(() => {
  return menuStore.favourites.some(item => item.id === props.menuItem.id)
})

// Extract modifier groups from menu item
// In a real implementation, this would come from the API
const modifierGroups = computed<ModifierGroup[]>(() => {
  // For now, return empty array - will be populated from API
  return []
})

const totalPrice = computed(() => {
  let price = selectedVariant.value?.price ?? props.menuItem.price
  
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
const handleModifierChange = (modifiers: Modifier[]) => {
  selectedModifiers.value = modifiers
  validateModifiers()
}

const handleVariantSelect = (variant: ProductVariant) => {
  selectedVariant.value = variant
  if (telegram.isTelegram.value) {
    telegram.selectionFeedback()
  }
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

  // Check if variant is required but not selected
  if (variants.value.length > 0 && !selectedVariant.value) {
    hasValidationErrors.value = true
    validationErrors.value.push(t('menu.selectVariant', 'Пожалуйста, выберите вариант'))
  }
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
  cartStore.addItem(props.menuItem, quantity.value, selectedModifiers.value, undefined, selectedVariant.value || undefined)
  
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
  menuStore.toggleFavourite(props.menuItem.id)
  
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
  selectedVariant.value = variants.value.length === 1 ? variants.value[0] : null
  hasValidationErrors.value = false
  validationErrors.value = []
  
  emit('close')
}

// Watch for modal open to reset state and setup Telegram MainButton
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    quantity.value = 1
    selectedModifiers.value = []
    selectedVariant.value = variants.value.length === 1 ? variants.value[0] : null
    hasValidationErrors.value = false
    validationErrors.value = []
    
    // Setup Telegram MainButton if in Telegram
    if (telegram.isTelegram.value) {
      const buttonText = `${t('menu.addToCart', 'В корзину')} - ${totalPrice.value.toFixed(2)}`
      cleanupMainButton = telegram.showMainButton(buttonText, handleAddToCart)
      
      // Setup Telegram BackButton
      cleanupBackButton = telegram.showBackButton(() => {
        handleClose()
      })
    }
  } else {
    // Cleanup Telegram MainButton
    if (cleanupMainButton) {
      cleanupMainButton()
      cleanupMainButton = null
    }
    telegram.hideMainButton()
    
    // Cleanup Telegram BackButton
    if (cleanupBackButton) {
      cleanupBackButton()
      cleanupBackButton = null
    }
    telegram.hideBackButton()
  }
})

// Watch for price changes to update MainButton text
watch(totalPrice, (newPrice) => {
  if (telegram.isTelegram.value && props.modelValue) {
    const buttonText = `${t('menu.addToCart', 'В корзину')} - ${newPrice.toFixed(2)}`
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
  
  if (cleanupBackButton) {
    cleanupBackButton()
  }
  telegram.hideBackButton()
})
</script>

<style lang="scss" scoped>


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
  background: var(--bg-primary);
  
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
  transition: color $transition-base;
  
  &:hover {
    color: var(--color-error);
  }
}

.menu-item-detail__favorite-btn--active {
  color: var(--color-error);
}

.menu-item-detail__description {
  line-height: $leading-relaxed;
}

.menu-item-detail__allergens {
  padding: $space-4;
  background: rgba($color-warning, 0.1);
  border: 1px solid rgba($color-warning, 0.3);
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
  background: $color-background-sidebar;
  border-radius: $radius-md;
}

.menu-item-detail__nutrition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;
  
  @media (min-width: $breakpoint-sm) {
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
  background: $color-background-sidebar;
  border-radius: $radius-md;
}

.menu-item-detail__footer {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding-top: $space-6;
  border-top: 1px solid $color-border-subtle;
  
  @media (min-width: $breakpoint-sm) {
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
  
  @media (min-width: $breakpoint-sm) {
    width: auto;
    min-width: 200px;
  }
}

.menu-item-detail__error {
  padding: $space-4;
  background: rgba($color-error, 0.1);
  border: 1px solid rgba($color-error, 0.3);
  border-radius: $radius-md;
  text-align: center;
}
</style>
