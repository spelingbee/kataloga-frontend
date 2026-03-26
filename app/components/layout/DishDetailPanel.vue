<template>
  <!-- Desktop dish detail panel -->
  <div class="flex flex-col h-full bg-background-card">
    <!-- Header -->
    <div class="p-6 border-b border-border-subtle">
      <div class="flex items-center justify-between mb-4">
        <AppHeading level="h2" size="heading-lg" class="text-white">
          Dish Details
        </AppHeading>
        <BaseButton
          variant="ghost"
          size="sm"
          aria-label="Close dish details"
          @click="closeDishDetail"
        >
          <BaseIcon name="x" size="md" />
        </BaseButton>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div v-if="dish" class="space-y-6">
        <!-- Dish Hero Section -->
        <DishHero
          :dish="dish"
          :selected-subcategory="selectedSubcategory"
          @subcategory-selected="selectedSubcategory = $event"
        />

        <!-- Dish Customization -->
        <DishCustomization
          v-if="dish.ingredients || dish.customizations"
          :dish="dish"
          :selected-ingredients="selectedIngredients"
          :customizations="selectedCustomizations"
          @ingredients-changed="selectedIngredients = $event"
          @customizations-changed="selectedCustomizations = $event"
        />

        <!-- Dish Nutrition -->
        <DishNutrition
          v-if="dish.nutrition"
          :nutrition="(dish.nutrition as any)"
        />
      </div>
    </div>

    <!-- Footer - Add to Cart -->
    <div class="p-6 border-t border-border-subtle space-y-4">
      <!-- Quantity Selector -->
      <div class="flex items-center justify-center">
        <QuantitySelector
          :quantity="selectedQuantity"
          :min="1"
          :max="10"
          @update="updateQuantity"
        />
      </div>

      <!-- Add to Cart Button -->
      <AddToCartButton
        :dish="dish"
        :quantity="selectedQuantity"
        :customizations="selectedCustomizations"
        :ingredients="selectedIngredients"
        :disabled="!dish"
        class="w-full"
        @added="onAddedToCart"
      />

      <!-- Total Price -->
      <div class="text-center">
        <AppText class="text-neutral-20 text-body-sm">
          Total: 
        </AppText>
        <PriceDisplay 
          :price="totalPrice" 
          size="lg" 
          class="font-semibold"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MenuItemUI } from '~/types'
import { useCartStore } from '~/stores/cart'
import { useMenuStore } from '~/stores/menu'

// Props
interface Props {
  dish: MenuItemUI | null
}

const props = defineProps<Props>()

// Stores
const menuStore = useMenuStore()
const cartStore = useCartStore()

// Reactive state
const selectedQuantity = ref(1)
const selectedIngredients = ref<string[]>([])
const selectedCustomizations = ref<Record<string, any>>({})
const selectedSubcategory = ref<string>('')

// Computed properties
const totalPrice = computed(() => {
  if (!props.dish) return 0
  
  let basePrice = props.dish.price
  
  // Add customization costs
  Object.values(selectedCustomizations.value).forEach((customization: any) => {
    if (customization?.price) {
      basePrice += customization.price
    }
  })
  
  return basePrice * selectedQuantity.value
})

// Methods
const updateQuantity = (quantity: number) => {
  selectedQuantity.value = quantity
}

const closeDishDetail = () => {
  menuStore.clearSelectedDish()
}

const onAddedToCart = () => {
  // Reset state after adding to cart
  selectedQuantity.value = 1
  selectedIngredients.value = []
  selectedCustomizations.value = {}
  selectedSubcategory.value = ''
  
  // Show success feedback
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 50, 50])
  }
}

// Watch for dish changes to reset state
watch(() => props.dish, () => {
  selectedQuantity.value = 1
  selectedIngredients.value = []
  selectedCustomizations.value = {}
  selectedSubcategory.value = ''
})
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>