<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-neutral-80/20">
      <div class="flex items-center gap-4">
        <BaseButton 
          variant="ghost" 
          @click="router.go(-1)"
        >
          <BaseIcon name="arrow-left" size="md" />
        </BaseButton>
        <div>
          <AppHeading level="h1" size="heading-lg" class="text-white">
            Select Quantity
          </AppHeading>
          <AppText class="text-neutral-20">
            {{ dish?.name }}
          </AppText>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"/>
        <AppText class="text-neutral-20">Loading quantity options...</AppText>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="px-6 py-8">
      <!-- Current Selection Summary -->
      <div class="mb-8 p-6 bg-background-card rounded-xl">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 bg-neutral-80/20 rounded-full flex items-center justify-center">
            <BaseIcon name="utensils" size="lg" class="text-neutral-80" />
          </div>
          <div class="flex-1">
            <AppHeading level="h3" size="heading-md" class="text-white mb-1">
              {{ dish?.name }}
            </AppHeading>
            <AppText size="body-sm" class="text-neutral-20">
              {{ formatPrice(dish?.price || 0) }} per item
            </AppText>
          </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <AppText size="body-lg" class="text-white font-semibold">{{ selectedQuantity }}</AppText>
            <AppText size="caption" class="text-neutral-20">Items</AppText>
          </div>
          <div class="text-center">
            <AppPrice :price="totalPrice" size="lg" />
            <AppText size="caption" class="text-neutral-20">Total Price</AppText>
          </div>
          <div class="text-center">
            <AppText size="body-lg" class="text-white font-semibold">{{ totalCalories }}</AppText>
            <AppText size="caption" class="text-neutral-20">Total Calories</AppText>
          </div>
          <div class="text-center">
            <AppText size="body-lg" class="text-white font-semibold">{{ totalWeight }}g</AppText>
            <AppText size="caption" class="text-neutral-20">Total Weight</AppText>
          </div>
        </div>
      </div>

      <!-- Quantity Selector -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Choose Quantity
        </AppHeading>
        
        <!-- Large Quantity Selector -->
        <div class="flex items-center justify-center gap-6 mb-8">
          <BaseButton
            variant="secondary"
            size="lg"
            :disabled="selectedQuantity <= 1"
            class="w-16 h-16 rounded-full"
            @click="decreaseQuantity"
          >
            <BaseIcon name="minus" size="lg" />
          </BaseButton>
          
          <div class="text-center">
            <AppText size="display-lg" class="text-white font-bold">
              {{ selectedQuantity }}
            </AppText>
            <AppText size="body-sm" class="text-neutral-20">
              {{ selectedQuantity === 1 ? 'item' : 'items' }}
            </AppText>
          </div>
          
          <BaseButton
            variant="secondary"
            size="lg"
            :disabled="selectedQuantity >= maxQuantity"
            class="w-16 h-16 rounded-full"
            @click="increaseQuantity"
          >
            <BaseIcon name="plus" size="lg" />
          </BaseButton>
        </div>

        <!-- Quick Quantity Buttons -->
        <div class="grid grid-cols-5 gap-2 mb-6">
          <BaseButton
            v-for="qty in quickQuantities"
            :key="qty"
            :variant="selectedQuantity === qty ? 'primary' : 'secondary'"
            size="lg"
            class="aspect-square"
            @click="selectedQuantity = qty"
          >
            {{ qty }}
          </BaseButton>
        </div>

        <!-- Custom Quantity Input -->
        <div class="flex items-center gap-4">
          <AppText size="body-sm" class="text-white">
            Custom quantity:
          </AppText>
          <BaseInput
            v-model.number="customQuantity"
            type="number"
            :min="1"
            :max="maxQuantity"
            placeholder="Enter amount"
            class="w-32"
          />
          <BaseButton 
            variant="ghost"
            :disabled="!isValidCustomQuantity"
            @click="applyCustomQuantity"
          >
            Apply
          </BaseButton>
        </div>
      </div>

      <!-- Bulk Order Options -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Bulk Order Options
        </AppHeading>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="bulk in bulkOptions"
            :key="bulk.quantity"
            class="p-4 border border-neutral-80/30 rounded-lg hover:border-primary-green/50 transition-colors cursor-pointer"
            :class="{ 'border-primary-green bg-primary-green/10': selectedQuantity === bulk.quantity }"
            @click="selectedQuantity = bulk.quantity"
          >
            <div class="flex items-center justify-between mb-2">
              <AppText size="body-md" class="text-white font-medium">
                {{ bulk.name }}
              </AppText>
              <BaseBadge
                v-if="bulk.discount > 0"
                variant="success"
                size="sm"
              >
                {{ bulk.discount }}% OFF
              </BaseBadge>
            </div>
            
            <AppText size="body-sm" class="text-neutral-20 mb-3">
              {{ bulk.description }}
            </AppText>
            
            <div class="flex items-center justify-between">
              <div>
                <AppText size="body-sm" class="text-white">
                  {{ bulk.quantity }} items
                </AppText>
                <AppText size="caption" class="text-neutral-20">
                  {{ formatPrice(bulk.pricePerItem) }} per item
                </AppText>
              </div>
              <div class="text-right">
                <AppPrice :price="bulk.totalPrice" size="md" />
                <AppText 
                  v-if="bulk.savings > 0"
                  size="caption" 
                  class="text-primary-green"
                >
                  Save {{ formatPrice(bulk.savings) }}
                </AppText>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Recommendations -->
      <div class="mb-8 p-4 bg-primary-green/10 border border-primary-green/30 rounded-xl">
        <div class="flex items-start gap-3">
          <BaseIcon name="lightbulb" size="md" class="text-primary-green mt-1" />
          <div>
            <AppHeading level="h4" size="heading-sm" class="text-white mb-2">
              Recommendation
            </AppHeading>
            <AppText size="body-sm" class="text-neutral-20 mb-3">
              {{ getRecommendationText() }}
            </AppText>
            <BaseButton 
              variant="secondary" 
              size="sm"
              @click="applyRecommendation"
            >
              Apply Recommendation
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Nutritional Impact -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Nutritional Impact
        </AppHeading>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-orange/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <FireIcon size="lg" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ totalCalories }}</AppText>
            <AppText size="caption" class="text-neutral-20">Total Calories</AppText>
            <AppText size="caption" class="text-neutral-20">
              {{ Math.round(totalCalories / 2000 * 100) }}% of daily intake
            </AppText>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-green/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <BaseIcon name="activity" size="lg" class="text-primary-green" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ totalProtein }}g</AppText>
            <AppText size="caption" class="text-neutral-20">Total Protein</AppText>
            <AppText size="caption" class="text-neutral-20">
              {{ Math.round(totalProtein / 50 * 100) }}% of daily needs
            </AppText>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-red/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <BaseIcon name="droplet" size="lg" class="text-primary-red" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ totalSodium }}mg</AppText>
            <AppText size="caption" class="text-neutral-20">Total Sodium</AppText>
            <AppText size="caption" class="text-neutral-20">
              {{ Math.round(totalSodium / 2300 * 100) }}% of daily limit
            </AppText>
          </div>
        </div>
      </div>

      <!-- Sharing Options -->
      <div v-if="selectedQuantity > 1" class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Sharing Information
        </AppHeading>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-3">Perfect for:</AppText>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <BaseIcon name="users" size="sm" class="text-primary-green" />
                <AppText size="body-sm" class="text-white">
                  {{ getSharingRecommendation() }}
                </AppText>
              </div>
              <div class="flex items-center gap-2">
                <BaseIcon name="clock" size="sm" class="text-primary-orange" />
                <AppText size="body-sm" class="text-white">
                  {{ getConsumptionTime() }}
                </AppText>
              </div>
            </div>
          </div>
          
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-3">Storage tips:</AppText>
            <AppText size="body-sm" class="text-white">
              {{ getStorageTips() }}
            </AppText>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4">
        <BaseButton 
          variant="primary"
          size="lg"
          class="flex-1"
          @click="confirmQuantity"
        >
          <BaseIcon name="check" size="sm" class="mr-2" />
          Confirm Quantity ({{ formatPrice(totalPrice) }})
        </BaseButton>
        
        <BaseButton 
          variant="secondary"
          size="lg"
          @click="addToCart"
        >
          <BaseIcon name="shopping-cart" size="sm" class="mr-2" />
          Add to Cart
        </BaseButton>
        
        <BaseButton 
          variant="ghost"
          size="lg"
          @click="resetQuantity"
        >
          Reset
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItemUI } from '~/types/ui'
import { createMenuItemUI } from '~/types/utils/converters'
import { useCartStore } from '~/stores/cart'

// Page setup
definePageMeta({
  title: 'Select Quantity - Menu Ordering App'
})

// Route and stores
const route = useRoute()
const router = useRouter()

const cartStore = useCartStore()

// Reactive state
const loading = ref(true)
const selectedQuantity = ref(1)
const customQuantity = ref<number | undefined>(undefined)

// Get dish ID from route
const dishId = computed(() => route.params.id as string)

// Mock dish data
const dish = ref<MenuItemUI | null>(null)
const basePrice = ref(15.99)
const baseCalories = ref(650)
const baseProtein = ref(35)
const baseSodium = ref(1200)
const baseWeight = ref(350)

// Constants
const maxQuantity = 50
const quickQuantities = [1, 2, 3, 4, 5]

// Bulk options with discounts
const bulkOptions = ref([
  {
    name: 'Family Pack',
    quantity: 4,
    description: 'Perfect for family dinner',
    discount: 10,
    pricePerItem: 14.39,
    totalPrice: 57.56,
    savings: 6.40
  },
  {
    name: 'Party Pack',
    quantity: 8,
    description: 'Great for parties and events',
    discount: 15,
    pricePerItem: 13.59,
    totalPrice: 108.72,
    savings: 19.20
  },
  {
    name: 'Bulk Order',
    quantity: 12,
    description: 'Maximum savings for large groups',
    discount: 20,
    pricePerItem: 12.79,
    totalPrice: 153.48,
    savings: 38.40
  }
])

// Computed
const totalPrice = computed(() => {
  // Check if current quantity matches a bulk option
  const bulkOption = bulkOptions.value.find(opt => opt.quantity === selectedQuantity.value)
  if (bulkOption) {
    return bulkOption.totalPrice
  }
  return basePrice.value * selectedQuantity.value
})

const totalCalories = computed(() => baseCalories.value * selectedQuantity.value)
const totalProtein = computed(() => baseProtein.value * selectedQuantity.value)
const totalSodium = computed(() => baseSodium.value * selectedQuantity.value)
const totalWeight = computed(() => baseWeight.value * selectedQuantity.value)

const isValidCustomQuantity = computed(() => {
  return customQuantity.value && 
         customQuantity.value >= 1 && 
         customQuantity.value <= maxQuantity
})

// Methods
const loadDish = async () => {
  loading.value = true
  
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    dish.value = createMenuItemUI({
      id: dishId.value,
      name: 'Delicious Burger',
      description: 'A mouth-watering burger',
      price: basePrice.value,
      categoryId: 'fastfood',
      isActive: true,
      calories: baseCalories.value
    })
    
  } catch (error) {
    console.error('Error loading dish:', error)
  } finally {
    loading.value = false
  }
}

const increaseQuantity = () => {
  if (selectedQuantity.value < maxQuantity) {
    selectedQuantity.value++
  }
}

const decreaseQuantity = () => {
  if (selectedQuantity.value > 1) {
    selectedQuantity.value--
  }
}

const applyCustomQuantity = () => {
  if (isValidCustomQuantity.value) {
    selectedQuantity.value = customQuantity.value!
    customQuantity.value = undefined
  }
}

const resetQuantity = () => {
  selectedQuantity.value = 1
  customQuantity.value = undefined
}

const getRecommendationText = () => {
  if (selectedQuantity.value === 1) {
    return 'For better value, consider our Family Pack (4 items) with 10% discount.'
  } else if (selectedQuantity.value < 4) {
    return 'You\'re close to our Family Pack discount! Add more items to save 10%.'
  } else if (selectedQuantity.value < 8) {
    return 'Great choice! You\'re getting our Family Pack discount. Consider Party Pack for even more savings.'
  } else {
    return 'Excellent! You\'re maximizing your savings with bulk pricing.'
  }
}

const applyRecommendation = () => {
  if (selectedQuantity.value < 4) {
    selectedQuantity.value = 4
  } else if (selectedQuantity.value < 8) {
    selectedQuantity.value = 8
  }
}

const getSharingRecommendation = () => {
  if (selectedQuantity.value <= 2) return '1-2 people'
  if (selectedQuantity.value <= 4) return '2-4 people (family)'
  if (selectedQuantity.value <= 8) return '4-8 people (small party)'
  return '8+ people (large gathering)'
}

const getConsumptionTime = () => {
  if (selectedQuantity.value <= 2) return 'Best consumed immediately'
  if (selectedQuantity.value <= 4) return 'Consume within 2 hours'
  return 'Plan for immediate serving'
}

const getStorageTips = () => {
  if (selectedQuantity.value <= 2) return 'Serve immediately for best taste'
  if (selectedQuantity.value <= 4) return 'Keep warm in oven at 200°F if needed'
  return 'Consider staggered preparation for freshness'
}

const confirmQuantity = () => {
  // Pass quantity back to dish page
  router.push({
    path: `/dish/${dishId.value}`,
    query: { 
      quantity: selectedQuantity.value.toString(),
      totalPrice: totalPrice.value.toString()
    }
  })
}

const addToCart = () => {
  if (dish.value) {
    cartStore.addItem(dish.value, selectedQuantity.value)
    router.push('/cart')
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

// Initialize
onMounted(() => {
  loadDish()
  
  // Set initial quantity from query params if available
  const quantityFromQuery = route.query.quantity
  if (quantityFromQuery && !isNaN(Number(quantityFromQuery))) {
    selectedQuantity.value = Math.max(1, Math.min(maxQuantity, Number(quantityFromQuery)))
  }
})

// Update page title
watchEffect(() => {
  if (dish.value) {
    useHead({
      title: `Select Quantity - ${dish.value.name} - Menu Ordering App`
    })
  }
})
</script>