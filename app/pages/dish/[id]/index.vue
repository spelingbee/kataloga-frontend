<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"/>
        <AppText class="text-neutral-20">Loading dish details...</AppText>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <BaseIcon name="alert-circle" size="4xl" class="text-primary-red mx-auto mb-6" />
        <AppHeading level="h2" size="heading-lg" class="text-white mb-4">
          Dish Not Found
        </AppHeading>
        <AppText class="text-neutral-20 mb-8">
          {{ error }}
        </AppText>
        <div class="flex gap-4 justify-center">
          <BaseButton @click="$router.go(-1)">
            Go Back
          </BaseButton>
          <NuxtLink to="/menu">
            <BaseButton variant="secondary">
              Browse Menu
            </BaseButton>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Dish Details -->
    <div v-else-if="dish" class="pb-8">
      <!-- Header with Navigation -->
      <div class="px-6 py-4 flex items-center justify-between border-b border-neutral-80/20">
        <div class="flex items-center gap-4">
          <BaseButton 
            variant="ghost" 
            @click="$router.go(-1)"
          >
            <BaseIcon name="arrow-left" size="md" />
          </BaseButton>
          <AppHeading level="h1" size="heading-lg" class="text-white">
            {{ dish.name }}
          </AppHeading>
        </div>
        
        <div class="flex items-center gap-2">
          <BaseButton
            variant="ghost"
            :class="isFavourite ? 'text-primary-red' : 'text-neutral-80'"
            @click="toggleFavourite"
          >
            <BaseIcon :name="isFavourite ? 'heart-filled' : 'heart'" size="md" />
          </BaseButton>
          <BaseButton variant="ghost" @click="shareDish">
            <BaseIcon name="share" size="md" />
          </BaseButton>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex flex-col lg:flex-row">
        <!-- Left Column - Images and Info -->
        <div class="lg:w-2/3 px-6 py-8">
          <!-- Dish Hero Section -->
          <DishHero 
            :dish="dish"
            class="mb-8"
          />

          <!-- Dish Images Slider -->
          <div class="mb-8">
            <DishImageSlider 
              :images="dishImages"
              :dish-name="dish.name"
            />
          </div>

          <!-- Description -->
          <div class="mb-8">
            <AppHeading level="h2" size="heading-md" class="text-white mb-4">
              Description
            </AppHeading>
            <AppText class="text-neutral-20 leading-relaxed">
              {{ dish.description }}
            </AppText>
          </div>

          <!-- Ingredients -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <AppHeading level="h2" size="heading-md" class="text-white">
                Ingredients
              </AppHeading>
              <NuxtLink :to="`/dish/${dish.id}/ingredients`">
                <BaseButton variant="ghost" size="sm">
                  View All
                  <BaseIcon name="arrow-right" size="sm" class="ml-2" />
                </BaseButton>
              </NuxtLink>
            </div>
            <DishIngredients 
              :ingredients="dish.ingredients || []"
              :show-all="false"
              :max-items="6"
            />
          </div>

          <!-- Nutrition Info -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <AppHeading level="h2" size="heading-md" class="text-white">
                Nutrition Information
              </AppHeading>
              <NuxtLink :to="`/dish/${dish.id}/caloric-content`">
                <BaseButton variant="ghost" size="sm">
                  Full Details
                  <BaseIcon name="arrow-right" size="sm" class="ml-2" />
                </BaseButton>
              </NuxtLink>
            </div>
            <DishNutrition 
              :nutrition="dish.nutritionInfo"
              :calories="dish.calories"
              :compact="true"
            />
          </div>

          <!-- Preparation Time -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
              <AppHeading level="h2" size="heading-md" class="text-white">
                Preparation Time
              </AppHeading>
              <NuxtLink :to="`/dish/${dish.id}/waiting-time`">
                <BaseButton variant="ghost" size="sm">
                  More Info
                  <BaseIcon name="arrow-right" size="sm" class="ml-2" />
                </BaseButton>
              </NuxtLink>
            </div>
            <WaitingTimeIndicator 
              :preparation-time="dish.preparationTime || 20"
              :show-details="false"
            />
          </div>

          <!-- Allergens -->
          <div v-if="dish.allergens && dish.allergens.length > 0" class="mb-8">
            <AppHeading level="h2" size="heading-md" class="text-white mb-4">
              Allergen Information
            </AppHeading>
            <div class="flex flex-wrap gap-2">
              <BaseBadge
                v-for="allergen in dish.allergens"
                :key="allergen"
                variant="warning"
                size="sm"
              >
                <BaseIcon name="alert-triangle" size="xs" class="mr-1" />
                {{ allergen }}
              </BaseBadge>
            </div>
          </div>
        </div>

        <!-- Right Column - Customization and Order -->
        <div class="lg:w-1/3 lg:border-l border-neutral-80/20">
          <div class="sticky top-0 px-6 py-8">
            <!-- Price and Basic Info -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-4">
                <AppPrice :price="dish.price" size="xl" />
                <div v-if="dish.calories" class="flex items-center gap-2">
                  <FireIcon size="sm" />
                  <AppText size="body-sm" class="text-neutral-20">
                    {{ dish.calories }} cal
                  </AppText>
                </div>
              </div>
              
              <!-- Rating and Reviews (Mock) -->
              <div class="flex items-center gap-4 mb-4">
                <div class="flex items-center gap-1">
                  <BaseIcon name="star" size="sm" class="text-primary-orange" />
                  <AppText size="body-sm" class="text-white">4.8</AppText>
                  <AppText size="body-sm" class="text-neutral-20">(124 reviews)</AppText>
                </div>
              </div>
            </div>

            <!-- Subcategory Selection -->
            <div v-if="hasSubcategories" class="mb-6">
              <div class="flex items-center justify-between mb-3">
                <AppText size="body-sm" class="text-white font-medium">
                  Choose Size/Type
                </AppText>
                <NuxtLink :to="`/dish/${dish.id}/subcategory`">
                  <BaseButton variant="ghost" size="sm">
                    More Options
                  </BaseButton>
                </NuxtLink>
              </div>
              <SubcategorySelector 
                v-model="selectedSubcategory"
                :options="subcategoryOptions"
                :compact="true"
              />
            </div>

            <!-- Customization Options -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-3">
                <AppText size="body-sm" class="text-white font-medium">
                  Customize
                </AppText>
                <NuxtLink :to="`/dish/${dish.id}/change-ingredients`">
                  <BaseButton variant="ghost" size="sm">
                    Full Options
                  </BaseButton>
                </NuxtLink>
              </div>
              <DishCustomization 
                v-model="customizations"
                :dish="dish"
                :compact="true"
              />
            </div>

            <!-- Quantity Selection -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-3">
                <AppText size="body-sm" class="text-white font-medium">
                  Quantity
                </AppText>
                <NuxtLink :to="`/dish/${dish.id}/change-quantity`">
                  <BaseButton variant="ghost" size="sm">
                    Bulk Order
                  </BaseButton>
                </NuxtLink>
              </div>
              <QuantitySelector 
                v-model="quantity"
                :min="1"
                :max="10"
                size="lg"
              />
            </div>

            <!-- Special Instructions -->
            <div class="mb-6">
              <AppText size="body-sm" class="text-white font-medium mb-3">
                Special Instructions (Optional)
              </AppText>
              <BaseInput
                v-model="specialInstructions"
                placeholder="Any special requests..."
                type="textarea"
                rows="3"
              />
            </div>

            <!-- Total Price -->
            <div class="mb-6 p-4 bg-background-card rounded-xl">
              <div class="flex items-center justify-between">
                <AppText size="body-md" class="text-white font-medium">
                  Total
                </AppText>
                <AppPrice :price="totalPrice" size="lg" />
              </div>
              <AppText size="body-sm" class="text-neutral-20 mt-1">
                {{ quantity }} × {{ formatPrice(dish.price) }}
                <span v-if="customizationPrice > 0">
                  + {{ formatPrice(customizationPrice) }} extras
                </span>
              </AppText>
            </div>

            <!-- Add to Cart Button -->
            <AddToCartButton 
              :item="dish"
              :quantity="quantity"
              :customizations="customizations"
              :special-instructions="specialInstructions"
              size="lg"
              class="w-full mb-4"
              @added="onAddedToCart"
            />

            <!-- Quick Actions -->
            <div class="flex gap-2">
              <BaseButton 
                variant="secondary" 
                size="sm"
                class="flex-1"
                @click="addToFavourites"
              >
                <BaseIcon name="heart" size="sm" class="mr-2" />
                Save
              </BaseButton>
              <BaseButton 
                variant="ghost" 
                size="sm"
                class="flex-1"
                @click="compareDish"
              >
                <BaseIcon name="compare" size="sm" class="mr-2" />
                Compare
              </BaseButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Dishes -->
      <div class="px-6 py-8 border-t border-neutral-80/20">
        <AppHeading level="h2" size="heading-lg" class="text-white mb-6">
          You Might Also Like
        </AppHeading>
        <MenuItemGrid 
          :items="relatedDishes"
          :columns="4"
          @item-selected="onRelatedDishSelected"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem, NutritionInfo } from '~/types'
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'

// Page setup
definePageMeta({
  title: 'Dish Details - Menu Ordering App'
})

// Route and stores
const route = useRoute()
const router = useRouter()

const menuStore = useMenuStore()
const cartStore = useCartStore()

// Reactive state
const loading = ref(true)
const error = ref<string | null>(null)
const quantity = ref(1)
const customizations = ref({})
const specialInstructions = ref('')
const selectedSubcategory = ref('')

// Get dish ID from route
const dishId = computed(() => route.params.id as string)

// Mock dish data - will be replaced with real API call
const dish = ref<MenuItem | null>(null)

// Mock related data
const dishImages = ref([
  '/images/dish-1.jpg',
  '/images/dish-2.jpg',
  '/images/dish-3.jpg'
])

const subcategoryOptions = ref([
  { id: 'small', name: 'Small', price: 0 },
  { id: 'medium', name: 'Medium', price: 2 },
  { id: 'large', name: 'Large', price: 5 }
])

const relatedDishes = ref<MenuItem[]>([])

// Computed
const isFavourite = computed(() => {
  return dish.value ? menuStore.favourites.some(fav => fav.id === dish.value!.id) : false
})

const hasSubcategories = computed(() => {
  return subcategoryOptions.value.length > 0
})

const customizationPrice = computed(() => {
  // Calculate additional price from customizations
  return Object.values(customizations.value).reduce((total: number, customization: any) => {
    return total + (customization.price || 0)
  }, 0)
})

const totalPrice = computed(() => {
  if (!dish.value) return 0
  const basePrice = dish.value.price
  const subcategoryPrice = selectedSubcategory.value ? 
    subcategoryOptions.value.find(opt => opt.id === selectedSubcategory.value)?.price || 0 : 0
  return (basePrice + subcategoryPrice + customizationPrice.value) * quantity.value
})

// Methods
const loadDish = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Try to get dish from menu store first
    const existingDish = menuStore.getMenuItemById(dishId.value)
    if (existingDish) {
      dish.value = existingDish
    } else {
      // Fetch dish from API
      const response = await menuStore.fetchMenuItem(dishId.value)
      if (response) {
        dish.value = response
      } else {
        throw new Error('Dish not found')
      }
    }
    
    // Load related dishes from the same category
    if (dish.value?.categoryId) {
      const categoryItems = menuStore.getItemsByCategory(dish.value.categoryId)
      relatedDishes.value = categoryItems
        .filter(item => item.id !== dish.value!.id)
        .slice(0, 4)
    }
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load dish details'
    console.error('Error loading dish:', err)
  } finally {
    loading.value = false
  }
}

const toggleFavourite = () => {
  if (dish.value) {
    menuStore.toggleFavourite(dish.value.id)
  }
}

const shareDish = () => {
  if (navigator.share && dish.value) {
    navigator.share({
      title: dish.value.name,
      text: dish.value.description,
      url: window.location.href
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href)
  }
}

const onAddedToCart = () => {
  // Show success message or navigate to cart
  router.push('/cart')
}

const addToFavourites = () => {
  if (dish.value) {
    menuStore.toggleFavourite(dish.value.id)
  }
}

const compareDish = () => {
  // Add to comparison list (mock functionality)
  console.log('Added to comparison')
}

const onRelatedDishSelected = (selectedDish: MenuItem) => {
  router.push(`/dish/${selectedDish.id}`)
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
})

// Watch for route changes
watch(() => dishId.value, () => {
  loadDish()
})

// Update page title
watchEffect(() => {
  if (dish.value) {
    useHead({
      title: `${dish.value.name} - Menu Ordering App`
    })
  }
})
</script>