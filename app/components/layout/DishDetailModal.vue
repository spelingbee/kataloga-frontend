<template>
  <!-- Mobile dish detail modal -->
  <div class="fixed inset-0 z-50 xl:hidden">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="$emit('close')"
    />
    
    <!-- Modal -->
    <div 
      class="absolute bottom-0 left-0 right-0 bg-background-card rounded-t-2xl shadow-xl transform transition-transform duration-300 ease-in-out max-h-[90vh]"
      :class="{ 'translate-y-0': isOpen, 'translate-y-full': !isOpen }"
    >
      <!-- Handle -->
      <div class="flex justify-center pt-3 pb-2">
        <div class="w-12 h-1 bg-neutral-80 rounded-full" />
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <AppHeading level="h2" size="heading-lg">
          {{ dish?.name || 'Dish Details' }}
        </AppHeading>
        <BaseButton
          variant="ghost"
          size="sm"
          aria-label="Close dish details"
          @click="$emit('close')"
        >
          <BaseIcon name="x" size="md" />
        </BaseButton>
      </div>

      <!-- Content -->
      <div class="flex flex-col max-h-[calc(90vh-120px)]">
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div v-if="dish" class="space-y-6">
            <!-- Dish Image -->
            <div class="text-center">
              <BaseImage
                :src="dish.imageUrl"
                :alt="dish.name"
                class="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-lg"
              />
            </div>

            <!-- Dish Info -->
            <div class="text-center space-y-2">
              <AppText class="text-neutral-80">
                {{ dish.description }}
              </AppText>
              <div class="flex items-center justify-center space-x-4">
                <AppPrice :price="dish.price" size="lg" />
                <div v-if="dish.calories" class="flex items-center space-x-1 text-primary-orange">
                  <BaseIcon name="fire" size="sm" />
                  <AppText size="body-sm">{{ dish.calories }} cal</AppText>
                </div>
              </div>
            </div>

            <!-- Ingredients (if available) -->
            <div v-if="dish.ingredients && dish.ingredients.length > 0" class="space-y-3">
              <AppHeading level="h4" size="heading-md">
                Customize Ingredients
              </AppHeading>
              <div class="space-y-2">
                <IngredientToggle
                  v-for="ingredient in dish.ingredients"
                  :key="ingredient.id"
                  :ingredient="ingredient"
                  @toggle="toggleIngredient"
                />
              </div>
            </div>

            <!-- Waiting Time -->
            <div v-if="dish.preparationTime" class="flex items-center justify-center space-x-2 text-neutral-80">
              <BaseIcon name="clock" size="sm" />
              <AppText size="body-sm">
                Ready in {{ dish.preparationTime }} minutes
              </AppText>
            </div>
          </div>
        </div>

        <!-- Footer - Add to Cart (Sticky) -->
        <div class="px-6 py-4 border-t border-border-subtle bg-background-card space-y-4">
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
            :disabled="!dish"
            class="w-full"
            size="lg"
            @added="onAddedToCart"
          />

          <!-- Total Price -->
          <div class="text-center">
            <AppText class="text-neutral-80 text-body-sm">
              Total: 
            </AppText>
            <AppPrice 
              :price="totalPrice" 
              size="lg" 
              class="font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '~/stores/cart'

// Props & Emits
interface Props {
  dish: any
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

// Stores
const cartStore = useCartStore()

// Reactive state
const isOpen = ref(false)
const selectedQuantity = ref(1)
const selectedIngredients = ref<string[]>([])

// Computed properties
const totalPrice = computed(() => {
  if (!props.dish) return 0
  return props.dish.price * selectedQuantity.value
})

// Methods
const updateQuantity = (quantity: number) => {
  selectedQuantity.value = quantity
}

const toggleIngredient = (ingredientId: string) => {
  const index = selectedIngredients.value.indexOf(ingredientId)
  if (index > -1) {
    selectedIngredients.value.splice(index, 1)
  } else {
    selectedIngredients.value.push(ingredientId)
  }
}

const onAddedToCart = () => {
  // Reset quantity after adding to cart
  selectedQuantity.value = 1
  selectedIngredients.value = []
  
  // Show success feedback
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 50, 50])
  }
  
  // Close modal
  $emit('close')
}

// Animation
onMounted(() => {
  // Trigger animation after mount
  nextTick(() => {
    isOpen.value = true
  })
})

// Handle escape key
onKeyStroke('Escape', () => {
  $emit('close')
})

// Watch for dish changes to reset state
watch(() => props.dish, () => {
  selectedQuantity.value = 1
  selectedIngredients.value = []
})

// Handle swipe down to close
let startY = 0
let currentY = 0

const handleTouchStart = (e: TouchEvent) => {
  startY = e.touches[0].clientY
}

const handleTouchMove = (e: TouchEvent) => {
  currentY = e.touches[0].clientY
  const diff = currentY - startY
  
  // Only allow swipe down
  if (diff > 0) {
    e.preventDefault()
  }
}

const handleTouchEnd = () => {
  const diff = currentY - startY
  
  // Close if swiped down more than 100px
  if (diff > 100) {
    $emit('close')
  }
}
</script>

<style scoped>
/* Smooth modal animation */
.transform {
  transform: translateY(100%);
}

.translate-y-0 {
  transform: translateY(0);
}

.translate-y-full {
  transform: translateY(100%);
}

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

/* Safe area padding */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
